/* ============================================================
   MALTE'S LIFE — Spiellogik
   ============================================================ */

const $ = (id) => document.getElementById(id);
const SPEICHER = "malteslife.v1";

/* ---------- Datum ---------- */
const alsDatum = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const heuteDatum = () => alsDatum(new Date());
const tageDazwischen = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
/* Kalenderwoche als Schlüssel, damit der Joker wöchentlich neu gilt */
function wochenSchluessel(d = new Date()) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() + 4 - (t.getDay() || 7));
  const jahresStart = new Date(t.getFullYear(), 0, 1);
  return `${t.getFullYear()}-${Math.ceil(((t - jahresStart) / 86400000 + 1) / 7)}`;
}

/* ---------- Speicherstand ---------- */
const leererStand = () => ({
  version: 2,
  richtigGesamt: 0,
  heuteDatum: heuteDatum(),
  heuteZahl: 0,
  streak: 0,
  letzterSpieltag: null,
  kapitel: KAPITEL.map(() => ({ levelFertig: 0 })),
  gutscheine: {},
  crewHabe: [],
  stats: {},                 // "k0s1" -> { versuche, richtig }
  jokerWoche: wochenSchluessel(),
  jokerBenutzt: 0,
  wocheSchluessel: wochenSchluessel(),
  wocheThemen: {},                       // "kapitel|stufe" -> wie oft geübt
  testWoche: { woche: wochenSchluessel(), versuche: 0, bestanden: false, eingeloest: false },
  lesehilfe: null,                       // null = Vorgabe aus config.js
  sprachVariante: undefined,             // welche Vorlese-Einstellung auf diesem Gerät geht
  aktuellK: 0,
  aktuellL: 1
});

let stand = leererStand();

function laden() {
  try {
    const roh = localStorage.getItem(SPEICHER);
    if (roh) {
      const g = JSON.parse(roh);
      if (g && Array.isArray(g.kapitel) && g.kapitel.length === KAPITEL.length) {
        stand = Object.assign(leererStand(), g, { version: 2 });
        // Felder ergänzen, die es in Version 1 noch nicht gab
        if (!Array.isArray(stand.crewHabe)) stand.crewHabe = [];
        if (!stand.stats || typeof stand.stats !== "object") stand.stats = {};
        if (!stand.wocheThemen || typeof stand.wocheThemen !== "object") stand.wocheThemen = {};
        if (!stand.testWoche) stand.testWoche = { woche: wochenSchluessel(), versuche: 0, bestanden: false, eingeloest: false };
      }
    }
  } catch (e) { /* kein Speicher verfügbar — läuft trotzdem, merkt sich nur nichts */ }

  // Tageswechsel
  if (stand.heuteDatum !== heuteDatum()) { stand.heuteDatum = heuteDatum(); stand.heuteZahl = 0; }
  // Wochenwechsel: Joker wieder aufladen
  if (stand.jokerWoche !== wochenSchluessel()) { stand.jokerWoche = wochenSchluessel(); stand.jokerBenutzt = 0; }
  // Neue Woche: geübte Themen und Testergebnis zurücksetzen
  if (stand.wocheSchluessel !== wochenSchluessel()) { stand.wocheSchluessel = wochenSchluessel(); stand.wocheThemen = {}; }
  if (!stand.testWoche || stand.testWoche.woche !== wochenSchluessel())
    stand.testWoche = { woche: wochenSchluessel(), versuche: 0, bestanden: false, eingeloest: false };
  setzeLesehilfe(stand.lesehilfe === null ? !!CONFIG.lesehilfe : stand.lesehilfe, false);
  pruefeStreak();
}

function sichern() {
  try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch (e) { /* ignorieren */ }
}

/* Serie prüfen: ein ausgelassener Tag kostet den Wochen-Joker, nicht die Serie */
function pruefeStreak() {
  if (!stand.letzterSpieltag || stand.letzterSpieltag === heuteDatum()) return;
  const luecke = tageDazwischen(stand.letzterSpieltag, heuteDatum());
  if (luecke <= 1) return;                       // gestern gespielt: alles gut
  const fehlend = luecke - 1;
  const jokerFrei = Math.max(0, (CONFIG.jokerProWoche || 0) - stand.jokerBenutzt);
  if (fehlend <= jokerFrei) stand.jokerBenutzt += fehlend;   // Joker rettet die Serie
  else stand.streak = 0;
}

/* ---------- Screens ---------- */
const SCREENS = ["s-start", "s-quiz", "s-level", "s-kapitelende", "s-album", "s-eltern", "s-testende"];
function zeigeScreen(id) {
  SCREENS.forEach(s => $(s).hidden = (s !== id));
  window.scrollTo({ top: 0, behavior: "instant" });
}
function heim() { if (window.speechSynthesis) speechSynthesis.cancel(); zeichneStart(); zeigeScreen("s-start"); }

/* ---------- Farbe & Hintergrund ---------- */
const FARBVAR = { rot:"--k1", orange:"--k2", gelb:"--k3", gruen:"--k4", blau:"--k5", violett:"--k6" };
const farbeVon = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

function setzeAkzent(kapitelIndex) {
  document.documentElement.style.setProperty("--akzent",
    farbeVon(kapitelIndex === null ? "--k6" : FARBVAR[KAPITEL[kapitelIndex].farbe]));

  const bilder = CONFIG.hintergrundBilder || [];
  const feld = $("bildgrund");
  if (!bilder.length) { feld.style.opacity = "0"; return; }
  const i = kapitelIndex === null ? 0 : kapitelIndex % bilder.length;
  feld.style.backgroundImage = `url("bilder/${bilder[i]}")`;
  feld.style.opacity = String((CONFIG.bilderDeckkraft ?? 0.22) * (kapitelIndex === null ? 0.7 : 1));
}


/* ============================================================
   VORLESEN — die wichtigste Hilfe bei LRS.
   Nutzt die Stimme des Betriebssystems, braucht kein Internet.
   ============================================================ */
const ZAHLWORT = ["null","ein","zwei","drei","vier","fünf","sechs","sieben","acht","neun","zehn","elf","zwölf"];
const NENNER = { 2:"Halbe", 3:"Drittel", 4:"Viertel", 5:"Fünftel", 6:"Sechstel", 8:"Achtel", 10:"Zehntel" };

