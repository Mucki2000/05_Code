# Lausebengel. Website

Statische Website für die Videoproduktionsfirma **Lausebengel**.
Reines HTML / CSS / JS, kein Build-Step, kein Framework. Direkt deploybar auf GitHub Pages.
Zweisprachig: Deutsch (Default) und Englisch.

---

## Ordnerstruktur

```
.
├── index.html                  ← Startseite (DE)
├── pages/
│   ├── premium.html            ← Premium Content (DE)
│   ├── social-media.html       ← Social Media Content (DE)
│   └── campaigns.html          ← Social Media Campaigns (DE)
├── en/
│   ├── index.html              ← Homepage (EN)
│   └── pages/
│       ├── premium.html        ← Premium Content (EN)
│       ├── social-media.html   ← Social Media Content (EN)
│       └── campaigns.html      ← Social Media Campaigns (EN)
├── css/
│   └── style.css               ← gemeinsames Stylesheet
├── js/
│   └── main.js                 ← gemeinsame Interaktionen
└── README.md
```

Beide Sprachversionen nutzen dasselbe Stylesheet und JS. Das spart Pflegeaufwand:
Wer das Design ändern will, macht das an einer Stelle.

---

## Sprachumschalter

Oben rechts in der Navigation gibt es einen kleinen `DE / EN`-Schalter.
Klick auf `EN` springt zur korrespondierenden englischen Seite, Klick auf `DE`
zurück zur deutschen. Jede Seite kennt ihre direkte Übersetzung über das
`hreflang`-Pärchen im `<head>`.

> Falls eine Seite umbenannt wird: nicht nur die Datei umbenennen, sondern auch
> den `nav__lang`-Link und die `hreflang`-Verweise in beiden Sprachversionen anpassen.

---

## Lokal ansehen

Doppelklick auf `index.html` funktioniert. Für saubere Page-Transitions ist ein
lokaler Webserver besser:

```bash
# Python (vorinstalliert auf macOS/Linux, auf Windows via python.org)
python -m http.server 8080
```

Dann `http://localhost:8080` im Browser öffnen.

---

## Auf GitHub Pages deployen

1. **Repository erstellen** auf GitHub (z. B. `lausebengel-web`).
2. Den Inhalt dieses Ordners ins Repo pushen:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<dein-user>/<repo>.git
   git push -u origin main
   ```
3. Im Repo auf **Settings → Pages** gehen.
4. Bei **Source** auswählen: `Deploy from a branch`.
5. Branch `main`, Folder `/ (root)` wählen und speichern.
6. Nach 1 bis 2 Minuten ist die Seite unter
   `https://<dein-user>.github.io/<repo>/` erreichbar.

> Für eine eigene Domain (`lausebengel.ch`):
> `Settings → Pages → Custom domain` eintragen, danach beim DNS-Anbieter
> einen `CNAME`-Eintrag auf `<dein-user>.github.io` setzen.

---

## Inhalte ersetzen

Alle Platzhalter im Code sind mit Kommentaren markiert. Du findest sie schnell, indem du im Editor nach **`ERSETZEN`** (DE) oder **`REPLACE`** (EN) oder **`YouTube:`** suchst.

> **Wichtig:** Wenn du in einer Sprache Inhalte änderst, vergiss die andere Sprache nicht. DE und EN sind eigenständige Dateien.

### 1. Texte ändern
Suche im Editor nach Kommentaren wie:
```html
<!-- TEXT ERSETZEN: Tagline der Firma -->
```
Direkt darunter steht der Platzhaltertext. Einfach überschreiben.

### 2. YouTube-Videos einbinden
In den Service-Seiten findest du Platzhalter wie:
```html
<!-- YouTube: Video-URL hier einfügen -->
<iframe src="" title="Projekt 1" ...></iframe>
<div class="project__video-placeholder">YouTube Embed</div>
```
So einbinden:
1. Auf YouTube das Video öffnen, **Teilen → Einbetten**.
2. Aus dem Embed-Code die URL kopieren (sieht so aus: `https://www.youtube.com/embed/XXXXXXXXXXX`).
3. Diese URL in `src=""` einfügen.
4. Den Platzhalter-Div darunter (`<div class="project__video-placeholder">...</div>`) entfernen.

Beispiel:
```html
<iframe
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  title="Projekt 1"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  loading="lazy"></iframe>
```

### 3. Weitere Projekte hinzufügen
In jeder Service-Seite gibt es einen Block:
```html
<!-- WEITERES PROJEKT? Block oben kopieren und einfügen. -->
```
Einfach einen `<article class="project reveal">...</article>`-Block kopieren und anpassen. Daran denken: dasselbe Projekt auch in der anderen Sprachversion hinzufügen.

### 4. Team-Fotos
In `index.html` im `.team`-Bereich. Statt der grauen Platzhalter-Box ein Bild als
Hintergrund setzen:
```html
<div class="team__photo" style="background-image: url('../assets/team-1.jpg'); background-size: cover; background-position: center;"></div>
```
> Lege dafür einen Ordner `assets/` an und kopiere die Bilder dort hinein. Auf der englischen Seite ist der Pfad `../assets/...`.

### 5. Kontakt-Email
Suche nach `hello@lausebengel.ch` und ersetze sie mit der echten Adresse (im Footer und in den `mailto:`-Links der CTA-Buttons).

### 6. Social-Media-Links
Suche im Footer nach `<a href="#" target="_blank" rel="noopener">Instagram</a>` und ersetze `#` mit der echten URL.

---

## Design anpassen

Alle Design-Tokens stehen am Anfang von `css/style.css` als CSS-Variablen:

```css
:root {
  --color-bg: #FAFAF8;          /* Hintergrund */
  --color-text: #1A1A18;        /* Text */
  --color-accent: #B8553A;      /* Terracotta-Akzent */
  --font-serif: 'Cormorant Garamond', ...;
  --font-sans: 'Inter', ...;
  ...
}
```
Eine Änderung dort wirkt sich auf beide Sprachversionen aus.

### Akzentfarbe ändern
Nur `--color-accent` und `--color-accent-hover` anpassen.
Vorschläge:
- Tiefes Blau: `#1F3A5F` / `#162C49`
- Tannengrün: `#2E4A36` / `#223828`
- Bordeaux: `#7A1F2B` / `#5E1820`

### Schriften wechseln
Im `<head>` jeder HTML-Datei (8 Dateien) den Google-Fonts-Link austauschen, dann in `style.css` die Variablen `--font-serif` und `--font-sans` anpassen.

---

## Browser-Support

Funktioniert in allen modernen Browsern (Chrome, Firefox, Safari, Edge, letzte 2 Jahre). Genutzte moderne Features: CSS-Variablen, `aspect-ratio`, `backdrop-filter`, IntersectionObserver. `prefers-reduced-motion` wird respektiert.

---

## Lizenz

Inhalte / Markenname © Lausebengel. Code-Vorlage zur freien Verwendung im Rahmen des Projekts.
