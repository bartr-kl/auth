-- Drop existing objects if they exist
DROP TABLE IF EXISTS public.orgs;

-- Create orgs table
CREATE TABLE public.orgs (
  id VARCHAR(50) PRIMARY KEY
    CHECK (
      LENGTH(id) >= 3 AND
      LENGTH(id) <= 50 AND
      id ~ '^[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]$'
    ),
  name TEXT NOT NULL,
  description TEXT,
  street TEXT NOT NULL,
  suite TEXT,
  city TEXT NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip VARCHAR(10) NOT NULL,
  phone VARCHAR(12) CHECK (phone ~ '^\d{3}-\d{3}-\d{4}$'),
  web_url TEXT CHECK (web_url ~ '^https?://'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to orgs
CREATE POLICY "Orgs are viewable by everyone"
  ON public.orgs
  FOR SELECT
  USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_orgs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on org changes
CREATE TRIGGER on_org_updated
  BEFORE UPDATE ON public.orgs
  FOR EACH ROW EXECUTE FUNCTION public.handle_orgs_updated_at();

-- Insert sample data
INSERT INTO public.orgs (id, name, description, street, suite, city, state, zip, phone, web_url)
VALUES
  (
    'picklr',
    'Picklr',
    'The Picklr - your home for pickleball',
    '8201 N FM 620',
    NULL,
    'Austin',
    'TX',
    '78726',
    '737-257-6035',
    'https://austinwest.thepicklr.com/'
  ),
  (
    'ranch',
    'Pickle Ranch',
    'The Pickle Ranch',
    '11000 Middle Fiskville Road',
    'Building B',
    'Austin',
    'TX',
    '78753',
    '737-242-5898',
    'https://www.austinpickleranch.com/'
  );

select * from orgs;
