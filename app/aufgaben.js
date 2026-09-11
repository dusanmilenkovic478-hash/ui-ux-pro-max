/* ============================================================
   AUFGABEN-GENERATOREN
   Jede Stufe erzeugt unendlich viele neue Aufgaben derselben Art.
   Rückgabe: { frage, antwort, optionen[], hinweis }
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

/* Baut 4 Antwortmöglichkeiten. Zuerst die typischen Fehler,
   dann bei Bedarf mit nahen Zahlen auffüllen. */
function optionen(richtig, typischeFehler = [], spanne = 5) {
  const set = [richtig];
  const passt = (v) => Number.isFinite(v) && v >= 0 && !set.includes(v);
  for (const f of typischeFehler) { if (set.length < 4 && passt(f)) set.push(f); }
  let schutz = 0;
  while (set.length < 4 && schutz++ < 200) {
    const abweichung = z(1, spanne) * (Math.random() < 0.5 ? -1 : 1);
    const kandidat = richtig + abweichung;
    if (passt(kandidat)) set.push(kandidat);
  }
  while (set.length < 4) set.push(richtig + set.length * 7);
  return mische(set);
}

/* Text-Optionen (für Aufgaben, deren Antwort kein reiner Zahlwert ist) */
function textOptionen(richtig, falsche) {
  return mische([richtig, ...falsche.filter(f => f !== richtig).slice(0, 3)]);
}

const eur = (cent) => (cent / 100).toFixed(2).replace(".", ",") + " €";

/* ============================================================
   KAPITEL 1 — PLUS & MINUS
   ============================================================ */
const kapitel1 = [
  // Stufe 1: zweistellig + einstellig
  () => {
    const a = z(11, 89), b = z(2, 9), e = a + b;
    return { frage: `${a} + ${b}`, antwort: e,
      optionen: optionen(e, [a + b + 1, a + b - 1, a - b]),
      hinweis: `Rechne von ${a} aus ${b} weiter: ${a} → ${e}.` };
  },
  // Stufe 2: zweistellig ± zweistellig
  () => {
    const plus = Math.random() < 0.5;
    if (plus) {
      const a = z(21, 79), b = z(11, 40), e = a + b;
      return { frage: `${a} + ${b}`, antwort: e,
        optionen: optionen(e, [e - 10, e + 10, a - b]),
        hinweis: `Erst die Zehner: ${Math.floor(a/10)*10} + ${Math.floor(b/10)*10}. Dann die Einer dazu.` };
    }
    const a = z(45, 99), b = z(11, 40), e = a - b;
    return { frage: `${a} − ${b}`, antwort: e,
      optionen: optionen(e, [e + 10, e - 10, a + b]),
      hinweis: `Erst ${b - (b % 10)} abziehen, dann noch ${b % 10}.` };
  },
  // Stufe 3: dreistellig ± zweistellig
  () => {
    const plus = Math.random() < 0.5;
    const a = z(120, 880), b = z(15, 95);
    const e = plus ? a + b : a - b;
    return { frage: `${a} ${plus ? "+" : "−"} ${b}`, antwort: e,
      optionen: optionen(e, [e + 10, e - 10, e + 100], 9),
      hinweis: `Die Hunderter bleiben erstmal. Rechne nur mit den letzten zwei Stellen.` };
  },
  // Stufe 4: dreistellig ± dreistellig
  () => {
    const plus = Math.random() < 0.5;
    const a = z(210, 750), b = z(110, 240);
    const e = plus ? a + b : a - b;
    return { frage: `${a} ${plus ? "+" : "−"} ${b}`, antwort: e,
      optionen: optionen(e, [e + 100, e - 100, e + 10], 9),
      hinweis: `Zerlege ${b} in Hunderter, Zehner und Einer und rechne Schritt für Schritt.` };
  },
  // Stufe 5: Ergänzen
  () => {
    const e = z(12, 68), ziel = z(80, 200);
    const a = ziel - e;
    return { frage: `${a} + ☐ = ${ziel}`, antwort: e,
      optionen: optionen(e, [e + 10, e - 10, ziel + a], 6),
      hinweis: `Frage andersherum: ${ziel} − ${a} = ?` };
  }
];

