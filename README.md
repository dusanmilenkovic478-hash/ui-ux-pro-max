# Malte's Life

Ein Mathe-Lernspiel, das offline auf dem eigenen Laptop läuft.
Gebaut für eine 15-jährige Lernende mit Balkenagenesie, LRS und Dyskalkulie,
deren Mathe-Stand etwa bei Klasse 4/5 liegt und die bis zum Schulabschluss
aufholen soll.

Die App ergänzt eine Förderung, sie ersetzt sie nicht. Bei diagnostizierter
Dyskalkulie bleibt eine Lerntherapie der eigentliche Hebel.

## Was die App macht

- **11 Kapitel** mit je 5 Levels, in zwei Gruppen:
  - *Grundlagen (Klasse 4–6):* Plus/Minus · Mal/Geteilt · Geld & Größen ·
    Textaufgaben · Brüche & Prozent · Runden & Schätzen
  - *Aufbau (Klasse 7–9):* Minus-Zahlen · Dreisatz · Prozent & Zinsen ·
    Flächen & Körper · Gleichungen & Pythagoras
- **Unbegrenzt viele Aufgaben.** Jede Stufe hat einen Generator statt einer
  festen Fragenliste — die Aufgaben gehen nie aus und sind nie auswendig gelernt.
- **Ausgleich statt Frust.** Nach 2 Fehlern in Folge wird die nächste Aufgabe
  leichter, nach 3 Treffern wieder schwerer. Kein Timer, keine Leben, keine Strafe.
- **Falsches kommt zurück.** Eine falsch beantwortete Aufgabe taucht 3 und 8
  Aufgaben später erneut auf, sichtbar als "Nochmal" markiert.
- **Sammelalbum.** Jedes geschaffte Level bringt ein Crew-Mitglied — 55 insgesamt.
- **Streak-Joker.** Ein ausgelassener Tag pro Woche kostet die Serie nicht.
- **Anschauungsbilder.** Bruchkreise und Punktefelder, teils direkt bei der
  Aufgabe, teils erst als Hilfe nach einem Fehler.
- **Eltern-Bereich hinter der PIN** mit Trefferquote je Kapitel und einem
  Hinweis, wo Nachhilfe ansetzen sollte.
- **Wochentest.** Sonntags ein Test über das, was in der Woche geübt wurde.
  Bestanden gibt es immer dieselbe Belohnung; zwei Versuche pro Woche.
- **Gutschein-System.** Jedes bestandene Level gibt einen Gutschein mit Code.
  Mama tippt die PIN ein, der Gutschein wird als eingelöst gestempelt.
- **Tagesziel 2 %.** 20 richtige Antworten am Tag = 2 %. 1000 richtige = 100 %.
  Wiederholen zählt mit — auch ein nicht bestandenes Level bringt Fortschritt.

## Warum das Design so ist, wie es ist

Balkenagenesie bedeutet in der Regel: Transferleistung und Abstraktion sind
schwer, das Verarbeitungstempo ist langsamer, Reizüberflutung stört schnell.
Deshalb:

- **Ein Element pro Bildschirm.** Dunkler Grund, darauf leuchtet genau eine Sache.
- **Der Regenbogen ist die Landkarte, nicht die Dauerbeleuchtung.** Jedes Kapitel
  hat eine feste Farbe. Innerhalb eines Kapitels wird nur diese Farbe verwendet.
  Geknallt wird erst beim Levelabschluss.
- **Kein Zeitdruck an keiner Stelle.**
- **Konkret vor abstrakt.** Pizzastücke, Busfahrten, Rückgeld statt nackter Zahlen.

Dazu kommen LRS und Dyskalkulie:

- **Vorlesen.** Jede Aufgabe hat einen Lautsprecher-Knopf. Die Sprachausgabe
  des Betriebssystems liest vor, kein Internet nötig. Mathe-Schreibweise wird
  vorher übersetzt: "3/4" wird zu "drei Viertel", "14:30 Uhr" zu "14 Uhr 30",
  "2,50 €" zu "2 Euro 50".
- **Lesehilfe.** Umschaltbar: größere Schrift, mehr Zeichen- und Wortabstand,
  mehr Zeilenhöhe. Bewusst keine Spezialschrift für Legasthenie — deren
  Wirksamkeit ist in Studien nicht belegt, gut gesetzte Schrift schlägt sie.
- **Kurze Sätze.** Textaufgaben stehen in Einzelsätzen, eine Information pro
  Zeile, längste Zeile rund 40 Zeichen.
- **Zwanzigerfeld und Zahlenstrahl.** Die Standard-Anschauungsmittel gegen
  zählendes Rechnen. Rund 42 % der Aufgaben haben ein Bild — bei den ersten
  Stufen direkt sichtbar, sonst als Hilfe nach einem Fehler. In den
  Aufbau-Kapiteln kommen Thermometer-Skala für negative Zahlen sowie
  maßstäbliche Zeichnungen für Flächen, Körper und Pythagoras dazu.

## Dateien

| Datei | Wofür |
|---|---|
| `app/config.js` | **Hier ändern Sie alles:** Name, PIN, Belohnungen, Crew, Sprüche, Tagesziel |
| `app/bilder/` | Eigene Hintergrundbilder ablegen (Anleitung liegt im Ordner) |
| `app/aufgaben.js` | Die Aufgaben-Generatoren |
| `app/app.js` | Spiellogik |
| `app/index.html` | Aufbau und Gestaltung |

## Ausprobieren

`app/index.html` im Browser öffnen. Der Fortschritt wird lokal im Browser
gespeichert und verlässt den Rechner nicht.

## Geplant

- Verpackung als Windows-Installer (Electron), damit die App ein Desktop-Icon
  bekommt und ohne Browser startet
- Vorlesen auf einem Rechner mit Audioausgabe prüfen (auf einer Server-
  oder Remote-Sitzung meldet Windows "synthesis-failed", weil dort kein
  Audiogerät vorhanden ist)
