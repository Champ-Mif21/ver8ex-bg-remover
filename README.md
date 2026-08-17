# Ver8ex BG Remover

Passport photo studio by [Ver8ex](https://ver8ex.com). Removes a portrait background in the browser, then composites the subject onto a color or uploaded image and exports a passport-size photo.

Photos never leave your machine. On first run the app downloads an on-device AI model (~80 MB) and caches it in the browser.

## Features

- Background removal with `@imgly/background-removal`
- Backgrounds: white, light blue, passport blue, navy, custom hex, or any uploaded image
- Passport sizes: 2×2 in, 35×45 mm, Canada 50×70 mm, China 33×48 mm, or custom millimetres
- Drag to reposition, scroll or slider to zoom, optional head/eye guides
- Light / dark theme
- Downloads: JPEG/PNG photo, transparent cutout, 4×6 or A4 print sheet

## Run

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). Use a front-facing portrait with the head fully in frame for the best cutout.

## Stack

- React + Vite + TypeScript
- Canvas compositing at 300 DPI
- Made by [Ver8ex](https://ver8ex.com)
