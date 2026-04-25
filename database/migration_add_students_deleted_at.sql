-- Add missing columns to students table (fixes "Failed to fetch students")
-- Run this in Supabase SQL Editor if your DB was created before these columns existed.
-- Adds: deleted_at, deletion_note, created_by_teacher_id

-- students: soft-delete + who added the student
ALTER TABLE students
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deletion_note TEXT NULL,
ADD COLUMN IF NOT EXISTS created_by_teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON students(deleted_at);
CREATE INDEX IF NOT EXISTS idx_students_created_by_teacher ON students(created_by_teacher_id);
