-- =============================================================================
-- Update DUPR fields: 3 decimal places, defaults, and new 'default' type
-- Run this SQL in your Supabase SQL Editor
-- =============================================================================

-- Add 'default' to the dupr_type enum
ALTER TYPE dupr_type ADD VALUE 'default';

-- Modify DUPR score columns: DECIMAL(5,3) for 3 decimal places (2.000 to 8.000)
-- First drop the existing constraints
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_dupr_score_singles_check,
  DROP CONSTRAINT IF EXISTS profiles_dupr_score_doubles_check;

-- Update column types and add defaults
ALTER TABLE public.profiles
  ALTER COLUMN dupr_score_singles TYPE DECIMAL(5,3),
  ALTER COLUMN dupr_score_singles SET DEFAULT 2.000,
  ALTER COLUMN dupr_score_singles SET NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN dupr_score_doubles TYPE DECIMAL(5,3),
  ALTER COLUMN dupr_score_doubles SET DEFAULT 2.000,
  ALTER COLUMN dupr_score_doubles SET NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN dupr_type SET DEFAULT 'default',
  ALTER COLUMN dupr_type SET NOT NULL;

-- Add new check constraints for the updated range
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_dupr_score_singles_check
    CHECK (dupr_score_singles >= 2.000 AND dupr_score_singles <= 8.000);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_dupr_score_doubles_check
    CHECK (dupr_score_doubles >= 2.000 AND dupr_score_doubles <= 8.000);

-- Update existing NULL values to defaults before constraints apply
UPDATE public.profiles
SET
  dupr_score_singles = COALESCE(dupr_score_singles, 2.000),
  dupr_score_doubles = COALESCE(dupr_score_doubles, 2.000),
  dupr_type = COALESCE(dupr_type, 'default')
WHERE dupr_score_singles IS NULL
   OR dupr_score_doubles IS NULL
   OR dupr_type IS NULL;
