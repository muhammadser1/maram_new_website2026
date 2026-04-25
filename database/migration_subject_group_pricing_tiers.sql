-- ============================================
-- Subject group pricing tiers (special subjects: 2 students = X, 3 = Y, etc.)
-- Exclude remedial (دروس علاجية) if you don't want tiers for it; tiers are optional per subject.
-- ============================================

CREATE TABLE IF NOT EXISTS subject_group_pricing_tiers (
    id SERIAL PRIMARY KEY,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    student_count INT NOT NULL CHECK (student_count >= 2),
    total_price DECIMAL(10,2) NOT NULL,
    price_per_student DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(subject_id, student_count)
);

CREATE INDEX IF NOT EXISTS idx_subject_group_tiers_subject ON subject_group_pricing_tiers(subject_id);

-- Group lesson trigger: when subject_id is set, do NOT overwrite total_cost (API sets it from tiers or subject price)
CREATE OR REPLACE FUNCTION update_group_lesson_cost()
RETURNS TRIGGER AS $$
DECLARE
    v_price_per_hour DECIMAL;
BEGIN
    IF NEW.subject_id IS NOT NULL THEN
        -- Leave total_cost as set by the application (tiers or subject price)
        RETURN NEW;
    END IF;
    NEW.total_cost := calculate_lesson_cost(NEW.education_level_id, 'group', NEW.hours);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
