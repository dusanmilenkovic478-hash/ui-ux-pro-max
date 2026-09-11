/* ============================================================
   AUFGABEN-GENERATOREN
   Jede Stufe erzeugt unendlich viele neue Aufgaben derselben Art.
   Die Schwierigkeit steigt bewusst langsam: Stufe 1 ist sehr leicht.
   Rückgabe: { frage, antwort, optionen[], hinweis, bild?, hinweisBild? }
     bild        = Anschauungshilfe, direkt bei der Aufgabe sichtbar
     hinweisBild = erscheint erst, wenn die Antwort falsch war
   ============================================================ */

const z = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const w = (arr) => arr[Math.floor(Math.random() * arr.length)];

function mische(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function optionen(richtig, typischeFehler = [], spanne = 5) {
  const set = [richtig];
  // Ist die Lösung eine ganze Zahl, dürfen die falschen Antworten keine
  // Kommazahlen sein — sonst steht plötzlich "7.5" zur Auswahl.
  const nurGanze = Number.isInteger(richtig);
  // Negative Aufgaben brauchen auch negative Alternativen, sonst ist die
  // Lösung schon daran zu erkennen, dass sie als einzige ein Minus hat.
  const negativOk = richtig < 0;
  const passt = (v) => Number.isFinite(v) && !set.includes(v)
    && (negativOk || v >= 0) && (!nurGanze || Number.isInteger(v));
  for (const f of typischeFehler) { if (set.length < 4 && passt(f)) set.push(f); }
  let schutz = 0;
  while (set.length < 4 && schutz++ < 200) {
    const k = richtig + z(1, spanne) * (Math.random() < 0.5 ? -1 : 1);
    if (passt(k)) set.push(k);
  }
  while (set.length < 4) set.push(richtig + set.length * 7);
  return mische(set);
}

/* Nimmt die richtige Antwort und füllt mit falschen auf — ohne Dopplungen.
   Zweimal dieselbe Antwort zur Auswahl zu stellen ist sinnlos und verwirrt. */
function textOptionen(richtig, falsche) {
  const set = [String(richtig)];
  for (const f of falsche) {
    if (set.length >= 4) break;
    const t = String(f);
    if (!set.includes(t)) set.push(t);
  }
  // Sind zu wenige übrig geblieben (weil sich Alternativen glichen), werden
  // aus der richtigen Antwort weitere gebildet — mit gleicher Einheit und
  // gleicher Schreibweise, damit nichts aus der Reihe fällt.
  if (set.length < 4) {
    const teile = String(richtig).match(/^(-?\d+(?:,\d+)?)(.*)$/);
    if (teile) {
      const mitKomma = teile[1].includes(",");
      const basis = parseFloat(teile[1].replace(",", "."));
      const rest = teile[2];
      const schreibe = (v) => (mitKomma ? v.toFixed(2).replace(".", ",") : String(v)) + rest;
      const abstaende = mitKomma ? [1, -1, 0.5, -0.5, 2, -2, 10, -10] : [1, -1, 2, -2, 5, -5, 10, -10, 3, 20];
      for (const d of abstaende) {
        if (set.length >= 4) break;
        const wert = basis + d;
        if (wert < 0 && basis >= 0) continue;                 // kein Minus, wo keines hingehört
        if (!mitKomma && !Number.isInteger(wert)) continue;
        const kandidat = schreibe(wert);
        if (!set.includes(kandidat)) set.push(kandidat);
      }
    }
  }
  return mische(set);
}

const eur = (cent) => (cent / 100).toFixed(2).replace(".", ",") + " €";

/* ---------- Anschauungshilfen (SVG) ---------- */

/* Kreis in n Stücke geteilt, davon z gefüllt — für Brüche */
function kreisTeil(zaehler, nenner, groesse = 116) {
  const r = 48, cx = 55, cy = 55;
  let p = "";
  for (let i = 0; i < nenner; i++) {
    const a1 = (i / nenner) * 2 * Math.PI - Math.PI / 2;
    const a2 = ((i + 1) / nenner) * 2 * Math.PI - Math.PI / 2;
    const x1 = (cx + r * Math.cos(a1)).toFixed(1), y1 = (cy + r * Math.sin(a1)).toFixed(1);
    const x2 = (cx + r * Math.cos(a2)).toFixed(1), y2 = (cy + r * Math.sin(a2)).toFixed(1);
    const gross = (a2 - a1) > Math.PI ? 1 : 0;
    const farbe = i < zaehler ? "var(--akzent)" : "rgba(255,255,255,.06)";
    p += `<path d="M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${gross} 1 ${x2} ${y2} Z" fill="${farbe}" stroke="#0A0714" stroke-width="2.5"/>`;
  }
  return `<svg viewBox="0 0 110 110" width="${groesse}" height="${groesse}" aria-hidden="true">${p}</svg>`;
}

/* Punktefeld: reihen × spalten — macht Malnehmen sichtbar */
function punkteFeld(reihen, spalten) {
  const d = 14, pad = 7;
  const bw = pad * 2 + spalten * d, bh = pad * 2 + reihen * d;
  let p = "";
  for (let i = 0; i < reihen; i++)
    for (let j = 0; j < spalten; j++)
      p += `<circle cx="${pad + j * d + d / 2}" cy="${pad + i * d + d / 2}" r="5" fill="var(--akzent)" stroke="#0A0714" stroke-width="1.5"/>`;
  return `<svg viewBox="0 0 ${bw} ${bh}" width="${Math.min(226, bw * 1.35)}" aria-hidden="true">${p}</svg>`;
}

/* Zwei Bruchkreise nebeneinander — zum Vergleichen */
function zweiKreise(a, b) {
  const teil = (s) => { const [p, q] = s.split("/").map(Number); return kreisTeil(p, q, 96); };
  return `<div style="display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap">
    <div><div>${teil(a)}</div><b style="display:block;margin-top:4px">${a}</b></div>
    <div><div>${teil(b)}</div><b style="display:block;margin-top:4px">${b}</b></div></div>`;
}


/* Zwanzigerfeld: der Klassiker gegen zählendes Rechnen.
   Zwei Reihen à 10, nach 5 abgesetzt — Mengen werden auf einen Blick erfassbar. */
function zwanzigerFeld(anzahl, zweiteMenge = 0) {
  const d = 19, pad = 8, luecke = 9;
  const bw = pad * 2 + 10 * d + luecke, bh = pad * 2 + 2 * d;
  let p = "";
  for (let i = 0; i < 20; i++) {
    const reihe = Math.floor(i / 10), spalte = i % 10;
    const x = pad + spalte * d + (spalte >= 5 ? luecke : 0) + d / 2;
    const y = pad + reihe * d + d / 2;
    let farbe = "rgba(255,255,255,.05)", rand = "rgba(255,255,255,.16)";
    if (i < anzahl) { farbe = "var(--akzent)"; rand = "#0A0714"; }
    else if (i < anzahl + zweiteMenge) { farbe = "#FFD84D"; rand = "#0A0714"; }
    p += `<circle cx="${x}" cy="${y}" r="7" fill="${farbe}" stroke="${rand}" stroke-width="1.8"/>`;
  }
  return `<svg viewBox="0 0 ${bw} ${bh}" width="${Math.min(268, bw)}" aria-hidden="true">${p}</svg>`;
}

/* Zahlenstrahl mit optionalem Sprung — macht Plus und Minus als Bewegung sichtbar */
function zahlenstrahl(von, bis, start, ziel) {
  const bw = 280, bh = 74, lx = 22, rx = bw - 22;
  const pos = (n) => lx + ((n - von) / (bis - von)) * (rx - lx);
  const y = 50;
  let p = `<line x1="${lx}" y1="${y}" x2="${rx}" y2="${y}" stroke="rgba(255,255,255,.3)" stroke-width="2.5"/>`;
  const schritt = Math.max(1, Math.round((bis - von) / 10));
  for (let n = von; n <= bis; n += schritt) {
    const x = pos(n);
    p += `<line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}" stroke="rgba(255,255,255,.3)" stroke-width="2"/>`;
    p += `<text x="${x}" y="${y + 22}" fill="rgba(255,255,255,.55)" font-size="11" text-anchor="middle" font-family="sans-serif">${n}</text>`;
  }
  if (start !== undefined && ziel !== undefined) {
    const x1 = pos(start), x2 = pos(ziel), hoch = y - 26;
    p += `<path d="M${x1} ${y - 8} Q${(x1 + x2) / 2} ${hoch - 12} ${x2} ${y - 8}" fill="none" stroke="var(--akzent)" stroke-width="3" stroke-linecap="round"/>`;
    p += `<circle cx="${x1}" cy="${y}" r="5.5" fill="#FFD84D" stroke="#0A0714" stroke-width="2"/>`;
    p += `<circle cx="${x2}" cy="${y}" r="5.5" fill="var(--akzent)" stroke="#0A0714" stroke-width="2"/>`;
  }
  return `<svg viewBox="0 0 ${bw} ${bh}" width="${bw}" aria-hidden="true">${p}</svg>`;
}

/* Geldstücke statt nackter Cent-Zahlen */
function muenzen(euro, cent) {
  const teile = [];
  for (let i = 0; i < Math.min(euro, 8); i++) teile.push(`<span style="font-size:1.5rem">🪙</span>`);
  let t = `<div style="display:flex;gap:3px;flex-wrap:wrap;justify-content:center;align-items:center">${teile.join("")}`;
  if (euro > 8) t += `<b style="font-size:.9rem;margin-left:4px">…${euro} €</b>`;
  if (cent) t += `<b style="font-size:.95rem;margin-left:8px">+ ${cent} ct</b>`;
  return t + `</div>`;
}


/* ---------- Figuren für Klasse 7 bis 9 ---------- */

const FIG_LINIE = "#0A0714", FIG_MASS = "rgba(255,255,255,.62)";

function figurRahmen(inhalt, bw, bh, breite) {
  return `<svg viewBox="0 0 ${bw} ${bh}" width="${breite || Math.min(250, bw)}" aria-hidden="true">${inhalt}</svg>`;
}
function beschriftung(x, y, text, anker = "middle") {
  return `<text x="${x}" y="${y}" fill="${FIG_MASS}" font-size="13" font-family="sans-serif" text-anchor="${anker}">${text}</text>`;
}

function figRechteck(breiteText, hoeheText) {
  const x = 60, y = 24, b = 158, h = 84;   // links Platz für die Maßangabe
  return figurRahmen(
    `<rect x="${x}" y="${y}" width="${b}" height="${h}" fill="color-mix(in srgb,var(--akzent) 26%,transparent)" stroke="${FIG_LINIE}" stroke-width="3"/>`
    + beschriftung(x + b / 2, y - 7, breiteText)
    + beschriftung(x - 8, y + h / 2 + 5, hoeheText, "end"), 252, 128);
}

function figDreieck(grundText, hoeheText) {
  const x = 34, y = 20, b = 158, h = 88;
  const spitzeX = x + b * 0.38;
  return figurRahmen(
    `<polygon points="${x},${y + h} ${x + b},${y + h} ${spitzeX},${y}" fill="color-mix(in srgb,var(--akzent) 26%,transparent)" stroke="${FIG_LINIE}" stroke-width="3"/>`
    + `<line x1="${spitzeX}" y1="${y}" x2="${spitzeX}" y2="${y + h}" stroke="${FIG_MASS}" stroke-width="2" stroke-dasharray="5 4"/>`
    + `<rect x="${spitzeX}" y="${y + h - 12}" width="12" height="12" fill="none" stroke="${FIG_MASS}" stroke-width="1.5"/>`
    + beschriftung(x + b / 2, y + h + 19, grundText)
    + beschriftung(spitzeX + 7, y + h / 2, hoeheText, "start"), 230, 134);
}

function figKreis(radiusText) {
  const cx = 115, cy = 68, r = 52;
  return figurRahmen(
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="color-mix(in srgb,var(--akzent) 26%,transparent)" stroke="${FIG_LINIE}" stroke-width="3"/>`
    + `<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${FIG_MASS}" stroke-width="2.5"/>`
    + `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${FIG_MASS}"/>`
    + beschriftung(cx + r / 2, cy - 8, radiusText), 230, 136);
}

function figQuader(laengeText, breiteText, hoeheText) {
  const x = 30, y = 38, b = 120, h = 66, t = 34;
  const fl = "color-mix(in srgb,var(--akzent) 26%,transparent)";
  return figurRahmen(
    `<polygon points="${x},${y} ${x + b},${y} ${x + b},${y + h} ${x},${y + h}" fill="${fl}" stroke="${FIG_LINIE}" stroke-width="3"/>`
    + `<polygon points="${x},${y} ${x + t},${y - t} ${x + b + t},${y - t} ${x + b},${y}" fill="color-mix(in srgb,var(--akzent) 40%,transparent)" stroke="${FIG_LINIE}" stroke-width="3"/>`
    + `<polygon points="${x + b},${y} ${x + b + t},${y - t} ${x + b + t},${y + h - t} ${x + b},${y + h}" fill="color-mix(in srgb,var(--akzent) 14%,transparent)" stroke="${FIG_LINIE}" stroke-width="3"/>`
    + beschriftung(x + b / 2, y + h + 19, laengeText)
    + beschriftung(x + b + t + 6, y + h / 2, hoeheText, "start")
    + beschriftung(x + t / 2 + 6, y - t / 2 - 2, breiteText, "end"), 234, 140);
}

/* Rechtwinkliges Dreieck; gesucht ist die Seite mit dem Fragezeichen */
function figPythagoras(aText, bText, cText) {
  const x = 64, y = 22, b = 140, h = 88;   // links Platz für die Maßangabe
  return figurRahmen(
    `<polygon points="${x},${y + h} ${x + b},${y + h} ${x},${y}" fill="color-mix(in srgb,var(--akzent) 26%,transparent)" stroke="${FIG_LINIE}" stroke-width="3"/>`
    + `<rect x="${x}" y="${y + h - 13}" width="13" height="13" fill="none" stroke="${FIG_MASS}" stroke-width="1.5"/>`
    + beschriftung(x - 8, y + h / 2, aText, "end")
    + beschriftung(x + b / 2, y + h + 19, bText)
    + beschriftung(x + b / 2 + 14, y + h / 2 - 8, cText, "start"), 256, 134);
}

/* Thermometer-Zahlenstrahl für negative Zahlen */
function figTemperatur(von, bis, wert, wert2) {
  const bw = 280, lx = 26, rx = bw - 26, y = 42;
  const pos = (n) => lx + ((n - von) / (bis - von)) * (rx - lx);
  let p = `<line x1="${lx}" y1="${y}" x2="${rx}" y2="${y}" stroke="rgba(255,255,255,.3)" stroke-width="2.5"/>`;
  const schritt = Math.max(1, Math.round((bis - von) / 10));
  for (let n = von; n <= bis; n += schritt) {
    const x = pos(n), null_ = (n === 0);
    p += `<line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}" stroke="${null_ ? "#FFD84D" : "rgba(255,255,255,.3)"}" stroke-width="${null_ ? 3 : 2}"/>`;
    p += `<text x="${x}" y="${y + 22}" fill="${null_ ? "#FFD84D" : "rgba(255,255,255,.5)"}" font-size="11" text-anchor="middle" font-family="sans-serif">${n}</text>`;
  }
  if (wert !== undefined) {
    p += `<circle cx="${pos(wert)}" cy="${y}" r="6" fill="#3BB8F5" stroke="${FIG_LINIE}" stroke-width="2"/>`;
    if (wert2 !== undefined) {
      p += `<circle cx="${pos(wert2)}" cy="${y}" r="6" fill="var(--akzent)" stroke="${FIG_LINIE}" stroke-width="2"/>`;
      p += `<path d="M${pos(wert)} ${y - 10} Q${(pos(wert) + pos(wert2)) / 2} ${y - 30} ${pos(wert2)} ${y - 10}" fill="none" stroke="var(--akzent)" stroke-width="3" stroke-linecap="round"/>`;
    }
  }
  return figurRahmen(p, bw, 62, bw);
}

/* ============================================================
   KAPITEL 1 — PLUS & MINUS
   ============================================================ */
const kapitel1 = [
  // Stufe 1: ganz leicht, einstellig, Ergebnis bis 20
  () => {
    const a = z(2, 9), b = z(2, 9), e = a + b;
    return { frage: `${a} + ${b}`, antwort: e,
      optionen: optionen(e, [e + 1, e - 1, e + 2], 3),
      hinweis: `${a} blaue Punkte, ${b} gelbe dazu. Zusammen ${e}.`,
      bild: zwanzigerFeld(a, b) };
  },
  // Stufe 2: zweistellig ± einstellig
  () => {
    const plus = Math.random() < 0.6;
    if (plus) {
      const zehner = z(1, 8) * 10, einer = z(1, 5), b = z(2, 4);
      const a = zehner + einer, e = a + b;
      return { frage: `${a} + ${b}`, antwort: e, optionen: optionen(e, [e + 1, e - 1, e + 10], 3),
        hinweis: `Die ${zehner} bleibt stehen. Rechne nur ${einer} + ${b} = ${einer + b}.`,
        hinweisBild: zahlenstrahl(zehner, zehner + 10, a, e) };
    }
    const a = z(25, 89), b = z(2, 5), e = a - b;
    return { frage: `${a} − ${b}`, antwort: e, optionen: optionen(e, [e + 1, e - 1, a + b], 3),
      hinweis: `Geh von ${a} aus ${b} Schritte zurück.`,
      hinweisBild: zahlenstrahl(Math.floor(e / 10) * 10, Math.floor(e / 10) * 10 + 10, a, e) };
  },
  // Stufe 3: zweistellig ± zweistellig
  () => {
    const plus = Math.random() < 0.5;
    if (plus) {
      const a = z(21, 69), b = z(11, 30), e = a + b;
      return { frage: `${a} + ${b}`, antwort: e, optionen: optionen(e, [e - 10, e + 10, a - b], 4),
        hinweis: `Erst die Zehner: ${Math.floor(a/10)*10} + ${Math.floor(b/10)*10} = ${Math.floor(a/10)*10 + Math.floor(b/10)*10}. Dann die Einer dazu.` };
    }
    const a = z(45, 99), b = z(11, 35), e = a - b;
    return { frage: `${a} − ${b}`, antwort: e, optionen: optionen(e, [e + 10, e - 10, a + b], 4),
      hinweis: `Erst ${b - (b % 10)} abziehen (macht ${a - (b - b % 10)}), dann noch ${b % 10}.` };
  },
  // Stufe 4: dreistellig ± zweistellig
  () => {
    const plus = Math.random() < 0.5;
    const a = z(120, 780), b = z(15, 85);
    const e = plus ? a + b : a - b;
    return { frage: `${a} ${plus ? "+" : "−"} ${b}`, antwort: e,
      optionen: optionen(e, [e + 10, e - 10, e + 100], 8),
      hinweis: `Die Hunderter kannst du erstmal liegen lassen. Rechne nur mit den letzten beiden Stellen.` };
  },
  // Stufe 5: dreistellig ± dreistellig und Ergänzen
  () => {
    if (Math.random() < 0.6) {
      const plus = Math.random() < 0.5;
      const a = z(210, 720), b = z(110, 240);
      const e = plus ? a + b : a - b;
      return { frage: `${a} ${plus ? "+" : "−"} ${b}`, antwort: e,
        optionen: optionen(e, [e + 100, e - 100, e + 10], 9),
        hinweis: `Zerleg ${b} in ${Math.floor(b/100)*100} + ${b % 100} und rechne in zwei Schritten.` };
    }
    const e = z(12, 68), ziel = z(90, 200), a = ziel - e;
    return { frage: `${a} + ☐ = ${ziel}`, antwort: e,
      optionen: optionen(e, [e + 10, e - 10, ziel + a], 6),
      hinweis: `Dreh die Frage um: ${ziel} − ${a} = ?` };
  }
];

/* ============================================================
   KAPITEL 2 — MAL & GETEILT
   ============================================================ */
const kapitel2 = [
  // Stufe 1: die leichtesten Reihen, mit Punktebild als Stütze
  () => {
    const a = w([2, 5, 10]), b = z(2, 6), e = a * b;
    return { frage: `${a} · ${b}`, antwort: e,
      optionen: optionen(e, [e + a, e - a, a + b], 3),
      hinweis: `${a} · ${b} heißt: ${b} mal die ${a} zusammenzählen.`,
      bild: punkteFeld(b, a) };
  },
  // Stufe 2: 3er und 4er Reihe
  () => {
    const a = w([3, 4]), b = z(2, 10), e = a * b;
    return { frage: `${a} · ${b}`, antwort: e,
      optionen: optionen(e, [e + a, e - a, a + b], 4),
      hinweis: `Tipp: ${a} · ${b - 1} = ${a * (b - 1)}, also noch einmal ${a} dazu.`,
      hinweisBild: punkteFeld(b, a) };
  },
  // Stufe 3: großes Einmaleins
  () => {
    const a = z(6, 9), b = z(3, 10), e = a * b;
    return { frage: `${a} · ${b}`, antwort: e,
      optionen: optionen(e, [e + a, e - a, e + b], 6),
      hinweis: `Tipp: ${a} · 10 = ${a * 10}. Davon ${10 - b} mal die ${a} wieder abziehen.` };
  },
  // Stufe 4: Teilen ohne Rest
  () => {
    const b = z(2, 9), e = z(2, 10), a = b * e;
    return { frage: `${a} : ${b}`, antwort: e,
      optionen: optionen(e, [e + 1, e - 1, b], 3),
      hinweis: `Frag dich: Wie oft passt ${b} in ${a}?`,
      hinweisBild: punkteFeld(e, b) };
  },
  // Stufe 5: Zehnerzahlen und Teilen mit Rest
  () => {
    if (Math.random() < 0.5) {
      const a = z(2, 9) * 10, b = z(3, 9), e = a * b;
      return { frage: `${a} · ${b}`, antwort: e,
        optionen: optionen(e, [e * 10, e / 10, e + 10], 20),
        hinweis: `Rechne ${a / 10} · ${b} = ${(a / 10) * b} und häng eine Null an.` };
    }
    const b = z(3, 9), ganz = z(2, 9), rest = z(1, b - 1), a = b * ganz + rest;
    return { frage: `${a} : ${b} — wie viel bleibt übrig?`, antwort: rest,
      optionen: optionen(rest, [ganz, rest + 1, b], 2),
      hinweis: `${b} · ${ganz} = ${b * ganz}. Von ${a} bleiben dann ${rest} übrig.` };
  }
];

/* ============================================================
   KAPITEL 3 — GELD & GRÖSSEN
   ============================================================ */
const kapitel3 = [
  // Stufe 1: volle Euro
  () => {
    const e = z(2, 9), c = e * 100;
    return { frage: `${c} Cent sind wie viel Euro?`, antwort: `${e} €`,
      optionen: textOptionen(`${e} €`, [`${e + 1} €`, `${e - 1} €`, `${c} €`, `${e * 10} €`]),
      hinweis: `100 Cent sind 1 €.\nAlso sind ${c} Cent genau ${e} €.`,
      hinweisBild: muenzen(e, 0) };
  },
  // Stufe 2: Euro und Cent gemischt
  () => {
    const c = z(2, 9) * 100 + z(1, 19) * 5;
    return { frage: `${c} Cent sind wie viel Euro?`, antwort: eur(c),
      optionen: textOptionen(eur(c), [eur(c + 100), eur(c - 100), eur(c * 10), eur(c + 10)]),
      hinweis: `Die letzten zwei Ziffern sind die Cent, alles davor sind die Euro.` };
  },
  // Stufe 3: Längen und Gewichte
  () => {
    if (Math.random() < 0.5) {
      const m = z(2, 9), cm = z(1, 9) * 10, e = m * 100 + cm;
      return { frage: `${m} m und ${cm} cm sind zusammen wie viele cm?`, antwort: e,
        optionen: optionen(e, [m * 10 + cm, e + 100, m + cm], 50),
        hinweis: `1 m = 100 cm. Also sind ${m} m schon ${m * 100} cm.` };
    }
    const kg = z(2, 9), g = z(1, 9) * 100, e = kg * 1000 + g;
    return { frage: `${kg} kg und ${g} g sind zusammen wie viele g?`, antwort: e,
      optionen: optionen(e, [kg * 100 + g, e + 1000, kg + g], 100),
      hinweis: `1 kg = 1000 g. Also sind ${kg} kg schon ${kg * 1000} g.` };
  },
  // Stufe 4: Uhrzeit
  () => {
    const sH = z(7, 19), sM = w([0, 15, 30, 45]), dauer = w([30, 45, 60, 75, 90, 120]);
    const gesamt = sH * 60 + sM + dauer;
    const eh = Math.floor(gesamt / 60) % 24, em = gesamt % 60;
    const fmt = (h, m) => `${h}:${String(m).padStart(2, "0")} Uhr`;
    return { frage: `Der Film startet um ${fmt(sH, sM)}.\nEr dauert ${dauer} Minuten.\nWann ist er zu Ende?`,
      antwort: fmt(eh, em),
      optionen: textOptionen(fmt(eh, em), [fmt(eh + 1, em), fmt(eh - 1, em), fmt(eh, (em + 30) % 60)]),
      hinweis: `${dauer} Minuten sind ${Math.floor(dauer / 60)} Stunde(n) und ${dauer % 60} Minuten.` };
  },
  // Stufe 5: Einkauf und Rückgeld
  () => {
    if (Math.random() < 0.5) {
      const anz = z(2, 5), preis = z(2, 9) * 50 + 49, e = anz * preis;
      return { frage: `Du kaufst ${anz} Energydrinks.\nEiner kostet ${eur(preis)}.\nWas kostet alles zusammen?`,
        antwort: eur(e),
        optionen: textOptionen(eur(e), [eur(e + 100), eur(e - 100), eur(preis * (anz + 1)), eur(e + preis)]),
        hinweis: `Rechne erst mit den vollen Euro, dann mit den Cent.` };
    }
    const preis = z(3, 17) * 100 + w([0, 50, 20, 90]);
    const gegeben = Math.ceil(preis / 500) * 500 + w([0, 500]);
    const e = gegeben - preis;
    return { frage: `Die Rechnung ist ${eur(preis)}.\nDu gibst ${eur(gegeben)}.\nWie viel bekommst du zurück?`,
      antwort: eur(e),
      optionen: textOptionen(eur(e), [eur(e + 100), eur(e - 100), eur(e + 50), eur(preis)]),
      hinweis: `Zähl von ${eur(preis)} hoch bis ${eur(gegeben)}.` };
  }
];

/* ============================================================
   KAPITEL 4 — TEXTAUFGABEN
   ============================================================ */
const kapitel4 = [
  // Stufe 1: ein Schritt, sehr kleine Zahlen
  () => {
    const leute = z(2, 4), proPerson = z(2, 3), stueck = leute * proPerson;
    return { frage: `Ihr seid ${leute} Leute.\nIhr habt ${stueck} Pizzastücke.\nJede Person bekommt gleich viel.\nWie viele sind das?`,
      antwort: proPerson, optionen: optionen(proPerson, [proPerson + 1, proPerson - 1, leute], 2),
      hinweis: `${stueck} Stücke auf ${leute} Personen verteilen: ${stueck} : ${leute}.`,
      hinweisBild: punkteFeld(leute, proPerson) };
  },
  // Stufe 2: ein Schritt, größere Zahlen
  () => {
    const tage = z(4, 7), minuten = z(20, 60);
    const e = tage * minuten;
    return { frage: `Du fährst ${tage} Tage pro Woche Bus.\nJede Fahrt dauert ${minuten} Minuten.\nWie lange fährst du in einer Woche?`,
      antwort: e, optionen: optionen(e, [e + minuten, e - minuten, tage + minuten], 15),
      hinweis: `${tage} · ${minuten}. Rechne erst ${tage} · ${Math.floor(minuten / 10) * 10}, dann den Rest.` };
  },
  // Stufe 3: zwei Schritte, plus und minus
  () => {
    const start = z(30, 60), aus = z(8, 20), ein = z(5, 15);
    const e = start - aus + ein;
    return { frage: `Im Bus sitzen ${start} Leute.\n${aus} steigen aus.\n${ein} steigen ein.\nWie viele sind jetzt im Bus?`,
      antwort: e, optionen: optionen(e, [start - aus, start + ein, start - aus - ein], 4),
      hinweis: `Erst abziehen: ${start} − ${aus} = ${start - aus}. Dann ${ein} dazu.` };
  },
  // Stufe 4: sparen, Fehlbetrag
  () => {
    const woche = z(5, 15), wochen = z(4, 10), gespart = woche * wochen;
    const ziel = gespart + z(10, 40), e = ziel - gespart;
    return { frage: `Du sparst ${woche} € pro Woche.\nDas machst du seit ${wochen} Wochen.\nDie Kopfhörer kosten ${ziel} €.\nWie viel fehlt noch?`,
      antwort: e, optionen: optionen(e, [ziel, gespart, e + 10], 6),
      hinweis: `Erst: ${woche} · ${wochen} = ${gespart} € gespart. Dann ${ziel} − ${gespart}.` };
  },
  // Stufe 5: zwei Schritte, mal und minus
  () => {
    const pack = z(3, 6), proPack = z(6, 12), verteilt = z(2, 5);
    const gesamt = pack * proPack, e = gesamt - verteilt;
    return { frage: `Du kaufst ${pack} Packungen.\nIn jeder sind ${proPack} Riegel.\nDu verschenkst ${verteilt} Riegel.\nWie viele hast du noch?`,
      antwort: e, optionen: optionen(e, [gesamt, gesamt + verteilt, gesamt - pack], 5),
      hinweis: `Erst alle zählen: ${pack} · ${proPack} = ${gesamt}. Dann ${verteilt} abziehen.` };
  }
];

/* ============================================================
   KAPITEL 5 — BRÜCHE, ANTEILE & PROZENT
   ============================================================ */
const kapitel5 = [
  // Stufe 1: die Hälfte, mit Bild
  () => {
    const ganz = z(3, 12) * 2, e = ganz / 2;
    return { frage: `Wie viel ist die Hälfte von ${ganz}?`, antwort: e,
      optionen: optionen(e, [e + 1, e - 1, ganz], 3),
      hinweis: `Halbieren heißt: in zwei gleich große Teile aufteilen. ${ganz} : 2.`,
      bild: kreisTeil(1, 2) };
  },
  // Stufe 2: Viertel und Drittel, mit Bild
  () => {
    const nenner = w([3, 4]), ganz = nenner * z(2, 8), e = ganz / nenner;
    return { frage: `Wie viel ist ein ${nenner === 3 ? "Drittel" : "Viertel"} von ${ganz}?`, antwort: e,
      optionen: optionen(e, [ganz / 2, e + 1, e - 1], 3),
      hinweis: `Ein ${nenner === 3 ? "Drittel" : "Viertel"} heißt: durch ${nenner} teilen. ${ganz} : ${nenner}.`,
      bild: kreisTeil(1, nenner) };
  },
  // Stufe 3: Bruchteil einer Menge
  () => {
    const nenner = w([3, 4, 5]), zaehler = z(2, nenner - 1);
    const ganz = nenner * z(3, 8), e = (ganz / nenner) * zaehler;
    return { frage: `Wie viel sind ${zaehler}/${nenner} von ${ganz}?`, antwort: e,
      optionen: optionen(e, [ganz / nenner, ganz - e, e + nenner], 4),
      hinweis: `Erst ${ganz} : ${nenner} = ${ganz / nenner}. Das dann mal ${zaehler}.`,
      hinweisBild: kreisTeil(zaehler, nenner) };
  },
  // Stufe 4: Brüche vergleichen — Bild erst als Hilfe nach dem Fehler
  () => {
    const paare = [["1/2","1/3"],["3/4","2/3"],["1/4","1/5"],["2/5","1/2"],["5/8","1/2"],["2/3","3/5"],["1/3","1/4"],["3/4","1/2"]];
    const [a, b] = w(paare);
    const wert = (s) => { const [p, q] = s.split("/").map(Number); return p / q; };
    const groesser = wert(a) > wert(b) ? a : b;
    return { frage: `Welcher Bruch ist größer?\n\n${a}  oder  ${b}`, antwort: groesser,
      optionen: mische([a, b, "beide gleich", "kann man nicht sagen"]),
      hinweis: `Stell dir zwei gleich große Pizzen vor — so sieht das aus:`,
      hinweisBild: zweiKreise(a, b) };
  },
  // Stufe 5: Prozent und Rabatt
  () => {
    if (Math.random() < 0.5) {
      const p = w([10, 25, 50]), ganz = z(2, 10) * 20, e = ganz * p / 100;
      return { frage: `Wie viel sind ${p} % von ${ganz}?`, antwort: e,
        optionen: optionen(e, [ganz / 2, ganz / 10, ganz - e], 5),
        hinweis: p === 50 ? `50 % ist die Hälfte.` : p === 25 ? `25 % ist ein Viertel.` : `10 % — einfach durch 10 teilen.`,
        hinweisBild: kreisTeil(p / 10, 10) };
    }
    const p = w([10, 20, 25, 50]), preis = z(2, 8) * 20;
    const rabatt = preis * p / 100, e = preis - rabatt;
    return { frage: `Die Jacke kostet ${preis} €.\nEs gibt ${p} % Rabatt.\nWas kostet sie jetzt?`,
      antwort: e, optionen: optionen(e, [rabatt, preis - 10, preis], 6),
      hinweis: `${p} % von ${preis} € sind ${rabatt} €. Die ziehst du vom Preis ab.` };
  }
];

/* ============================================================
   KAPITEL 6 — RUNDEN & SCHÄTZEN
   ============================================================ */
const kapitel6 = [
  // Stufe 1: auf 10 runden, kleine Zahlen
  () => {
    const a = z(11, 79), e = Math.round(a / 10) * 10;
    return { frage: `Runde ${a} auf volle Zehner.`, antwort: e,
      optionen: optionen(e, [e + 10, e - 10, Math.floor(a / 10) * 10], 10),
      hinweis: `Letzte Ziffer ist ${a % 10}: ${a % 10 < 5 ? "unter 5, also abrunden" : "5 oder mehr, also aufrunden"}.` };
  },
  // Stufe 2: auf 10 runden, größere Zahlen
  () => {
    const a = z(101, 899), e = Math.round(a / 10) * 10;
    return { frage: `Runde ${a} auf volle Zehner.`, antwort: e,
      optionen: optionen(e, [e + 10, e - 10, Math.round(a / 100) * 100], 10),
      hinweis: `Schau nur auf die letzte Ziffer: 0–4 abrunden, 5–9 aufrunden.` };
  },
  // Stufe 3: auf 100 runden
  () => {
    const a = z(120, 1980), e = Math.round(a / 100) * 100;
    return { frage: `Runde ${a} auf volle Hunderter.`, antwort: e,
      optionen: optionen(e, [e + 100, e - 100, Math.round(a / 10) * 10], 100),
      hinweis: `Schau auf die Zehnerstelle: unter 50 abrunden, ab 50 aufrunden.` };
  },
  // Stufe 4: Überschlag beim Zusammenzählen
  () => {
    const a = z(180, 620), b = z(180, 620);
    const e = Math.round(a / 100) * 100 + Math.round(b / 100) * 100;
    return { frage: `Überschlag:\n${a} + ${b} ist ungefähr …`, antwort: e,
      optionen: optionen(e, [e + 100, e - 100, e + 200], 100),
      hinweis: `Runde beide Zahlen erst auf Hunderter, dann addiere.` };
  },
  // Stufe 5: Überschlag beim Malnehmen und im Alltag
  () => {
    if (Math.random() < 0.5) {
      const a = z(18, 62), b = z(3, 9), e = Math.round(a / 10) * 10 * b;
      return { frage: `Überschlag:\n${a} · ${b} ist ungefähr …`, antwort: e,
        optionen: optionen(e, [e + 10 * b, e - 10 * b, a * b + 20], 20),
        hinweis: `Runde ${a} auf ${Math.round(a / 10) * 10} und rechne dann mal ${b}.` };
    }
    const anz = z(3, 7), preis = z(3, 9) * 100 + 95;
    const e = anz * Math.round(preis / 100) * 100;
    return { frage: `Du legst ${anz} Artikel in den Wagen.\nJeder kostet ${eur(preis)}.\nUngefähr wie viel zahlst du?`,
      antwort: eur(e),
      optionen: textOptionen(eur(e), [eur(e + 500), eur(e - 500), eur(preis * (anz + 1)), eur(e + 100)]),
      hinweis: `${eur(preis)} ist fast ${eur(Math.round(preis / 100) * 100)}. Also ${anz} · ${Math.round(preis / 100)} €.` };
  }
];


/* ============================================================
   KAPITEL 7 — NEGATIVE ZAHLEN (Klasse 7)
   ============================================================ */
const kapitel7 = [
  // Stufe 1: Was ist kälter?
  () => {
    const a = z(-14, -1), b = z(1, 12);
    const kaelter = `${a} °C`;
    return { frage: `Was ist kälter?\n\n${a} °C  oder  ${b} °C`, antwort: kaelter,
      optionen: mische([kaelter, `${b} °C`, "gleich kalt", "kann man nicht sagen"]),
      hinweis: `Unter null wird es kälter. ${a} liegt links von der Null.`,
      bild: figTemperatur(-15, 15, a, b) };
  },
  // Stufe 2: Wie viel wärmer?
  () => {
    const a = z(-12, -2), b = z(1, 10), e = b - a;
    return { frage: `Morgens sind es ${a} °C.\nMittags sind es ${b} °C.\nWie viel wärmer ist es geworden?`,
      antwort: `${e} °C`,
      optionen: textOptionen(`${e} °C`, [`${b + a} °C`, `${e - 1} °C`, `${e + 1} °C`, `${b} °C`]),
      hinweis: `Von ${a} bis 0 sind es ${-a} Grad, von 0 bis ${b} nochmal ${b}. Zusammen ${e}.`,
      bild: figTemperatur(-15, 15, a, b) };
  },
  // Stufe 3: Rechnen mit negativen Zahlen
  () => {
    const a = z(-9, -1), b = z(2, 14), e = a + b;
    return { frage: `${a} + ${b}`, antwort: e,
      optionen: optionen(e, [a - b, Math.abs(a) + b, e + 1], 3),
      hinweis: `Start bei ${a}, dann ${b} Schritte nach rechts.`,
      hinweisBild: figTemperatur(-15, 15, a, e) };
  },
  // Stufe 4: Kontostand
  () => {
    const stand = z(-40, -5), rein = z(10, 80), e = stand + rein;
    return { frage: `Dein Konto steht bei ${stand} €.\nDu zahlst ${rein} € ein.\nWie viel hast du dann?`,
      antwort: `${e} €`,
      optionen: textOptionen(`${e} €`, [`${stand - rein} €`, `${-e} €`, `${rein} €`, `${e + 5} €`, `${e - 5} €`, `${Math.abs(stand) + rein} €`]),
      hinweis: `Erst müssen die ${Math.abs(stand)} € Schulden weg. Dann bleiben ${e} €.`,
      hinweisBild: figTemperatur(-50, 100, stand, e) };
  },
  // Stufe 5: Minus minus
  () => {
    if (Math.random() < 0.5) {
      const a = z(1, 9), b = z(2, 9), e = a - b;
      return { frage: `${a} − ${b}`, antwort: e,
        optionen: optionen(e, [b - a, -(a + b), e - 1], 3),
        hinweis: e < 0 ? `${a} ist kleiner als ${b} — das Ergebnis wird negativ.` : `Ganz normal abziehen.`,
        hinweisBild: figTemperatur(-15, 15, a, e) };
    }
    const a = z(2, 9), b = z(-9, -2), e = a * b;
    return { frage: `${a} · (${b})`, antwort: e,
      optionen: optionen(e, [-e, a + b, e + a], 4),
      hinweis: `Plus mal Minus gibt immer Minus. ${a} · ${Math.abs(b)} = ${Math.abs(e)}, also ${e}.` };
  }
];

/* ============================================================
   KAPITEL 8 — DREISATZ (Klasse 7)
   ============================================================ */
const kapitel8 = [
  // Stufe 1: Verdoppeln
  () => {
    const stueck = z(2, 5), preis = z(2, 6) * 50, e = preis * 2;
    return { frage: `${stueck} Brötchen kosten ${eur(preis)}.\nWas kosten ${stueck * 2} Brötchen?`,
      antwort: eur(e),
      optionen: textOptionen(eur(e), [eur(preis), eur(e + 50), eur(e - 50), eur(preis * 3), eur(e + 100)]),
      hinweis: `Doppelt so viele Brötchen kosten auch doppelt so viel.` };
  },
  // Stufe 2: Über den Einzelpreis
  () => {
    const anz = z(3, 6), einzeln = z(2, 9) * 20;
    const gesamt = anz * einzeln, neuAnz = anz + z(1, 4), e = neuAnz * einzeln;
    return { frage: `${anz} Hefte kosten ${eur(gesamt)}.\nWas kosten ${neuAnz} Hefte?`,
      antwort: eur(e),
      optionen: textOptionen(eur(e), [eur(gesamt), eur(e + einzeln), eur(e - einzeln), eur(einzeln)]),
      hinweis: `Erst eins: ${eur(gesamt)} : ${anz} = ${eur(einzeln)}. Dann mal ${neuAnz}.` };
  },
  // Stufe 3: Rezept umrechnen
  () => {
    const fuer = z(2, 4), menge = z(2, 6) * 50;
    const neu = fuer * z(2, 3), e = menge / fuer * neu;
    return { frage: `Das Rezept ist für ${fuer} Personen.\nDu brauchst ${menge} g Mehl.\nWie viel brauchst du für ${neu} Personen?`,
      antwort: `${e} g`,
      optionen: textOptionen(`${e} g`, [`${menge} g`, `${e + 50} g`, `${e - 50} g`, `${menge * neu} g`]),
      hinweis: `Für eine Person: ${menge} : ${fuer} = ${menge / fuer} g. Mal ${neu} Personen.` };
  },
  // Stufe 4: Verbrauch und Strecke
  () => {
    const km = z(2, 5) * 100, liter = z(4, 9) * 2;
    const neuKm = km * z(2, 3), e = liter / km * neuKm;
    return { frage: `Auf ${km} km braucht das Auto ${liter} Liter.\nWie viel braucht es auf ${neuKm} km?`,
      antwort: `${e} Liter`,
      optionen: textOptionen(`${e} Liter`, [`${liter} Liter`, `${e + 4} Liter`, `${e - 4} Liter`, `${liter * 4} Liter`]),
      hinweis: `${neuKm} km sind das ${neuKm / km}-fache von ${km} km. Also auch ${neuKm / km} mal so viel Sprit.` };
  },
  // Stufe 5: Umgekehrter Dreisatz
  () => {
    const leute = z(2, 4), stunden = z(6, 12);
    const neuLeute = leute * 2, e = stunden / 2;
    return { frage: `${leute} Leute brauchen ${stunden} Stunden.\nWie lange brauchen ${neuLeute} Leute?`,
      antwort: `${e} Stunden`,
      optionen: textOptionen(`${e} Stunden`, [`${stunden * 2} Stunden`, `${stunden} Stunden`, `${e + 1} Stunden`, `${e - 1} Stunden`]),
      hinweis: `Achtung, andersherum: Doppelt so viele Leute brauchen nur die halbe Zeit.` };
  }
];

/* ============================================================
   KAPITEL 9 — PROZENT & ZINSEN (Klasse 7/8)
   ============================================================ */
const kapitel9 = [
  // Stufe 1: Prozentwert
  () => {
    const p = w([5, 15, 20, 30]), ganz = z(2, 10) * 20, e = ganz * p / 100;
    return { frage: `Wie viel sind ${p} % von ${ganz} €?`, antwort: `${e} €`,
      optionen: textOptionen(`${e} €`, [`${ganz / 10} €`, `${e + 10} €`, `${e - 5} €`, `${ganz - e} €`]),
      hinweis: `1 % von ${ganz} sind ${ganz / 100}. Mal ${p} macht ${e}.` };
  },
  // Stufe 2: Prozentsatz
  () => {
    const ganz = z(2, 10) * 20, teil = ganz * w([10, 20, 25, 50]) / 100;
    const e = teil / ganz * 100;
    const andere = mische([10, 20, 25, 50, 5, 75, 40].filter(x => x !== e)).map(x => `${x} %`);
    return { frage: `${teil} von ${ganz} — wie viel Prozent sind das?`, antwort: `${e} %`,
      optionen: textOptionen(`${e} %`, andere),
      hinweis: `${teil} : ${ganz} = ${(teil / ganz).toString().replace(".", ",")}. Mal 100 macht ${e} %.` };
  },
  // Stufe 3: Grundwert
  () => {
    const p = w([10, 20, 25, 50]), ganz = z(2, 12) * 20, teil = ganz * p / 100;
    return { frage: `${p} % sind ${teil} €.\nWie viel ist das Ganze?`, antwort: `${ganz} €`,
      optionen: textOptionen(`${ganz} €`, [`${teil} €`, `${ganz + 20} €`, `${ganz - 20} €`, `${ganz + 40} €`]),
      hinweis: `${p} % sind ${teil} €. Das Ganze ist ${100 / p} mal so viel: ${teil} · ${100 / p} = ${ganz} €.` };
  },
  // Stufe 4: Erhöhung und Minderung
  () => {
    if (Math.random() < 0.5) {
      const p = w([10, 20, 25]), preis = z(2, 8) * 20, e = preis * (100 + p) / 100;
      return { frage: `Die Miete war ${preis} €.\nSie steigt um ${p} %.\nWie hoch ist sie jetzt?`, antwort: `${e} €`,
        optionen: textOptionen(`${e} €`, [`${preis * p / 100} €`, `${preis} €`, `${preis - preis * p / 100} €`, `${e + 10} €`]),
        hinweis: `${p} % von ${preis} sind ${preis * p / 100} €. Die kommen oben drauf.` };
    }
    const p = w([10, 20, 30, 50]), preis = z(2, 8) * 20, e = preis * (100 - p) / 100;
    return { frage: `Die Schuhe kosten ${preis} €.\nSie sind um ${p} % reduziert.\nWas kosten sie jetzt?`, antwort: `${e} €`,
      optionen: textOptionen(`${e} €`, [`${preis * p / 100} €`, `${preis} €`, `${e - 10} €`, `${e + 10} €`]),
      hinweis: `${p} % von ${preis} sind ${preis * p / 100} €. Die werden abgezogen.` };
  },
  // Stufe 5: Zinsen
  () => {
    const kapital = z(2, 20) * 100, satz = w([1, 2, 3, 5]), e = kapital * satz / 100;
    return { frage: `Du legst ${kapital} € an.\nEs gibt ${satz} % Zinsen im Jahr.\nWie viel Zinsen bekommst du nach einem Jahr?`,
      antwort: `${e} €`,
      optionen: textOptionen(`${e} €`, [`${e * 2} €`, `${kapital + e} €`, `${e + 10} €`, `${satz} €`]),
      hinweis: `Zinsen sind einfach Prozent vom angelegten Geld: ${satz} % von ${kapital} €.` };
  }
];

/* ============================================================
   KAPITEL 10 — FLÄCHEN & KÖRPER (Klasse 8)
   ============================================================ */
const kapitel10 = [
  // Stufe 1: Umfang Rechteck
  () => {
    const b = z(3, 12), h = z(2, 9), e = 2 * (b + h);
    return { frage: `Wie groß ist der Umfang?`, antwort: `${e} cm`,
      optionen: textOptionen(`${e} cm`, [`${b * h} cm`, `${b + h} cm`, `${e + 2} cm`, `${e - 2} cm`]),
      hinweis: `Einmal rundherum: ${b} + ${h} + ${b} + ${h} = ${e} cm.`,
      bild: figRechteck(`${b} cm`, `${h} cm`) };
  },
  // Stufe 2: Fläche Rechteck
  () => {
    const b = z(3, 12), h = z(2, 9), e = b * h;
    return { frage: `Wie groß ist die Fläche?`, antwort: `${e} cm²`,
      optionen: textOptionen(`${e} cm²`, [`${2 * (b + h)} cm²`, `${b + h} cm²`, `${e + b} cm²`, `${e - h} cm²`]),
      hinweis: `Länge mal Breite: ${b} · ${h} = ${e} cm².`,
      bild: figRechteck(`${b} cm`, `${h} cm`) };
  },
  // Stufe 3: Fläche Dreieck
  () => {
    const g = z(4, 16), h = z(2, 10) * 2 / 2 * 2;   // gerade Höhe, damit es aufgeht
    const hoehe = h % 2 === 0 ? h : h + 1;
    const e = g * hoehe / 2;
    return { frage: `Wie groß ist die Fläche des Dreiecks?`, antwort: `${e} cm²`,
      optionen: textOptionen(`${e} cm²`, [`${g * hoehe} cm²`, `${g + hoehe} cm²`, `${e + g} cm²`, `${e / 2} cm²`]),
      hinweis: `Grundseite mal Höhe, geteilt durch 2: ${g} · ${hoehe} : 2 = ${e} cm².`,
      bild: figDreieck(`${g} cm`, `${hoehe} cm`) };
  },
  // Stufe 4: Kreis
  () => {
    const r = z(2, 9);
    if (Math.random() < 0.5) {
      const e = Math.round(2 * 3.14 * r);
      return { frage: `Wie lang ist der Umfang des Kreises?\n(runde auf ganze cm)`, antwort: `${e} cm`,
        optionen: textOptionen(`${e} cm`, [`${Math.round(3.14 * r * r)} cm`, `${Math.round(3.14 * r)} cm`, `${e + 3} cm`, `${e - 3} cm`]),
        hinweis: `Umfang = 2 · 3,14 · r = 2 · 3,14 · ${r} ≈ ${e} cm.`,
        bild: figKreis(`r = ${r} cm`) };
    }
    const e = Math.round(3.14 * r * r);
    return { frage: `Wie groß ist die Fläche des Kreises?\n(runde auf ganze cm²)`, antwort: `${e} cm²`,
      optionen: textOptionen(`${e} cm²`, [`${Math.round(2 * 3.14 * r)} cm²`, `${e + 6} cm²`, `${e - 6} cm²`, `${r * r} cm²`]),
      hinweis: `Fläche = 3,14 · r · r = 3,14 · ${r} · ${r} ≈ ${e} cm².`,
      bild: figKreis(`r = ${r} cm`) };
  },
  // Stufe 5: Volumen Quader
  () => {
    const l = z(2, 9), b = z(2, 7), h = z(2, 6), e = l * b * h;
    return { frage: `Wie groß ist das Volumen?`, antwort: `${e} cm³`,
      optionen: textOptionen(`${e} cm³`, [`${l + b + h} cm³`, `${l * b} cm³`, `${e + l} cm³`, `${2 * (l * b + l * h + b * h)} cm³`]),
      hinweis: `Länge mal Breite mal Höhe: ${l} · ${b} · ${h} = ${e} cm³.`,
      bild: figQuader(`${l} cm`, `${b} cm`, `${h} cm`) };
  }
];

/* ============================================================
   KAPITEL 11 — GLEICHUNGEN & PYTHAGORAS (Klasse 8/9)
   ============================================================ */
const PYTHAGORAS_TRIPEL = [[3,4,5],[6,8,10],[5,12,13],[9,12,15],[8,15,17],[12,16,20],[7,24,25]];

const kapitel11 = [
  // Stufe 1: x plus
  () => {
    const x = z(2, 20), b = z(3, 30), summe = x + b;
    return { frage: `x + ${b} = ${summe}\n\nWie groß ist x?`, antwort: x,
      optionen: optionen(x, [summe + b, summe, x + 1], 4),
      hinweis: `Ziehe auf beiden Seiten ${b} ab: x = ${summe} − ${b}.` };
  },
  // Stufe 2: x mal
  () => {
    const x = z(2, 12), a = z(2, 9), produkt = a * x;
    return { frage: `${a} · x = ${produkt}\n\nWie groß ist x?`, antwort: x,
      optionen: optionen(x, [produkt, produkt - a, x + 1], 3),
      hinweis: `Teile beide Seiten durch ${a}: x = ${produkt} : ${a}.` };
  },
  // Stufe 3: zwei Schritte
  () => {
    const x = z(2, 12), a = z(2, 6), b = z(3, 20), ergebnis = a * x + b;
    return { frage: `${a} · x + ${b} = ${ergebnis}\n\nWie groß ist x?`, antwort: x,
      optionen: optionen(x, [ergebnis - b, Math.round(ergebnis / a), x + 1], 3),
      hinweis: `Erst ${b} abziehen: ${a} · x = ${ergebnis - b}. Dann durch ${a} teilen.` };
  },
  // Stufe 4: Pythagoras, lange Seite gesucht
  () => {
    const [a, b, c] = w(PYTHAGORAS_TRIPEL);
    return { frage: `Wie lang ist die schräge Seite?`, antwort: `${c} cm`,
      optionen: textOptionen(`${c} cm`, [`${a + b} cm`, `${c + 1} cm`, `${c - 1} cm`, `${a * b} cm`]),
      hinweis: `a² + b² = c². Also ${a}·${a} + ${b}·${b} = ${a*a} + ${b*b} = ${c*c}. Und ${c} · ${c} = ${c*c}.`,
      bild: figPythagoras(`${a} cm`, `${b} cm`, "? cm") };
  },
  // Stufe 5: Pythagoras, kurze Seite gesucht
  () => {
    const [a, b, c] = w(PYTHAGORAS_TRIPEL);
    return { frage: `Eine kurze Seite fehlt.\nWie lang ist sie?`, antwort: `${a} cm`,
      optionen: textOptionen(`${a} cm`, [`${c - b} cm`, `${a + 1} cm`, `${b} cm`, `${c} cm`]),
      hinweis: `c² − b² = a². Also ${c*c} − ${b*b} = ${a*a}. Und ${a} · ${a} = ${a*a}.`,
      bild: figPythagoras("? cm", `${b} cm`, `${c} cm`) };
  }
];

/* ============================================================
   KAPITEL-ÜBERSICHT
   ============================================================ */
const KAPITEL = [
  // Grundlagen — Klasse 4 bis 6
  { nr: 1,  gruppe: 0, name: "Plus & Minus",       unter: "Zahlen bis 1000",        farbe: "rot",     emoji: "➕", stufen: kapitel1 },
  { nr: 2,  gruppe: 0, name: "Mal & Geteilt",      unter: "Das Einmaleins",         farbe: "orange",  emoji: "✖️", stufen: kapitel2 },
  { nr: 3,  gruppe: 0, name: "Geld & Größen",      unter: "Euro, Meter, Uhrzeit",   farbe: "gelb",    emoji: "💶", stufen: kapitel3 },
  { nr: 4,  gruppe: 0, name: "Textaufgaben",       unter: "Mathe im echten Leben",  farbe: "gruen",   emoji: "💬", stufen: kapitel4 },
  { nr: 5,  gruppe: 0, name: "Brüche & Prozent",   unter: "Anteile und Rabatte",    farbe: "blau",    emoji: "🍕", stufen: kapitel5 },
  { nr: 6,  gruppe: 0, name: "Runden & Schätzen",  unter: "Schnell im Kopf",        farbe: "violett", emoji: "🎯", stufen: kapitel6 },
  // Aufbau — Klasse 7 bis 9
  { nr: 7,  gruppe: 1, name: "Minus-Zahlen",       unter: "Kälte, Schulden, unter null", farbe: "rot",     emoji: "🌡️", stufen: kapitel7 },
  { nr: 8,  gruppe: 1, name: "Dreisatz",           unter: "Von drei auf sechs",     farbe: "orange",  emoji: "⚖️", stufen: kapitel8 },
  { nr: 9,  gruppe: 1, name: "Prozent & Zinsen",   unter: "Rabatt, Miete, Sparen",  farbe: "gelb",    emoji: "🏷️", stufen: kapitel9 },
  { nr: 10, gruppe: 1, name: "Flächen & Körper",   unter: "Umfang, Fläche, Volumen", farbe: "gruen",  emoji: "📐", stufen: kapitel10 },
  { nr: 11, gruppe: 1, name: "Gleichungen",        unter: "x finden und Pythagoras", farbe: "blau",   emoji: "🧮", stufen: kapitel11 }
];

const GRUPPEN = [
  { name: "Grundlagen", unter: "Klasse 4 bis 6" },
  { name: "Aufbau",     unter: "Klasse 7 bis 9" }
];

/* Eine Antwort wie "7.5" hat in dieser App nichts zu suchen: der Punkt ist
   englisch geschrieben und krumme Zwischenergebnisse verwirren zusätzlich.
   Kommt so etwas heraus, wird die Aufgabe neu gewürfelt. */
const hatKrummeZahl = (a) =>
  a.optionen.concat([a.antwort]).some(o => /\d\.\d/.test(String(o)));

function holeAufgabe(kapitelIndex, stufe) {
  const k = KAPITEL[kapitelIndex];
  const i = Math.max(0, Math.min(k.stufen.length - 1, stufe - 1));
  let a;
  for (let versuch = 0; versuch < 25; versuch++) {
    a = k.stufen[i]();
    a.optionen = a.optionen.map(String);
    a.antwort = String(a.antwort);
    if (!hatKrummeZahl(a)) break;
  }
  a.kapitel = kapitelIndex;
  a.stufe = i + 1;
  return a;
}
