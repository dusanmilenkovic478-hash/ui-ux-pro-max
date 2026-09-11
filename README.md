# Malte's Life

Ein Mathe-Lernspiel, das offline auf dem eigenen Laptop läuft.
Gebaut für eine 15-jährige Lernende mit Balkenagenesie, deren Mathe-Stand
etwa bei Klasse 4/5 liegt und die bis zum Schulabschluss aufholen soll.

## Was die App macht

- **6 Kapitel** mit je 5 Levels: Plus/Minus → Mal/Geteilt → Geld & Größen →
  Textaufgaben → Brüche & Prozent → Runden & Schätzen
- **Unbegrenzt viele Aufgaben.** Jede Stufe hat einen Generator statt einer
  festen Fragenliste — die Aufgaben gehen nie aus und sind nie auswendig gelernt.
- **Ausgleich statt Frust.** Nach 2 Fehlern in Folge wird die nächste Aufgabe
  leichter, nach 3 Treffern wieder schwerer. Kein Timer, keine Leben, keine Strafe.
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

## Dateien

| Datei | Wofür |
|---|---|
| `app/config.js` | **Hier ändern Sie alles:** Name, PIN, Belohnungen, Sprüche, Tagesziel |
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
- Klassenstufen 6–9 als weitere Kapitel
