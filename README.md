# KLXM Motion – Animationen gestalten (Erweiterung für KLXM Studio)

Animationen direkt in der Verwaltung gestalten und als Block auf Seiten zeigen – ohne Code, ohne externe Dienste,
passend zur strengen Content-Security-Policy von KLXM Studio (SVG + erzeugte CSS-Datei, keine Inline-Styles/-Skripte).

## Funktionen

- **Editor im Vollbild** (Verwaltung → Animationen):
  - Bibliothek mit Bausteinen – Oberflächen (Browserfenster, Smartphone, Button, Karte, Schalter, Häkchen-Feld, Eingabefeld,
    Hinweis, Diagramm, Person, Mauszeiger, Hand), Zeichen (Erledigt, Glocke, Brief, Sprechblase, Ort, Idee, Rakete, Wolke,
    Herz, Stern, Funkeln), Formen & Linien (Pfeil, Bogenpfeil, Welle, Fläche, Ring, Punkte) – **auf die Fläche ziehen** oder anklicken
  - Werkzeuge: Auswählen (V), **Stift – frei zeichnen** (P, wird automatisch geglättet), Rechteck (R), Kreis (O), Linie (L), Text (T),
    Bild aus der Mediathek
  - Verschieben, Größe (Ecken; Bausteine/Bilder behalten das Seitenverhältnis, ⇧ = frei), Drehen (Griff oben, ⇧ = 15°-Schritte),
    Farbe, Kontur, Deckkraft, Ebenen nach vorn/hinten, Duplizieren (⌘D), Löschen (⌫), Pfeiltasten (⇧ = 10)
  - **Fertige Bewegungen**: Einblenden, von links/rechts/unten/oben, Heranzoomen, Aufploppen, Drehen, Pulsieren, Wackeln,
    Schweben, Linie zeichnen, Ausblenden – mit Beginn und Dauer in Sekunden
  - **Zeitleiste** mit Schlüsselbildern (Versatz, Skalierung, Drehung, Deckkraft, Zeichnen); Abspielkopf verschieben und Element
    ziehen/drehen → Schlüsselbild an dieser Stelle; Rauten ziehen = Zeitpunkt ändern; Verlauf: sanft, abbremsen, beschleunigen,
    gleichmäßig, federnd
  - Szene: Größe (16:9, 4:3, 1:1, Banner, Hochformat oder frei), Hintergrund, Dauer, Schleife, Start (sobald sichtbar, sofort,
    beim Überfahren); Rückgängig/Wiederholen (⌘Z/⇧⌘Z), Speichern (⌘S), Leertaste = abspielen
  - Startvorlagen: leer, „Klick & Erfolg“, „Liste, die sich abhakt“, „Linie zeichnet sich“
- **Block „Animation“** (Gruppe Medien): Animation wählen, Beschreibung für Screenreader, Breite, Bildunterschrift.
  Startet, sobald sichtbar; Schleifen halten außerhalb des Bildes an; bei „Bewegung reduzieren“ und ohne JavaScript steht
  das fertige Bild (Endzustand).

## Installation

```bash
composer require klxm/studio-motion      # oder Ordner nach extensions/motion kopieren
php bin/console extensions:publish        # public/ → public/assets/ext/motion
```

Aktivieren: Administration → Funktionen & Erweiterungen oder `'extensions' => ['motion']` in `config/sites/{key}.php`.
Recht für Rollen: „Animationen gestalten“ (`motion.edit`). Die Tabelle `motion_animations` legt die Erweiterung selbst an.

## Technik

- `src/Scene.php` prüft jede gespeicherte Szene (Zahlenbereiche, Farben nur als Hexwert, Pfade nur aus SVG-Pfadbefehlen,
  Bausteine nur aus `src/Library.php` – es wird nie fremdes SVG gespeichert oder ausgegeben).
- `src/Render.php`: Szene → `<svg>` (nur Attribute, kein `style`) und CSS mit Keyframes je Element, geschrieben nach
  `media/motion/m{id}-{hash}.css` (Name aus Prüfsumme, kein Cache-Problem). Zustände: Ruhe = Endzustand, `.is-armed` = Anfang,
  `.is-play` = Animation, `.is-vis` = sichtbar (sonst pausiert). `public/js/motion.js` setzt die Klassen.
- Editor: `public/js/motion-editor.js` (ohne Abhängigkeiten), Vorschau rechnet dieselben Kurven wie CSS (cubic-bezier).
- Befehle: `php bin/console motion:list`, `php bin/console motion:selftest`.

## Lizenz

MIT – © 2026 KLXM Crossmedia GmbH and contributors.
