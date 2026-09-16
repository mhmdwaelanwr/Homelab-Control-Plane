# Homelab Control Plane Roadmap

The project is being developed in stages: keep a clean, useful baseline first, then return for deeper infrastructure work in focused passes.

## Phase 0 — Repository Baseline ✅

- clean public source import
- generated/local files excluded
- default admin and viewer credentials removed from source
- local configuration documented through `.env.example`
- project identity clarified as a homelab control plane
- architecture/security/contribution docs added
- CI and repository-health checks added

## Phase 1 — Stabilize Existing Features

- add server-side tests for auth, path safety, terminal profiles, and Docker error handling
- add frontend tests for login and critical admin flows
- review role boundaries between `local-admin` and `local-viewer`
- add explicit session expiration / idle timeout
- improve error states for missing Docker, noVNC, and host capabilities
- finish audit/activity behavior across destructive actions
- review route-level authorization consistently

## Phase 2 — Security Hardening

- hashed credential storage or an external identity provider
- CSRF / origin / reverse-proxy review
- secure cookies or hardened token transport
- WebSocket authentication enabled by default
- brute-force protection and login throttling review
- configurable session expiry and revocation
- command-policy hardening for terminal execution
- Docker socket exposure review
- structured security logging
- deployment threat model

## Phase 3 — Persistence and Configuration

- persistent settings store
- persistent activity/audit history
- saved server/service definitions
- managed device inventory
- configurable service-health probes
- configuration validation and migration strategy

## Phase 4 — Homelab Operations

- service and container dashboards with historical metrics
- backup status / scheduled job visibility
- systemd service management with explicit authorization
- update/reboot workflow with confirmations
- alert routing
- storage SMART / filesystem-health integrations where supported
- richer network visibility

## Phase 5 — Multi-node Control Plane

- register multiple Linux nodes
- node health and reachability
- per-node authorization
- remote agent/API design
- aggregate dashboards
- safe remote command execution
- node enrollment and key rotation

## Phase 6 — Product Polish

- screenshots and short demo
- branding/icon system
- responsive mobile admin experience
- accessibility pass
- dark/light theme polish
- release notes and versioning
- deployment guide

## Current rule

Keep `main` as a clean, buildable baseline. New infrastructure capabilities should land through focused branches and pull requests, with security boundaries documented before remote exposure.
