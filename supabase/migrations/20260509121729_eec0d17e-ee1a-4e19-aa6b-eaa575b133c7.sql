ALTER TABLE public.user_roles DISABLE TRIGGER USER;
INSERT INTO public.user_roles (user_id, role) VALUES ('865cbc7f-1548-4391-9b08-5e301a145133', 'admin') ON CONFLICT (user_id, role) DO NOTHING;
ALTER TABLE public.user_roles ENABLE TRIGGER USER;