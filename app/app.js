/* ============================================================
   MALTE'S LIFE — Spiellogik
   ============================================================ */

const $ = (id) => document.getElementById(id);
const SPEICHER = "malteslife.v1";

/* ---------- Speicherstand ---------- */
const heuteDatum = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const leererStand = () => ({
  version: 1,
  richtigGesamt: 0,
  heuteDatum: heuteDatum(),
  heuteZahl: 0,
  streak: 0,
  letzterSpieltag: null,
  kapitel: KAPITEL.map(() => ({ levelFertig: 0 })),
  gutscheine: {},
  aktuellK: 0,
  aktuellL: 1
});

let stand = leererStand();

function laden() {
  try {
    const roh = localStorage.getItem(SPEICHER);
    if (roh) {
      const g = JSON.parse(roh);
      if (g && g.version === 1 && Array.isArray(g.kapitel) && g.kapitel.length === KAPITEL.length) stand = g;
    }
  } catch (e) { /* Speicher nicht verfügbar — läuft trotzdem, nur ohne Merken */ }
  if (stand.heuteDatum !== heuteDatum()) { stand.heuteDatum = heuteDatum(); stand.heuteZahl = 0; }
}

function sichern() {
  try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch (e) { /* ignorieren */ }
}

/* ---------- Screens ---------- */
const SCREENS = ["s-start", "s-quiz", "s-level", "s-kapitelende"];
function zeigeScreen(id) {
  SCREENS.forEach(s => $(s).hidden = (s !== id));
  window.scrollTo({ top: 0, behavior: "instant" });
}

/* ---------- Farbe & Hintergrund pro Kapitel ---------- */
const FARBVAR = { rot:"--k1", orange:"--k2", gelb:"--k3", gruen:"--k4", blau:"--k5", violett:"--k6" };

