![screenshot](client/public/android-chrome-512x512.png)


# CarePoint — Clinic Management System

Full-stack MERN clinic management platform: role-based auth (Admin /
Doctor / Patient), appointment booking with conflict detection,
encrypted medical records, digital prescriptions, real-time
notifications, and peer-to-peer video consultations.

## Stack
- **Server:** Node.js, Express, MongoDB/Mongoose, JWT (access + refresh),
  bcrypt, Socket.io, AES-256-GCM field encryption for clinical notes.
- **Client:** React (Vite), Tailwind CSS, Redux Toolkit (auth) +
  TanStack Query (server state), React Router v6, Recharts,
  simple-peer (WebRTC) + Socket.io-client.

## Project structure
```
carepoint/
├── client/     React SPA (Vite)
└── server/     Express API + Socket.io
```
See each folder for its internal layout (models, controllers, routes,
middleware on the server; pages, components, features on the client).

## Getting started

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Configure environment variables**
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   Fill in `server/.env`:
   - `MONGO_URI` — your MongoDB connection string
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — long random strings
   - `FIELD_ENCRYPTION_KEY` — 32-byte key, generate with
     `openssl rand -base64 32`

3. **Run MongoDB** locally, or point `MONGO_URI` at Atlas.

4. **Start both apps in dev mode**
   ```bash
   npm run dev
   ```
   - API: http://localhost:5000
   - Client: http://localhost:5173 (Vite proxies `/api` and websockets
     to the server — see `client/vite.config.js`)

5. **Create your first users — the easy way**
   ```bash
   npm run seed --prefix server
   ```
   This creates one account per role (idempotent — safe to re-run,
   skips anything that already exists):

   | Role    | Email                   | Password    |
   |---------|-------------------------|-------------|
   | Admin   | admin@carepoint.dev     | Admin123!   |
   | Doctor  | dr.okafor@carepoint.dev | Doctor123!  |
   | Doctor  | dr.lee@carepoint.dev    | Doctor123!  |
   | Patient | patient@carepoint.dev   | Patient123! |

   **Doctors sign in at the same `/login` form as everyone else** — the
   server looks up the account by email and the client redirects based
   on the role in the response (`client/src/pages/LoginPage.jsx`), so
   there's no separate "sign in as doctor" flow to configure. The two
   seeded doctors already have a Mon–Fri 9–5 schedule and specialty set,
   so `patient@carepoint.dev` can book an appointment with them
   immediately after seeding.

   Change these passwords (or delete the accounts) before deploying
   anywhere real — they're committed in this README for local dev only.

   **The manual way** (no seed script, e.g. against a shared/staging DB):
   - Patients self-register at `/register`.
   - Doctor and Admin accounts are created via `POST /api/admin`-guarded
     routes (`POST /api/doctors` as an admin) — seed one admin directly
     in MongoDB to bootstrap, e.g.:
     ```js
     // in a mongo shell / Compass, after hashing a password with bcrypt
     db.users.insertOne({
       firstName: "Sarah", lastName: "Chen", email: "admin@carepoint.dev",
       password: "<bcrypt-hash>", role: "admin", isActive: true
     })
     ```

## Key implementation notes

- **Auth:** short-lived JWT access tokens (Authorization header) +
  httpOnly refresh cookie; axios interceptor in `client/src/services/api.js`
  auto-refreshes on 401.
- **RBAC:** `middleware/auth.js` (`protect`) + `middleware/role.js`
  (`authorize`, `authorizeOwnerOrRoles`) guard every route.
- **Booking engine:** `Appointment.hasConflict()` + a compound
  `{doctor, startTime, endTime}` index prevent double-booking;
  `GET /api/schedules/:doctorId/slots?date=` expands a doctor's
  weekly shift template into concrete open slots for the UI.
- **Encrypted records:** `MedicalRecord.diagnosticNotes` is
  AES-256-GCM encrypted at rest via a Mongoose setter/getter
  (`server/src/utils/encryption.js`) and excluded from default queries.
- **Real-time:** a single authenticated Socket.io connection
  (`client/src/services/socket.js`) handles both the notification feed
  (`notification:new`) and WebRTC signaling for video consultations
  (`consultation:*` events) — see `server/src/socket/index.js`.
- **Video calls:** `simple-peer` handles the WebRTC peer connection;
  the server only relays signaling data, never the media stream itself.
  `simple-peer` pulls in Node's `readable-stream` under the hood, which
  expects `global`/`process`/`Buffer` to exist — `vite-plugin-node-polyfills`
  is configured in `client/vite.config.js` to shim these for the browser.
  If you ever see `Uncaught ReferenceError: global is not defined`,
  check that this plugin is still present in the Vite config.

