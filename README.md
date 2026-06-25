# GoGreenlight Tools — Web App

Next.js web app for **tools.gogreenlight.ai**, a suite of AI-assisted pre-production tools for film & TV. Users upload a screenplay (PDF/DOCX) and the app extracts structured breakdowns; it also hosts the public Street Casting submission flow.

> Originally scaffolded with [v0.dev](https://v0.dev) and deployed on Vercel; it has since grown well beyond the starter template.

**Repository:** [`cabrila/ggl-app-experiment-page`](https://github.com/cabrila/ggl-app-experiment-page) — deployed via Vercel (`main` → production `tools.gogreenlight.ai`, `dev` → preview `tools-dev.ggl.cx`). Pairs with the backend repo [`Greenlight-Casting/tools.gogreenlight.ai-dev`](https://github.com/Greenlight-Casting/tools.gogreenlight.ai-dev).

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

**Auth on backend calls:** the backend's internal endpoints (AI import, and all casting-call / submission management) require a Firebase ID token. Attach it with the `authHeaders()` helper in [`lib/firebase.ts`](lib/firebase.ts) (`{ Authorization: 'Bearer <idToken>' }`), which `useImportJob` and the Public Casting components use. A call that omits it gets a 401 — which surfaces as an empty dashboard if not handled, so always include `authHeaders()` on protected requests.

### Public Casting flow

- **Create/manage** (signed-in): [`components/public-casting/`](components/public-casting/). On create, the backend assigns the casting call's id; the frontend uses **that** id for the shareable link and local state — a client-minted id would 404 the public form. Casting calls and submissions are owner-scoped server-side, so the dashboard only shows the signed-in user's data. The dashboard refetches via `refreshFromBackend()` when the list/submissions views open, so newly-made submissions appear without a hard reload.
- **Public form** (anonymous): [`app/actor-submission/[formId]/page.tsx`](app/actor-submission/[formId]/page.tsx) loads `GET /api/public/casting-call/:id` and posts to `POST /api/public/submit-actor` — no auth. It only shows "Submission Received" when the backend actually accepts the submission (checks `res.ok`).

## Access & environments

Two independent gates sit in front of the app:

1. **Vercel Deployment Protection** (Preview only) — preview deployments (`tools-dev.ggl.cx`, the `dev` branch) are behind Vercel's auth wall, so only Vercel team members or approved access requests can load them. Production (`tools.gogreenlight.ai`) is exempt (production custom domain). Configured in the Vercel project → Settings → Deployment Protection.
2. **Firebase magic-link login** — passwordless email-link sign-in ([`lib/auth.ts`](lib/auth.ts)). On **Preview**, access is limited to `@gogreenlight.ai`, enforced **in code** (no Vercel config): the login page shows the restriction up front ([`components/auth/LoginScreen.tsx`](components/auth/LoginScreen.tsx)) and `sendMagicLink` rejects other domains — both gated on `NEXT_PUBLIC_VERCEL_ENV === "preview"` (auto-set by Vercel). Production is unrestricted. An explicit `NEXT_PUBLIC_RESTRICT_AUTH_DOMAIN` still overrides in any environment if you ever want to force it.

Each environment authenticates against its **own Firebase project** (separate users + Firestore) — see the [backend README](../backend-service/README.md) branch→environment table for the project ids. Two gotchas:

- The frontend's `NEXT_PUBLIC_FIREBASE_*` project must match the backend's `FIREBASE_PROJECT_ID` for that environment, or authenticated backend calls 401.
- The deployment's domain must be in that Firebase project's **Authorized domains**, or magic-link sending fails with `auth/unauthorized-continue-uri`.

## Environment variables

Set these in `.env.local` (locally) and in Vercel project settings (per environment). See `FIREBASE_SETUP.md` for obtaining the Firebase values.

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
NEXT_PUBLIC_RESTRICT_AUTH_DOMAIN=               # override: force a sign-in domain in ANY env (not needed — Preview is restricted in code)
NEXT_PUBLIC_GA_MEASUREMENT_ID=                  # Google Analytics
# NEXT_PUBLIC_VERCEL_ENV is auto-set by Vercel (production|preview|development);
# the login page + sendMagicLink use it to restrict sign-in to @gogreenlight.ai on Preview only.
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

Deployed on **Vercel** (project `app-experiment-page`, Greenlight team). Pushes deploy automatically:

- `main` → **Production** → `tools.gogreenlight.ai`
- `dev` branch → **Preview** → `tools-dev.ggl.cx`

`NEXT_PUBLIC_*` vars (including the Vercel-provided `NEXT_PUBLIC_VERCEL_ENV`) are inlined at build time, so the Preview `@gogreenlight.ai` restriction takes effect on the Preview build automatically. See **Access & environments** above for the Deployment Protection and per-environment Firebase notes.
