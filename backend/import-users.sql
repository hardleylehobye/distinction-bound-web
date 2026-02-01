-- Import users into distinction_bound.users
-- Run: mysql -u root -p distinction_bound < import-users.sql
-- Or in MySQL: USE distinction_bound; then paste the INSERTs below.

USE distinction_bound;

-- Optional: clear existing users if you want a clean import (uncomment the next line)
-- TRUNCATE TABLE users;

INSERT INTO users (id, uid, email, name, role, blocked, special_admin, created_at, updated_at)
VALUES
(1, 'LBcFeF3QJPh1rp3iuJC00kfoBPV2', 'hardleylehobye@gmail.com', 'Hardley Lehobye', 'admin', 0, 1, '2026-01-20 00:44:33', '2026-01-21 07:02:27'),
(2, 'UovYL1BDt2e8dxbuKdXmBkvN3Zl2', 'thabangth2003@gmail.com', 'Thabang Lehobye', 'instructor', 0, 0, '2026-01-20 00:44:33', '2026-01-22 04:21:50'),
(3, 'QWD1SHuXNwcVGTzVbBA8gj9A22H2', '2542228@students.wits.ac.za', 'Thabang Lehobye', 'student', 0, 0, '2026-01-20 22:48:54', '2026-01-21 06:49:51'),
(11, '9PdkHZ695lhi2PwL4B2wAsEovwM2', '2538825@students.wits.ac.za', 'Sibusiso Mahlangu', 'student', 0, 0, '2026-01-21 08:39:18', '2026-01-21 08:39:18'),
(12, '7ZpTQIBTcfSKQPrKUaH9X717OQh1', 'lehlohonolomahlangu718@gmail.com', 'Lehlohonolo', 'admin', 0, 1, '2026-01-21 19:43:16', '2026-01-21 19:43:16')
AS new
ON DUPLICATE KEY UPDATE
  uid = new.uid,
  email = new.email,
  name = new.name,
  role = new.role,
  blocked = new.blocked,
  special_admin = new.special_admin,
  updated_at = new.updated_at;
