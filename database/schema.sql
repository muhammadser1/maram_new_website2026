-- ============================================
-- Institute Management System - Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Drop existing tables to avoid conflicts when re-running the schema
DROP TABLE IF EXISTS group_lesson_students CASCADE;
DROP TABLE IF EXISTS group_lessons CASCADE;
DROP TABLE IF EXISTS individual_lessons CASCADE;
DROP TABLE IF EXISTS group_pricing_tiers CASCADE;
DROP TABLE IF EXISTS pricing CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS education_levels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
-- Handles all login and authentication logic
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'subAdmin', 'teacher')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 1b. App settings (admin-configurable keys)
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by INT REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
INSERT INTO app_settings (key, value, description) VALUES
  ('teachers_can_add_students', 'true', 'السماح للمعلمين بإضافة طلاب جدد')
ON CONFLICT (key) DO NOTHING;

-- 2. Teachers Table
-- Links each teacher to their user account and stores contact info
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Education Levels Table
-- Reusable for lessons, pricing, and student categorization (ابتدائي، إعدادي، ثانوي، جامعي)
CREATE TABLE IF NOT EXISTS education_levels (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(50) NOT NULL,  -- e.g. 'ابتدائي'
    name_en VARCHAR(50) NOT NULL,   -- e.g. 'Elementary'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3b. Subjects Table (special subjects with their own price: رياضيات، محاسبة، فيزياء، دروس علاجية، etc.)
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(120) NOT NULL,
    name_en VARCHAR(120),
    education_level_id INT REFERENCES education_levels(id) ON DELETE SET NULL,
    price_per_hour DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Students Table
-- Student list linked to education level (not users, since no login)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    parent_contact VARCHAR(100),
    education_level_id INT REFERENCES education_levels(id),
    class VARCHAR(50),  -- Class/grade (e.g., 'أول', 'ثاني', 'ثالث', etc.)
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,   -- soft delete
    deletion_note TEXT NULL,     -- admin note for why deleted
    created_by_teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL
);

-- Ensure student names stay unique system-wide
DO $$
BEGIN
    ALTER TABLE students
        ADD CONSTRAINT students_full_name_unique UNIQUE (full_name);
EXCEPTION
    WHEN duplicate_object THEN
        -- constraint already exists, ignore
        NULL;
END $$;

-- 5. Pricing Table
-- Defines prices for education level and lesson type combinations
CREATE TABLE IF NOT EXISTS pricing (
    id SERIAL PRIMARY KEY,
    education_level_id INT REFERENCES education_levels(id),
    lesson_type VARCHAR(20) NOT NULL CHECK (lesson_type IN ('individual', 'group')),
    price_per_hour DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(education_level_id, lesson_type)
);

-- 5b. Group Pricing Tiers
-- Allows variable group lesson pricing based on student count
CREATE TABLE IF NOT EXISTS group_pricing_tiers (
    id SERIAL PRIMARY KEY,
    education_level_id INT REFERENCES education_levels(id) ON DELETE CASCADE,
    student_count INT NOT NULL CHECK (student_count >= 2),
    total_price DECIMAL(10,2) NOT NULL,
    price_per_student DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(education_level_id, student_count)
);

-- 6. Individual Lessons Table
CREATE TABLE IF NOT EXISTS individual_lessons (
    id SERIAL PRIMARY KEY,
    teacher_id INT REFERENCES teachers(id),
    student_id INT REFERENCES students(id),
    education_level_id INT REFERENCES education_levels(id),
    subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,  -- NULL = regular price, set = special subject price
    date DATE NOT NULL,
    start_time TIME,  -- Lesson start time (10:00 to 23:00 in 15-minute intervals)
    hours DECIMAL(4,2) NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    total_cost DECIMAL(10,2),
    price_locked BOOLEAN DEFAULT FALSE,  -- Prevents cost recalculation when pricing changes
    seeded_by_script BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,   -- soft delete
    deletion_note TEXT NULL      -- admin note for why deleted
);

-- 7. Group Lessons Table
CREATE TABLE IF NOT EXISTS group_lessons (
    id SERIAL PRIMARY KEY,
    teacher_id INT REFERENCES teachers(id),
    education_level_id INT REFERENCES education_levels(id),
    subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,  -- NULL = regular price, set = special subject price
    date DATE NOT NULL,
    start_time TIME,  -- Lesson start time (10:00 to 23:00 in 15-minute intervals)
    hours DECIMAL(4,2) NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    total_cost DECIMAL(10,2),
    price_locked BOOLEAN DEFAULT FALSE,  -- Prevents cost recalculation when pricing changes
    seeded_by_script BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,   -- soft delete
    deletion_note TEXT NULL      -- admin note for why deleted
);

-- 8. Group Lesson Students (many-to-many between group lessons and students)
CREATE TABLE IF NOT EXISTS group_lesson_students (
    group_lesson_id INT REFERENCES group_lessons(id) ON DELETE CASCADE,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    seeded_by_script BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (group_lesson_id, student_id)
);