/* ============================================================
   KAPITEL 2 — MAL & GETEILT
   ============================================================ */
const kapitel2 = [
  // Stufe 1: kleines Einmaleins
  () => {
    const a = z(2, 5), b = z(2, 10), e = a * b;
    return { frage: `${a} · ${b}`, antwort: e,
      optionen: optionen(e, [e + a, e - a, a + b], 4),
      hinweis: `${a} · ${b} heißt: ${b} mal die ${a} zusammenzählen.` };
  },
  // Stufe 2: großes Einmaleins
  () => {
    const a = z(6, 10), b = z(3, 10), e = a * b;
    return { frage: `${a} · ${b}`, antwort: e,
      optionen: optionen(e, [e + a, e - a, e + b], 6),
      hinweis: `Tipp: ${a} · 10 = ${a*10}. Davon ${10-b} mal die ${a} abziehen.` };
  },
  // Stufe 3: Teilen ohne Rest
  () => {
    const b = z(2, 9), e = z(2, 10), a = b * e;
    return { frage: `${a} : ${b}`, antwort: e,
      optionen: optionen(e, [e + 1, e - 1, b], 3),
      hinweis: `Frage: Wie oft passt ${b} in ${a}?` };
  },
  // Stufe 4: Zehnerzahlen
  () => {
    const a = z(2, 9) * 10, b = z(3, 9), e = a * b;
    return { frage: `${a} · ${b}`, antwort: e,
      optionen: optionen(e, [e * 10, e / 10, e + 10], 20),
      hinweis: `Rechne ${a/10} · ${b} = ${(a/10)*b} und häng eine Null an.` };
  },
  // Stufe 5: Teilen mit Rest
  () => {
    const b = z(3, 9), ganz = z(2, 9), rest = z(1, b - 1), a = b * ganz + rest;
    return { frage: `${a} : ${b} — wie viel bleibt übrig?`, antwort: rest,
      optionen: optionen(rest, [ganz, rest + 1, b], 2),
      hinweis: `${b} · ${ganz} = ${b*ganz}. Von ${a} bleiben dann noch ${rest} übrig.` };
  }
];

/* ============================================================
   KAPITEL 3 — GELD & GRÖSSEN
   ============================================================ */
