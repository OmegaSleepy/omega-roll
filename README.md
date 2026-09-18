# neon-crunchuroll-simple

A small static front-end demo project that showcases a lightweight anime streaming UI and client-side helpers.

This repository is a simple, self-contained static website. It's intended for local experimentation, learning, and UI prototyping.

**Quick Start**
- **Serve locally:** `python3 -m http.server 8000` and open [index.html](index.html)
- **Open directly:** Double-click [index.html](index.html) in a browser (CORS-sensitive features may be limited).

**Contents**
- **Website entry:** [index.html](index.html)
- **Pages:** [pages/](pages) (e.g. [watch.html](pages/watch.html), [search.html](pages/search.html))
- **Static assets:** [assets/](assets) — CSS, JS, images
  - Styles: [assets/css/style.css](assets/css/style.css)
  - JS modules: [assets/js/](assets/js/)

**Notable scripts**
- `assets/js/index.js` — main boot script
- `assets/js/watch.js`, `search.js`, `home.js` — page-specific logic
- `assets/js/redirect-blocker.js` and `assets/js/ad-blocker.js` — navigation and ad-related helpers

**How to develop**
1. Start a local static server in the project root (see Quick Start).
2. Edit files under `assets/` and `pages/`.
3. Refresh the browser to view changes.

**Project structure**

- [index.html](index.html) — app shell
- [package.json](package.json) — basic metadata
- [assets/](assets) — static resources (CSS, JS)
- [pages/](pages) — HTML pages the app navigates between

**Development notes**
- This project is intentionally dependency-free and uses vanilla JavaScript and static HTML.
- There are no automated tests or build steps configured.

**Resources & links**
- Original demo / reference: https://omegasleepy.github.io/omega-roll/

**Contributing**
See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines on contributing and reporting issues.

**License**
This repository is marked `private` in `package.json`. Add a license file if you intend to publish.