## Recently added

- **Persistent login** — the server already issued a 7-day httpOnly
  refresh cookie on login (`REFRESH_COOKIE_OPTIONS` in
  `authController.js`), but the client only ever kept the short-lived
  access token in `sessionStorage`, which is wiped when the tab
  closes — so closing the browser meant logging in again even with a
  perfectly valid cookie. `client/src/features/auth/authSlice.js` now
  has a `bootstrapAuth` thunk, dispatched once on app load
  (`App.jsx`), that silently trades the refresh cookie for a new
  access token via `POST /api/auth/refresh` + `GET /api/auth/me`
  before any routing decision is made. A brief spinner shows while
  this resolves; `/login` and `/register` redirect straight to the
  right dashboard if a session was restored
  (`routes/RedirectIfAuthenticated.jsx`). Net effect: sign in once,
  stay signed in for up to 7 days across tab/browser restarts, until
  you explicitly log out or the cookie expires.

- **Seed script** (`server/src/utils/seed.js`, run via `npm run seed`)
  — was referenced in `package.json` but didn't exist; without it
  there was no way to get an admin account (and therefore no way to
  create a doctor to sign in as) without hand-editing MongoDB.
- **Doctor self-profile page** — `client/src/pages/DoctorProfilePage.jsx`
  at `/doctor/profile`, reachable from the Topbar account menu (now
  shown for both doctor and patient roles). Edits bio, specialty, fee,
  license, qualifications via the existing `PUT /api/doctors/:id`.
- **Doctor online/offline toggle** — the same page has a toggle that
  sets `DoctorProfile.isOnline`, which now actually has a UI control
  behind it. Feeds the "Doctors Online" admin stat and the green
  online dot shown on doctor cards in the "Find a Doctor" list —
  both existed already but had nothing to turn the flag on.

- **Appointment booking flow** — `client/src/pages/BookAppointment.jsx`
  (`/patient/doctors/:doctorId/book`, linked from the Doctors page).
  Date picker over the next 14 days, real open slots pulled from
  `GET /api/schedules/:doctorId/slots?date=`, in-person/video toggle,
  optional reason, and `POST /api/appointments` — which re-validates
  the slot server-side (via `Appointment.hasConflict`) in case another
  patient books the same slot first, surfacing a clear error instead
  of a silent double-booking.
- **Admin user-management screen** — `client/src/pages/AdminUsers.jsx`
  (`/admin/users`, "User Management" in the sidebar). Lists every
  account with role tabs (All/Patients/Doctors/Admins), search, and
  pagination via the existing `DataTable`; each row can be
  activated/deactivated (`PATCH /api/admin/users/:id/status` — an
  admin can't deactivate their own account). A "New Admin" button
  opens `CreateAdminModal.jsx`, calling the new
  `POST /api/admin/users` to onboard additional staff accounts.
- **Admin doctor-creation UI** — `client/src/components/CreateDoctorModal.jsx`,
  opened from a "New Doctor" button on the Doctors page (admin only).
  Calls the existing admin-guarded `POST /api/doctors`.
- **File uploads for attachments** — `server/src/middleware/upload.js`
  (multer, local disk storage under `server/uploads/`, 10MB limit,
  image/PDF/Word allow-list) behind `POST /api/uploads`
  (doctor/admin only). `client/src/components/AttachmentUploader.jsx`
  uploads files and feeds the returned `{fileName, fileUrl, fileType}`
  into a medical record's `attachments` array — wired into the new
  "New record" form on the Medical Records page. Swap the multer disk
  driver for an S3 (or similar) driver before deploying; uploaded
  files are currently served statically from `/uploads`.
- **Persisted notifications** — `server/src/models/Notification.js` +
  `notificationController`/`notificationRoutes` (`GET /api/notifications`,
  mark-read, mark-all-read, delete). `emitNotification()` in
  `server/src/socket/index.js` now writes to this collection *and*
  pushes the live Socket.io event, so the feed survives refresh and
  shows an accurate unread count. The Topbar bell and Notifications
  page both read from this endpoint.

## Next steps to productionize
- Swap local-disk uploads for a cloud bucket (S3/GCS) driver.
- Add TypeScript, tests, and CI.
- Add rate limiting (e.g. `express-rate-limit`) to `/api/auth`.
- Add pagination/infinite-scroll to the notifications feed for high-volume accounts.
