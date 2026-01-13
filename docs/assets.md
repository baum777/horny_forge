# Assets

Badges, Icons und Base-Images sind in zwei Schichten organisiert:

- Der Frontend-Ordner `public/` hält Favicons, Badge-Manifest-Dateien sowie alle statischen Grafiken, die direkt von der Vite-Dev-Umgebung bedient werden.
- Das Backend serviert meme-spezifische Base-Images aus `server/public/horny_base` (konfigurierbar über `BASE_IMAGES_PATH`) unter der Route `/horny_base`. Das erlaubt der Forge-Logik, je nach Prompt ein passendes Ausgangsbild zu laden, ohne dass die SPA selbst auf das Dateisystem zugreift.

Assets werden über die Express-Static-Middleware ausgeliefert; bei lokalen Builds hilft es, den Server immer vom Repo-Root aus zu starten, damit `process.cwd()` korrekt auf `server/public` verweist.

