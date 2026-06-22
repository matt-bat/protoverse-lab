# Protoverse Lab

Created by Matthew Bateman.

Protoverse Lab is a seeded universe-evolution sandbox built with React, TypeScript, and Three.js. It lets you generate small “possible universe” runs, tune the starting conditions, watch matter cluster and enrich, and save interesting seeds for later.

This is not meant to be a literal physics engine. The simulation uses coarse packets that stand in for matter, radiation, proto-particles, enriched material, and habitability potential. The goal is to make the chain from early packets to stars, enrichment, rocky worlds, and life-capable regions understandable and interactive.

The default run starts with 8,000 packets so movement and camera controls stay smooth. Higher counts are available in the controls for stronger machines.

## What It Does

- Generates deterministic universes from a seed and parameter set
- Lets you tune density, expansion, cooling, gravity, particle balance, enrichment, planets, and life probability
- Tracks coarse proto-particle species and isotope-like variants
- Evolves enriched matter into periodic-table-inspired element families
- Shows metrics for stars, supernovae, rocky worlds, habitability, enrichment, density, heat, dominant species, and dominant element family
- Renders the universe with WebGL shader particles, glow layers, adaptive sampling, and star/enrichment highlights
- Saves seeds locally, with editable titles and descriptions
- Imports and exports seed libraries as JSON

## Stack

- Vite
- TypeScript
- React
- Three.js
- React Three Fiber
- lucide-react
- Vitest
- Playwright smoke checks

## Run It Locally

```sh
npm install
npm run dev
```

Vite usually opens at `http://127.0.0.1:5173`. If that port is busy, it will print the next available local URL.

## Live Site

GitHub Pages serves the public build here:

```text
https://matt-bat.github.io/protoverse-lab/
```

## Test And Build

```sh
npm run check
```

That runs TypeScript checks, the simulation regression tests, and a production build.

With the dev server running, you can also run the browser smoke check:

```sh
npm run smoke:browser
```

## Scientific Framing

Protoverse Lab is intentionally conceptual. A run roughly follows this path:

```text
primordial packets
-> cooling and clustering
-> stellar populations
-> supernova enrichment
-> rocky world candidates
-> habitability potential
```

Particle species are not literal Standard Model particles. They are coarse simulation packets with different interaction rules. Element families are also simplified; they mirror periodic-table behavior categories so enriched regions can become more chemistry-friendly over time without simulating atoms one by one.

## Project Notes

- [PERFORMANCE.md](./PERFORMANCE.md) explains the current bottlenecks and the worker/typed-array roadmap.
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) is the checklist to use before publishing or tagging a GitHub release.
- [DEPLOYMENT.md](./DEPLOYMENT.md) covers the basic build and hosting flow.

## Credit

Designed and created by Matthew Bateman.
