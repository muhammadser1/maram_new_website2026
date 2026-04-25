-- Add soft-delete columns to lessons tables (fixes 42703 "column deleted_at does not exist")
-- Run this in Supabase SQL Editor if your DB was created before these columns existed.

-- individual_lessons
ALTER TABLE individual_lessons
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deletion_note TEXT NULL;

-- group_lessons
ALTER TABLE group_lessons
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deletion_note TEXT NULL;

-- Indexes for filtering by deleted_at
CREATE INDEX IF NOT EXISTS idx_individual_lessons_deleted_at ON individual_lessons(deleted_at);
CREATE INDEX IF NOT EXISTS idx_group_lessons_deleted_at ON group_lessons(deleted_at);
