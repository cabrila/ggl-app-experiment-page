# GoGreenlight Tools — Web App

Next.js web app for **tools.gogreenlight.ai**, a suite of AI-assisted pre-production tools for film & TV. Users upload a screenplay (PDF/DOCX) and the app extracts structured breakdowns; it also hosts the public Street Casting submission flow.

> Originally scaffolded with [v0.dev](https://v0.dev) and deployed on Vercel; it has since grown well beyond the starter template.

## Features

Each tool uploads a document to the backend skills engine, polls for progress, then renders an editable, exportable result (JSON / PDF / Excel):

- **Character Bible** — characters with aliases, gender, age range, scene appearances (`character-extract`)
- **Scene List** — scene-by-scene breakdown with headings, locations, time of day (`scene-extract`)
- **Prop List** — props with categories and per-scene handling (`prop-extract`)
- **Location Overview** — distinct shooting locations with INT/EXT, time of day, scouting notes (`location-overview`)
- **Actor Management** — actor database, including imports (`actor-extract`)
- **Public Casting** — public, shareable casting-call forms and a submissions dashboard

Large screenplays are chunked server-side, so the upload views display real per-chunk progress (e.g. "4 of 8 parts done") streamed through the polling `useImportJob` hook. A **Usage** page surfaces per-call AI token/cost telemetry.

## Stack

- **Next.js 14** (App Router) + **React 19**, TypeScript
- **TailwindCSS** + **Radix UI** primitives, Framer Motion, lucide-react
- **Firebase** (magic-link auth) + `firebase-admin`
- Client export libs: `jspdf` / `jspdf-autotable`, `xlsx`
- Vercel Analytics + Google Analytics

## Project structure

```
app/                 # App Router routes (page.tsx is the tool shell; actor-submission, usage, auth/callback)
components/          # Feature modules: character-bible, scene-list, prop-list, location-scouting,
                    #   actor-list, public-casting, usage, home, layout, modals, ui (shared primitives)
hooks/              # useImportJob (poll-based AI job tracker), useFirebaseUser, etc.
lib/                # firebase, firestore, auth, analytics, *-export.ts (per-tool exporters)
types/              # DTOs/models incl. ai.ts (skill result shapes) and per-tool types
```

The frontend talks to the NestJS backend (`../backend-service`) over REST. AI extraction goes through `POST /api/import/:taskType` + polling `GET /api/import/:taskType/:taskId`; see [`hooks/useImportJob.ts`](hooks/useImportJob.ts).

## Environment variables

Set these in `.env.local` (locally) and in Vercel project settings. See `FIREBASE_SETUP.md` for obtaining the Firebase values.

```env
# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3005   # NestJS backend base URL

# Firebase (public — safe in browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Optional
NEXT_PUBLIC_RESTRICT_AUTH_DOMAIN=               # restrict sign-in to a domain
NEXT_PUBLIC_GA_MEASUREMENT_ID=                  # Google Analytics
```

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

Run the backend (`../backend-service`) alongside it and point `NEXT_PUBLIC_BACKEND_URL` at it so the AI tools work end-to-end.

## Deployment

Deployed on **Vercel**. Pushes to this repository deploy automatically.
