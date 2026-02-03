-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_location_updated ON public.locations;
DROP FUNCTION IF EXISTS public.handle_locations_updated_at();
DROP TABLE IF EXISTS public.locations cascade;

-- Create locations table
CREATE TABLE public.locations (
  id VARCHAR(50) PRIMARY KEY
    CHECK (
      LENGTH(id) >= 3 AND
      LENGTH(id) <= 50 AND
      id ~ '^[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]$'
    ),
  org_id VARCHAR(50) NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
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

-- Create index on org_id for faster lookups
CREATE INDEX idx_locations_org_id ON public.locations(org_id);

-- Enable Row Level Security
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to locations
CREATE POLICY "Locations are viewable by everyone"
  ON public.locations
  FOR SELECT
  USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on location changes
CREATE TRIGGER on_location_updated
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_locations_updated_at();

-- Insert sample data
INSERT INTO public.locations (id, org_id, name, description, street, suite, city, state, zip, phone, web_url)
VALUES
  (
    'austin-west',
    'picklr',
    'Picklr Austin West',
    'The Picklr - Austin West',
    '8201 N FM 620',
    NULL,
    'Austin',
    'TX',
    '78726',
    '737-257-6035',
    'https://austinwest.thepicklr.com/'
  ),
  (
    'round-rock',
    'picklr',
    'Picklr Round Rock',
    'The Picklr - Round Rock',
    '3021 I-35',
    'Suite 240',
    'Round Rock',
    'TX',
    '78664',
    '737-734-2225',
    'https://roundrock.thepicklr.com/'
  ),
  (
    'pickle-ranch',
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

select * from locations;
