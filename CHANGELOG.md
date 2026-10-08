# Changelog

## 0.1.0 – 2026-10-05

Erste Fassung.

- Editor im Vollbild: Bibliothek (Oberflächen, Zeichen, Formen & Linien – u. a. Browserfenster, Smartphone, Button, Schloss,
  Server, Datenbank, Globus, Kalender, Dokument, Formular), Stift mit Glättung, Rechteck, Kreis, Linie, Text, Bild aus der Mediathek.
- Fertige Bewegungen (Erscheinen, Dauerhaft, Verschwinden) und Zeitleiste mit Schlüsselbildern; Schlüsselbild-Knopf folgt dem
  Abspielkopf, Geister für unsichtbare Startzustände, Zeitleiste in der Höhe verstellbar.
- Block „Animation“ (Gruppe Medien): startet, sobald sichtbar; Endzustand bei „Bewegung reduzieren“ und ohne JavaScript.
- Ausgabe als SVG + erzeugte CSS-Datei (CSP-tauglich); Szenen werden streng geprüft (`src/Scene.php`).
- Behoben: Verschieben/Drehen nach Schlüsselbild bei gedrehten Elementen; Drehpunkt auf der Website = Rahmenmitte.
