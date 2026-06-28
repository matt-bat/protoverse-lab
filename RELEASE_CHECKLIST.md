# Git Release Checklist

Protoverse Lab was created by Matthew Bateman. Use this checklist before pushing the repo or cutting a release.

## Repo Basics

- [ ] `README.md` explains what the app is, how to run it, and what its limits are.
- [ ] Matthew Bateman is credited in the README, package metadata, and release docs.
- [ ] `.gitignore` is present and keeps build output, dependencies, logs, env files, and local junk out of Git.
- [ ] `package.json` has the right name, description, author, scripts, and license status.
- [ ] No secrets, local-only exports, browser profiles, screenshots, or machine-specific files are staged.
- [ ] The lockfile is committed with the app.

## App Checks

- [ ] Run `npm run check`.
- [ ] Start the dev server with `npm run dev`.
- [ ] Run `npm run smoke:browser`.
- [ ] Try all presets.
- [ ] Switch through every render mode while the sim is running.
- [ ] Save, edit, load, fork, export, clear, and import a seed library.
- [ ] Oversized seed-library imports are rejected cleanly before parsing.
- [ ] Make sure old localStorage seed libraries either load or fail gracefully.

## Simulation Checks

- [ ] Same seed and same parameters produce the same outcome.
- [ ] Matter does not rush to the cube boundary during long runs.
- [ ] The default run holds at least 30fps on the target machine.
- [ ] Camera pan, orbit, and zoom stay responsive while running.
- [ ] `Max Frame-Budgeted` speeds things up without freezing the tab.
- [ ] High particle counts remain recoverable within the public 60,000-packet cap.

## Visual Checks

- [ ] Desktop screenshot looks clean at 1280x800.
- [ ] Mobile screenshot looks clean around 390x844.
- [ ] Text does not overlap controls or important canvas content.
- [ ] Color modes are easy to tell apart.
- [ ] Star and enrichment highlights are visible without overpowering the field.
- [ ] The expanded metrics panel is readable and scrolls cleanly.

## Accessibility And UX

- [ ] Space toggles play/pause.
- [ ] Left and right arrows adjust speed.
- [ ] Focus states are visible on buttons, sliders, inputs, selects, and textareas.
- [ ] Controls are reachable on mobile.
- [ ] Mouse wheel over the universe view does not change browser zoom.

## Build And Hosting

- [ ] `npm install` works from a clean checkout.
- [ ] `npm run build` works from a clean checkout.
- [ ] `dist/` can be served as a static site.
- [ ] The chosen host serves `index.html` correctly.
- [ ] `DEPLOYMENT.md` still matches the planned hosting setup.

## GitHub Release

- [ ] Open the repo page and check README rendering.
- [ ] Add screenshots or a short demo GIF if the repo is public.
- [ ] Add useful repo topics: `react`, `typescript`, `threejs`, `webgl`, `simulation`.
- [ ] Mention known limits in the release notes: conceptual physics, main-thread simulation, local-only seed storage.
- [ ] Tag a release only after the checks above pass.
