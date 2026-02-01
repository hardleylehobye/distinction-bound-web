# 🔥 Use Firebase (Firestore) as Backend Database

The backend can use the **same Firestore** as your frontend, so you don’t need Render PostgreSQL (no 90‑day expiry).

**⚠️ Security:** Never commit your service account JSON or paste it in chat. If a key was ever exposed, revoke it in Firebase Console (Service accounts → delete that key) and generate a new one.

---

## 1. Get a service account key

1. Open [Firebase Console](https://console.firebase.google.com) → your project.
2. **Project settings** (gear) → **Service accounts**.
3. Click **Generate new private key**.
4. Save the JSON file somewhere safe (do **not** commit it).

## 2. Configure the backend

Use **one** of these:

**Option A – File path (local, recommended)**  
Put the new JSON file somewhere outside the repo (e.g. Desktop). In `backend/.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\MC\OneDrive\Desktop\distiction-bound-service-account.json
FIREBASE_PROJECT_ID=distiction-bound
```

(Use the real path to your JSON file. No `DATABASE_URL` in `.env` so the backend uses Firebase.)

**Option B – JSON in env (e.g. Render)**  
Paste the **entire** service account JSON as one line into an env var:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
FIREBASE_PROJECT_ID=your-firebase-project-id
```

- Do not set `MYSQL_URL` / `DATABASE_URL` (mysql://...) if you want the backend to use Firebase.

## 3. Run the backend

```bash
cd backend
npm install
npm start
```

You should see: **Using Firebase (Firestore) database**.

## Priority order

1. **Firebase** – if `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS` is set.
2. **MySQL** – if `MYSQL_URL` or `DATABASE_URL` (mysql://...) is set.

Your frontend already uses Firestore; with this, the backend uses the same Firestore, so there’s a single source of truth and no Render DB expiry.
