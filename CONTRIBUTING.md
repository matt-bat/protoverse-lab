# Contributing to Protoverse Lab

Contributions that improve simulation clarity, deterministic behavior, performance, accessibility, testing, or scientific framing are welcome.

## Before opening an issue

1. Search existing issues and reproduce the behavior on the latest `main` branch.
2. Include the seed, parameter changes, browser, and device details needed to reproduce simulation or rendering problems.
3. Distinguish a software defect from a proposal to change the project’s intentionally coarse scientific model.
4. Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Local setup and validation

```sh
npm install
npm run check
```

For browser-visible changes, start the development server and run:

```sh
npm run dev
npm run smoke:browser
```

## Pull request expectations

- Keep changes focused and describe the observable result.
- Preserve repeatability for identical seeds and parameters, or explicitly document a deliberate simulation-version change.
- Add deterministic tests for simulation changes and exercise the browser path for rendering changes.
- Label conceptual rules honestly; do not present coarse packets or habitability scores as literal physical predictions.
- Preserve import limits and validate untrusted saved-seed data.
- Update README, performance, deployment, or release documentation when their described behavior changes.
- Do not commit build output, test artifacts, credentials, or personal seed libraries.

By contributing, you agree that your contribution is distributed under the repository’s license.
