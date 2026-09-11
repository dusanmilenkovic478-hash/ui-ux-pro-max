/* ============================================================
   BAUEN — macht aus den vier Dateien in app/ eine einzige
   HTML-Datei, die man doppelklicken kann.
   Aufruf:  node bauen.js
   Ergebnis: malteslife.html
   ============================================================ */
const fs = require("fs");
const pfad = require("path");

const ordner = pfad.join(__dirname, "app");
let html = fs.readFileSync(pfad.join(ordner, "index.html"), "utf8");

// Die drei Skriptdateien direkt einbetten
for (const datei of ["config.js", "aufgaben.js", "app.js"]) {
  const marke = `<script src="${datei}"></script>`;
  if (!html.includes(marke)) throw new Error(`Einbindung für ${datei} nicht gefunden`);
  const code = fs.readFileSync(pfad.join(ordner, datei), "utf8")
                 .replace(/<\/script>/gi, "<\\/script>");   // sonst bricht das Skript-Tag vorzeitig ab
  html = html.replace(marke, `<script>\n${code}\n</script>`);
}

// Titel und Schrift-Verweise gehören in den Kopf der Seite
const titel = (html.match(/<title>[^<]*<\/title>/) || ["<title>Malte's Life</title>"])[0];
const linkZeilen = html.match(/<link[^>]*>/g) || [];
html = html.replace(titel, "");
linkZeilen.forEach(l => { html = html.replace(l, ""); });

const seite = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
${titel}
${linkZeilen.join("\n")}
</head>
<body>
${html.trim()}
</body>
</html>
`;

const ziel = pfad.join(__dirname, "malteslife.html");
fs.writeFileSync(ziel, seite, "utf8");
const groesse = (fs.statSync(ziel).size / 1024).toFixed(0);
console.log(`malteslife.html gebaut — ${groesse} KB, eine Datei, läuft offline.`);
