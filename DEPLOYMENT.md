# Deployment Notes

Protoverse Lab was created by Matthew Bateman. It is a Vite app, so the production build is just static files in `dist/`.

## Before Deploying

Run the full check:

```sh
npm run check
```

That covers TypeScript, simulation tests, and the production build.

For a quick browser check, start the app:

```sh
npm run dev
```

Then run:

```sh
npm run smoke:browser
```

## Manual QA

Before pushing a release, it is worth doing a short hands-on pass:

1. Try each preset.
2. Run at `1x`, then move up to `Max Frame-Budgeted`.
3. Switch through all render modes while the sim is moving.
4. Save a seed, edit its title and description, load it again, fork it, export the library, clear it, and import it back.
5. Resize to a phone-width viewport and make sure the controls still feel usable.
6. Make sure mouse wheel zoom affects the universe view, not browser zoom.

## Build

```sh
npm run build
```

Upload the contents of `dist/` to any static host.

## Known Limits

- Rendering uses WebGL through Three.js and React Three Fiber.
- The simulation still runs on the main thread.
- Seed history is stored in the browser unless the user exports it.
- The model is conceptual, not a first-principles cosmology solver.
- CSS minification is disabled in Vite because native optional dependency installs can be flaky on Windows-mounted WSL workspaces, and the CSS file is small.

## Next Big Upgrade

The next major production improvement is moving simulation stepping into a Web Worker. That should happen before raising the default particle count far beyond the current browser-friendly setting.
