-- Revoke blanket UPDATE permissions for authenticated users on the users table
REVOKE UPDATE ON public.users FROM authenticated;

-- Grant UPDATE permissions ONLY on specific columns that users are allowed to change
GRANT UPDATE (full_name, university) ON public.users TO authenticated;
