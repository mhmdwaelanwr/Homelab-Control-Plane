# Contributing

Homelab Control Plane is being developed in focused stages. Keep `main` as the clean baseline and use small branches / pull requests for deeper work.

## Before opening a PR

```bash
npm ci
npm run build
npm run lint
```

## Repository hygiene

Do not commit generated output, dependency folders, `.env` files, logs, editor metadata, credentials, keys, or private infrastructure data.

## Security-sensitive changes

Changes involving authentication, terminal execution, Docker control, file mutation, WebSockets, screen sharing, or remote access should document:

- the capability being added or changed
- who is allowed to use it
- what input is trusted
- failure / rollback behavior
- whether the change increases network or host exposure

## Scope

Prefer focused improvements over broad rewrites. Internal package renaming, authentication redesign, multi-node support, and deployment hardening are intentionally staged in `ROADMAP.md`.
