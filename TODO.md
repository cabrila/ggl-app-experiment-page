# Greenlight App — Deployment & Roadmap TODO

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

This plan covers shipping the app to the live environment in three phases:

1. **Phase 1 — Deploy the ready app** (Street/Public Casting hidden)
2. **Phase 2 — Build & deploy Street Casting** (needs a real backend)
3. **Phase 3 — Testing** (placeholder; none exists today)

---

## Architecture snapshot (as of this plan)

- **Frontend:** Next.js 14 (App Router), deployed via Vercel (synced from the v0 project).
- **Persistence:** Firebase **Firestore**, client SDK only, **named database `app-experiment-firestore`**, per-user subtrees `users/{uid}/…`. See `lib/firebase.ts`, `lib/firestore.ts`.
- **Auth:** Firebase magic-link (passwordless email). See `FIREBASE_SETUP.md`.
- **AI extraction:** browser → `app/api/import/[taskType]` → `gl-services/ai` (Cloud Run).
- **Backend status by feature:**
  - ✅ Backend-backed (Firestore): Character Bible, **Actor Management** (`actorProjects` + `standaloneActors`), Location Scouting, Prop List, Scene List.
  - ❌ **No backend: Street/Public Casting** — casting calls & submissions live in browser `localStorage` (demo persistence); shareable links are placeholder strings; the public submission page uses a hardcoded form and saves nowhere. **Not deployable as a live service.**

---

## Phase 1 — Prepare & deploy the ready app (Street Casting hidden)

Goal: ship the Firestore-backed tools (Character Bible, Actor Management, Locations, Props, Scenes) to the live environment with Public/Street Casting hidden.

### 1.1 Hide Street Casting from the live build
- [x] Comment out the `public-casting` tile in `components/home/SplashScreen.tsx` so it isn't reachable from the splash. *(Screen, routing and submissions UI remain in the codebase — only the entry point is gated. Restored in Phase 2.)*
- [ ] Confirm no other live entry point links to `public-casting` (search `onNavigate("public-casting")`, nav menus, deep links).

