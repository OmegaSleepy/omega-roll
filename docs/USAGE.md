# Usage

This project is a static demo. The main interactions are driven by the JavaScript files in `assets/js/` and the HTML pages under `pages/`.

Common pages
- [pages/home.html](pages/home.html) or the app shell at [index.html](index.html)
- [pages/watch.html](pages/watch.html) — playback UI
- [pages/search.html](pages/search.html) — search UI
- [pages/explore.html](pages/explore.html) — discovery
- [pages/watch-later.html](pages/watch-later.html)

Key client scripts
- `assets/js/index.js` — initializes the app and common UI elements
- `assets/js/header.js` — header behavior and navigation
- `assets/js/search.js` — search interactions
- `assets/js/watch.js` — watch page logic
- `assets/js/watch-later.js` — watch-later list UI

Helpers
- `assets/js/ad-blocker.js` — helper to mitigate ads (project-specific utility)
- `assets/js/redirect-blocker.js` — prevents unwanted redirects/navigation

Extending the project
- Edit or add HTML pages under `pages/` and wire in JS modules from `assets/js/`.
- Use the CSS in `assets/css/style.css` and add components there.
