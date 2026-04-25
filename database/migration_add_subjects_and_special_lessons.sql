-- Migration: Special subjects with their own prices
-- When teacher submits a "regular" lesson → price from pricing table (education_level + lesson_type).
-- When teacher selects "special lesson" and a subject → price from subjects table (subject's price_per_hour).
-- Run in Supabase SQL Editor after schema and existing migrations.

-- 1. Create subjects table (special subjects: رياضيات، محاسبة، فيزياء للثانوي، دروس علاجية، etc.)
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(120) NOT NULL,
    name_en VARCHAR(120),
    education_level_id INT REFERENCES education_levels(id) ON DELETE SET NULL,
    price_per_hour DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_education_level ON subjects(education_level_id);

-- 2. Add جامعي if not present
INSERT INTO education_levels (name_ar, name_en)
SELECT 'جامعي', 'University'
WHERE NOT EXISTS (SELECT 1 FROM education_levels WHERE name_ar = 'جامعي');

-- 3. Add subject_id to lesson tables (NULL = regular lesson, set = special lesson)
ALTER TABLE individual_lessons
ADD COLUMN IF NOT EXISTS subject_id INT REFERENCES subjects(id) ON DELETE SET NULL;

ALTER TABLE group_lessons
ADD COLUMN IF NOT EXISTS subject_id INT REFERENCES subjects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_individual_lessons_subject ON individual_lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_group_lessons_subject ON group_lessons(subject_id);

-- 4. Trigger: use subject price when subject_id is set, else use regular pricing
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

-- 5. Seed example special subjects (run once; admin can add more via app/settings later)
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'رياضيات للثانوي', 'Math Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 150.00
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name_ar = 'رياضيات للثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'محاسبة للثانوي', 'Accounting Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 140.00
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name_ar = 'محاسبة للثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'فيزياء للثانوي', 'Physics Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 160.00
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name_ar = 'فيزياء للثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'حاسوب للثانوي', 'Computer Science Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 140.00
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name_ar = 'حاسوب للثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'دروس علاجية متكنت', 'Remedial Lessons', NULL, 120.00
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name_ar = 'دروس علاجية متكنت');
