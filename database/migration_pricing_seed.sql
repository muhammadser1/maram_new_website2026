-- ============================================
-- Pricing migration: seed individual, group, and specials
-- ============================================
-- Run in Supabase SQL Editor after schema (or on existing DB).
-- 1. pricing (individual + group per education level)
-- 2. group_pricing_tiers (per level, by student count 2–5)
-- 3. subjects (special lessons / دروس خاصة: رياضيات، محاسبة، فيزياء، حاسوب، دروس علاجية)
-- ============================================

-- 1. Seed pricing: individual and group per education level
--    (جامعي = individual only; others = both)
INSERT INTO pricing (education_level_id, lesson_type, price_per_hour)
SELECT id, 'individual', 
  CASE name_ar 
    WHEN 'ابتدائي' THEN 100.00 
    WHEN 'إعدادي' THEN 110.00 
    WHEN 'ثانوي' THEN 120.00 
    WHEN 'جامعي' THEN 140.00 
    ELSE 100.00 
  END
FROM education_levels
ON CONFLICT (education_level_id, lesson_type) 
DO UPDATE SET price_per_hour = EXCLUDED.price_per_hour;

INSERT INTO pricing (education_level_id, lesson_type, price_per_hour)
SELECT id, 'group', 
  CASE name_ar 
    WHEN 'ابتدائي' THEN 70.00 
    WHEN 'إعدادي' THEN 80.00 
    WHEN 'ثانوي' THEN 90.00 
    ELSE 80.00 
  END
FROM education_levels
WHERE name_ar != 'جامعي'
ON CONFLICT (education_level_id, lesson_type) 
DO UPDATE SET price_per_hour = EXCLUDED.price_per_hour;

-- 2. Seed group_pricing_tiers (per level, by student count)
--    Only for levels that have group pricing (exclude جامعي)
INSERT INTO group_pricing_tiers (education_level_id, student_count, total_price, price_per_student)
SELECT el.id, sc.n, 
  (CASE el.name_ar 
    WHEN 'ابتدائي' THEN 70.00 * sc.n 
    WHEN 'إعدادي' THEN 80.00 * sc.n 
    WHEN 'ثانوي' THEN 90.00 * sc.n 
    ELSE 80.00 * sc.n 
  END),
  (CASE el.name_ar 
    WHEN 'ابتدائي' THEN 70.00 
    WHEN 'إعدادي' THEN 80.00 
    WHEN 'ثانوي' THEN 90.00 
    ELSE 80.00 
  END)
FROM education_levels el
CROSS JOIN (SELECT 2 AS n UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) sc
WHERE el.name_ar != 'جامعي'
ON CONFLICT (education_level_id, student_count) 
DO UPDATE SET 
  total_price = EXCLUDED.total_price, 
  price_per_student = EXCLUDED.price_per_student;

-- 3. Seed subjects (special lessons / دروس خاصة – price_per_hour per subject)
--    When teacher selects a subject on a lesson, cost = subject.price_per_hour × hours
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'رياضيات للثانوي', 'Math Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 150.00
WHERE EXISTS (SELECT 1 FROM education_levels WHERE name_ar = 'ثانوي')
  AND NOT EXISTS (SELECT 1 FROM subjects WHERE name_ar = 'رياضيات للثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'محاسبة للثانوي', 'Accounting Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 140.00
WHERE EXISTS (SELECT 1 FROM education_levels WHERE name_ar = 'ثانوي')
  AND NOT EXISTS (SELECT 1 FROM subjects WHERE name_ar = 'محاسبة للثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'فيزياء للثانوي', 'Physics Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 160.00
WHERE EXISTS (SELECT 1 FROM education_levels WHERE name_ar = 'ثانوي')
  AND NOT EXISTS (SELECT 1 FROM subjects WHERE name_ar = 'فيزياء للثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'حاسوب للثانوي', 'Computer Science Secondary', (SELECT id FROM education_levels WHERE name_ar = 'ثانوي' LIMIT 1), 140.00
WHERE EXISTS (SELECT 1 FROM education_levels WHERE name_ar = 'ثانوي')
  AND NOT EXISTS (SELECT 1 FROM subjects WHERE name_ar = 'حاسوب للثانوي');
INSERT INTO subjects (name_ar, name_en, education_level_id, price_per_hour)
SELECT 'دروس علاجية متكنت', 'Remedial Lessons', NULL, 120.00
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name_ar = 'دروس علاجية متكنت');