const kapitel3 = [
  // Stufe 1: Euro/Cent
  () => {
    const c = z(2, 9) * 100 + z(1, 19) * 5;
    return { frage: `${c} Cent sind wie viel Euro?`, antwort: eur(c),
      optionen: textOptionen(eur(c), [eur(c + 100), eur(c - 100), eur(c * 10), eur(c + 10)]),
      hinweis: `100 Cent = 1 €. Also die letzten zwei Ziffern sind die Cent.` };
  },
  // Stufe 2: Längen und Gewichte
  () => {
    if (Math.random() < 0.5) {
      const m = z(2, 9), cm = z(1, 9) * 10, e = m * 100 + cm;
      return { frage: `${m} m und ${cm} cm sind zusammen wie viele cm?`, antwort: e,
        optionen: optionen(e, [m * 10 + cm, e + 100, m + cm], 50),
        hinweis: `1 m = 100 cm. Also ${m} m = ${m*100} cm.` };
    }
    const kg = z(2, 9), g = z(1, 9) * 100, e = kg * 1000 + g;
    return { frage: `${kg} kg und ${g} g sind zusammen wie viele g?`, antwort: e,
      optionen: optionen(e, [kg * 100 + g, e + 1000, kg + g], 100),
      hinweis: `1 kg = 1000 g. Also ${kg} kg = ${kg*1000} g.` };
  },
  // Stufe 3: Zeitspanne
  () => {
    const startH = z(7, 19), startM = w([0, 15, 30, 45]);
    const dauer = w([30, 45, 60, 75, 90, 120]);
    const gesamt = startH * 60 + startM + dauer;
    const eh = Math.floor(gesamt / 60) % 24, em = gesamt % 60;
    const fmt = (h, m) => `${h}:${String(m).padStart(2, "0")} Uhr`;
    return { frage: `Der Film startet um ${fmt(startH, startM)} und dauert ${dauer} Minuten.\nWann ist er zu Ende?`,
      antwort: fmt(eh, em),
      optionen: textOptionen(fmt(eh, em), [fmt(eh + 1, em), fmt(eh - 1, em), fmt(eh, (em + 30) % 60)]),
      hinweis: `${dauer} Minuten sind ${Math.floor(dauer/60)} Std. und ${dauer%60} Min.` };
  },
  // Stufe 4: Einkauf
  () => {
    const anz = z(2, 5), preis = z(2, 9) * 50 + 49, e = anz * preis;
    return { frage: `Du kaufst ${anz} Energydrinks für je ${eur(preis)}.\nWas kostet das zusammen?`,
      antwort: eur(e),
      optionen: textOptionen(eur(e), [eur(e + 100), eur(e - 100), eur(preis * (anz + 1)), eur(e + preis)]),
      hinweis: `${anz} · ${eur(preis)} — rechne erst mit den vollen Euro, dann mit den Cent.` };
  },
  // Stufe 5: Rückgeld
  () => {
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
  // Stufe 1: ein Rechenschritt, teilen
  () => {
    const leute = z(3, 6), stueck = leute * z(2, 4);
    const e = stueck / leute;
    return { frage: `Ihr seid ${leute} Leute und teilt euch ${stueck} Pizzastücke gerecht auf.\nWie viele bekommt jede Person?`,
      antwort: e, optionen: optionen(e, [e + 1, e - 1, leute], 3),
      hinweis: `${stueck} geteilt durch ${leute} Personen.` };
  },
  // Stufe 2: ein Rechenschritt, mal
  () => {
    const tage = z(4, 7), minuten = z(20, 60);
    const e = tage * minuten;
    return { frage: `Du bist ${tage} Tage die Woche je ${minuten} Minuten im Bus.\nWie viele Minuten sind das pro Woche?`,
      antwort: e, optionen: optionen(e, [e + minuten, e - minuten, tage + minuten], 15),
      hinweis: `${tage} · ${minuten}. Rechne ${tage} · ${Math.floor(minuten/10)*10} und dann den Rest.` };
  },
  // Stufe 3: zwei Schritte
  () => {
    const start = z(30, 60), aus = z(8, 20), ein = z(5, 15);
    const e = start - aus + ein;
    return { frage: `Im Bus sitzen ${start} Leute.\nAn der Haltestelle steigen ${aus} aus und ${ein} ein.\nWie viele sind jetzt drin?`,
      antwort: e, optionen: optionen(e, [start - aus, start + ein, start - aus - ein], 4),
      hinweis: `Erst abziehen: ${start} − ${aus} = ${start - aus}. Dann ${ein} dazu.` };
  },
  // Stufe 4: Sparen
  () => {
    const woche = z(5, 15), wochen = z(4, 10), ziel = woche * wochen + z(10, 40);
    const gespart = woche * wochen;
    const e = ziel - gespart;
    return { frage: `Du sparst ${woche} € pro Woche, seit ${wochen} Wochen.\nDie Kopfhörer kosten ${ziel} €.\nWie viel fehlt dir noch?`,
      antwort: e, optionen: optionen(e, [ziel, gespart, e + 10], 6),
      hinweis: `Erst: ${woche} · ${wochen} = ${gespart} € gespart. Dann ${ziel} − ${gespart}.` };
  },
  // Stufe 5: zwei Schritte, gemischt
  () => {
    const pack = z(3, 6), proPack = z(6, 12), verteilt = z(2, 5);
    const gesamt = pack * proPack;
    const e = gesamt - verteilt;
    return { frage: `Du kaufst ${pack} Packungen mit je ${proPack} Riegeln.\nDu verschenkst ${verteilt} davon.\nWie viele hast du noch?`,
      antwort: e, optionen: optionen(e, [gesamt, gesamt + verteilt, pack * proPack - pack], 5),
      hinweis: `Erst alle zählen: ${pack} · ${proPack} = ${gesamt}. Dann ${verteilt} abziehen.` };
  }
];

/* ============================================================
   KAPITEL 5 — BRÜCHE, ANTEILE & PROZENT
   ============================================================ */
const kapitel5 = [
  // Stufe 1: einfacher Anteil
  () => {
    const nenner = w([2, 4]), ganz = nenner * z(3, 12);
    const e = ganz / nenner;
    return { frage: `Wie viel ist ${nenner === 2 ? "die Hälfte" : "ein Viertel"} von ${ganz}?`,
      antwort: e, optionen: optionen(e, [ganz / 2, ganz - nenner, e + 2], 4),
      hinweis: `${nenner === 2 ? "Halbieren" : "Durch 4 teilen"}: ${ganz} : ${nenner}.` };
  },
  // Stufe 2: Bruchteil einer Menge
  () => {
    const nenner = w([3, 4, 5]), zaehler = z(1, nenner - 1);
    const ganz = nenner * z(3, 8);
    const e = (ganz / nenner) * zaehler;
    return { frage: `Wie viel sind ${zaehler}/${nenner} von ${ganz}?`,
      antwort: e, optionen: optionen(e, [ganz / nenner, ganz - e, e + nenner], 4),
      hinweis: `Erst ${ganz} : ${nenner} = ${ganz/nenner}. Das dann · ${zaehler}.` };
  },
  // Stufe 3: Brüche vergleichen
  () => {
    const paare = [["1/2", "1/3"], ["3/4", "2/3"], ["1/4", "1/5"], ["2/5", "1/2"], ["5/8", "1/2"], ["2/3", "3/5"]];
    const [a, b] = w(paare);
    const wert = (s) => { const [p, q] = s.split("/").map(Number); return p / q; };
    const groesser = wert(a) > wert(b) ? a : b;
    return { frage: `Welcher Bruch ist größer?\n\n${a}  oder  ${b}`,
      antwort: groesser, optionen: mische([a, b, "beide gleich", "kann man nicht sagen"]),
      hinweis: `Stell dir eine Pizza vor: Bei ${a} und ${b} — welches Stück wäre größer?` };
  },
  // Stufe 4: einfache Prozente
  () => {
    const p = w([10, 25, 50]), ganz = z(4, 20) * 10;
    const e = ganz * p / 100;
    return { frage: `Wie viel sind ${p} % von ${ganz}?`,
      antwort: e, optionen: optionen(e, [ganz / 2, ganz / 10, ganz - e], 5),
      hinweis: p === 50 ? `50 % ist die Hälfte.` : p === 25 ? `25 % ist ein Viertel.` : `10 % — einfach durch 10 teilen.` };
  },
  // Stufe 5: Rabatt
  () => {
    const p = w([10, 20, 25, 50]), preis = z(4, 16) * 10;
    const rabatt = preis * p / 100, e = preis - rabatt;
    return { frage: `Die Jacke kostet ${preis} €.\nJetzt gibt es ${p} % Rabatt.\nWas kostet sie jetzt?`,
      antwort: e, optionen: optionen(e, [rabatt, preis - 10, preis], 6),
      hinweis: `${p} % von ${preis} € sind ${rabatt} €. Die ziehst du ab.` };
  }
];

/* ============================================================
   KAPITEL 6 — RUNDEN & ÜBERSCHLAG
   ============================================================ */
const kapitel6 = [
  // Stufe 1: auf 10 runden
  () => {
    const a = z(12, 198);
    const e = Math.round(a / 10) * 10;
    return { frage: `Runde ${a} auf volle Zehner.`, antwort: e,
      optionen: optionen(e, [e + 10, e - 10, Math.floor(a / 10) * 10], 10),
      hinweis: `Schau auf die letzte Ziffer: 0-4 → abrunden, 5-9 → aufrunden.` };
  },
  // Stufe 2: auf 100 runden
  () => {
    const a = z(120, 1980);
    const e = Math.round(a / 100) * 100;
    return { frage: `Runde ${a} auf volle Hunderter.`, antwort: e,
      optionen: optionen(e, [e + 100, e - 100, Math.round(a / 10) * 10], 100),
      hinweis: `Schau auf die Zehnerstelle: unter 50 → ab, ab 50 → auf.` };
  },
  // Stufe 3: Überschlag Summe
  () => {
    const a = z(180, 620), b = z(180, 620);
    const e = Math.round(a / 100) * 100 + Math.round(b / 100) * 100;
    return { frage: `Überschlag:\n${a} + ${b} ist ungefähr …`, antwort: e,
      optionen: optionen(e, [e + 100, e - 100, e + 200], 100),
      hinweis: `Runde beide Zahlen erst auf Hunderter, dann addiere.` };
  },
  // Stufe 4: Überschlag Produkt
  () => {
    const a = z(18, 62), b = z(3, 9);
    const e = Math.round(a / 10) * 10 * b;
    return { frage: `Überschlag:\n${a} · ${b} ist ungefähr …`, antwort: e,
      optionen: optionen(e, [e + 10 * b, e - 10 * b, a * b + 20], 20),
      hinweis: `Runde ${a} auf ${Math.round(a/10)*10} und rechne dann · ${b}.` };
  },
  // Stufe 5: Überschlag im Alltag
  () => {
    const anz = z(3, 7), preis = z(3, 9) * 100 + 95;
    const e = anz * Math.round(preis / 100) * 100;
    return { frage: `Du legst ${anz} Artikel zu je ${eur(preis)} in den Wagen.\nReicht ein Überschlag: ungefähr wie viel zahlst du?`,
      antwort: eur(e),
      optionen: textOptionen(eur(e), [eur(e + 500), eur(e - 500), eur(preis * (anz + 1)), eur(e + 100)]),
      hinweis: `${eur(preis)} ist fast ${eur(Math.round(preis/100)*100)}. Also ${anz} · ${Math.round(preis/100)} €.` };
  }
];

/* ============================================================
   KAPITEL-ÜBERSICHT
   ============================================================ */
const KAPITEL = [
  { nr: 1, name: "Plus & Minus",      unter: "Zahlen bis 1000",        farbe: "rot",     emoji: "➕", stufen: kapitel1 },
  { nr: 2, name: "Mal & Geteilt",     unter: "Das Einmaleins",         farbe: "orange",  emoji: "✖️", stufen: kapitel2 },
  { nr: 3, name: "Geld & Größen",     unter: "Euro, Meter, Uhrzeit",   farbe: "gelb",    emoji: "💶", stufen: kapitel3 },
  { nr: 4, name: "Textaufgaben",      unter: "Mathe im echten Leben",  farbe: "gruen",   emoji: "💬", stufen: kapitel4 },
  { nr: 5, name: "Brüche & Prozent",  unter: "Anteile und Rabatte",    farbe: "blau",    emoji: "🍕", stufen: kapitel5 },
  { nr: 6, name: "Runden & Schätzen", unter: "Schnell im Kopf",        farbe: "violett", emoji: "🎯", stufen: kapitel6 }
];

/* Erzeugt eine Aufgabe. stufe 1-5, wird bei Bedarf ausgeglichen. */
function holeAufgabe(kapitelIndex, stufe) {
  const k = KAPITEL[kapitelIndex];
  const i = Math.max(0, Math.min(k.stufen.length - 1, stufe - 1));
  const a = k.stufen[i]();
  a.optionen = a.optionen.map(String);
  a.antwort = String(a.antwort);
  return a;
}
