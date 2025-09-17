-- Fix security linter issues

-- 1. Drop the security definer view and replace with a proper function approach
DROP VIEW IF EXISTS public.redemptions_staff_view;

-- 2. Fix function search_path issues by ensuring all functions have proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(auth.uid(), _role)
$$;

-- 3. Create a safer function for staff to get filtered redemption data
-- This avoids the security definer view issue
CREATE OR REPLACE FUNCTION public.get_staff_redemptions()
RETURNS TABLE (
    id UUID,
    item_name TEXT,
    redemption_code TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    coins_spent INTEGER,
    customer_name TEXT,
    masked_email TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
      r.id,
      r.item_name,
      r.redemption_code,
      r.status,
      r.created_at,
      r.expires_at,
      r.redeemed_at,
      r.coins_spent,
      COALESCE(gu.display_name, 'Anonymous') AS customer_name,
      CASE 
          WHEN gu.email IS NOT NULL THEN 
              SUBSTRING(gu.email FROM 1 FOR 3) || '***@' || SPLIT_PART(gu.email, '@', 2)
          ELSE 'No email'
      END AS masked_email
  FROM public.redemptions r
  LEFT JOIN public.game_users gu ON r.user_id = gu.id
  WHERE 
      -- Only allow staff/admin to call this function
      public.current_user_has_role('staff') 
      OR public.current_user_has_role('admin');
$$;

-- 4. Update the handle_new_user function to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Grant execute permission to authenticated users for the staff function
GRANT EXECUTE ON FUNCTION public.get_staff_redemptions() TO authenticated;