### 1.2 🔴 BLOCKER — Firestore security rules
Every write is client-SDK direct to Firestore, so rules are the only data protection, and **none are committed to this repo** (only `FIREBASE_SETUP.md`).
- [ ] Author `firestore.rules` locking every `users/{uid}/…` subtree to its owner. Cover all collections: `characterBibles`, `actorProjects`, **`standaloneActors`** (new), `locationProjects`, `propProjects`, `sceneProjects`.
- [ ] Add `firebase.json` (+ `.firebaserc`) so rules are versioned and deployable from the repo.
- [ ] **Deploy rules to the NAMED database `app-experiment-firestore`, not `(default)`** — a common silent-failure trap.
- [ ] Verify single-field `orderBy("updatedAt","desc")` queries need no composite indexes (they shouldn't); add `firestore.indexes.json` only if the console requests one.

### 1.3 Environment & secrets
- [ ] Set the 6 `NEXT_PUBLIC_FIREBASE_*` vars in the production Vercel project (`FIREBASE_SETUP.md` lists them).
- [ ] Confirm the magic-link **authorized domain** in Firebase Auth includes the production domain.
- [ ] Configure the production **AI service URL** for `app/api/import/*` (point at the prod `gl-services/ai`, not dev) and confirm auth between the app and the service.
- [ ] Audit server-side keys used by API routes (`/api/share`, `/api/feedback*`, `/api/usage`) — e.g. SendGrid key (build logged `API key does not start with "SG."`). Set or disable.

### 1.4 Build & smoke test
- [ ] `pnpm build` passes (currently does; TS errors are ignored via `next.config.mjs`).
- [ ] Manual smoke test signed-in against prod Firebase: create/rename/delete an actor list; add/edit/delete actors; All Actors aggregation + add-to-list; AI import for one document; repeat the equivalent for Character Bible / Locations / Props / Scenes.
- [ ] Confirm data **persists across a redeploy** (create a record, redeploy, verify it's still there).

### 1.5 Go live
- [ ] Promote to the production domain.
- [ ] Post-deploy verification (auth, one write per feature, AI import).
- [ ] Decide rollback procedure (Vercel instant rollback to previous deployment).

### Phase 1 known gaps (non-blocking, track separately)
- [ ] **No headshot/photo upload for actors** — `headshotUrl` is URL-only; Firebase Storage is configured but unused. Build an uploader if producers expect to attach photos.
- [ ] Actors are stored as an **array embedded in each list doc** (Firestore 1 MB/doc limit). Fine for hundreds of URL-only actors; revisit if lists get very large or media-heavy.
- [ ] Logged-out mode is demo/in-memory only (expected).

---

## Phase 2 — Build & deploy Street / Public Casting

Goal: turn the casting prototype into a real service. **Hard requirement: public forms must stay reachable online and submissions must persist across software updates / redeploys.** That means moving casting calls and submissions off browser `localStorage` and onto the server.

### 2.1 Persist casting calls (server-side)
- [ ] Add a Firestore collection for casting calls readable **unauthenticated by `formId`** (e.g. top-level `castingCalls/{formId}`), storing the producer's configured fields, title, status, owner uid.
- [ ] Add helpers in `lib/firestore.ts`: `createCastingCall`, `updateCastingCall`, `getCastingCall(formId)`, `subscribeToCastingCalls(uid)`, `closeCastingCall`.
- [ ] Migrate `PublicCastingContext` off `localStorage`/`demoPersistence` to these helpers (producer side).

### 2.2 Real shareable URLs
- [ ] Generate `shareableLink` as `https://<prod-domain>/actor-submission/{formId}` (the route already exists). Remove the placeholder `gogreenlight.ai/cast/<random>` strings.
- [ ] Carry `formId` (and optional `character`/`project`) in the link; QR code uses the same URL.

### 2.3 Public submission page (`app/actor-submission/[formId]/page.tsx`)
- [ ] Load the casting call by `formId` from Firestore and **render its configured fields dynamically** (today it renders a hardcoded field set).
- [ ] Handle "form not found / closed" states.
- [ ] Keep the page publicly accessible (no auth required to submit).

### 2.4 Submission ingestion (persist + survive redeploys)
- [ ] Replace the client-only `utils/submissionProcessor` `window` event with a real write: either an API route (`app/api/casting/[formId]/submit`) or a guarded direct Firestore write to `castingCalls/{formId}/submissions/{submissionId}`.
- [ ] Security rules: public **create-only** on the submissions subcollection (no public read/list); owner can read all.
- [ ] Producer's Submissions view reads submissions from Firestore (real-time) instead of `localStorage`. The migrated multi-select / add-to-actor-list / view-modes UI stays; only the data source changes.

### 2.5 File storage for media
- [ ] Upload submitted **photos/videos to Firebase Storage** (or GCS) and store the resulting URLs on the submission (today photos are in-memory `File` objects that never leave the browser).
- [ ] Storage security rules for public upload to a per-form path + size/type limits.
- [ ] Wire submission media into the actor `headshotUrl` / `photos` / `videos` mapping already present in `submissionToActor`.

### 2.6 Re-enable & ship
- [ ] Uncomment the `public-casting` tile in `SplashScreen.tsx` (reverse of 1.1).
- [ ] End-to-end test **across two devices/browsers**: producer creates form → external actor submits on a phone → producer sees the submission and can push it into an actor list.
- [ ] Verify a redeploy does not lose forms or submissions.
- [ ] Deploy.

### Phase 2 open questions
- [ ] Spam/abuse protection on public submissions (rate limit / captcha)?
- [ ] PII handling & retention for public submitters (consent, deletion).
- [ ] Notifications to the producer on new submissions (email via SendGrid? in-app?).

### 2.7 Update the AI extraction scripts (`gl-services/ai`)
*(Independent of Street Casting, but grouped into Phase 2 per decision.)*

The "AI scripts" are **skills** served by **`gl-services/ai/skills-service`** (`gl-skills-service`)
— the AI backend for THIS app. ⚠️ The sibling **`gl-services/ai/service`** (`gl-ai-service`) is a
different service for the **main product** (`gl-services/api` → `gl-webclient-next`); do NOT edit
skills there for this app. Each folder has a `README.md` explaining the split (the `/usage`
endpoint exists only in skills-service — quickest way to tell them apart).
Each skill is a folder under `skills-service/src/skills/<skill>/` (`manifest.yaml`, `prompt.md`,
`input.schema.json`, `output.schema.json`, + `evals/` where present), auto-loaded at startup by
`ManifestLoader` and invoked via Gemini (`GEMINI_API_KEY`). The app reaches them through
`app/api/import/[taskType]` → skills-service `/tasks/upload`.

**Applied 2026-06-15** — integrated the AI developer's candidate prompts (`gl-services/ai/update/`)
into **skills-service**. All five skills already existed there; this updated their prompts/schemas.
Remaining items below are deploy/validation steps.
- [x] `actor-extract` → Actors V5 (v0.2.0); `prop-extract` → Props V4 (v0.2.0) — prompt-only (schemas already matched the candidates).
- [x] `character-extract` → Characters V3 (v0.3.0 → v0.4.0): prompt now uses `Not specified` + `[Active]/[Referenced]` citation tagging (schema already had `scene_appearances`, no `type`).
- [x] `location-overview` → Locations V8 (v0.2.0): output schema relaxed — `time_of_day` → free comma-separated string, `type` enum now includes `Not specified`.
- [x] `scene-extract` → Scenes V3 (v0.2.0): output `raw_text` → `summary` (**behaviour change**: full scene text → a summary). App reconciled — `summary?` added to `SceneExtractResult`, `SceneUploadView` maps `summary` → `rawText`.
- [x] Corrected an earlier misapplication: these were first applied to `service/` by mistake, then reverted there and re-applied to `skills-service/`.
- [ ] ⚠️ **Deploy gotcha (flagged in `skills.service.ts`):** skill files live in `src/skills/` and are *not* copied to `dist/`. Confirm the deployed Cloud Run revision actually loads the updated + new skills — ship the files, set `SKILLS_DIR`, or complete the planned move to GCS — and verify the running revision lists all 5 skills at startup.
- [ ] Add/refresh golden evals for all five skills (`skills/<skill>/evals/*.yaml`) and run the eval CLI (`src/evals/cli.ts`). **Existing `character-extract` evals likely break** (schema changed: `type` removed, `scene_appearances` added) — update them.
- [ ] Follow-up (app robustness, not blocking the skills): `actor-extract` now emits `gender`/`characters` and `location-overview` emits free-text/comma-separated `time_of_day` + `"Not specified"` type — the app's `ActorExtractResult`/upload mapping ignores gender/characters, and `LocationOverviewResult` types `time_of_day` as a strict enum. Loosen/extend app mappings if you want that data surfaced.
- [ ] Redeploy the AI service (Cloud Run) and point the app's production AI-service URL (Phase 1.3) at the updated service.

---

## Phase 3 — Testing (PLACEHOLDER)

> No automated testing exists in the repo today. This is a placeholder to be fleshed out
> after Phase 2. Scope, tooling, and coverage targets to be decided.

- [ ] Choose tooling (e.g. Vitest/Jest for units, React Testing Library for components, Playwright for E2E).
- [ ] Unit tests for pure logic: `allActors` aggregation/dedup, `submissionToActor` mapping, gender/age/type filters, Firestore `stripUndefined`/timestamp conversion.
- [ ] Component tests for the migrated UI: view-mode toggle, multi-select + add-to-list modal, manual-create buttons.
- [ ] Integration tests against the Firestore emulator (rules + CRUD per collection).
- [ ] E2E happy paths: sign-in, actor list lifecycle, AI import, and (post-Phase-2) the public casting submission flow across devices.
- [ ] CI wiring (run tests + build on PR).
- [ ] Decide coverage targets and a definition of "tested enough to ship".

---

## Quick reference — files touched by each phase

| Area | Key files |
|---|---|
| Hide/show casting tile | `components/home/SplashScreen.tsx` |
| Firestore wiring | `lib/firebase.ts`, `lib/firestore.ts` |
| Rules/config (to add) | `firestore.rules`, `firebase.json`, `.firebaserc` |
| Casting calls (Phase 2) | `components/public-casting/PublicCastingContext.tsx`, `CastingCallSetup.tsx`, `CastingCallsList.tsx` |
| Public form (Phase 2) | `app/actor-submission/[formId]/page.tsx`, `utils/submissionProcessor.ts` |
| Submissions view | `components/public-casting/SubmissionsList.tsx`, `SubmissionCard.tsx` |
| AI scripts (Phase 2.7) | **separate repo** `gl-services/ai/`**`skills-service`**`/src/skills/<skill>/` (NOT `service/` — that's the main-product AI service); loader `src/lib/manifest-loader.ts` |
