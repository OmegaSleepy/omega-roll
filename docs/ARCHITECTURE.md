# Architecture

This project is structured as a simple static website. The design favors clarity and minimal tooling.

Top-level structure

- [index.html](index.html): application shell that loads core scripts and styles.
- [pages/]: separate HTML pages for app screens.
- [assets/]: static assets
  - `assets/css/`: global styles
  - `assets/js/`: modular client-side scripts
  - `images/` or `assets/images/`: static images (project root `images/` exists)

Client-side module responsibilities
- `index.js`: app initialization and global event wiring
- `header.js`: top-bar and navigation
- `api.js`: client fetch helpers (if present)
- `explore.js`, `home.js`, `genres.js`, `search.js`: per-page UI logic

No build pipeline
- This project intentionally avoids bundlers and build steps; files are included as-is in HTML.
