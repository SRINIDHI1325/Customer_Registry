# Customer Registry

A MERN stack Customer Care Registry app — customers raise complaints, agents resolve
them, admins oversee everything.

## Folder structure

```
customer-registry/
├── server/          ← Backend (Node + Express + MongoDB)
└── client/           ← Frontend (React, single HTML file)
```

See `server/README.md` and `client/README.md` for setup details on each.

## Quick start

**1. Backend:**
```bash
cd server
npm install
npm run dev
```
Runs at `http://localhost:5000`. Requires MongoDB running locally (or an Atlas URI in `.env`).

**2. Frontend** (in a second terminal):
```bash
cd client
npx server
```
Opens at a local URL (e.g. `http://localhost:3000`) — open that in your browser.

## Roles

- **Customer** — submits complaints, tracks status, messages the assigned agent, rates resolution
- **Agent** — works assigned complaints, updates status, messages the customer
- **Admin** — sees everything, assigns agents to complaints, manages user accounts
