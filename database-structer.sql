-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.event_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id bigint NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  academic_year text,
  notes text,
  agree_to_terms boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_registrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.students (
  id integer NOT NULL DEFAULT nextval('students_id_seq'::regclass),
  student_id bigint NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying,
  academic_year character varying NOT NULL,
  field_of_study character varying NOT NULL,
  preferred_department character varying NOT NULL,
  second_choice_department character varying,
  motivation text NOT NULL,
  experience text,
  agree_to_terms boolean NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  matricule bigint UNIQUE,
  CONSTRAINT students_pkey PRIMARY KEY (id)
);