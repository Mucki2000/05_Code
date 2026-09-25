# Gemeinsame Bestenliste (BRICKS und FLAPPY)

Die Website ist statisch (GitHub Pages). Damit alle Besucher dieselbe
Bestenliste sehen, speichert ein winziger Dienst die Punkte: ein Google Sheet
mit einem Apps-Script als Web-App. Die Seite spricht ihn über `SCORES_ENDPOINT`
in `js/config.js` an. Ist die URL leer, bleibt die Liste im Browser des
Besuchers.

## Einrichten (einmalig, ca. 5 Minuten)

1. Auf https://sheets.new ein neues Google Sheet anlegen, z. B. „Lausebengel Highscores“.
2. Menü **Erweiterungen → Apps Script**. Den vorhandenen Code löschen und den
   Inhalt von `docs/highscore-backend.gs` einfügen. Speichern (Diskette).
3. Oben rechts **Bereitstellen → Neue Bereitstellung**. Beim Zahnrad den Typ
   **Web-App** wählen. Einstellungen:
   - Beschreibung: beliebig
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
4. **Bereitstellen** klicken, den Zugriff einmal bestätigen (Google warnt, weil
   die App nicht verifiziert ist: „Erweitert“ → „Zu … öffnen“ → „Zulassen“).
5. Die angezeigte **Web-App-URL** kopieren (endet auf `/exec`) und weitergeben.
   Sie kommt in `js/config.js` als `SCORES_ENDPOINT`.

Zum Prüfen kann man die URL mit `?game=bricks` im Browser öffnen; sie liefert
`{"scores":[]}`.

## Betrieb

- Das Sheet bekommt ein Blatt `scores` mit den Spalten game, name, score, at.
  Jede Zeile ist ein gespeicherter Punktestand; Löschen einer Zeile entfernt
  den Eintrag (Schummler aufräumen).
- Das Script behält je Spiel nur die besten 40 Zeilen und löscht schwächere automatisch.
- Die Seite zeigt je Spiel die besten zehn. Namen werden auf 12 Zeichen
  (A-Z, 0-9, Leerzeichen, . - _, Umlaute) gekürzt, Punkte auf ganze Zahlen.
- Fällt der Dienst aus, zeigt die Seite die lokale Liste und meldet beim
  Speichern „(OFFLINE)“.
- Wer das Script ändert, muss unter **Bereitstellen → Bereitstellungen
  verwalten** die bestehende Bereitstellung bearbeiten und eine neue Version
  wählen, sonst bleibt die URL beim alten Code.
