-- ============================================
-- Drop all tables to start from zero
-- ============================================
-- Run this in Supabase SQL Editor, then re-run schema.sql (and migrations if needed)
-- to recreate a fresh database.
-- ============================================

-- Drop in dependency order (child tables first) so FK constraints don't block drops.
-- CASCADE removes any dependent triggers/views/constraints.

-- Junction and child tables
DROP TABLE IF EXISTS group_lesson_students CASCADE;

-- Lesson tables
DROP TABLE IF EXISTS group_lessons CASCADE;
DROP TABLE IF EXISTS individual_lessons CASCADE;

-- Payments and pricing
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS group_pricing_tiers CASCADE;
DROP TABLE IF EXISTS pricing CASCADE;

-- App config and special-notes (references users)
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS special_lesson_notes CASCADE;

-- Core entities
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS education_levels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- In case it exists in your project
DROP TABLE IF EXISTS subjects CASCADE;

-- Optional: drop schema-owned functions that reference the dropped tables
-- (they will error if called until you re-run schema.sql)
DROP FUNCTION IF EXISTS calculate_lesson_cost(INT, VARCHAR, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS update_individual_lesson_cost() CASCADE;
DROP FUNCTION IF EXISTS update_group_lesson_cost() CASCADE;
DROP FUNCTION IF EXISTS get_student_dues_summary() CASCADE;
