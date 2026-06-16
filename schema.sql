-- HAMS Supabase SQL Schema based on PRD

-- 1. Departments
CREATE TABLE public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    geo_fence_override_m INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Shifts
CREATE TABLE public.shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_minutes INTEGER DEFAULT 10,
    half_day_threshold TIME,
    total_break_limit_min INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Employees
CREATE TABLE public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT,
    department_id UUID REFERENCES public.departments(id),
    shift_id UUID REFERENCES public.shifts(id),
    is_active BOOLEAN DEFAULT true,
    face_descriptor JSONB, -- Stores the 128D array from face-api
    device_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Attendance
CREATE TABLE public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Present',
    total_work_minutes INTEGER,
    total_break_minutes INTEGER,
    is_late BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- 5. Breaks
CREATE TABLE public.breaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_id UUID REFERENCES public.attendance(id) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;

-- Allow reading all config for authenticated users
CREATE POLICY "Allow read access to authenticated users" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON public.shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON public.employees FOR SELECT TO authenticated USING (true);

-- Allow employees to read/write their own attendance
CREATE POLICY "Allow individuals to read own attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow individuals to insert own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow individuals to update own attendance" ON public.attendance FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow individuals to read own breaks" ON public.breaks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow individuals to insert own breaks" ON public.breaks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow individuals to update own breaks" ON public.breaks FOR UPDATE TO authenticated USING (true);

-- Enable Realtime
alter publication supabase_realtime add table attendance;
alter publication supabase_realtime add table breaks;
