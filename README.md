# MoRNChess

MoRNChess is a free, beginner-friendly chess learning website.  
This repository currently contains a lightweight single-page scaffold built with vanilla HTML, CSS, and JavaScript, styled primarily with Tailwind CSS (CDN).

## Project Structure

```text
MoRNChess/
├── index.html     # Main single-page app layout
├── styles.css     # Small custom styles (complements Tailwind)
├── app.js         # Placeholder JavaScript entry point
└── README.md      # Project documentation
```

## Local Development

Because this is a static website, you can open `index.html` directly in your browser.

For a better local workflow, serve the project with any static file server (examples):

- Python:
  ```bash
  python3 -m http.server 8000
  ```
- Node (if installed):
  ```bash
  npx serve .
  ```

Then visit `http://localhost:8000`.

## GitHub Pages Deployment

You can deploy this repository to GitHub Pages in a few steps:

1. Push your changes to GitHub.
2. In GitHub, open the repository **Settings**.
3. Go to **Pages** in the left sidebar.
4. Under **Build and deployment**:
   - **Source**: choose **Deploy from a branch**
   - **Branch**: choose your default branch (for example `main`)
   - **Folder**: choose `/ (root)`
5. Click **Save**.
6. Wait for GitHub Pages to build and publish your site.
7. Your live site URL will appear in the Pages settings (typically `https://<username>.github.io/<repository>/`).

## Notes

- Tailwind CSS is loaded from the official CDN in `index.html`.
- The chessboard uses `chessboard.js` and `chess.js` from CDNs for the first interactive beginner lessons.
