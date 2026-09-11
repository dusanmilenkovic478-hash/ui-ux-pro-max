const fs = require("fs");
const pfad = require("path");
const quelle = fs.readFileSync(pfad.join(__dirname, "..", "app", "aufgaben.js"), "utf8");
const lade = new Function(quelle + "; return { KAPITEL, GRUPPEN, holeAufgabe };");
const { KAPITEL, GRUPPEN, holeAufgabe } = lade();

console.log("Kapitel gesamt:", KAPITEL.length, "| Level gesamt:", KAPITEL.length * 5);
console.log("Gruppen:", GRUPPEN.map(g => `${g.name} (${g.unter})`).join(", "));

let fehler = 0, anzahl = 0, mitBild = 0;
const proKapitel = {};
for (let k = 0; k < KAPITEL.length; k++) {
  proKapitel[KAPITEL[k].name] = 0;
  for (let s = 1; s <= 5; s++) {
    for (let i = 0; i < 400; i++) {
      const a = holeAufgabe(k, s); anzahl++;
      const wo = `K${k + 1}S${s} (${KAPITEL[k].name})`;
      const melde = (t) => { console.log(t); fehler++; proKapitel[KAPITEL[k].name]++; };
      if (!a.optionen.includes(a.antwort))
        melde(`FEHLT ${wo}: "${a.frage.replace(/\n/g, " / ")}" -> ${a.antwort} | ${a.optionen}`);
      if (new Set(a.optionen).size !== 4) melde(`DOPPELT ${wo}: ${a.optionen}`);
      for (const feld of ["antwort", "hinweis", "bild", "hinweisBild"])
        if (a[feld] && /NaN|undefined/.test(String(a[feld])))
          melde(`KAPUTT ${feld} ${wo}: ${String(a[feld]).slice(0, 80)}`);
      if (a.optionen.some(o => /\d\.\d|Infinity|e-\d/.test(o)))
        melde(`KRUMME ZAHL ${wo}: ${a.optionen}`);
      if (a.bild || a.hinweisBild) mitBild++;
    }
  }
}
console.log(`\n${anzahl} Aufgaben getestet, ${fehler} Fehler`);
console.log(`mit Anschauungsbild: ${Math.round(mitBild / anzahl * 100)} %`);
if (fehler) { console.log("\nFehler pro Kapitel:", proKapitel); process.exit(1); }