-- 9. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Create Indexes for Better Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_students_education_level ON students(education_level_id);
CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON students(deleted_at);
CREATE INDEX IF NOT EXISTS idx_students_created_by_teacher ON students(created_by_teacher_id);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_teacher ON individual_lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_student ON individual_lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_date ON individual_lessons(date);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_approved ON individual_lessons(approved);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_start_time ON individual_lessons(start_time);
CREATE INDEX IF NOT EXISTS idx_group_lessons_teacher ON group_lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_group_lessons_date ON group_lessons(date);
CREATE INDEX IF NOT EXISTS idx_group_lessons_approved ON group_lessons(approved);
CREATE INDEX IF NOT EXISTS idx_group_lessons_start_time ON group_lessons(start_time);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_pricing_level_type ON pricing(education_level_id, lesson_type);
CREATE INDEX IF NOT EXISTS idx_subjects_education_level ON subjects(education_level_id);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_subject ON individual_lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_group_lessons_subject ON group_lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_deleted_at ON individual_lessons(deleted_at);
CREATE INDEX IF NOT EXISTS idx_group_lessons_deleted_at ON group_lessons(deleted_at);

-- ============================================
-- Initial Data
-- ============================================

-- Insert Education Levels (ابتدائي، إعدادي، ثانوي، جامعي)
INSERT INTO education_levels (name_ar, name_en) VALUES
('ابتدائي', 'Elementary'),
('إعدادي', 'Middle'),
('ثانوي', 'Secondary'),
('جامعي', 'University');

