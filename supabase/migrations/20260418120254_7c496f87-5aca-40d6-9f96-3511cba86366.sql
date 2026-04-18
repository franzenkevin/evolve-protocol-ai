-- Phase 2: body emphasis field for protocol generation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS body_emphasis text;

COMMENT ON COLUMN public.profiles.body_emphasis IS 'User-requested body emphasis for AI protocol generation. NULL = let AI decide based on assessment. Otherwise free-text describing focus areas (ex: "quero priorizar glúteo e posterior de coxa").';