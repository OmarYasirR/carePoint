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

5. **Create your first users**
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