ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cardio_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cardio_frequency text,
  ADD COLUMN IF NOT EXISTS cardio_duration text,
  ADD COLUMN IF NOT EXISTS cardio_timing text,
  ADD COLUMN IF NOT EXISTS cardio_type_preference text,
  ADD COLUMN IF NOT EXISTS ai_data_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_data_consent_at timestamp with time zone;