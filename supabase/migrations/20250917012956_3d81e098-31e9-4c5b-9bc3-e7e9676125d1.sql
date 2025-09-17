-- Create user roles system to fix security vulnerability
-- 1. Create an enum for application roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user');

-- 2. Create user_roles table to manage user permissions
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create function to check if current user has role
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), _role)
$$;

-- 5. RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.current_user_has_role('admin'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.current_user_has_role('admin'))
WITH CHECK (public.current_user_has_role('admin'));

-- 6. Update the problematic redemptions policy to use proper role checking
DROP POLICY IF EXISTS "Staff can view all redemptions" ON public.redemptions;

-- Create new secure policy that only allows staff/admin to view redemptions
CREATE POLICY "Staff and admins can view redemptions for verification"
ON public.redemptions
FOR SELECT
TO authenticated
USING (
  -- Users can see their own redemptions
  auth.uid() = (SELECT auth_id FROM public.game_users WHERE id = redemptions.user_id)
  OR 
  -- Staff and admins can see all redemptions for verification purposes
  public.current_user_has_role('staff') 
  OR 
  public.current_user_has_role('admin')
);

-- 7. Create a staff-focused view that limits exposed data
CREATE OR REPLACE VIEW public.redemptions_staff_view AS
SELECT 
    r.id,
    r.item_name,
    r.redemption_code,
    r.status,
    r.created_at,
    r.expires_at,
    r.redeemed_at,
    r.coins_spent,
    -- Only expose limited user info for staff
    COALESCE(gu.display_name, 'Anonymous') AS customer_name,
    CASE 
        WHEN gu.email IS NOT NULL THEN 
            SUBSTRING(gu.email FROM 1 FOR 3) || '***@' || SPLIT_PART(gu.email, '@', 2)
        ELSE 'No email'
    END AS masked_email
FROM public.redemptions r
LEFT JOIN public.game_users gu ON r.user_id = gu.id
WHERE 
    -- Only show to staff/admin users
    public.current_user_has_role('staff') 
    OR public.current_user_has_role('admin');

-- Grant access to the view
GRANT SELECT ON public.redemptions_staff_view TO authenticated;

-- 8. Add trigger to automatically assign 'user' role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (this will run when users sign up)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();