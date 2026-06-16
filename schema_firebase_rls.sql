-- Supabase Firebase JWT RLS Rules & Table Updates

-- 1. Create a function to securely extract the Firebase User ID from the custom JWT
CREATE OR REPLACE FUNCTION public.firebase_uid() 
RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
    ''
  )::text;
$$ LANGUAGE sql STABLE;

-- 2. Add Salary & Location columns to existing tables
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE; -- Link to Firebase Auth User
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_in_lat NUMERIC;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_in_lng NUMERIC;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_out_lat NUMERIC;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_out_lng NUMERIC;

-- 3. Update RLS Policies to use firebase_uid() instead of auth.uid()

-- Drop old policies (if they exist from previous script)
DROP POLICY IF EXISTS "Allow individuals to read own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow individuals to insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow individuals to update own attendance" ON public.attendance;

-- Create new Firebase JWT Policies for Attendance
CREATE POLICY "Firebase: Read own attendance" ON public.attendance 
  FOR SELECT TO authenticated 
  USING (employee_id IN (SELECT id FROM public.employees WHERE firebase_uid = public.firebase_uid()));

CREATE POLICY "Firebase: Insert own attendance" ON public.attendance 
  FOR INSERT TO authenticated 
  WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE firebase_uid = public.firebase_uid()));

CREATE POLICY "Firebase: Update own attendance" ON public.attendance 
  FOR UPDATE TO authenticated 
  USING (employee_id IN (SELECT id FROM public.employees WHERE firebase_uid = public.firebase_uid()));

-- Also allow employees to only read their own profile
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.employees;

CREATE POLICY "Admin read all employees" ON public.employees
  FOR SELECT TO service_role
  USING (true);

CREATE POLICY "Firebase: Read own profile" ON public.employees
  FOR SELECT TO authenticated
  USING (firebase_uid = public.firebase_uid());
