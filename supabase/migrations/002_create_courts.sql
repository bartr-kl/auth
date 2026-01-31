-- =============================================================================
-- Courts Table Setup
-- Run this SQL in your Supabase SQL Editor
-- =============================================================================

-- Create custom type for court type
CREATE TYPE court_type AS ENUM ('indoor', 'outdoor', 'covered');

-- Create courts table
CREATE TABLE public.courts (
  court_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type court_type DEFAULT 'indoor' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Row Level Security Policies
-- =============================================================================

-- Everyone can view courts
CREATE POLICY "Anyone can view courts"
  ON public.courts
  FOR SELECT
  USING (true);

-- Only admins can insert courts
CREATE POLICY "Admins can insert courts"
  ON public.courts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can update courts
CREATE POLICY "Admins can update courts"
  ON public.courts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can delete courts
CREATE POLICY "Admins can delete courts"
  ON public.courts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =============================================================================
-- Trigger for updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_courts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courts_updated_at
  BEFORE UPDATE ON public.courts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_courts_updated_at();

-- =============================================================================
-- Sample Data
-- =============================================================================

INSERT INTO public.courts (name, description, type) VALUES
  ('Court 1', 'Court 1', 'indoor'),
  ('Court 2', 'Court 2', 'indoor'),
  ('Court 3', 'Court 3', 'indoor'),
  ('Court 4', 'Court 4', 'indoor'),
  ('Court 5', 'Court 5', 'indoor'),
  ('Court 6', 'Court 6', 'indoor'),
  ('Court 7', 'Court 7', 'indoor'),
  ('Court 8', 'Court 8', 'indoor'),
  ('Court 9', 'Court 9', 'indoor'),
  ('Court 10', 'Court 10', 'indoor'),
  ('Court 11', 'Court 11', 'indoor');
