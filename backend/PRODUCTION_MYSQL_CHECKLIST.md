# Use MySQL in production (Render)

**Important:** On Render there is **no MySQL on localhost**. You must use a **hosted MySQL** URL. If `MYSQL_URL` points to `localhost`, the app will start (so the port is detected) but all DB calls will fail with a clear error until you set a remote MySQL URL.

---

## 1. Get a hosted MySQL URL

Use one of these (free tiers available):

- **Railway:** https://railway.app → New Project → Add MySQL → copy the `DATABASE_URL` (use as `MYSQL_URL`).
- **PlanetScale:** https://planetscale.com → Create database → Connect → get the connection string (use MySQL format).
- **Aiven:** https://aiven.io → Create MySQL service → copy connection URI.

The URL must look like: `mysql://USER:PASSWORD@HOST:PORT/DATABASE` (host must **not** be localhost/127.0.0.1).

---

## 2. Render backend → set MYSQL_URL

1. Open **Render Dashboard** → your **backend** service (e.g. `distinction-bound-backend`).
2. Go to **Environment**.
3. **Set:**
   - **Key:** `MYSQL_URL`
   - **Value:** your **hosted** MySQL URL from step 1 (e.g. from Railway/PlanetScale/Aiven).
4. **Remove** any `MYSQL_URL` or `DATABASE_URL` that points to `localhost` or `127.0.0.1`.
5. **Save** and **Manual Deploy** (or push to `main`).
6. In **Logs** you should see: `Using MySQL database (production)`. If you see “MYSQL_URL is set to localhost”, replace it with a hosted URL.

---

## 3. Vercel frontend → point at the correct backend

1. Open **Vercel** → your project (Distinction Bound) → **Settings** → **Environment Variables**.
2. Add or edit:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://YOUR-RENDER-BACKEND-URL/api`  
     Example: `https://distinction-bound-backend.onrender.com/api`  
     (Use your real backend URL; it must end with `/api`.)
3. **Save** and **redeploy** the frontend (Deployments → … → Redeploy), so the new env is used.

---

## 4. Hard refresh and test

- On the live site, do a **hard refresh** (Ctrl+Shift+R or Cmd+Shift+R) so the browser doesn’t use cached data.
- Log in and check courses, tickets, etc. They should now come from **MySQL**.

---

## Summary

| Where   | What to set |
|--------|-------------|
| Render (backend) | `MYSQL_URL=mysql://user:pass@**remote-host**:3306/db` (never localhost on Render) |
| Vercel (frontend) | `REACT_APP_API_URL=https://your-backend.onrender.com/api` |

**Port / “no open ports”:** The server binds to `0.0.0.0:PORT` so Render detects the port. If you still see “no open ports”, ensure `MYSQL_URL` is not localhost (or the app will use the stub and start; then set a hosted MySQL URL).
