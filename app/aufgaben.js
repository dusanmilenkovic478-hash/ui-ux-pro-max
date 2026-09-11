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
  const passt = (v) => Number.isFinite(v) && v >= 0 && !set.includes(v);
  for (const f of typischeFehler) { if (set.length < 4 && passt(f)) set.push(f); }
  let schutz = 0;
  while (set.length < 4 && schutz++ < 200) {
    const k = richtig + z(1, spanne) * (Math.random() < 0.5 ? -1 : 1);
    if (passt(k)) set.push(k);
  }
  while (set.length < 4) set.push(richtig + set.length * 7);
  return mische(set);
}

function textOptionen(richtig, falsche) {
  return mische([richtig, ...falsche.filter(f => f !== richtig).slice(0, 3)]);
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

/* ============================================================
   KAPITEL 1 — PLUS & MINUS
   ============================================================ */
const kapitel1 = [
  // Stufe 1: ganz leicht, einstellig, Ergebnis bis 20
  () => {
    const a = z(2, 9), b = z(2, 9), e = a + b;
    return { frage: `${a} + ${b}`, antwort: e,
      optionen: optionen(e, [e + 1, e - 1, e + 2], 3),
      hinweis: `Zähl von ${a} aus ${b} weiter.`,
      hinweisBild: punkteFeld(1, a) + `<div style="height:6px"></div>` + punkteFeld(1, b) };
  },
  // Stufe 2: zweistellig ± einstellig
  () => {
    const plus = Math.random() < 0.6;
    if (plus) {
      const zehner = z(1, 8) * 10, einer = z(1, 5), b = z(2, 4);
      const a = zehner + einer, e = a + b;
      return { frage: `${a} + ${b}`, antwort: e, optionen: optionen(e, [e + 1, e - 1, e + 10], 3),
        hinweis: `Die ${zehner} bleibt. Rechne nur ${einer} + ${b} = ${einer + b}.` };
    }
    const a = z(25, 89), b = z(2, 5), e = a - b;
    return { frage: `${a} − ${b}`, antwort: e, optionen: optionen(e, [e + 1, e - 1, a + b], 3),
      hinweis: `Zähl von ${a} aus ${b} rückwärts.` };
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
      hinweis: `100 Cent = 1 €. Also sind ${c} Cent genau ${e} €.` };
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
    return { frage: `Der Film startet um ${fmt(sH, sM)} und dauert ${dauer} Minuten.\nWann ist er zu Ende?`,
      antwort: fmt(eh, em),
      optionen: textOptionen(fmt(eh, em), [fmt(eh + 1, em), fmt(eh - 1, em), fmt(eh, (em + 30) % 60)]),
      hinweis: `${dauer} Minuten sind ${Math.floor(dauer / 60)} Stunde(n) und ${dauer % 60} Minuten.` };
  },
  // Stufe 5: Einkauf und Rückgeld
  () => {
    if (Math.random() < 0.5) {
      const anz = z(2, 5), preis = z(2, 9) * 50 + 49, e = anz * preis;
      return { frage: `Du kaufst ${anz} Energydrinks für je ${eur(preis)}.\nWas kostet das zusammen?`,
        antwort: eur(e),
        optionen: textOptionen(eur(e), [eur(e + 100), eur(e - 100), eur(preis * (anz + 1)), eur(e + preis)]),
        hinweis: `Rechne erst mit den vollen Euro, dann mit den Cent.` };
    }
    const preis = z(3, 17) * 100 + w([0, 50, 20, 90]);
    const gegeben = Math.ceil(preis / 500) * 500 + w([0, 500]);
    const e = gegeben - preis;
    return { frage: `Die Rechnung ist ${eur(preis)}.\nDu zahlst mit ${eur(gegeben)}.\nWie viel bekommst du zurück?`,
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
    return { frage: `Ihr seid ${leute} Leute und teilt euch ${stueck} Pizzastücke gerecht auf.\nWie viele bekommt jede Person?`,
      antwort: proPerson, optionen: optionen(proPerson, [proPerson + 1, proPerson - 1, leute], 2),
      hinweis: `${stueck} Stücke auf ${leute} Personen verteilen: ${stueck} : ${leute}.`,
      hinweisBild: punkteFeld(leute, proPerson) };
  },
  // Stufe 2: ein Schritt, größere Zahlen
  () => {
    const tage = z(4, 7), minuten = z(20, 60);
    const e = tage * minuten;
    return { frage: `Du bist ${tage} Tage die Woche je ${minuten} Minuten im Bus.\nWie viele Minuten sind das pro Woche?`,
      antwort: e, optionen: optionen(e, [e + minuten, e - minuten, tage + minuten], 15),
      hinweis: `${tage} · ${minuten}. Rechne erst ${tage} · ${Math.floor(minuten / 10) * 10}, dann den Rest.` };
  },
  // Stufe 3: zwei Schritte, plus und minus
  () => {
    const start = z(30, 60), aus = z(8, 20), ein = z(5, 15);
    const e = start - aus + ein;
    return { frage: `Im Bus sitzen ${start} Leute.\nAn der Haltestelle steigen ${aus} aus und ${ein} ein.\nWie viele sind jetzt drin?`,
      antwort: e, optionen: optionen(e, [start - aus, start + ein, start - aus - ein], 4),
      hinweis: `Erst abziehen: ${start} − ${aus} = ${start - aus}. Dann ${ein} dazu.` };
  },
  // Stufe 4: sparen, Fehlbetrag
  () => {
    const woche = z(5, 15), wochen = z(4, 10), gespart = woche * wochen;
    const ziel = gespart + z(10, 40), e = ziel - gespart;
    return { frage: `Du sparst ${woche} € pro Woche, seit ${wochen} Wochen.\nDie Kopfhörer kosten ${ziel} €.\nWie viel fehlt dir noch?`,
      antwort: e, optionen: optionen(e, [ziel, gespart, e + 10], 6),
      hinweis: `Erst: ${woche} · ${wochen} = ${gespart} € gespart. Dann ${ziel} − ${gespart}.` };
  },
  // Stufe 5: zwei Schritte, mal und minus
  () => {
    const pack = z(3, 6), proPack = z(6, 12), verteilt = z(2, 5);
    const gesamt = pack * proPack, e = gesamt - verteilt;
    return { frage: `Du kaufst ${pack} Packungen mit je ${proPack} Riegeln.\nDu verschenkst ${verteilt} davon.\nWie viele hast du noch?`,
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
      const p = w([10, 25, 50]), ganz = z(4, 20) * 10, e = ganz * p / 100;
      return { frage: `Wie viel sind ${p} % von ${ganz}?`, antwort: e,
        optionen: optionen(e, [ganz / 2, ganz / 10, ganz - e], 5),
        hinweis: p === 50 ? `50 % ist die Hälfte.` : p === 25 ? `25 % ist ein Viertel.` : `10 % — einfach durch 10 teilen.`,
        hinweisBild: kreisTeil(p / 10, 10) };
    }
    const p = w([10, 20, 25, 50]), preis = z(4, 16) * 10;
    const rabatt = preis * p / 100, e = preis - rabatt;
    return { frage: `Die Jacke kostet ${preis} €.\nJetzt gibt es ${p} % Rabatt.\nWas kostet sie jetzt?`,
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
    return { frage: `Du legst ${anz} Artikel zu je ${eur(preis)} in den Wagen.\nUngefähr wie viel zahlst du?`,
      antwort: eur(e),
      optionen: textOptionen(eur(e), [eur(e + 500), eur(e - 500), eur(preis * (anz + 1)), eur(e + 100)]),
      hinweis: `${eur(preis)} ist fast ${eur(Math.round(preis / 100) * 100)}. Also ${anz} · ${Math.round(preis / 100)} €.` };
  }
];

/* ============================================================
   KAPITEL-ÜBERSICHT
   ============================================================ */
const KAPITEL = [
  { nr: 1, name: "Plus & Minus",      unter: "Zahlen bis 1000",       farbe: "rot",     emoji: "➕", stufen: kapitel1 },
  { nr: 2, name: "Mal & Geteilt",     unter: "Das Einmaleins",        farbe: "orange",  emoji: "✖️", stufen: kapitel2 },
  { nr: 3, name: "Geld & Größen",     unter: "Euro, Meter, Uhrzeit",  farbe: "gelb",    emoji: "💶", stufen: kapitel3 },
  { nr: 4, name: "Textaufgaben",      unter: "Mathe im echten Leben", farbe: "gruen",   emoji: "💬", stufen: kapitel4 },
  { nr: 5, name: "Brüche & Prozent",  unter: "Anteile und Rabatte",   farbe: "blau",    emoji: "🍕", stufen: kapitel5 },
  { nr: 6, name: "Runden & Schätzen", unter: "Schnell im Kopf",       farbe: "violett", emoji: "🎯", stufen: kapitel6 }
];

function holeAufgabe(kapitelIndex, stufe) {
  const k = KAPITEL[kapitelIndex];
  const i = Math.max(0, Math.min(k.stufen.length - 1, stufe - 1));
  const a = k.stufen[i]();
  a.optionen = a.optionen.map(String);
  a.antwort = String(a.antwort);
  a.kapitel = kapitelIndex;
  a.stufe = i + 1;
  return a;
}