/* Macht aus Mathe-Schreibweise etwas, das eine Sprachausgabe richtig liest */
function sprechText(t) {
  let s = String(t);
  const istUhrzeit = /Uhr/.test(s);

  // Brüche: 3/4 -> "drei Viertel"
  s = s.replace(/(\d+)\/(\d+)/g, (treffer, zStr, nStr) => {
    const zahl = Number(zStr), nenner = Number(nStr);
    if (!NENNER[nenner] || zahl > 12) return `${zStr} durch ${nStr}`;
    const wort = ZAHLWORT[zahl] || zStr;
    return zahl === 1 ? `ein ${NENNER[nenner]}` : `${wort} ${NENNER[nenner]}`;
  });

  // Geldbeträge: 2,50 € -> "2 Euro 50", 0,80 € -> "80 Cent"
  s = s.replace(/(\d+),(\d{2})\s*€/g, (tr, e, c) => {
    const cent = Number(c);
    if (Number(e) === 0) return `${cent} Cent`;
    return cent === 0 ? `${e} Euro` : `${e} Euro ${cent}`;
  });

  if (istUhrzeit) s = s.replace(/(\d{1,2}):(\d{2})(\s*Uhr)?/g, "$1 Uhr $2");
  else s = s.replace(/(\d)\s*:\s*(\d)/g, "$1 geteilt durch $2");

  return s
    .replace(/☐/g, " wie viel ")
    .replace(/\s\+\s/g, " plus ")
    .replace(/\s[−–-]\s/g, " minus ")
    .replace(/\s[·*×]\s/g, " mal ")
    .replace(/%/g, " Prozent")
    .replace(/€/g, " Euro")
    .replace(/\bkg\b/g, "Kilogramm").replace(/\bg\b/g, "Gramm")
    .replace(/\bcm\b/g, "Zentimeter").replace(/\bm\b/g, "Meter")
    .replace(/\bct\b/g, "Cent")
    .replace(/([.!?])\s*\n\s*/g, "$1 ")
    .replace(/\n/g, ". ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

let deutscheStimme = null;
let sprachProblem = null;      // zuletzt aufgetretener Grund, für die Diagnose

function stimmenListe() {
  try { return window.speechSynthesis ? (speechSynthesis.getVoices() || []) : []; }
  catch (e) { return []; }
}
function holeStimme() {
  const alle = stimmenListe();
  if (!alle.length) return null;
  deutscheStimme = alle.find(v => /^de/i.test(v.lang)) || null;
  return deutscheStimme;
}
if (window.speechSynthesis && "onvoiceschanged" in speechSynthesis)
  speechSynthesis.onvoiceschanged = holeStimme;

const PROBLEM_TEXT = {
  "fehlt":       "Dieser Browser kann nicht vorlesen.",
  "blockiert":   "Vorlesen ist hier blockiert. Auf dem Laptop als eigene Datei geht es.",
  "not-allowed": "Vorlesen ist hier blockiert. Auf dem Laptop als eigene Datei geht es.",
  "keine-stimme":"Auf diesem Gerät ist keine Sprachstimme installiert.",
  "kein-start":  "Vorlesen hat nicht gestartet. Auf dem Laptop als eigene Datei geht es."
};

function zeigeSprachProblem(grund) {
  sprachProblem = grund;
  const feld = $("hoer-meldung");
  if (!feld) return;
  feld.textContent = PROBLEM_TEXT[grund] || PROBLEM_TEXT["kein-start"];
  feld.hidden = false;
  const knopf = $("btn-hoeren");
  if (knopf) { knopf.classList.remove("laeuft"); knopf.classList.add("kaputt"); }
}

/* ============================================================
   Chrome scheitert auf manchen Windows-Rechnern beim Sprechen
   ("synthesis-failed"), je nachdem wie die Anfrage gestellt wird.
   Welche Kombination geht, lässt sich nicht vorhersagen — also
   probiert die App sie der Reihe nach durch und merkt sich die,
   die funktioniert hat.
   ============================================================ */
const SPRACH_VARIANTEN = [
  { name: "Deutsche Stimme, langsam",  rate: 0.88, stimme: 0 },
  { name: "Deutsche Stimme, normal",   rate: 1,    stimme: 0 },
  { name: "Ohne feste Stimme",         rate: 1,    stimme: null },
  { name: "Ohne Sprachangabe",         rate: 1,    stimme: null, ohneLang: true },
  { name: "Zweite deutsche Stimme",    rate: 1,    stimme: 1 },
  { name: "Dritte deutsche Stimme",    rate: 1,    stimme: 2 },
  { name: "Irgendeine Stimme",         rate: 1,    stimme: 0, egalWelcheSprache: true }
];

let laufendeRede = null;        // hält das Objekt fest, sonst räumt Chrome es weg
let sprachVersuch = 0;

function deutscheStimmen() {
  return stimmenListe().filter(v => /^de/i.test(v.lang));
}

function baueRede(text, v) {
  const rede = new SpeechSynthesisUtterance(sprechText(text));
  if (!v.ohneLang) rede.lang = "de-DE";
  rede.rate = v.rate;
  if (v.stimme !== null) {
    const auswahl = v.egalWelcheSprache ? stimmenListe() : deutscheStimmen();
    if (!auswahl[v.stimme]) return null;          // diese Variante gibt es hier nicht
    // Schlägt das Setzen fehl, wird trotzdem gesprochen — nur eben mit
    // der Stimme, die der Browser selbst wählt.
    try { rede.voice = auswahl[v.stimme]; } catch (e) { /* ohne feste Stimme weiter */ }
  }
  return rede;
}

/* Einen einzelnen Anlauf starten. meldung(true) sobald Ton kommt,
   meldung(false, grund) wenn er scheitert oder still bleibt. */
function sprachAnlauf(text, index, meldung) {
  const v = SPRACH_VARIANTEN[index];
  if (!v) return meldung(false, "alle-versucht");

  let rede;
  try {
    speechSynthesis.cancel();
    rede = baueRede(text, v);
  } catch (e) { return meldung(false, "blockiert"); }
  if (!rede) return meldung(false, "variante-entfaellt");

  laufendeRede = rede;
  const meinVersuch = ++sprachVersuch;
  let fertig = false;
  const einmal = (ok, grund) => {
    if (fertig || meinVersuch !== sprachVersuch) return;
    fertig = true;
    meldung(ok, grund);
  };

  const knopf = $("btn-hoeren");
  rede.onstart = () => { if (knopf) knopf.classList.add("laeuft"); einmal(true); };
  rede.onend   = () => { laufendeRede = null; if (knopf) knopf.classList.remove("laeuft"); };
  rede.onerror = (e) => {
    const grund = (e && e.error) || "kein-start";
    laufendeRede = null;
    if (knopf) knopf.classList.remove("laeuft");
    if (grund === "interrupted" || grund === "canceled") { fertig = true; return; }
    einmal(false, grund);
  };

  try {
    speechSynthesis.speak(rede);
    if (speechSynthesis.paused) speechSynthesis.resume();
  } catch (e) { return einmal(false, "blockiert"); }

  setTimeout(() => {
    if (speechSynthesis.speaking || speechSynthesis.pending) return einmal(true);
    einmal(false, "kein-start");
  }, 1500);
}

/* Der Reihe nach durchprobieren, bis eine Variante Ton macht. */
function sprachKaskade(text, abIndex, fertig) {
  sprachAnlauf(text, abIndex, (ok, grund) => {
    if (ok) { stand.sprachVariante = abIndex; sichern(); return fertig && fertig(true, abIndex); }
    sprachProblem = grund;
    if (abIndex + 1 < SPRACH_VARIANTEN.length) return sprachKaskade(text, abIndex + 1, fertig);
    fertig && fertig(false, null);
  });
}

function vorlesen(text) {
  const knopf = $("btn-hoeren");
  const feld = $("hoer-meldung");
  if (feld) feld.hidden = true;

  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined")
    return zeigeSprachProblem("fehlt");
  if (!stimmenListe().length) { holeStimme(); if (!stimmenListe().length) return zeigeSprachProblem("keine-stimme"); }

  // Läuft gerade etwas? Dann ist der Knopf ein Stopp-Knopf.
  if (knopf && knopf.classList.contains("laeuft")) {
    try { speechSynthesis.cancel(); } catch (e) {}
    laufendeRede = null;
    knopf.classList.remove("laeuft");
    return;
  }

  // Bekannte funktionierende Variante zuerst, sonst von vorn durchprobieren
  const start = (typeof stand.sprachVariante === "number") ? stand.sprachVariante : 0;
  sprachAnlauf(text, start, (ok, grund) => {
    if (ok) return;
    sprachProblem = grund;
    sprachKaskade(text, start === 0 ? 1 : 0, (gelungen) => {
      if (!gelungen) zeigeSprachProblem(sprachProblem || "kein-start");
    });
  });
}

/* Probiert im Eltern-Bereich alle Varianten durch und sagt, welche geht. */
function sprachLabor(anzeigen) {
  if (!window.speechSynthesis) return anzeigen("Dieser Browser kennt keine Sprachausgabe.");
  stand.sprachVariante = undefined;
  anzeigen("Probiere alle Einstellungen durch …");
  sprachKaskade("Test. Drei plus vier ist sieben.", 0, (ok, index) => {
    if (ok) anzeigen(`✓ Es funktioniert mit der Einstellung „${SPRACH_VARIANTEN[index].name}". Die App merkt sich das.`);
    else anzeigen(`Keine der ${SPRACH_VARIANTEN.length} Einstellungen hat funktioniert. Zuletzt gemeldet: ${sprachProblem}. `
      + `Auf diesem Gerät kann die App nicht vorlesen — auf einem anderen Rechner meist schon.`);
  });
}

/* Was kann dieses Gerät? Wird im Eltern-Bereich angezeigt. */
function sprachDiagnose() {
  if (!window.speechSynthesis) return "Dieser Browser kennt keine Sprachausgabe.";
  const alle = stimmenListe();
  const deutsch = alle.filter(v => /^de/i.test(v.lang));
  let t = `${alle.length} Stimme(n) gefunden, davon ${deutsch.length} deutsche`;
  if (deutsch.length) t += ` (${deutsch.slice(0, 3).map(v => v.name).join(", ")})`;
  t += ".";
  if (!alle.length) t += " Ohne installierte Stimme kann nicht vorgelesen werden.";
  if (sprachProblem) t += ` Zuletzt gemeldet: ${sprachProblem}.`;
  if (typeof stand.sprachVariante === "number" && SPRACH_VARIANTEN[stand.sprachVariante])
    t += ` Funktionierende Einstellung: „${SPRACH_VARIANTEN[stand.sprachVariante].name}".`;
  return t;
}

/* Lesehilfe: größere Schrift, mehr Abstand zwischen Buchstaben */
function setzeLesehilfe(an, sichern_ = true) {
  document.documentElement.dataset.lesehilfe = an ? "an" : "aus";
  stand.lesehilfe = !!an;
  const knopf = $("btn-lesehilfe");
  if (knopf) knopf.textContent = an ? "Aa Lesehilfe ✓" : "Aa Lesehilfe";
  if (sichern_) sichern();
}

/* ---------- Statistik ---------- */
function merkeStat(kapitel, stufe, richtig) {
  const s = `k${kapitel}s${stufe}`;
  if (!stand.stats[s]) stand.stats[s] = { versuche: 0, richtig: 0 };
  stand.stats[s].versuche++;
  if (richtig) stand.stats[s].richtig++;

  // Für den Wochentest merken, was diese Woche geübt wurde
  if (stand.wocheSchluessel !== wochenSchluessel()) { stand.wocheSchluessel = wochenSchluessel(); stand.wocheThemen = {}; }
  const t = `${kapitel}|${stufe}`;
  stand.wocheThemen[t] = (stand.wocheThemen[t] || 0) + 1;
}

/* ---------- Startbildschirm ---------- */
const BEGRUESSUNGEN = [
  "Jeden Tag ein bisschen. Das reicht völlig.",
  "Kein Timer, kein Stress. Nur du und die Zahlen.",
  "Kleine Schritte zählen auch. Sogar besonders.",
  "Du musst nichts können. Du lernst es ja gerade.",
  "Falsch ist erlaubt. Aufgeben nicht."
];

function zeichneStart() {
  $("app-titel").textContent = CONFIG.appName;
  $("begruessung").textContent = w(BEGRUESSUNGEN);
  setzeAkzent(null);

  const prozent = Math.min(100, (stand.richtigGesamt / CONFIG.aufgabenBisZumZiel) * 100);
  $("gesamt-prozent").textContent = prozent.toFixed(prozent < 10 ? 1 : 0) + "%";
  $("ring-bogen").style.strokeDashoffset = String(283 - (283 * prozent) / 100);

  const tagesZiel = CONFIG.aufgabenProTag;
  $("heute-zahl").textContent = stand.heuteZahl;
  $("heute-ziel").textContent = tagesZiel;
  const tagProzent = Math.min(100, (stand.heuteZahl / tagesZiel) * 100);
  $("heute-balken").style.width = tagProzent + "%";
  $("heute-balken-box").classList.toggle("voll", tagProzent >= 100);

  const jokerFrei = Math.max(0, (CONFIG.jokerProWoche || 0) - stand.jokerBenutzt);
  $("streak-text").textContent = stand.streak >= 2
    ? `🔥 ${stand.streak} Tage am Stück${jokerFrei ? " · 🃏 1 Joker" : ""}`
    : (stand.heuteZahl >= tagesZiel ? "✓ Tagesziel geschafft" : "Noch keine Serie");
  $("richtig-gesamt").textContent = `${stand.richtigGesamt} richtig`;

  const fertigeLevel = stand.kapitel.reduce((s, k) => s + k.levelFertig, 0);
  $("btn-weiter").textContent = (fertigeLevel === 0 && stand.richtigGesamt === 0) ? "▶ LOS GEHT'S" : "▶ WEITERMACHEN";
  $("album-zahl").textContent = `${stand.crewHabe.length}/30`;

  const offen = Object.values(stand.gutscheine).filter(g => !g.eingeloest).length;
  $("fuss-text").textContent = offen
    ? `${offen} Gutschein${offen > 1 ? "e" : ""} noch nicht eingelöst · Ziel: ${tagesZiel} Aufgaben am Tag`
    : `Ziel: ${tagesZiel} richtige Aufgaben am Tag — das sind 2 % Fortschritt.`;

  zeichneTestKachel();

  const liste = $("kapitel-liste");
  liste.innerHTML = "";
  KAPITEL.forEach((k, i) => {
    const fertig = stand.kapitel[i].levelFertig;
    const b = document.createElement("button");
    b.className = "kap";
    b.style.setProperty("--kf", farbeVon(FARBVAR[k.farbe]));
    b.innerHTML =
      `<span class="kap-icon">${k.emoji}</span>` +
      `<span><span class="kap-name">${k.name}</span>` +
      `<span class="kap-unter">${k.unter}</span>` +
      `<span class="kap-punkte">${[1,2,3,4,5].map(n => `<i class="pkt${n <= fertig ? " an" : ""}"></i>`).join("")}</span></span>` +
      `<span class="kap-pfeil">${fertig >= 5 ? "✓" : "▶"}</span>`;
    b.addEventListener("click", () => starteLevel(i, Math.min(5, fertig + 1)));
    liste.appendChild(b);
  });
}

/* Wo geht es weiter? Erstes Kapitel, das noch nicht komplett ist. */
function naechstesOffenes() {
  const gemerkt = stand.aktuellK ?? 0;
  if (stand.kapitel[gemerkt] && stand.kapitel[gemerkt].levelFertig < 5)
    return { k: gemerkt, l: stand.kapitel[gemerkt].levelFertig + 1 };
  for (let i = 0; i < KAPITEL.length; i++)
    if (stand.kapitel[i].levelFertig < 5) return { k: i, l: stand.kapitel[i].levelFertig + 1 };
  return { k: gemerkt, l: 5 };
}

/* ---------- Quiz ---------- */
let quiz = null;

function starteLevel(kIndex, level) {
  quiz = {
    k: kIndex, level, stufe: level,
    richtig: 0, fehlerSerie: 0, richtigSerie: 0,
    ergebnisse: [], warteschlange: [],
    aufgabe: null, istWiederholung: false, beantwortet: false
  };
  stand.aktuellK = kIndex; stand.aktuellL = level; sichern();
  setzeAkzent(kIndex);
  $("q-kapitel").textContent = KAPITEL[kIndex].name;
  $("q-level").textContent = `Level ${level} von 5`;
  zeigeScreen("s-quiz");
  naechsteAufgabe();
}

const durchgangLaenge = () => (quiz && quiz.istTest) ? CONFIG.wochentest.aufgaben : CONFIG.aufgabenProLevel;

function zeichneSpur() {
  const spur = $("spur");
  spur.innerHTML = "";
  for (let i = 0; i < durchgangLaenge(); i++) {
    const s = document.createElement("span");
    if (i < quiz.ergebnisse.length) s.className = quiz.ergebnisse[i] ? "ok" : "nein";
    else if (i === quiz.ergebnisse.length) s.className = "jetzt";
    spur.appendChild(s);
  }
}

function naechsteAufgabe() {
  quiz.beantwortet = false;
  const nr = quiz.ergebnisse.length;

  // Falsch beantwortete Aufgaben kommen gezielt zurück
  const faellig = quiz.istTest ? -1 : quiz.warteschlange.findIndex(e => e.faelligBei <= nr);
  if (faellig >= 0) {
    quiz.aufgabe = quiz.warteschlange.splice(faellig, 1)[0].aufgabe;
    quiz.istWiederholung = true;
  } else if (quiz.istTest) {
    quiz.aufgabe = quiz.testPlan[nr];
    quiz.istWiederholung = false;
  } else {
    quiz.aufgabe = holeAufgabe(quiz.k, quiz.stufe);
    quiz.istWiederholung = false;
  }

  zeichneSpur();
  $("nochmal-label").hidden = !quiz.istWiederholung;

  const text = $("aufgabe-text");
  text.textContent = quiz.aufgabe.frage;
  text.classList.toggle("lang", quiz.aufgabe.frage.length > 34);
  $("aufgabe-box").classList.remove("treffer");

  const bildBox = $("bild-box");
  bildBox.innerHTML = quiz.aufgabe.bild || "";
  bildBox.hidden = !quiz.aufgabe.bild;

  $("btn-hoeren").hidden = !CONFIG.vorlesen;
  $("btn-hoeren").classList.remove("laeuft");
  $("hoer-meldung").hidden = true;
  if (window.speechSynthesis) speechSynthesis.cancel();

  $("blase").hidden = true;
  $("quiz-weiter").hidden = true;

  const feld = $("antworten");
  feld.innerHTML = "";
  quiz.aufgabe.optionen.forEach(opt => {
    const b = document.createElement("button");
    b.className = "antwort";
    b.textContent = opt;
    b.addEventListener("click", () => antworte(b, opt));
    feld.appendChild(b);
  });
}

function antworte(knopf, gewaehlt) {
  if (quiz.beantwortet) return;
  quiz.beantwortet = true;

  const korrekt = gewaehlt === quiz.aufgabe.antwort;
  [...$("antworten").children].forEach(b => b.disabled = true);
  merkeStat(quiz.aufgabe.kapitel, quiz.aufgabe.stufe, korrekt);

  if (korrekt) {
    knopf.classList.add("gut");
    $("aufgabe-box").classList.add("treffer");
    quiz.richtig++;
    quiz.richtigSerie++;
    quiz.fehlerSerie = 0;
    stand.richtigGesamt++;
    stand.heuteZahl++;

    if (stand.letzterSpieltag !== heuteDatum()) {
      const gestern = new Date(); gestern.setDate(gestern.getDate() - 1);
      stand.streak = (stand.letzterSpieltag === alsDatum(gestern) || stand.streak > 0) ? stand.streak + 1 : 1;
      stand.letzterSpieltag = heuteDatum();
    }

    // Ausgleich: nach 3 Treffern zurück auf die volle Level-Stufe (im Test nicht)
    if (!quiz.istTest && quiz.richtigSerie >= 3 && quiz.stufe < quiz.level) { quiz.stufe++; quiz.richtigSerie = 0; }

    zeigeBlase(true, w(CONFIG.lobRichtig), null, null);
  } else {
    knopf.classList.add("schlecht");
    [...$("antworten").children].forEach(b => { if (b.textContent === quiz.aufgabe.antwort) b.classList.add("zeigen"); });
    quiz.fehlerSerie++;
    quiz.richtigSerie = 0;

    // Ausgleich: nach 2 Fehlern wird die nächste Aufgabe leichter (im Test nicht)
    if (!quiz.istTest && quiz.fehlerSerie >= 2 && quiz.stufe > 1) { quiz.stufe--; quiz.fehlerSerie = 0; }

    // Diese Aufgabe kommt später noch zweimal zurück
    if (!quiz.istWiederholung && !quiz.istTest) {
      const nr = quiz.ergebnisse.length;
      quiz.warteschlange.push({ aufgabe: quiz.aufgabe, faelligBei: nr + 3 });
      quiz.warteschlange.push({ aufgabe: quiz.aufgabe, faelligBei: nr + 8 });
    }

    zeigeBlase(false, w(CONFIG.lobFalsch),
      `Richtig wäre: ${quiz.aufgabe.antwort}\n${quiz.aufgabe.hinweis}`,
      quiz.aufgabe.hinweisBild || quiz.aufgabe.bild);
  }

  quiz.ergebnisse.push(korrekt);
  zeichneSpur();
  sichern();

  $("quiz-weiter").hidden = false;
  $("btn-naechste").textContent = quiz.ergebnisse.length >= durchgangLaenge()
    ? (quiz.istTest ? "TEST AUSWERTEN ▶" : "LEVEL AUSWERTEN ▶") : "WEITER ▶";
  $("btn-naechste").focus({ preventScroll: true });
}

function zeigeBlase(gut, titel, text, bild) {
  const b = $("blase");
  b.hidden = false;
  b.className = "blase " + (gut ? "gut" : "schlecht");
  $("blase-titel").textContent = titel;
  $("blase-text").textContent = text || "";
  $("blase-text").hidden = !text;
  const bb = $("blase-bild");
  bb.innerHTML = bild || "";
  bb.hidden = !bild;
}

/* ---------- Level auswerten ---------- */
function werteLevelAus() {
  const geschafft = quiz.richtig >= CONFIG.richtigeZumBestehen;
  setzeAkzent(quiz.k);
  $("level-bilanz").textContent =
    `${quiz.richtig} von ${CONFIG.aufgabenProLevel} richtig · ${KAPITEL[quiz.k].name}, Level ${quiz.level}`;

  if (!geschafft) {
    $("level-titel").textContent = "Fast! Nochmal?";
    $("gutschein").hidden = true;
    $("pin-input").parentElement.hidden = true;
    $("pin-meldung").textContent = "";
    $("level-hinweis").textContent =
      `Du brauchst ${CONFIG.richtigeZumBestehen} von ${CONFIG.aufgabenProLevel}. Deine ${quiz.richtig} richtigen Antworten sind trotzdem gezählt worden.`;
    $("btn-level-weiter").textContent = "LEVEL NOCHMAL ▶";
    $("btn-level-weiter").onclick = () => starteLevel(quiz.k, quiz.level);
    zeigeScreen("s-level");
    return;
  }

  if (quiz.level > stand.kapitel[quiz.k].levelFertig) stand.kapitel[quiz.k].levelFertig = quiz.level;

  // Neues Crew-Mitglied fürs Album
  const crewNr = quiz.k * 5 + (quiz.level - 1);
  const crewNeu = !stand.crewHabe.includes(crewNr);
  if (crewNeu) stand.crewHabe.push(crewNr);
  const figur = CONFIG.crew[crewNr];

  $("level-titel").textContent = w(["Stark!", "Level durch!", "Das saß.", "Geschafft!"]);
  $("gutschein").hidden = false;
  $("pin-input").parentElement.hidden = false;
  $("pin-input").value = "";
  $("pin-meldung").textContent = "";
  $("level-hinweis").innerHTML = figur
    ? `<b style="color:var(--tinte)">${figur[0]} ${figur[1]}</b> ist neu in deiner Crew.<br>Zeig den Gutschein Mama — sie tippt die PIN ein.`
    : "Zeig den Gutschein Mama. Sie tippt die PIN ein.";

  const schluessel = `k${quiz.k + 1}l${quiz.level}`;
  if (!stand.gutscheine[schluessel]) {
    stand.gutscheine[schluessel] = {
      was: CONFIG.belohnungen[quiz.k + 1][quiz.level - 1],
      code: `M-K${quiz.k + 1}L${quiz.level}-${z(1000, 9999)}`,
      eingeloest: false
    };
  }
  const g = stand.gutscheine[schluessel];
  $("gutschein-was").textContent = g.was;
  $("gutschein-code").textContent = g.code;
  $("gutschein-stempel").hidden = !g.eingeloest;

  const kapitelFertig = stand.kapitel[quiz.k].levelFertig >= 5;
  $("btn-level-weiter").textContent = kapitelFertig ? "KAPITEL ABSCHLIESSEN ▶" : "NÄCHSTES LEVEL ▶";
  $("btn-level-weiter").onclick = () =>
    kapitelFertig ? zeigeKapitelende(quiz.k) : starteLevel(quiz.k, quiz.level + 1);

  sichern();
  zeigeScreen("s-level");
  konfetti();
}

/* ---------- Kapitelende ---------- */
function zeigeKapitelende(kIndex) {
  setzeAkzent(kIndex);
  $("ende-titel").textContent = `${KAPITEL[kIndex].name} — komplett!`;
  $("witz-text").textContent = CONFIG.kapitelSprueche[kIndex] || "Gut gemacht!";
  const naechstes = kIndex + 1;
  const b = $("btn-ende-weiter");
  if (naechstes < KAPITEL.length) {
    b.hidden = false;
    b.textContent = `WEITER: ${KAPITEL[naechstes].name.toUpperCase()} ▶`;
    b.onclick = () => starteLevel(naechstes, Math.min(5, stand.kapitel[naechstes].levelFertig + 1));
  } else b.hidden = true;
  zeigeScreen("s-kapitelende");
  konfetti();
}

/* ---------- Gutschein einlösen ---------- */
function pinPruefen() {
  const g = stand.gutscheine[`k${quiz.k + 1}l${quiz.level}`];
  if (!g) return;
  if ($("pin-input").value.trim() === String(CONFIG.elternPin)) {
    g.eingeloest = true; sichern();
    $("gutschein-stempel").hidden = false;
    $("pin-meldung").textContent = "✓ Eingelöst. Viel Spaß damit!";
    $("pin-input").value = "";
  } else {
    $("pin-meldung").textContent = "Das war nicht die richtige PIN. Nochmal?";
  }
}


/* ============================================================
   WOCHENTEST — sonntags, über das, was die Woche geübt wurde
   ============================================================ */
const WOCHENTAGE = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];

function testStatus() {
  const cfg = CONFIG.wochentest;
  const tw = stand.testWoche;
  const istTestTag = new Date().getDay() === cfg.tag;
  const versucheFrei = Math.max(0, cfg.versucheProWoche - tw.versuche);
  return {
    istTestTag, bestanden: tw.bestanden, versucheFrei,
    spielbar: istTestTag && !tw.bestanden && versucheFrei > 0,
    tagName: WOCHENTAGE[cfg.tag]
  };
}

/* Welche Themen kommen dran? Was diese Woche geübt wurde —
   und wenn nichts geübt wurde, alles bisher Freigeschaltete. */
function testThemen() {
  const geuebt = Object.entries(stand.wocheThemen || {})
    .filter(([, anzahl]) => anzahl >= 3)
    .map(([s]) => s.split("|").map(Number));
  if (geuebt.length) return geuebt;

  const alle = [];
  KAPITEL.forEach((k, i) => {
    const bis = Math.max(1, stand.kapitel[i].levelFertig);
    for (let st = 1; st <= bis; st++) alle.push([i, st]);
  });
  return alle.length ? alle : [[0, 1]];
}

function zeichneTestKachel() {
  const st = testStatus();
  const k = $("test-kachel");
  const anzahlThemen = new Set(testThemen().map(t => t[0])).size;
  k.classList.remove("bereit", "fertig", "ruht");
  k.disabled = !st.spielbar;

  if (st.bestanden) {
    k.classList.add("fertig");
    $("tk-icon").textContent = "🏆";
    $("tk-titel").textContent = "Wochentest bestanden!";
    $("tk-unter").textContent = `Belohnung: ${CONFIG.wochentest.belohnung}`;
    $("tk-pfeil").textContent = "✓";
  } else if (st.spielbar) {
    k.classList.add("bereit");
    $("tk-icon").textContent = "🎮";
    $("tk-titel").textContent = "Der Wochentest ist da!";
    $("tk-unter").textContent = `${CONFIG.wochentest.aufgaben} Aufgaben aus `
      + (anzahlThemen === 1 ? "einem Thema" : `${anzahlThemen} Themen`)
      + ` dieser Woche · Belohnung: ${CONFIG.wochentest.belohnung}`;
    $("tk-pfeil").textContent = "▶";
  } else if (st.istTestTag && st.versucheFrei === 0) {
    k.classList.add("ruht");
    $("tk-icon").textContent = "😮‍💨";
    $("tk-titel").textContent = "Heute keine Versuche mehr";
    $("tk-unter").textContent = `Nächsten ${st.tagName} gibt es einen neuen Test.`;
    $("tk-pfeil").textContent = "";
  } else {
    k.classList.add("ruht");
    $("tk-icon").textContent = "📅";
    $("tk-titel").textContent = `Wochentest am ${st.tagName}`;
    $("tk-unter").textContent = `Übe unter der Woche — genau das kommt im Test dran. Belohnung: ${CONFIG.wochentest.belohnung}`;
    $("tk-pfeil").textContent = "";
  }
}

function starteTest() {
  if (!testStatus().spielbar) return;
  const themen = mische(testThemen());
  const plan = [];
  for (let i = 0; i < CONFIG.wochentest.aufgaben; i++) {
    const [k, st] = themen[i % themen.length];
    plan.push(holeAufgabe(k, st));
  }
  quiz = {
    istTest: true, k: plan[0].kapitel, level: 0, stufe: 0,
    testPlan: plan, richtig: 0, fehlerSerie: 0, richtigSerie: 0,
    ergebnisse: [], warteschlange: [], aufgabe: null,
    istWiederholung: false, beantwortet: false
  };
  stand.testWoche.versuche++;
  sichern();
  setzeAkzent(null);
  $("q-kapitel").textContent = "Wochentest";
  $("q-level").textContent = `${CONFIG.wochentest.aufgaben} Aufgaben · ab ${CONFIG.wochentest.richtigeZumBestehen} bestanden`;
  zeigeScreen("s-quiz");
  naechsteAufgabe();
}

function werteTestAus() {
  const cfg = CONFIG.wochentest;
  const bestanden = quiz.richtig >= cfg.richtigeZumBestehen;
  setzeAkzent(null);
  $("test-bilanz").textContent = `${quiz.richtig} von ${cfg.aufgaben} richtig`;

  if (bestanden) {
    stand.testWoche.bestanden = true;
    $("test-titel").textContent = "Bestanden!";
    $("test-gutschein").hidden = false;
    $("test-pin-block").hidden = false;
    $("test-belohnung").textContent = cfg.belohnung;
    $("test-code").textContent = `ROBLOX-${stand.testWoche.woche}`;
    $("test-stempel").hidden = !stand.testWoche.eingeloest;
    $("test-pin").value = "";
    $("test-pin-meldung").textContent = "";
    $("btn-test-nochmal").hidden = true;
    konfetti();
  } else {
    const frei = Math.max(0, cfg.versucheProWoche - stand.testWoche.versuche);
    $("test-titel").textContent = "Diesmal nicht ganz";
    $("test-gutschein").hidden = true;
    $("test-pin-block").hidden = true;
    $("test-bilanz").textContent =
      `${quiz.richtig} von ${cfg.aufgaben} richtig — du brauchst ${cfg.richtigeZumBestehen}. `
      + (frei > 0 ? `Du hast noch ${frei} Versuch${frei > 1 ? "e" : ""}.` : `Nächste Woche gibt es einen neuen Test.`);
    $("btn-test-nochmal").hidden = frei === 0;
  }
  sichern();
  zeigeScreen("s-testende");
}

function testPinPruefen() {
  if ($("test-pin").value.trim() === String(CONFIG.elternPin)) {
    stand.testWoche.eingeloest = true; sichern();
    $("test-stempel").hidden = false;
    $("test-pin-meldung").textContent = "✓ Eingelöst. Viel Spaß!";
    $("test-pin").value = "";
  } else {
    $("test-pin-meldung").textContent = "Das war nicht die richtige PIN. Nochmal?";
  }
}

/* ---------- Sammelalbum ---------- */
function zeichneAlbum() {
  setzeAkzent(null);
  const habe = stand.crewHabe.length;
  $("album-text").textContent = habe === 0
    ? "Noch leer. Für jedes geschaffte Level kommt ein Mitglied dazu."
    : habe >= 30 ? "Komplett. Alle 30 beisammen. Wahnsinn." : `${habe} von 30 gesammelt. Noch ${30 - habe} zu holen.`;

  const gitter = $("album-gitter");
  gitter.innerHTML = "";
  CONFIG.crew.forEach((figur, i) => {
    const habeIch = stand.crewHabe.includes(i);
    const d = document.createElement("div");
    d.className = "karte " + (habeIch ? "habe" : "leer");
    d.style.setProperty("--kf", farbeVon(FARBVAR[KAPITEL[Math.floor(i / 5)].farbe]));
    d.innerHTML = `<span class="fig">${habeIch ? figur[0] : "❔"}</span><span class="nam">${habeIch ? figur[1] : "???"}</span>`;
    d.title = habeIch ? figur[1] : `Kapitel ${Math.floor(i / 5) + 1}, Level ${(i % 5) + 1}`;
    gitter.appendChild(d);
  });
  zeigeScreen("s-album");
}

/* ---------- Eltern-Bereich ---------- */
function zeichneEltern(entsperrt) {
  setzeAkzent(null);
  $("eltern-sperre").hidden = entsperrt;
  $("eltern-inhalt").hidden = !entsperrt;
  $("eltern-titel").textContent = entsperrt ? "Lernstand" : "PIN eingeben";
  if (!entsperrt) { $("eltern-pin").value = ""; $("eltern-meldung").textContent = ""; zeigeScreen("s-eltern"); return; }

  let gesamtV = 0, gesamtR = 0;
  const zeilen = [];
  KAPITEL.forEach((k, i) => {
    let v = 0, r = 0;
    for (let s = 1; s <= 5; s++) {
      const e = stand.stats[`k${i}s${s}`];
      if (e) { v += e.versuche; r += e.richtig; }
    }
    gesamtV += v; gesamtR += r;
    zeilen.push({ name: k.name, v, r });
  });

  $("eltern-zusammenfassung").textContent = gesamtV === 0
    ? "Noch keine Aufgaben bearbeitet."
    : `${gesamtV} Aufgaben bearbeitet, davon ${gesamtR} richtig (${Math.round(gesamtR / gesamtV * 100)} %). `
      + `${stand.crewHabe.length} von 30 Levels geschafft, Serie: ${stand.streak} Tag(e).`;

  const koerper = $("eltern-tabelle");
  koerper.innerHTML = "";
  zeilen.forEach(zl => {
    const q = zl.v ? Math.round(zl.r / zl.v * 100) : null;
    const klasse = q === null ? "keine" : q >= 80 ? "gut" : q >= 60 ? "mittel" : "schwach";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${zl.name}</td><td>${zl.v || "—"}</td>`
      + `<td><span class="quote ${klasse}">${q === null ? "—" : q + " %"}</span></td>`;
    koerper.appendChild(tr);
  });

  $("diagnose-text").textContent = sprachDiagnose();

  const schwach = zeilen.filter(zl => zl.v >= 10 && zl.r / zl.v < 0.6);
  $("eltern-rat").textContent = gesamtV < 10
    ? "Sobald ein paar Levels gespielt wurden, sehen Sie hier, welche Themen Mühe machen."
    : schwach.length
      ? `Schwerpunkt für Nachhilfe: ${schwach.map(s => s.name).join(", ")} — hier liegt die Trefferquote unter 60 %.`
      : "Alle Themen liegen über 60 % Trefferquote. Kein Thema sticht negativ heraus.";
  zeigeScreen("s-eltern");
}

/* ---------- Konfetti ---------- */
function konfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = $("konfetti"), ctx = c.getContext("2d");
  c.hidden = false;
  c.width = innerWidth; c.height = innerHeight;
  const farben = ["#FF4D8D","#FF9142","#FFD84D","#3DDC97","#3BB8F5","#A78BFA"];
  const teile = Array.from({ length: 110 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 190, y: innerHeight * 0.32,
    vx: (Math.random() - .5) * 11, vy: Math.random() * -13 - 4,
    g: 0.34 + Math.random() * 0.2, b: 5 + Math.random() * 7, h: 8 + Math.random() * 9,
    dreh: Math.random() * Math.PI, dv: (Math.random() - .5) * 0.28,
    f: farben[Math.floor(Math.random() * farben.length)]
  }));
  let rahmen = 0;
  (function lauf() {
    ctx.clearRect(0, 0, c.width, c.height);
    let sichtbar = false;
    for (const t of teile) {
      t.x += t.vx; t.y += t.vy; t.vy += t.g; t.dreh += t.dv;
      if (t.y < c.height + 40) sichtbar = true;
      ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.dreh);
      ctx.fillStyle = t.f; ctx.fillRect(-t.b / 2, -t.h / 2, t.b, t.h);
      ctx.restore();
    }
    if (sichtbar && rahmen++ < 320) requestAnimationFrame(lauf);
    else { ctx.clearRect(0, 0, c.width, c.height); c.hidden = true; }
  })();
}

/* ---------- Sternenhimmel ---------- */
function sterne() {
  const c = $("sterne"), ctx = c.getContext("2d");
  const zeichne = () => {
    c.width = innerWidth; c.height = innerHeight;
    const n = Math.min(90, Math.round(innerWidth * innerHeight / 16000));
    ctx.clearRect(0, 0, c.width, c.height);
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = 0.18 + Math.random() * 0.5;
      ctx.fillStyle = Math.random() < 0.14 ? "#FFD84D" : "#FFFFFF";
      ctx.beginPath();
      ctx.arc(Math.random() * c.width, Math.random() * c.height, Math.random() * 1.3 + 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  zeichne();
  let t;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(zeichne, 200); });
}

/* ---------- Knöpfe ---------- */
function verdrahten() {
  $("btn-weiter").addEventListener("click", () => { const z = naechstesOffenes(); starteLevel(z.k, z.l); });
  $("btn-naechste").addEventListener("click", () => {
    if (quiz.ergebnisse.length < durchgangLaenge()) return naechsteAufgabe();
    return quiz.istTest ? werteTestAus() : werteLevelAus();
  });

  $("btn-pause").addEventListener("click", () => { $("pause-overlay").hidden = false; $("btn-fortsetzen").focus(); });
  $("btn-fortsetzen").addEventListener("click", () => $("pause-overlay").hidden = true);
  $("btn-beenden").addEventListener("click", () => { $("pause-overlay").hidden = true; sichern(); heim(); });

  $("btn-pin").addEventListener("click", pinPruefen);
  $("pin-input").addEventListener("keydown", e => { if (e.key === "Enter") pinPruefen(); });

  $("btn-level-heim").addEventListener("click", heim);
  $("btn-ende-heim").addEventListener("click", heim);

  $("btn-hoeren").addEventListener("click", () => vorlesen(quiz.aufgabe.frage));
  $("test-kachel").addEventListener("click", starteTest);
  $("btn-test-pin").addEventListener("click", testPinPruefen);
  $("test-pin").addEventListener("keydown", e => { if (e.key === "Enter") testPinPruefen(); });
  $("btn-test-nochmal").addEventListener("click", starteTest);
  $("btn-test-heim").addEventListener("click", heim);
  $("btn-lesehilfe").addEventListener("click", () => setzeLesehilfe(document.documentElement.dataset.lesehilfe !== "an"));

  $("btn-sprach-test").addEventListener("click", () => {
    $("btn-sprach-test").textContent = "Läuft …";
    sprachLabor(text => {
      $("diagnose-text").textContent = text + " " + sprachDiagnose();
      if (text.indexOf("Probiere") !== 0) $("btn-sprach-test").textContent = "Nochmal testen";
    });
  });

  $("btn-album").addEventListener("click", zeichneAlbum);
  $("btn-album-zurueck").addEventListener("click", heim);

  $("btn-eltern").addEventListener("click", () => zeichneEltern(false));
  $("btn-eltern-zurueck").addEventListener("click", heim);
  const elternPruefen = () => {
    if ($("eltern-pin").value.trim() === String(CONFIG.elternPin)) zeichneEltern(true);
    else $("eltern-meldung").textContent = "Falsche PIN.";
  };
  $("btn-eltern-pin").addEventListener("click", elternPruefen);
  $("eltern-pin").addEventListener("keydown", e => { if (e.key === "Enter") elternPruefen(); });

  $("btn-reset").addEventListener("click", () => {
    if (confirm("Wirklich den ganzen Fortschritt löschen? Das lässt sich nicht rückgängig machen.")) {
      stand = leererStand(); sichern(); heim();
    }
  });

  addEventListener("keydown", e => {
    if ($("s-quiz").hidden || !$("pause-overlay").hidden) return;
    const i = ["1","2","3","4"].indexOf(e.key);
    if (i >= 0) { const b = $("antworten").children[i]; if (b && !b.disabled) b.click(); }
  });
}

/* ---------- Start ---------- */
laden();
sterne();
verdrahten();
heim();
