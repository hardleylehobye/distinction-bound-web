# Run everything on your PC (localhost)

**Frontend and backend both run on your computer. No Vercel API, no Railway, no Render.**

---

## 1. Backend (MySQL on your PC)

1. Make sure **MySQL** is running on your PC with database **distinction_bound**.
2. In **backend/.env** you should have:
   - `MYSQL_URL=mysql://root:YOUR_PASSWORD@localhost:3306/distinction_bound`
3. Start the backend:
   ```bash
   cd backend
   npm install
   npm start
   ```
   Server runs at **http://localhost:5000**

---

## 2. Frontend

1. In a **new terminal** (project root):
   ```bash
   npm install
   npm start
   ```
2. Browser opens at **http://localhost:3000**
3. The app talks to **http://localhost:5000/api** (your local backend).

---

## Summary

| What        | Where              |
|------------|--------------------|
| Frontend   | http://localhost:3000 |
| Backend API| http://localhost:5000 |
| Database   | MySQL on your PC (distinction_bound) |

No `REACT_APP_API_URL` needed – the app uses localhost:5000 by default.
