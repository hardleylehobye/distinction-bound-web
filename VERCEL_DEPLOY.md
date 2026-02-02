# Deploy on Vercel and connect to your database

Frontend and API both run on Vercel. The API connects to **your database** via the `MYSQL_URL` you set in Vercel (e.g. Railway MySQL). Push to `main` → auto deploy.

---

## Connect your database to Vercel

1. **Vercel** → your project → **Settings** → **Environment Variables**
2. Add **`MYSQL_URL`** with your **public** database URL.

**If you use Railway MySQL:**

- Use the **public** URL (not `mysql.railway.internal`).
- Example: `mysql://root:YOUR_PASSWORD@ballast.proxy.rlwy.net:25441/railway`
- Copy the exact URL from Railway → your MySQL service → **Variables** (or use the public host/port from **Settings**).

3. Save and **redeploy** so the API uses this database.

**If there is no data** (courses, users, etc. are empty): your data is in **local MySQL**. Copy it to Railway once:

- In **PowerShell** (from project root):
  ```powershell
  cd backend
  $env:MYSQL_RAILWAY_URL="mysql://root:YOUR_RAILWAY_PASSWORD@ballast.proxy.rlwy.net:25441/railway"
  node copy-local-to-railway.js
  ```
- Use your real Railway password. The script creates tables on Railway (if needed) and copies all data from your local MySQL. After that, Vercel will show the same data.

---

## 1. Connect repo

- **Vercel** → New Project → Import `hardleylehobye/distinction-bound-web`
- Framework: **Create React App** (auto-detected)
- Build: `npm run build`, Output: `build`
- Deploy

---

## 2. Environment variables (Vercel project → Settings → Environment Variables)

Add these for **Production** (and Preview if you want):

| Key | Value | Notes |
|-----|--------|------|
| `NODE_ENV` | `production` | So Yoco uses live keys |
| `MYSQL_URL` | `mysql://user:pass@**host**:3306/db` | **Hosted MySQL only** (Railway, PlanetScale, Aiven). Do **not** use localhost. |
| `YOCO_LIVE_PUBLIC_KEY` | `pk_live_...` | From Yoco dashboard |
| `YOCO_LIVE_SECRET_KEY` | `sk_live_...` | From Yoco dashboard |
| `RESEND_API_KEY` | `re_...` | For contact/support emails |
| `FROM_EMAIL` | Your verified sender email | Optional |

**Optional (test keys):**  
`YOCO_TEST_PUBLIC_KEY`, `YOCO_TEST_SECRET_KEY` if you want a test fallback.

**Do not set** `REACT_APP_API_URL` – the app uses the same origin (`/api`) on Vercel.

---

## 3. Hosted MySQL (required)

Vercel has no database. Use one of:

- **Railway:** https://railway.app → New Project → Add **MySQL** → copy connection URL → use as `MYSQL_URL`
- **PlanetScale:** https://planetscale.com → Create database → Connect → MySQL connection string
- **Aiven:** https://aiven.io → Create MySQL service → connection URI

`MYSQL_URL` must look like: `mysql://USER:PASSWORD@HOST:PORT/DATABASE` with a **remote** host (not localhost).

---

## 4. Verify

- **Frontend:** `https://your-project.vercel.app`
- **API health:** `https://your-project.vercel.app/api/health` → `{"status":"ok",...}`

---

## Troubleshooting

### `Error: connect ETIMEDOUT` (MySQL)

- **Use Railway’s public URL:** In Railway → your MySQL service → **Settings** → **Networking**. Ensure the service is **public** and copy the **Public** host and port (e.g. `something.proxy.rlwy.net:25441`). Use that in `MYSQL_URL`, not any `*.railway.internal` host.
- **Set `MYSQL_URL` in Vercel:** Project → Settings → Environment Variables → add `MYSQL_URL` for **Production** (and Preview if you use it). Redeploy after changing env vars.
- **Optional:** If Railway suggests disabling SSL for external clients, append `?sslMode=DISABLED` to your URL, e.g.  
  `mysql://root:PASSWORD@host.proxy.rlwy.net:25441/railway?sslMode=DISABLED`

### `RESEND_API_KEY not found`

- Optional. Add `RESEND_API_KEY` in Vercel env vars to enable email; otherwise emails are disabled.

---

## Local development

- **Frontend:** `npm start` (port 3000)
- **Backend:** `cd backend && npm start` (port 5000)

The frontend uses `http://localhost:5000/api` when on localhost; production uses same-origin `/api`.
