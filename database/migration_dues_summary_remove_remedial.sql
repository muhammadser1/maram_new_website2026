-- Remove remedial_lessons from dues summary (remedial table removed; special lessons use subjects on individual/group).
-- Run after migration_student_dues_summary.sql. Replaces get_student_dues_summary().

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
  ORDER BY (COALESCE(ind.due, 0) + COALESCE(grp.due, 0) - COALESCE(pay.paid, 0)) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;
