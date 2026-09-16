# Architecture

## Current shape

Homelab Control Plane is a two-workspace TypeScript monorepo.

```text
apps/web
  React / Vite operator UI
        │
        ├── HTTP API
        └── WebSockets
                │
                ▼
apps/server
  Express control API
        │
        ├── auth/session service
        ├── system telemetry adapter
        ├── Docker service
        ├── managed-root file service
        ├── terminal execution service
        ├── media / screen services
        └── activity / health services
                │
                ▼
Linux host / local services
```

## Web application

The web workspace provides the operator-facing screens for system metrics, Docker containers, files, terminal access, screen sharing, media controls, settings, and homelab status.

The UI consumes REST endpoints and live metric streams from the server. It should not be treated as an authorization boundary; authorization decisions belong on the server.

## Server application

The server owns access to the host and local infrastructure.

### Authentication

The current baseline uses in-memory bearer-token sessions. The administrator account is required through environment variables. The optional viewer account is disabled unless both viewer credentials are configured.

Sessions are not yet durable and do not yet have a formal expiration policy.

### System telemetry

The system adapter uses Node.js host APIs plus Linux sources such as `/proc` and `/sys` where available to collect CPU, memory, storage, temperature, hostname, and network information.

### Managed filesystem

File operations are constrained under `DASH_ROOT`. Path resolution and entry-name checks are intended to prevent normal traversal outside that managed root. Deployments should still configure the narrowest practical root.

### Terminal

Terminal commands run through the host shell. The read-only profile applies an allowlist/blocking policy, while the admin profile is intentionally much more powerful. This is a sensitive execution boundary and requires deeper hardening before remote exposure.

### Docker

Container management talks to the local Docker daemon through Dockerode. Access to the Docker socket should be treated as effectively privileged host access.

### Screen / media surfaces

The current screen-control layer is designed around a noVNC-style gateway and related local service metadata. These integrations should remain optional and deployment-specific.

## Current boundaries

The project is local-first and single-node. It does not yet provide:

- hardened internet-facing authentication
- persistent session storage
- formal session expiration
- multi-node enrollment
- a remote agent trust model
- a complete deployment threat model
- production-grade authorization tests

Those belong to later roadmap phases rather than the repository-baseline pass.
