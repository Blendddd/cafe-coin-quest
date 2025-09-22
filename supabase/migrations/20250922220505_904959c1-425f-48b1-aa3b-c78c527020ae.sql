-- Create admin actions audit table
CREATE TABLE public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  coin_adjustment INTEGER,
  reason TEXT NOT NULL,
  old_balance INTEGER,
  new_balance INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Admin actions policies
CREATE POLICY "Admins can view all admin actions" 
ON public.admin_actions 
FOR SELECT 
USING (current_user_has_role('admin'));

CREATE POLICY "Admins can insert admin actions" 
ON public.admin_actions 
FOR INSERT 
WITH CHECK (current_user_has_role('admin'));

-- Function to adjust user coins (admin only)
CREATE OR REPLACE FUNCTION public.admin_adjust_user_coins(
  p_target_user_id UUID,
  p_coin_adjustment INTEGER,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user_id UUID;
  v_old_balance INTEGER;
  v_new_balance INTEGER;
  v_target_user_record public.game_users%ROWTYPE;
BEGIN
  -- Get current user ID
  v_admin_user_id := auth.uid();
  
  -- Check if current user is admin
  IF NOT current_user_has_role('admin') THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: Admin privileges required');
  END IF;
  
  -- Get target user record
  SELECT * INTO v_target_user_record FROM public.game_users WHERE id = p_target_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Target user not found');
  END IF;
  
  v_old_balance := v_target_user_record.coin_balance;
  v_new_balance := v_old_balance + p_coin_adjustment;
  
  -- Prevent negative balance
  IF v_new_balance < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Cannot set negative coin balance');
  END IF;
  
  -- Update user coins
  UPDATE public.game_users 
  SET 
    coin_balance = v_new_balance,
    updated_at = now()
  WHERE id = p_target_user_id;
  
  -- Log the admin action
  INSERT INTO public.admin_actions (
    admin_user_id, 
    target_user_id, 
    action_type, 
    coin_adjustment, 
    reason, 
    old_balance, 
    new_balance
  )
  VALUES (
    v_admin_user_id,
    p_target_user_id,
    'coin_adjustment',
    p_coin_adjustment,
    p_reason,
    v_old_balance,
    v_new_balance
  );
  
  RETURN json_build_object(
    'success', true,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
    'adjustment', p_coin_adjustment
  );
END;
$$;

-- Function to get all users for admin dashboard
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  coin_balance INTEGER,
  total_coins_earned INTEGER,
  coins_earned_today INTEGER,
  last_game_played TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  total_games INTEGER,
  total_redemptions INTEGER
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    gu.id,
    gu.display_name,
    gu.email,
    gu.phone,
    gu.coin_balance,
    gu.total_coins_earned,
    gu.coins_earned_today,
    gu.last_game_played,
    gu.created_at,
    COALESCE(gs.total_games, 0)::INTEGER AS total_games,
    COALESCE(r.total_redemptions, 0)::INTEGER AS total_redemptions
  FROM public.game_users gu
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_games
    FROM public.game_sessions
    GROUP BY user_id
  ) gs ON gu.id = gs.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_redemptions
    FROM public.redemptions
    GROUP BY user_id
  ) r ON gu.id = r.user_id
  WHERE 
    -- Only allow admin to call this function
    current_user_has_role('admin')
  ORDER BY gu.created_at DESC;
$$;