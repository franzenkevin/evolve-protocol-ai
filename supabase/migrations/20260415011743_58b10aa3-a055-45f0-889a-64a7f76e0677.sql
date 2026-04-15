
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  age INTEGER,
  sex TEXT,
  weight NUMERIC,
  height NUMERIC,
  goal TEXT,
  activity_level TEXT,
  neat TEXT,
  training_days INTEGER,
  experience TEXT,
  gym_type TEXT,
  injuries TEXT,
  preferred_foods TEXT[],
  disliked_foods TEXT,
  allergies TEXT,
  sleep_hours NUMERIC,
  stress_level TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Protocols table
CREATE TABLE public.protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  training JSONB NOT NULL DEFAULT '{}',
  diet JSONB NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '60 days'),
  status TEXT NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own protocols" ON public.protocols FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own protocols" ON public.protocols FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own protocols" ON public.protocols FOR UPDATE USING (auth.uid() = user_id);

-- Exercises library
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  equipment TEXT,
  video_url TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exercises" ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert exercises" ON public.exercises FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update exercises" ON public.exercises FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete exercises" ON public.exercises FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Foods library
CREATE TABLE public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  calories NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view foods" ON public.foods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert foods" ON public.foods FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update foods" ON public.foods FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete foods" ON public.foods FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Check-ins table
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight NUMERIC,
  photo_front TEXT,
  photo_side TEXT,
  photo_back TEXT,
  notes TEXT,
  adherence INTEGER,
  protocol_id UUID REFERENCES public.protocols(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins" ON public.checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON public.checkins FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_protocols_updated_at BEFORE UPDATE ON public.protocols FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON public.foods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', false);

CREATE POLICY "Users can upload own photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
