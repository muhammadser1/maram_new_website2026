-- Secretary role + work hours table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  (role)::text = ANY (
    (ARRAY[
      'admin'::character varying,
      'subAdmin'::character varying,
      'teacher'::character varying,
      'secretary'::character varying
    ])::text[]
  )
);

CREATE SEQUENCE IF NOT EXISTS secretary_hours_id_seq;

CREATE TABLE IF NOT EXISTS secretary_hours (
  id integer NOT NULL DEFAULT nextval('secretary_hours_id_seq'::regclass),
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  hours numeric(4,2) NOT NULL,
  note text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT secretary_hours_pkey PRIMARY KEY (id),
  CONSTRAINT secretary_hours_hours_check CHECK (hours > 0)
);

ALTER SEQUENCE secretary_hours_id_seq OWNED BY secretary_hours.id;

CREATE INDEX IF NOT EXISTS idx_secretary_hours_user_id ON public.secretary_hours USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_secretary_hours_work_date ON public.secretary_hours USING btree (work_date);
