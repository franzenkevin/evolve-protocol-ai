-- Garante que o upsert de feedback do protocolo funcione (onConflict: user_id,protocol_id)
ALTER TABLE public.protocol_feedback
  ADD CONSTRAINT protocol_feedback_user_protocol_unique UNIQUE (user_id, protocol_id);