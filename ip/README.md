# What Is My IP

A static single-page app that shows your public IPv4 and IPv6, geolocation, and device/network info. No backend required.

## Run locally (no Python needed)

```bash
npm run serve
```

Then open **http://localhost:3000**. This uses [serve](https://www.npmjs.com/package/serve) via npx, so you only need Node.js installed.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Select the branch (e.g. `main`) and folder **/ (root)**.
5. Save. GitHub will serve the site at `https://<username>.github.io/<repo>/`.

No server or Python is involved—GitHub Pages serves the static files (HTML, JS, CSS) over HTTPS. The app runs entirely in the browser and calls public IP/geo APIs.
