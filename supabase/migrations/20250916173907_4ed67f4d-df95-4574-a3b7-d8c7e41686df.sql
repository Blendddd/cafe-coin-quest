-- Create users table for game accounts
CREATE TABLE public.game_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  coin_balance INTEGER NOT NULL DEFAULT 0,
  total_coins_earned INTEGER NOT NULL DEFAULT 0,
  last_game_played TIMESTAMP WITH TIME ZONE,
  daily_coin_limit INTEGER NOT NULL DEFAULT 500,
  coins_earned_today INTEGER NOT NULL DEFAULT 0,
  last_daily_reset DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(auth_id)
);

-- Create game_sessions table to track individual game plays
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.game_users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create redemptions table for tracking food purchases
CREATE TABLE public.redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.game_users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_price INTEGER NOT NULL,
  coins_spent INTEGER NOT NULL,
  redemption_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, expired
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  redeemed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.game_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Create policies for game_users
CREATE POLICY "Users can view their own profile" 
ON public.game_users FOR SELECT 
USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile" 
ON public.game_users FOR UPDATE 
USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert their own profile" 
ON public.game_users FOR INSERT 
WITH CHECK (auth.uid() = auth_id);

-- Create policies for game_sessions
CREATE POLICY "Users can view their own game sessions" 
ON public.game_sessions FOR SELECT 
USING (auth.uid() = (SELECT auth_id FROM public.game_users WHERE id = user_id));

CREATE POLICY "Users can insert their own game sessions" 
ON public.game_sessions FOR INSERT 
WITH CHECK (auth.uid() = (SELECT auth_id FROM public.game_users WHERE id = user_id));

-- Create policies for redemptions
CREATE POLICY "Users can view their own redemptions" 
ON public.redemptions FOR SELECT 
USING (auth.uid() = (SELECT auth_id FROM public.game_users WHERE id = user_id));

CREATE POLICY "Users can insert their own redemptions" 
ON public.redemptions FOR INSERT 
WITH CHECK (auth.uid() = (SELECT auth_id FROM public.game_users WHERE id = user_id));

-- Staff can view all redemptions for verification (you can restrict this further)
CREATE POLICY "Staff can view all redemptions" 
ON public.redemptions FOR SELECT 
USING (true); -- You may want to add role-based checks here

-- Create functions for coin management
CREATE OR REPLACE FUNCTION public.award_coins(
  p_user_id UUID,
  p_game_type TEXT,
  p_score INTEGER,
  p_duration_seconds INTEGER DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_user_record public.game_users%ROWTYPE;
  v_coins_to_award INTEGER;
  v_session_id UUID;
  v_result JSON;
BEGIN
  -- Get user record
  SELECT * INTO v_user_record FROM public.game_users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Reset daily coins if it's a new day
  IF v_user_record.last_daily_reset < CURRENT_DATE THEN
    UPDATE public.game_users 
    SET coins_earned_today = 0, last_daily_reset = CURRENT_DATE 
    WHERE id = p_user_id;
    v_user_record.coins_earned_today := 0;
  END IF;
  
  -- Calculate coins based on score (1 coin per 100 points, max 50 per game)
  v_coins_to_award := LEAST(GREATEST(p_score / 100, 1), 50);
  
  -- Check daily limit
  IF v_user_record.coins_earned_today + v_coins_to_award > v_user_record.daily_coin_limit THEN
    v_coins_to_award := GREATEST(v_user_record.daily_coin_limit - v_user_record.coins_earned_today, 0);
  END IF;
  
  -- Insert game session
  INSERT INTO public.game_sessions (user_id, game_type, score, coins_earned, duration_seconds)
  VALUES (p_user_id, p_game_type, p_score, v_coins_to_award, p_duration_seconds)
  RETURNING id INTO v_session_id;
  
  -- Update user coins
  UPDATE public.game_users 
  SET 
    coin_balance = coin_balance + v_coins_to_award,
    total_coins_earned = total_coins_earned + v_coins_to_award,
    coins_earned_today = coins_earned_today + v_coins_to_award,
    last_game_played = now(),
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Return result
  SELECT json_build_object(
    'success', true,
    'coins_awarded', v_coins_to_award,
    'new_balance', coin_balance,
    'daily_coins_remaining', daily_coin_limit - coins_earned_today,
    'session_id', v_session_id
  ) INTO v_result
  FROM public.game_users WHERE id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for redemptions
CREATE OR REPLACE FUNCTION public.create_redemption(
  p_user_id UUID,
  p_item_name TEXT,
  p_coins_required INTEGER
) RETURNS JSON AS $$
DECLARE
  v_user_balance INTEGER;
  v_redemption_code TEXT;
  v_redemption_id UUID;
BEGIN
  -- Get current balance
  SELECT coin_balance INTO v_user_balance FROM public.game_users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  IF v_user_balance < p_coins_required THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient coins');
  END IF;
  
  -- Generate redemption code
  v_redemption_code := 'LN' || UPPER(substring(gen_random_uuid()::text, 1, 6));
  
  -- Create redemption
  INSERT INTO public.redemptions (user_id, item_name, item_price, coins_spent, redemption_code)
  VALUES (p_user_id, p_item_name, p_coins_required, p_coins_required, v_redemption_code)
  RETURNING id INTO v_redemption_id;
  
  -- Deduct coins
  UPDATE public.game_users 
  SET coin_balance = coin_balance - p_coins_required, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'redemption_code', v_redemption_code,
    'new_balance', (SELECT coin_balance FROM public.game_users WHERE id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_users_updated_at
  BEFORE UPDATE ON public.game_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_game_users_auth_id ON public.game_users(auth_id);
CREATE INDEX idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX idx_game_sessions_completed_at ON public.game_sessions(completed_at);
CREATE INDEX idx_redemptions_user_id ON public.redemptions(user_id);
CREATE INDEX idx_redemptions_code ON public.redemptions(redemption_code);
CREATE INDEX idx_redemptions_status ON public.redemptions(status);