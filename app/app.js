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
      }
    }
  } catch (e) { /* kein Speicher verfügbar — läuft trotzdem, merkt sich nur nichts */ }

  // Tageswechsel
  if (stand.heuteDatum !== heuteDatum()) { stand.heuteDatum = heuteDatum(); stand.heuteZahl = 0; }
  // Wochenwechsel: Joker wieder aufladen
  if (stand.jokerWoche !== wochenSchluessel()) { stand.jokerWoche = wochenSchluessel(); stand.jokerBenutzt = 0; }
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
const SCREENS = ["s-start", "s-quiz", "s-level", "s-kapitelende", "s-album", "s-eltern"];
function zeigeScreen(id) {
  SCREENS.forEach(s => $(s).hidden = (s !== id));
  window.scrollTo({ top: 0, behavior: "instant" });
}
function heim() { zeichneStart(); zeigeScreen("s-start"); }

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

/* ---------- Statistik ---------- */
function merkeStat(kapitel, stufe, richtig) {
  const s = `k${kapitel}s${stufe}`;
  if (!stand.stats[s]) stand.stats[s] = { versuche: 0, richtig: 0 };
  stand.stats[s].versuche++;
  if (richtig) stand.stats[s].richtig++;
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

function zeichneSpur() {
  const spur = $("spur");
  spur.innerHTML = "";
  for (let i = 0; i < CONFIG.aufgabenProLevel; i++) {
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
  const faellig = quiz.warteschlange.findIndex(e => e.faelligBei <= nr);
  if (faellig >= 0) {
    quiz.aufgabe = quiz.warteschlange.splice(faellig, 1)[0].aufgabe;
    quiz.istWiederholung = true;
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

    // Ausgleich: nach 3 Treffern zurück auf die volle Level-Stufe
    if (quiz.richtigSerie >= 3 && quiz.stufe < quiz.level) { quiz.stufe++; quiz.richtigSerie = 0; }

    zeigeBlase(true, w(CONFIG.lobRichtig), null, null);
  } else {
    knopf.classList.add("schlecht");
    [...$("antworten").children].forEach(b => { if (b.textContent === quiz.aufgabe.antwort) b.classList.add("zeigen"); });
    quiz.fehlerSerie++;
    quiz.richtigSerie = 0;

    // Ausgleich: nach 2 Fehlern wird die nächste Aufgabe leichter
    if (quiz.fehlerSerie >= 2 && quiz.stufe > 1) { quiz.stufe--; quiz.fehlerSerie = 0; }

    // Diese Aufgabe kommt später noch zweimal zurück
    if (!quiz.istWiederholung) {
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
  $("btn-naechste").textContent = quiz.ergebnisse.length >= CONFIG.aufgabenProLevel ? "LEVEL AUSWERTEN ▶" : "WEITER ▶";
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
  $("btn-naechste").addEventListener("click", () =>
    quiz.ergebnisse.length >= CONFIG.aufgabenProLevel ? werteLevelAus() : naechsteAufgabe());

  $("btn-pause").addEventListener("click", () => { $("pause-overlay").hidden = false; $("btn-fortsetzen").focus(); });
  $("btn-fortsetzen").addEventListener("click", () => $("pause-overlay").hidden = true);
  $("btn-beenden").addEventListener("click", () => { $("pause-overlay").hidden = true; sichern(); heim(); });

  $("btn-pin").addEventListener("click", pinPruefen);
  $("pin-input").addEventListener("keydown", e => { if (e.key === "Enter") pinPruefen(); });

  $("btn-level-heim").addEventListener("click", heim);
  $("btn-ende-heim").addEventListener("click", heim);

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
