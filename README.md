# Project Frontend

React 19 and Vite frontend for the Smart Study Planner.

## Requirements

- Node.js 20.19+ or 22.13+
- The backend API running at the configured URL

## Run locally (PowerShell)

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Vite serves the app at `http://localhost:5173`. `VITE_API_BASE_URL` sets the backend origin and defaults to `http://localhost:8080`. Vite embeds this value at build time for production deployments.

The frontend calls `GET` and `POST /api/subjects`. Configure the backend's `FRONTEND_ORIGIN` to the deployed frontend origin so browser requests are allowed.

## Checks

```powershell
npm run lint
npm run build
```
