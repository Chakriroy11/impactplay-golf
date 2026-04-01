-- Supabase Database Schema for Golf Charity Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Charities Table
CREATE TABLE public.charities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Data for Charities
INSERT INTO public.charities (name, description, image_url) VALUES 
('Ocean Conservancy', 'Protecting the ocean from today''s greatest global challenges.', 'https://placehold.co/400x300?text=Ocean+Conservancy'),
('Local Youth Golf', 'Providing access to golf and mentorship for underprivileged youth.', 'https://placehold.co/400x300?text=Youth+Golf'),
('Global Reforestation', 'Planting trees to combat climate change and restore biodiversity.', 'https://placehold.co/400x300?text=Global+Trees');

-- 2. Users Table (Extends Supabase Auth profiles optionally, or serves as the main profile table)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'inactive',
    charity_id UUID REFERENCES public.charities(id) ON DELETE SET NULL,
    charity_contribution_percentage INTEGER DEFAULT 10 CHECK (charity_contribution_percentage >= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Scores Table (1-45 constraint)
CREATE TABLE public.scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: The 5-score limit will be enforced via the Express backend controller.

-- 4. Draws Table
CREATE TABLE public.draws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draw_month_year DATE NOT NULL,
    winning_numbers INTEGER[] CHECK (array_length(winning_numbers, 1) = 5),
    pool_size NUMERIC DEFAULT 0,
    jackpot_amount NUMERIC DEFAULT 0,
    match_4_amount NUMERIC DEFAULT 0,
    match_3_amount NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('simulated', 'published')) DEFAULT 'simulated',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Winnings Table
CREATE TABLE public.winnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    match_tier INTEGER CHECK (match_tier IN (3, 4, 5)),
    amount_won NUMERIC NOT NULL,
    proof_screenshot_url TEXT,
    payout_status TEXT CHECK (payout_status IN ('pending', 'verified', 'paid')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to automatically create a user profile when a new Supabase Auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Storage Bucket for Winner Proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('winner_proofs', 'winner_proofs', false) 
ON CONFLICT DO NOTHING;

-- Allow users to upload to their own path
CREATE POLICY "Users can upload their own proofs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'winner_proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow admins full access to proofs
CREATE POLICY "Admins full access to proofs" 
ON storage.objects FOR ALL 
USING (bucket_id = 'winner_proofs' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winnings ENABLE ROW LEVEL SECURITY;

-- 1. Charities (Public Read)
CREATE POLICY "Public charities are readable" ON public.charities FOR SELECT USING (true);

-- 2. Users (Read/Update Own Profile)
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 3. Scores (Read/Update Own Scores)
CREATE POLICY "Users can view own scores" ON public.scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scores" ON public.scores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Admin Access (Full ALL Permissions based on user role)
-- Ensures a user checking their own role can execute all if 'admin'
CREATE POLICY "Admins have full access to users" ON public.users FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admins have full access to scores" ON public.scores FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admins have full access to charities" ON public.charities FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admins have full access to draws" ON public.draws FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admins have full access to winnings" ON public.winnings FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
