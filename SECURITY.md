# Security Policy

Homelab Control Plane is an experimental local administration tool with access to sensitive host capabilities. It should not be treated as internet-ready or as a hardened security boundary in its current form.

## Current assumptions

The baseline assumes deployment on a trusted machine or trusted private network. Administrator credentials are required from environment configuration. The optional viewer account is disabled unless both viewer credential variables are configured.

The application can interact with:

- the local filesystem inside the configured managed root
- the local Docker daemon
- shell commands through the terminal service
- host telemetry and networking information
- optional screen-sharing / noVNC infrastructure

Compromise of the control plane can therefore have serious host impact.

## Repository rules

Do not commit:

- `.env` files containing credentials
- passwords, API keys, access tokens, or private endpoints
- TLS private keys or certificates
- SSH keys
- production deployment secrets
- private infrastructure inventories or user data

Use `.env.example` only for non-secret configuration examples.

## Deployment guidance

Before exposing the service beyond localhost or a tightly trusted LAN:

- use strong unique administrator credentials
- set `DASH_ROOT` to the narrowest required path instead of `/`
- enable WebSocket authentication
- restrict access with a firewall / VPN / trusted reverse proxy
- terminate TLS at a trusted boundary
- review role authorization for every mutable route
- review Docker socket access carefully
- review terminal command execution and session lifetime
- avoid exposing the service directly to the public internet

## Known baseline limitations

Security work intentionally deferred to later roadmap phases includes stronger credential storage, session expiration, persistent revocation, broader automated security testing, a formal threat model, and hardened remote/multi-node operation.

## Reporting

Do not open a public issue for a vulnerability that could expose credentials, private infrastructure, or host access. Contact the repository owner privately with reproduction steps and impact details.
