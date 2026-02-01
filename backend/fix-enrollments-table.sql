-- Run this in MySQL Workbench (select distinction_bound schema first)
-- Adds columns required for enrollment to work.
-- If you get "Duplicate column name", the column already exists – that's OK.

ALTER TABLE enrollments ADD COLUMN session_id VARCHAR(255) NULL;
ALTER TABLE courses ADD COLUMN enrollmentCount INT DEFAULT 0;
