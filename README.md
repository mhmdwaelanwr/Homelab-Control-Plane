# Homelab Control Plane

A local-first web control plane for managing and observing a Linux homelab from one interface.

The project combines a React/TypeScript operator console with a Node.js/Express backend and WebSocket-powered live telemetry. It is designed as a practical foundation for managing a personal Linux server, home lab, or small self-hosted environment.

## Current status

**Clean experimental baseline.** The project already contains useful management surfaces, but it should still be treated as a local/homelab administration tool rather than an internet-facing production control plane.

The repository is intentionally being preserved in a documented, buildable state so deeper hardening and infrastructure integrations can be added later.

## What it currently includes

- live CPU, memory, storage, network, and host telemetry
- per-core CPU usage and basic system-health indicators
- Docker container listing, start, stop, restart, and stats
- managed-root file browser with upload, download, rename, create-folder, and delete flows
- authenticated web terminal with read-only and admin execution profiles
- WebSocket-powered live metrics
- screen-sharing control surfaces designed around a noVNC-style gateway
- media/broadcast management UI
- service-health probes and connected-device views
- a Homelab Intelligence page that summarizes current infrastructure signals and operational priorities

The Homelab Intelligence score is currently rule-based; it is not an AI/ML model.

## Architecture

```text
Browser
  │
  ├── React + Vite + TypeScript UI
  │
  └── HTTP / WebSocket
          │
          ▼
Node.js + Express control API
  │
  ├── System telemetry
  ├── Docker socket integration
  ├── Managed-root filesystem operations
  ├── Authenticated terminal execution
  ├── Media / screen-control services
  └── Activity / health services
          │
          ▼
Linux host / homelab services
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the current boundaries and planned direction.

## Repository structure

```text
apps/
├── server/   # Express API, WebSockets, Linux/Docker/file/terminal services
└── web/      # React operator dashboard
```

This repository still uses some older internal `dash` package naming. Renaming internal workspace identifiers is intentionally deferred until a later refactor so the baseline pass stays low-risk.

## Stack

### Web

- React 18
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Recharts
- xterm.js

### Server

- Node.js
- TypeScript
- Express
- WebSocket (`ws`)
- Dockerode
- Zod
- Multer

## Local setup

Requirements:

- Node.js 22+
- npm
- Linux recommended for the full host-management feature set
- Docker daemon if container management is needed

Install dependencies:

```bash
npm ci
```

Create local configuration from the example:

```bash
cp .env.example .env
```

At minimum, configure strong administrator credentials:

```env
ADMIN_USER=your-admin-user
ADMIN_PASSWORD=use-a-strong-unique-password
```

Then run the frontend and backend together:

```bash
set -a
source .env
set +a
npm run dev
```

Default local endpoints:

- Web UI: `http://localhost:5173`
- API: `http://localhost:4000`

## Security boundary

This application can expose powerful host capabilities, including terminal execution, file mutation, Docker management, and screen-control functions.

Before using it beyond a trusted local environment:

- restrict `DASH_ROOT` to the smallest directory that needs management
- use strong credentials and do not commit `.env`
- enable WebSocket authentication
- place the service behind a trusted reverse proxy / TLS layer
- restrict host firewall access
- review session lifetime and authorization behavior
- avoid exposing the Docker socket or admin terminal to untrusted users

See [`SECURITY.md`](SECURITY.md) for the current security assumptions and deferred hardening work.

## Build validation

```bash
npm ci
npm run build
npm run lint
```

GitHub Actions performs the baseline build/type-check validation and repository-hygiene checks.

## Roadmap

The next stages are documented in [`ROADMAP.md`](ROADMAP.md). The immediate goal is not feature sprawl; it is to keep the repository clean and return later for focused security, persistence, observability, and deployment work.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

Original project-specific source code and materials are copyright © 2026 Mohamed Anwar. All rights reserved unless explicitly stated otherwise. Third-party dependencies remain subject to their respective licenses.
