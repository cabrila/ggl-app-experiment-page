# Street / Public Casting Implementation Plan

## 1. Overview
The "Street Casting" (also referred to as "Public Casting" or "Actor Submission") feature allows production teams to create, configure, and share public-facing web forms. Actors and talent can use these unique URL forms to submit their profiles (headshots, videos, sizes, skills) directly into the Greenlight platform. 

Currently, the feature is functional in the frontend UI (mocked via React Context in `PublicCastingContext.tsx` and handled in `components/public-casting/`), but requires a robust Firestore backend to handle form persistence, secure public access, and integration with the project's internal actor database.

## 2. Core Entities & Data Model

We will need two primary Firestore collections to support this feature:

### Collection: `casting_calls`
Represents the configuration of a public-facing form created by a production team.
* **Document ID**: Unique UUID (used as the public URL parameter).
* **Fields**:
  * `projectId` (string): The internal Greenlight Project ID this call belongs to.
  * `createdBy` (string): User ID of the creator.
  * `title` (string): e.g., "Lead Role - Sarah".
  * `description` (string): Description of the role/project.
  * `headerImageUrl` (string): URL to the cover image.
  * `projectName` (string): For display on the public form.
  * `fields` (array of objects): Dynamic field configuration.
    * `id`, `type`, `label`, `required`, `options`, `placeholder`.
  * `status` (string): `"active"`, `"completed"`, `"draft"`.
  * `createdAt` (timestamp).
  * `updatedAt` (timestamp).

### Collection: `actor_submissions`
Represents a single submission from an actor via the public form.
* **Document ID**: Unique UUID.
* **Fields**:
  * `castingCallId` (string): Reference to the `casting_calls` document.
  * `projectId` (string): Copied from the casting call for easier querying.
  * `status` (string): `"new"`, `"reviewed"`, `"shortlisted"`, `"rejected"`.
  * `submittedAt` (timestamp).
  * `actorData` (object): The submitted payload.
    * `name`, `email`, `phone`, `gender`, `age`, `location`, `headshots` (array of URLs), `videos` (array of URLs), `customFields` (map of dynamic field IDs to values).

## 3. Security Rules (Firestore)

Because this feature bridges internal authenticated users and anonymous external users, the security rules must be carefully strictly defined.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // CASTING CALLS
    match /casting_calls/{callId} {
      // Internal team can read/write their own project's casting calls
      allow read, write: if request.auth != null && 
                         isUserInProject(resource.data.projectId);
                         
      // The public can READ active casting calls to render the form
      allow read: if resource.data.status == "active";
    }

    // ACTOR SUBMISSIONS
    match /actor_submissions/{subId} {
      // Internal team can read/update submissions for their projects
      allow read, update, delete: if request.auth != null && 
                                  isUserInProject(resource.data.projectId);
                                  
      // The public can CREATE a submission, but cannot read or modify them
      // They must provide the valid castingCallId of an active call
      allow create: if get(/databases/$(database)/documents/casting_calls/$(request.resource.data.castingCallId)).data.status == "active";
    }
  }
}
```

## 4. API & Service Layer

Since the `ggl-app-experiment-page` is a lightweight frontend app, we will build a dedicated backend for this functionality at `tools.gogreenlight.ai/backend-service`. This backend will act as the secure bridge between the public-facing URLs and our Firestore database.

### Public Endpoints (Unauthenticated)
* `GET /api/public/casting-call/:id`: Fetches the customized casting call configuration. This must return:
  * Static config: `title`, `description`, `headerImageUrl`, `projectName`, `roleName`.
  * **Dynamic Form Config:** The exact array of custom `fields` configured by the user (e.g., text inputs, dropdowns, checkboxes, file uploads), ensuring the public page dynamically renders exactly what the casting director requested.
  * *Note: Strips out internal metadata (like internal project IDs or internal notes).*
* `POST /api/public/submit-actor`: Accepts the dynamic payload submitted by the actor. 
  * Validates the payload against the custom `fields` definition required by the specific casting call.
  * Uploads images/videos to a public cloud storage bucket (or generates pre-signed URLs).
  * Creates an `actor_submissions` document in Firestore with a `customFields` map containing the actor's answers.

### Internal Endpoints (Authenticated)
* `POST /api/casting-calls`: Create a new casting call, including the custom field schema.
* `PUT /api/casting-calls/:id`: Update configuration (title, images) or edit the custom form fields. Can also be used to toggle status to "completed".
* `GET /api/projects/:projectId/casting-calls`: List all calls for a project.
* `GET /api/projects/:projectId/submissions`: List all submissions.
* `POST /api/submissions/:id/approve`: Action to move a submission into the internal `Actor List` (extracts the `actorData`, maps the custom fields to the closest internal fields or adds them to an `extras` map, and creates a standard `Actor` entity in the main project database).

## 5. Implementation Phases

### Phase 1: Storage & Database Setup
1. Define the TypeScript interfaces for the Firestore collections.
2. Implement Firestore Security Rules for public reading of calls and public writing of submissions.
3. Configure a Google Cloud Storage bucket with public read access (for headshots/videos) and CORS rules to allow direct uploads from the browser.

### Phase 2: Internal Management UI (ggl-app-experiment-page)
1. Un-hide the "Public Casting" feature in `FeatureLayout.tsx` and `SplashScreen.tsx`.
2. Connect `CastingCallsList.tsx` and `CastingCallSetup.tsx` to read/write from Firestore instead of the mocked `PublicCastingContext`.
3. Connect `SubmissionsList.tsx` to query `actor_submissions` from Firestore.

### Phase 3: The Public Actor Form
1. Ensure `app/actor-submission/[formId]/page.tsx` fetches the form config dynamically based on `formId`.
2. Implement the file upload logic (direct-to-GCS with signed URLs or via an API route) for headshots and video links.
3. Implement the final submit logic to push to the `actor_submissions` collection.

### Phase 4: Integration
1. Build the "Accept / Import to Project" workflow. When a casting director likes a submission, clicking "Add to Actor List" maps the submission data into the standard internal Actor context.
2. Implement Email Notifications (e.g., SendGrid) to alert project owners when a new submission arrives.