-- Insert an initial admin account (update credentials before production)
INSERT INTO users (username, password_hash, role, is_active)
VALUES (
    'admin',
    '$2a$10$D/VBppQglR2KSZAGa14ltrNUcPt7T9yx4ZqzM0JpkZ5CA4Qjdf6OO', -- bcrypt hash for 'admin123'
    'admin',
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Seed example special subjects (admin can add more later)
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'رياضيات للثانوي', 'Math Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 150.00
WHERE EXISTS (SELECT 1 FROM education_levels WHERE name_ar = 'ثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'محاسبة للثانوي', 'Accounting Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 140.00
WHERE EXISTS (SELECT 1 FROM education_levels WHERE name_ar = 'ثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'فيزياء للثانوي', 'Physics Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 160.00
WHERE EXISTS (SELECT 1 FROM education_levels WHERE name_ar = 'ثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'حاسوب للثانوي', 'Computer Science Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 140.00
WHERE EXISTS (SELECT 1 FROM education_levels WHERE name_ar = 'ثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
VALUES ('دروس علاجية متكنت', 'Remedial Lessons', NULL, 120.00);

-- ============================================
-- Optional: Create a function to calculate lesson cost
-- ============================================

CREATE OR REPLACE FUNCTION calculate_lesson_cost(
    p_education_level_id INT,
    p_lesson_type VARCHAR,
    p_hours DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_price_per_hour DECIMAL;
BEGIN
    SELECT price_per_hour INTO v_price_per_hour
    FROM pricing
    WHERE education_level_id = p_education_level_id
    AND lesson_type = p_lesson_type;
    
    IF v_price_per_hour IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN v_price_per_hour * p_hours;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Optional: Create a trigger to auto-calculate lesson cost
-- ============================================

-- Trigger for individual lessons (use subject price when subject_id set, else regular pricing)
CREATE OR REPLACE FUNCTION update_individual_lesson_cost()
RETURNS TRIGGER AS $$
DECLARE
    v_price_per_hour DECIMAL;
BEGIN
    IF NEW.subject_id IS NOT NULL THEN
        SELECT price_per_hour INTO v_price_per_hour FROM subjects WHERE id = NEW.subject_id;
        IF v_price_per_hour IS NOT NULL THEN
            NEW.total_cost := v_price_per_hour * NEW.hours;
            RETURN NEW;
        END IF;
    END IF;
    NEW.total_cost := calculate_lesson_cost(NEW.education_level_id, 'individual', NEW.hours);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_individual_lesson_cost
BEFORE INSERT OR UPDATE ON individual_lessons
FOR EACH ROW
EXECUTE FUNCTION update_individual_lesson_cost();

-- Trigger for group lessons (use subject price when subject_id set, else regular pricing)
CREATE OR REPLACE FUNCTION update_group_lesson_cost()
RETURNS TRIGGER AS $$
DECLARE
    v_price_per_hour DECIMAL;
BEGIN
    IF NEW.subject_id IS NOT NULL THEN
        SELECT price_per_hour INTO v_price_per_hour FROM subjects WHERE id = NEW.subject_id;
        IF v_price_per_hour IS NOT NULL THEN
            NEW.total_cost := v_price_per_hour * NEW.hours;
            RETURN NEW;
        END IF;
    END IF;
    NEW.total_cost := calculate_lesson_cost(NEW.education_level_id, 'group', NEW.hours);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_lesson_cost
BEFORE INSERT OR UPDATE ON group_lessons
FOR EACH ROW
EXECUTE FUNCTION update_group_lesson_cost();

-- ============================================
-- Dues summary for payments dashboard (RPC)
-- ============================================
CREATE OR REPLACE FUNCTION get_student_dues_summary()
RETURNS TABLE (
  student_id INT,
  student_name VARCHAR(120),
  level_name VARCHAR(50),
  individual_due DECIMAL,
  group_due DECIMAL,
  remedial_due DECIMAL,
  total_due DECIMAL,
  total_paid DECIMAL,
  remaining DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH
  ind AS (
    SELECT il.student_id, COALESCE(SUM(il.total_cost), 0)::DECIMAL AS due
    FROM public.individual_lessons il
    WHERE il.approved = true
      AND (il.deleted_at IS NULL)
      AND COALESCE(il.total_cost, 0) > 0
    GROUP BY il.student_id
  ),
  grp AS (
    SELECT gls.student_id,
           COALESCE(SUM((gl.total_cost)::DECIMAL / NULLIF(cnt.c, 0)), 0)::DECIMAL AS due
    FROM public.group_lessons gl
    INNER JOIN (
      SELECT group_lesson_id, COUNT(*)::numeric AS c
      FROM public.group_lesson_students
      GROUP BY group_lesson_id
    ) cnt ON cnt.group_lesson_id = gl.id
    INNER JOIN public.group_lesson_students gls ON gls.group_lesson_id = gl.id
    WHERE gl.approved = true
      AND (gl.deleted_at IS NULL)
      AND COALESCE(gl.total_cost, 0) > 0
    GROUP BY gls.student_id
  ),
  pay AS (
    SELECT p.student_id, COALESCE(SUM(p.amount), 0)::DECIMAL AS paid
    FROM public.payments p
    GROUP BY p.student_id
  )
  SELECT
    s.id,
    s.full_name::VARCHAR(120),
    COALESCE(el.name_ar, 'غير محدد')::VARCHAR(50),
    COALESCE(ind.due, 0),
    COALESCE(grp.due, 0),
    0::DECIMAL,
    (COALESCE(ind.due, 0) + COALESCE(grp.due, 0)),
    COALESCE(pay.paid, 0),
    (COALESCE(ind.due, 0) + COALESCE(grp.due, 0) - COALESCE(pay.paid, 0))
  FROM public.students s
  LEFT JOIN public.education_levels el ON el.id = s.education_level_id
  LEFT JOIN ind ON ind.student_id = s.id
  LEFT JOIN grp ON grp.student_id = s.id
  LEFT JOIN pay ON pay.student_id = s.id
  WHERE (s.deleted_at IS NULL)
  ORDER BY (COALESCE(ind.due, 0) + COALESCE(grp.due, 0) - COALESCE(pay.paid, 0)) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Seed pricing (individual, group, group tiers)
-- ============================================
INSERT INTO pricing (education_level_id, lesson_type, price_per_hour)
SELECT id, 'individual',
  CASE name_ar WHEN 'ابتدائي' THEN 100.00 WHEN 'إعدادي' THEN 110.00 WHEN 'ثانوي' THEN 120.00 WHEN 'جامعي' THEN 140.00 ELSE 100.00 END
FROM education_levels
ON CONFLICT (education_level_id, lesson_type) DO UPDATE SET price_per_hour = EXCLUDED.price_per_hour;

INSERT INTO pricing (education_level_id, lesson_type, price_per_hour)
SELECT id, 'group',
  CASE name_ar WHEN 'ابتدائي' THEN 70.00 WHEN 'إعدادي' THEN 80.00 WHEN 'ثانوي' THEN 90.00 ELSE 80.00 END
FROM education_levels
WHERE name_ar != 'جامعي'
ON CONFLICT (education_level_id, lesson_type) DO UPDATE SET price_per_hour = EXCLUDED.price_per_hour;

INSERT INTO group_pricing_tiers (education_level_id, student_count, total_price, price_per_student)
SELECT el.id, sc.n,
  (CASE el.name_ar WHEN 'ابتدائي' THEN 70.00 * sc.n WHEN 'إعدادي' THEN 80.00 * sc.n WHEN 'ثانوي' THEN 90.00 * sc.n ELSE 80.00 * sc.n END),
  (CASE el.name_ar WHEN 'ابتدائي' THEN 70.00 WHEN 'إعدادي' THEN 80.00 WHEN 'ثانوي' THEN 90.00 ELSE 80.00 END)
FROM education_levels el
CROSS JOIN (SELECT 2 AS n UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) sc
WHERE el.name_ar != 'جامعي'
ON CONFLICT (education_level_id, student_count) DO UPDATE SET total_price = EXCLUDED.total_price, price_per_student = EXCLUDED.price_per_student;

-- ============================================
-- End of Schema
-- ============================================

