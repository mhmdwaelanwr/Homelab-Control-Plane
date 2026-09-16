# Linux Dashboard Suite

Production-style local Linux server management dashboard built with React, Vite, TypeScript, Tailwind CSS, Recharts, Node.js, Express, and WebSocket live updates.

## Structure

- `apps/web`: operator-facing dashboard UI
- `apps/server`: backend API, file operations, auth placeholder, and live metrics socket

## Run

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:4000` by default.

## Placeholder Credentials

Configure administrator credentials before starting the server:

```bash
ADMIN_USER=your-admin-username
ADMIN_PASSWORD=use-a-strong-password
```

These values are intentionally simple placeholders for local-network admin use. Replace them before any real deployment.
