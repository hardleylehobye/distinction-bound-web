# 🐬 Use MySQL as Backend Database

The backend can use **MySQL** or **Firebase** (Firestore) as its database.

## 1. Create a MySQL database

Use any MySQL 5.7+ or MariaDB server (local, or a host like PlanetScale, Railway, AWS RDS, etc.). Create a database and user, and note:

- Host
- Port (usually 3306)
- Database name
- Username and password

## 2. Set the connection URL

In `backend/.env` set **one** of:

```env
# Option A – dedicated MySQL URL (recommended)
MYSQL_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME

# Option B – reuse DATABASE_URL (only if you're not using Postgres)
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME
```

Examples:

```env
# Local MySQL
MYSQL_URL=mysql://root:password@localhost:3306/distinction_bound

# PlanetScale (use their connection string)
MYSQL_URL=mysql://user:pswd@aws.connect.psdb.cloud/dbname?ssl={"rejectUnauthorized":true}
```

**Important:** If you use MySQL, do **not** set Firebase env vars (`GOOGLE_APPLICATION_CREDENTIALS` / `FIREBASE_SERVICE_ACCOUNT_JSON`) if you want the backend to use MySQL. Priority is: **Firebase → MySQL**.

## 3. Run the backend

```bash
cd backend
npm install
npm start
```

You should see: **Using MySQL database**.

Tables (`users`, `courses`, `sessions`, `enrollments`, `purchases`, `attendance`, `notes`, `videos`, `payouts`) are created automatically on first run.
