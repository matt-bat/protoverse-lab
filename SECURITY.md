# Security Policy

Security fixes are provided for the latest code on `main`. Report suspected vulnerabilities through GitHub private vulnerability reporting; do not disclose exploitable import, browser, dependency, or deployment issues in a public issue first.

Include the affected revision, browser and operating system, reproduction steps, impact, and any proposed mitigation. Do not include credentials or private user data.

Protoverse Lab is a static browser application with no account system, application backend, telemetry service, AI model, or required runtime secret. Saved-seed JSON is untrusted input and must remain size-bounded and schema-validated. Deployment credentials belong only in GitHub’s protected secret store and must never be committed.
