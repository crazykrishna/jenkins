# Neon Rush 3D

An endless arcade racer built with React, Vite, and Three.js. Dodge traffic, steer with the arrow keys or A/D, and hold Space for nitro. Touch controls are included for mobile. Distance and personal best are saved in the browser.

## Run locally

Requires Node.js 18 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build and deploy

```sh
npm run build
```

The production site is written to `dist/`. To deploy with GitHub and Vercel, import the repository and set the project root to `outputs/neon-rush-3d` (or move that directory's contents to the repository root). Vercel detects Vite; the build command is `npm run build` and the output directory is `dist`.
