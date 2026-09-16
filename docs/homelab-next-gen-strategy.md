# HELM Next-Gen Homelab OS Strategy

## 1) Executive Summary

HELM today is already a strong local operations dashboard (telemetry, files, terminal, screen, media, containers). The next leap is to evolve it from a single-node dashboard into a full homelab operating system control plane.

Target positioning:

- Simpler daily operations than Proxmox for home users
- Better app/service experience than CasaOS for power users
- More Linux-native observability and runbook automation than both

Core promise:

- Operate a home datacenter from one interface with confidence, automation, and safe defaults.

## 2) Current Product Analysis

### Strengths

- Real-time node telemetry with WebSocket stream
- Role-based local auth and guarded routes
- Practical operations surface: terminal, files, media, screen, Docker lifecycle
- Clean React + TypeScript frontend and modular Express backend

### Gaps

- Single-node mindset (needs multi-node fleet model)
- No service topology map (what app depends on what)
- No first-class backup/restore and DR runbooks
- No policy automation engine (scheduled tasks, remediation)
- No built-in app marketplace templates for common homelab services

## 3) User Segments and Use Cases

### Segment A: Home power users

- Run Plex/Jellyfin, Home Assistant, Pi-hole, NAS shares
- Need one-click lifecycle + safe updates + storage and network visibility

### Segment B: Self-hosting enthusiasts

- Run reverse proxy, monitoring stack, CI, secrets, VPN
- Need service dependency graph, alerts, and automation hooks

### Segment C: Small lab teams / makerspaces

- Multi-user shared infrastructure
- Need RBAC, audit trails, and operations runbooks

## 4) Competitive Positioning

### Against CasaOS

- Win on observability depth, network diagnostics, and operator workflows
- Keep onboarding as simple as CasaOS

### Against Proxmox

- Win on UX speed for day-to-day application operations
- Keep advanced capabilities optional, not mandatory

### HELM differentiation

- Linux operations first (not only VM lifecycle)
- Unified control for telemetry + files + containers + remote session
- Explainable recommendations (not black-box magic)

## 5) Product Vision: HELM Control Plane

### Pillar 1: Fleet and Topology

- Manage multiple homelab nodes from a single pane
- Service dependency map (DNS, reverse proxy, media, automations, storage)
- Health correlation across host, network, and service layers

### Pillar 2: Reliability Automation

- Scheduled backups with verification
- Auto-run health checks and remediation playbooks
- Safe rollbacks for failed updates

### Pillar 3: Secure-by-Default Homelab

- Enforced least privilege profiles
- Secret management integration
- Audit log and high-risk action approvals

### Pillar 4: App and Service Experience

- Curated templates for common homelab stacks
- One-click install + updates + config validation
- Service SLO view (uptime, latency, error rate)

## 6) Target Technical Architecture

### Control plane

- Existing Node/Express API evolves into orchestration API
- Add internal job scheduler for recurring tasks
- Store persistent state (PostgreSQL or SQLite for local mode)

### Agent model

- Lightweight HELM Agent on each Linux node
- Secure mTLS communication with control plane
- Agent capabilities: metrics, command execution profiles, service probes, backup tasks

### Data layers

- Time series metrics (Prometheus-compatible schema)
- Operational events and audit log
- Configuration and inventory state

### Frontend domains

- Overview and alerts
- Nodes and topology
- Services catalog
- Automation and runbooks
- Security and access

## 7) Implementation Roadmap

### Phase 1: Foundation Hardening (2-3 weeks)

- Multi-origin CORS and runtime resilience (done in this sprint)
- Encoding-safe file write policy and CI checks
- Dedicated health and diagnostics panel

### Phase 2: Homelab Intelligence (2-4 weeks)

- Maturity scoring and strategy page (started)
- Service profile templates (Plex, HA, Pi-hole, NAS)
- Topology summary cards and risk scoring

### Phase 3: Multi-Node Operations (4-8 weeks)

- Register external Linux nodes
- Node inventory, status, and tags
- Unified command and telemetry fan-out

### Phase 4: Reliability and Recovery (4-6 weeks)

- Backup jobs + retention rules
- Restore workflows and dry-run checks
- Alert routing to Telegram/Discord/Email

### Phase 5: Platform Ecosystem (ongoing)

- Template marketplace
- Plugin SDK for custom adapters
- Community profiles and runbook sharing

## 8) Metrics for Success

Product KPIs:

- Mean time to detect incidents
- Mean time to recover services
- Backup success rate
- Weekly active operators
- Percentage of automated runbook execution

Reliability SLOs:

- Control plane uptime target: 99.9%
- Metrics delay under 3 seconds for local nodes
- Critical action audit coverage: 100%

## 9) Security Baseline for Home Linux Servers

Minimum baseline:

- Non-root by default operations
- Action-level authorization for destructive commands
- Signed sessions and token expiry policy
- Optional MFA for admin accounts
- Immutable audit trail for auth and command actions

Network baseline:

- Separate management VLAN if available
- Strict ingress rules for exposed services
- Reverse proxy with TLS for external access

## 10) Immediate Backlog (What to Build Next)

1. Service health probe engine with per-service checks
2. Topology map page with dependency edges
3. Backup policy UI and execution logs
4. Alert channel integrations (Telegram first)
5. Node enrollment wizard for secondary Linux machines

## 11) Why This Version Will Be Better

This roadmap turns HELM from a local dashboard into a complete homelab operating layer:

- More practical than generic admin panels
- More observable than app launchers
- Less complex than enterprise virtualization consoles
- Better fit for real home-server ownership and maintenance
