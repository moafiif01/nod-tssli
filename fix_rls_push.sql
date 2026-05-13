-- Run this in your Supabase SQL Editor to fix the notification permissions

-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON push_subscriptions;

-- Allow any authenticated user to read all subscriptions (needed for server-side push)
-- The security is enforced by the API route itself (only sending to the right user)
CREATE POLICY "Authenticated users can read subscriptions"
ON push_subscriptions FOR SELECT
TO authenticated
USING (true);
