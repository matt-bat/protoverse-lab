# Performance Notes

Protoverse Lab was created by Matthew Bateman.

This file tracks the practical performance limits of the current browser version. The short version: the app is tuned for smooth default runs now, but the next big jump needs a Web Worker and typed-array simulation state.

## Where The Cost Is

- The simulation still runs on the browser main thread, alongside React, Three.js, input, and layout.
- Particles are stored as regular objects. That is easy to work with, but typed arrays would be faster and easier to transfer to a worker.
- Rendering uploads position and color buffers on a capped visual cadence. That works well for the 8,000-packet default, but very high counts still scale linearly.
- Enrichment and event logic is branch-heavy. That is fine in JavaScript for now, but it is not a clean first target for GPU compute.

## Measurements

These were measured on the current development machine with a temporary CommonJS compile of `src/simulation.ts`.

Before the frame-budget work:

| Packets | Spawn ms | 1x frame ms | Max frame ms |
| ---: | ---: | ---: | ---: |
| 5,000 | 41.17 | 21.79 | 99.18 |
| 15,000 | 88.55 | 19.02 | 191.47 |
| 52,000 | 115.09 | 20.95 | 638.63 |
| 100,000 | 334.10 | 40.68 | 1123.68 |

After frame caps, buffer reuse, render sampling, and camera/containment tuning:

| Packets | Spawn ms | 1x frame ms | Max frame ms |
| ---: | ---: | ---: | ---: |
| 5,000 | 64.82 | 17.82 | 57.96 |
| 15,000 | 90.85 | 21.03 | 29.64 |
| 52,000 | 104.37 | 23.34 | 28.76 |
| 100,000 | 289.89 | 70.37 | 50.42 |

The default browser run is now 8,000 packets. A Playwright cadence check measured about 59fps while the sim was running, which clears the 30fps target with room to spare.

## What Has Already Been Tuned

- Frame-budgeted Max speed
- Reused spatial-grid and fabric buffers
- Cached neighbor indices for grid smoothing
- No per-frame bounding-sphere recomputation
- Shader-based point rendering
- Adaptive visual sampling
- Slower density-glow updates, since that layer does not need per-frame updates
- Orbit controls instead of fly controls
- Spherical spawning, normalized gravity fabric, velocity caps, and radial containment

## Next Steps

1. Move `UniverseSimulation` into a Vite module worker.
   - Keep React and Three.js on the main thread.
   - Let the worker own stepping, seed resets, and summary generation.
   - Send compact snapshots back to the renderer.

2. Move particle state into typed arrays.
   - Positions: `Float32Array`
   - Velocity: `Float32Array`
   - Scalar fields like density, temperature, metallicity, and habitability: `Float32Array`
   - Kinds, variants, families, and flags: `Uint8Array`

3. Add batch seed evaluation.
   - Run many seeds at low resolution.
   - Score promising outcomes.
   - Let users re-run the best seeds at higher resolution.

4. Consider GPU work only after the typed-array rewrite.
   - GPU.js or WebGPU may help with grid/fabric kernels later.
   - The current event and enrichment rules should stay on CPU until the state model is cleaner.

