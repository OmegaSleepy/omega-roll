# Setup

These steps describe how to run the project locally for development or testing.

Prerequisites
- A modern browser (Chrome, Firefox, Edge)
- Python 3 (for a simple static server) or any static server (Node `http-server`, Live Server extension)

Run locally

1. Open a terminal in the project root.
2. Start a simple HTTP server:

```bash
python3 -m http.server 8000
```

3. Open `http://localhost:8000/` in your browser or open [index.html](index.html) directly.

Notes
- Serving files via HTTP is recommended to avoid CORS and file:// limitations when loading assets.
