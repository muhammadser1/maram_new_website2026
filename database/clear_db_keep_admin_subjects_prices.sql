-- ============================================
-- Clear DB but keep: admin user(s), subjects, education_levels, pricing
-- ============================================
-- Run this in Supabase SQL Editor.
-- Deletes: other users/teachers, students, lessons, payments.
-- Keeps: users where role = 'admin', subjects, education_levels, pricing, group_pricing_tiers, app_settings.
-- ============================================

-- 1. Child tables that reference lessons/students (delete first)
DELETE FROM group_lesson_students;

-- 2. Lesson tables
DELETE FROM group_lessons;
DELETE FROM individual_lessons;

-- 3. Payments (reference students)
DELETE FROM payments;


-- 5. Students
DELETE FROM students;

-- 6. Teachers (references users)
DELETE FROM teachers;

-- 7. Non-admin users (keep only admin)
DELETE FROM users WHERE role != 'admin';

-- ============================================
-- Done. Remaining data:
--   - users (only role = 'admin')
--   - education_levels
--   - subjects
--   - pricing
--   - group_pricing_tiers
--   - app_settings (keys unchanged, updated_by is NULL)
-- ============================================
