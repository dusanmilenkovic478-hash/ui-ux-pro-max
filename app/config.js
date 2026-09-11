/* ============================================================
   MALTE'S LIFE — EINSTELLUNGEN
   ============================================================
   Das ist die einzige Datei, die Sie selbst anpassen müssen.
   Alles zwischen "Anführungszeichen" dürfen Sie ändern.
   Wichtig: Anführungszeichen und Kommas stehen lassen!
   ============================================================ */

const CONFIG = {

  /* --- 1. NAME ------------------------------------------- */
  appName: "Malte's Life",
  spielerName: "Malte",

  /* --- 2. ELTERN-PIN --------------------------------------
     Diese 4 Ziffern tippt Mama ein, um einen Gutschein
     als "eingelöst" abzuhaken. Bitte ändern!
     HINWEIS: Die PIN steht hier unverschlüsselt in der Datei.
     Sie verhindert versehentliches Mehrfach-Einlösen,
     sie ist kein echter Schutz vor jemandem, der die
     Datei öffnet.                                          */
  elternPin: "1234",

  /* --- 3. TAGESZIEL ---------------------------------------
     20 richtige Antworten = 2 % Fortschritt pro Tag.
     1000 richtige insgesamt = 100 % (also rund 50 Tage).
     Runtersetzen, falls 20 am Anfang zu viel sind.         */
  aufgabenProTag: 20,
  aufgabenBisZumZiel: 1000,

  /* --- 4. LEVEL-EINSTELLUNGEN ----------------------------- */
  aufgabenProLevel: 10,
  richtigeZumBestehen: 8,

  /* --- 5. EIGENE HINTERGRUNDBILDER ------------------------
     So bauen Sie eigene Bilder ein:
       1. Bilddatei in den Ordner  app/bilder/  legen
       2. Dateinamen hier unten in die Liste eintragen
       3. App neu starten
     Beispiel:
       hintergrundBilder: ["momo1.jpg", "momo2.png"],
     Die Bilder erscheinen dezent hinter dem Panel, damit
     die Aufgabe gut lesbar bleibt.
     Leere Liste = nur das eingebaute Manga-Muster.         */
  hintergrundBilder: [],
  bilderDeckkraft: 0.22,   // 0 = unsichtbar, 1 = volle Stärke

  /* --- 6. BELOHNUNGEN -------------------------------------
     30 Level = 30 Gutscheine. Zeile 1 = Kapitel 1 usw.,
     innerhalb der Zeile von Level 1 bis Level 5.
     Text frei änderbar.                                     */
  belohnungen: {
    1: ["Eine Kugel Eis", "Deine Lieblingsschokolade", "2 € Taschengeld", "Du suchst die Folge für heute Abend aus", "5 € Taschengeld"],
    2: ["Eine Tüte Chips", "3 € Taschengeld", "Ramen-Abend zu Hause", "Eine Stunde länger aufbleiben", "Ein Manga-Band deiner Wahl"],
    3: ["Ein Getränk deiner Wahl", "5 € Taschengeld", "Pizza-Abend", "Ein Anime-Marathon-Nachmittag", "10 € für den Manga-Laden"],
    4: ["Ein Snack deiner Wahl", "6 € Taschengeld", "Einmal Abwasch erlassen", "Freundin darf übernachten", "Ein Manga-Poster für dein Zimmer"],
    5: ["Lieblings-Frühstück", "8 € Taschengeld", "Ein Bubble-Tea", "Ein Nachmittag ohne Hausaufgaben-Diskussion", "Der nächste Band deiner Lieblingsreihe"],
    6: ["10 € Taschengeld", "Ein Kino-Besuch", "15 € Taschengeld", "Eine Anime-Figur für dein Regal", "20 € — und du hast ALLES geschafft"]
  },

  /* --- 7. SPRÜCHE AM KAPITEL-ENDE ------------------------- */
  kapitelSprueche: [
    "Warum war die 6 sauer auf die 7?\n\nWeil 7 8 9. (seven ate nine — sorry, nicht sorry)",
    "Mathe ist wie ein Filler-Arc:\n\nGefühlt endlos, aber am Ende kannst du plötzlich was.",
    "Lehrer: „Wofür brauchst du Mathe im echten Leben?\"\n\nIch, beim Aufteilen der Pizzarechnung unter 5 Leuten: 👁️👄👁️",
    "Parallele Linien haben so viel gemeinsam.\n\nSchade, dass sie sich nie treffen werden.",
    "Statistisch gesehen sind 6 von 5 Menschen schlecht in Brüchen.",
    "Du hast 6 Kapitel Mathe durchgezogen.\n\nDein Taschenrechner ist offiziell arbeitslos. 🏆"
  ],

  /* --- 8. LOB WÄHREND DES SPIELS -------------------------- */
  lobRichtig: ["Nice!", "Sitzt!", "Genau das!", "Läuft bei dir.", "Richtig!", "Yes!", "Volltreffer.", "Easy.", "Stark.", "Weiter so!"],
  lobFalsch:  ["Fast.", "Knapp daneben.", "Kein Ding.", "Nochmal.", "Passiert.", "Nicht schlimm."],

  /* --- 9. SAMMEL-CREW -------------------------------------
     Für jedes der 30 Level gibt es ein neues Crew-Mitglied
     fürs Album. Reihenfolge = Kapitel 1 Level 1, 1-2, 1-3 …
     Emoji und Namen frei änderbar.                         */
  crew: [
    ["👻","Yurei"],    ["🛸","Kosmo"],   ["🐙","Tako"],     ["🍡","Dango"],    ["⚡","Zappa"],
    ["🦊","Kitsu"],    ["🌀","Wirbel"],  ["🐉","Ryu"],      ["🍜","Ramen-Ro"], ["🔮","Orakel"],
    ["🐈‍⬛","Kuro"],     ["🌙","Tsuki"],   ["🗿","Moai"],     ["🍥","Naru"],     ["✨","Kira"],
    ["🦑","Ika"],      ["🎐","Furin"],   ["🐸","Kero"],     ["🍄","Pilzo"],    ["🌸","Sakura"],
    ["🤖","Robo-Ken"], ["🪐","Planeta"], ["🐺","Okami"],    ["🔥","Hono"],     ["❄️","Yuki"],
    ["🦋","Chou"],     ["🌊","Nami"],    ["🥷","Shinobi"],  ["👑","Kaiser"],   ["🏆","Legende"]
  ],

  /* --- 10. STREAK-JOKER ------------------------------------
     So viele Tage darf pro Woche ausfallen, ohne dass die
     Serie reißt. 0 = kein Joker.                           */
  jokerProWoche: 1,

  /* --- 11. WOCHENTEST -------------------------------------
     Am Sonntag gibt es einen Test über das, was in der
     Woche geübt wurde. Immer dieselbe Belohnung.
     tag: 0 = Sonntag, 1 = Montag, … 6 = Samstag          */
  wochentest: {
    tag: 0,
    aufgaben: 12,
    richtigeZumBestehen: 8,
    versucheProWoche: 2,
    belohnung: "2 Stunden Roblox zocken"
  },

  /* --- 12. HILFEN BEI LRS ---------------------------------
     vorlesen:  Lautsprecher-Knopf an jeder Aufgabe.
                Nutzt die Stimme, die auf dem Laptop
                installiert ist — braucht kein Internet.
     lesehilfe: Größere Schrift und mehr Abstand zwischen
                den Buchstaben. Malte kann das auch selbst
                im Startbildschirm umschalten.             */
  vorlesen: true,
  lesehilfe: false
};