function setzeAkzent(kapitelIndex) {
  const varName = kapitelIndex === null ? "--k6" : FARBVAR[KAPITEL[kapitelIndex].farbe];
  const wert = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  document.documentElement.style.setProperty("--akzent", wert);

  const bilder = CONFIG.hintergrundBilder || [];
  const feld = $("bildgrund");
  if (bilder.length && kapitelIndex !== null) {
    feld.style.backgroundImage = `url("bilder/${bilder[kapitelIndex % bilder.length]}")`;
    feld.style.opacity = String(CONFIG.bilderDeckkraft ?? 0.22);
  } else if (bilder.length) {
    feld.style.backgroundImage = `url("bilder/${bilder[0]}")`;
    feld.style.opacity = String((CONFIG.bilderDeckkraft ?? 0.22) * 0.7);
  } else {
    feld.style.opacity = "0";
  }
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

  const ziel = CONFIG.aufgabenBisZumZiel;
  const prozent = Math.min(100, (stand.richtigGesamt / ziel) * 100);
  $("gesamt-prozent").textContent = prozent.toFixed(prozent < 10 ? 1 : 0) + "%";
  $("ring-bogen").style.strokeDashoffset = String(283 - (283 * prozent) / 100);

  const tagesZiel = CONFIG.aufgabenProTag;
  $("heute-zahl").textContent = stand.heuteZahl;
  $("heute-ziel").textContent = tagesZiel;
  const tagProzent = Math.min(100, (stand.heuteZahl / tagesZiel) * 100);
  $("heute-balken").style.width = tagProzent + "%";
  $("heute-balken-box").classList.toggle("voll", tagProzent >= 100);

  $("streak-text").textContent = stand.streak >= 2
    ? `🔥 ${stand.streak} Tage am Stück`
    : (stand.heuteZahl >= tagesZiel ? "✓ Tagesziel geschafft" : "Noch keine Serie");
  $("richtig-gesamt").textContent = `${stand.richtigGesamt} richtig`;

  const fertigeLevel = stand.kapitel.reduce((s, k) => s + k.levelFertig, 0);
  $("btn-weiter").textContent = fertigeLevel === 0 && stand.richtigGesamt === 0 ? "▶ LOS GEHT'S" : "▶ WEITERMACHEN";

  const offen = Object.values(stand.gutscheine).filter(g => !g.eingeloest).length;
  $("fuss-text").textContent = offen
    ? `${offen} Gutschein${offen > 1 ? "e" : ""} noch nicht eingelöst · Ziel: ${tagesZiel} Aufgaben am Tag`
    : `Ziel: ${tagesZiel} richtige Aufgaben am Tag — das sind 2 % Fortschritt.`;

  const liste = $("kapitel-liste");
  liste.innerHTML = "";
  KAPITEL.forEach((k, i) => {
    const fertig = stand.kapitel[i].levelFertig;
    const farbe = getComputedStyle(document.documentElement).getPropertyValue(FARBVAR[k.farbe]).trim();
    const b = document.createElement("button");
    b.className = "kap";
    b.style.setProperty("--kf", farbe);
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

/* Wo geht es weiter? Erstes Kapitel, das noch nicht komplett ist.
   Ist alles fertig, wird dort weitergeübt, wo zuletzt gespielt wurde. */
function naechstesOffenes() {
  const gemerkt = stand.aktuellK ?? 0;
  if (stand.kapitel[gemerkt] && stand.kapitel[gemerkt].levelFertig < 5)
    return { k: gemerkt, l: stand.kapitel[gemerkt].levelFertig + 1 };
  for (let i = 0; i < KAPITEL.length; i++)
    if (stand.kapitel[i].levelFertig < 5) return { k: i, l: stand.kapitel[i].levelFertig + 1 };
  return { k: gemerkt, l: 5 };
}

/* ---------- Quiz-Zustand ---------- */
let quiz = null;

function starteLevel(kIndex, level) {
  quiz = {
    k: kIndex,
    level: level,
    stufe: level,          // wird bei Bedarf ausgeglichen
    nr: 0,                 // wievielte Aufgabe im Level
    richtig: 0,
    fehlerSerie: 0,
    richtigSerie: 0,
    ergebnisse: [],
    aufgabe: null,
    beantwortet: false
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
  quiz.aufgabe = holeAufgabe(quiz.k, quiz.stufe);
  zeichneSpur();

  const text = $("aufgabe-text");
  text.textContent = quiz.aufgabe.frage;
  text.classList.toggle("lang", quiz.aufgabe.frage.length > 34);
  $("aufgabe-box").classList.remove("treffer");

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
  const alle = [...$("antworten").children];
  alle.forEach(b => b.disabled = true);

  if (korrekt) {
    knopf.classList.add("gut");
    $("aufgabe-box").classList.add("treffer");
    quiz.richtig++;
    quiz.richtigSerie++;
    quiz.fehlerSerie = 0;
    stand.richtigGesamt++;
    stand.heuteZahl++;

    // Streak pflegen
    if (stand.letzterSpieltag !== heuteDatum()) {
      const gestern = new Date(); gestern.setDate(gestern.getDate() - 1);
      const gesternStr = `${gestern.getFullYear()}-${String(gestern.getMonth()+1).padStart(2,"0")}-${String(gestern.getDate()).padStart(2,"0")}`;
      stand.streak = (stand.letzterSpieltag === gesternStr) ? stand.streak + 1 : 1;
      stand.letzterSpieltag = heuteDatum();
    }

    // AUSGLEICH: nach 3 Treffern wieder auf die volle Level-Stufe
    if (quiz.richtigSerie >= 3 && quiz.stufe < quiz.level) { quiz.stufe++; quiz.richtigSerie = 0; }

    zeigeBlase(true, w(CONFIG.lobRichtig), null);
  } else {
    knopf.classList.add("schlecht");
    alle.forEach(b => { if (b.textContent === quiz.aufgabe.antwort) b.classList.add("zeigen"); });
    quiz.fehlerSerie++;
    quiz.richtigSerie = 0;

    // AUSGLEICH: nach 2 Fehlern wird die nächste Aufgabe leichter
    if (quiz.fehlerSerie >= 2 && quiz.stufe > 1) { quiz.stufe--; quiz.fehlerSerie = 0; }

    zeigeBlase(false, w(CONFIG.lobFalsch), `Richtig wäre: ${quiz.aufgabe.antwort}\n${quiz.aufgabe.hinweis}`);
  }

  quiz.ergebnisse.push(korrekt);
  zeichneSpur();
  sichern();

  $("quiz-weiter").hidden = false;
  $("btn-naechste").textContent = quiz.ergebnisse.length >= CONFIG.aufgabenProLevel ? "LEVEL AUSWERTEN ▶" : "WEITER ▶";
  $("btn-naechste").focus({ preventScroll: true });
}

function zeigeBlase(gut, titel, text) {
  const b = $("blase");
  b.hidden = false;
  b.className = "blase " + (gut ? "gut" : "schlecht");
  $("blase-titel").textContent = titel;
  $("blase-text").textContent = text || "";
  $("blase-text").hidden = !text;
}

/* ---------- Level auswerten ---------- */
function werteLevelAus() {
  const geschafft = quiz.richtig >= CONFIG.richtigeZumBestehen;
  const kap = KAPITEL[quiz.k];
  setzeAkzent(quiz.k);

  $("level-bilanz").textContent = `${quiz.richtig} von ${CONFIG.aufgabenProLevel} richtig · ${kap.name}, Level ${quiz.level}`;

  if (!geschafft) {
    // Sanft: kein Gutschein, aber alles Richtige zählt trotzdem fürs 100%-Ziel
    $("level-titel").textContent = "Fast! Nochmal?";
    $("gutschein").hidden = true;
    $("pin-input").parentElement.hidden = true;
    $("pin-meldung").textContent = "";
    $("level-hinweis").textContent =
      `Du brauchst ${CONFIG.richtigeZumBestehen} von ${CONFIG.aufgabenProLevel}. Deine richtigen Antworten sind trotzdem gezählt worden.`;
    $("btn-level-weiter").textContent = "LEVEL NOCHMAL ▶";
    $("btn-level-weiter").onclick = () => starteLevel(quiz.k, quiz.level);
    zeigeScreen("s-level");
    return;
  }

  // Bestanden
  const neu = quiz.level > stand.kapitel[quiz.k].levelFertig;
  if (neu) stand.kapitel[quiz.k].levelFertig = quiz.level;

  $("level-titel").textContent = w(["Stark!", "Level durch!", "Das saß.", "Geschafft!"]);
  $("gutschein").hidden = false;
  $("pin-input").parentElement.hidden = false;
  $("pin-input").value = "";
  $("pin-meldung").textContent = "";
  $("level-hinweis").textContent = "Zeig den Gutschein Mama. Sie tippt die PIN ein.";

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
  $("btn-level-weiter").onclick = () => {
    if (kapitelFertig) zeigeKapitelende(quiz.k);
    else starteLevel(quiz.k, quiz.level + 1);
  };

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
  } else {
    b.hidden = true;
  }
  zeigeScreen("s-kapitelende");
  konfetti();
}

/* ---------- Gutschein einlösen ---------- */
function pinPruefen() {
  const eingabe = $("pin-input").value.trim();
  const schluessel = `k${quiz.k + 1}l${quiz.level}`;
  const g = stand.gutscheine[schluessel];
  if (!g) return;
  if (eingabe === String(CONFIG.elternPin)) {
    g.eingeloest = true;
    sichern();
    $("gutschein-stempel").hidden = false;
    $("pin-meldung").textContent = "✓ Eingelöst. Viel Spaß damit!";
    $("pin-input").value = "";
  } else {
    $("pin-meldung").textContent = "Das war nicht die richtige PIN. Nochmal?";
  }
}

/* ---------- Konfetti ---------- */
function konfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = $("konfetti"), ctx = c.getContext("2d");
  c.hidden = false;
  c.width = innerWidth; c.height = innerHeight;
  const farben = ["#FF4D8D","#FF9142","#FFD84D","#3DDC97","#3BB8F5","#A78BFA"];
  const teile = Array.from({ length: 110 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 190,
    y: innerHeight * 0.32,
    vx: (Math.random() - .5) * 11,
    vy: Math.random() * -13 - 4,
    g: 0.34 + Math.random() * 0.2,
    b: 5 + Math.random() * 7,
    h: 8 + Math.random() * 9,
    dreh: Math.random() * Math.PI,
    dv: (Math.random() - .5) * 0.28,
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
      const x = Math.random() * c.width, y = Math.random() * c.height;
      const r = Math.random() * 1.3 + 0.35;
      ctx.globalAlpha = 0.18 + Math.random() * 0.5;
      ctx.fillStyle = Math.random() < 0.14 ? "#FFD84D" : "#FFFFFF";
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  zeichne();
  let t;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(zeichne, 200); });
}

/* ---------- Knöpfe verdrahten ---------- */
function verdrahten() {
  $("btn-weiter").addEventListener("click", () => {
    const ziel = naechstesOffenes();
    starteLevel(ziel.k, ziel.l);
  });

  $("btn-naechste").addEventListener("click", () => {
    if (quiz.ergebnisse.length >= CONFIG.aufgabenProLevel) werteLevelAus();
    else naechsteAufgabe();
  });

  $("btn-pause").addEventListener("click", () => { $("pause-overlay").hidden = false; $("btn-fortsetzen").focus(); });
  $("btn-fortsetzen").addEventListener("click", () => $("pause-overlay").hidden = true);
  $("btn-beenden").addEventListener("click", () => {
    $("pause-overlay").hidden = true;
    sichern(); zeichneStart(); zeigeScreen("s-start");
  });

  $("btn-pin").addEventListener("click", pinPruefen);
  $("pin-input").addEventListener("keydown", e => { if (e.key === "Enter") pinPruefen(); });

  $("btn-level-heim").addEventListener("click", () => { zeichneStart(); zeigeScreen("s-start"); });
  $("btn-ende-heim").addEventListener("click", () => { zeichneStart(); zeigeScreen("s-start"); });

  $("btn-reset").addEventListener("click", () => {
    if (confirm("Wirklich den ganzen Fortschritt löschen? Das lässt sich nicht rückgängig machen.")) {
      stand = leererStand(); sichern(); zeichneStart();
    }
  });

  // Tastatur: 1-4 wählt Antworten
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
zeichneStart();
zeigeScreen("s-start");
