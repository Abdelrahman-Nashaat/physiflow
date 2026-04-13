-- =============================================
-- فيزيوفلو - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PATIENTS
-- =============================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  national_id TEXT,
  address TEXT,
  diagnosis TEXT,
  medical_history TEXT,
  referred_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  total_sessions_prescribed INTEGER,
  sessions_completed INTEGER DEFAULT 0,
  next_appointment TEXT,
  notes TEXT,
  emergency_contact TEXT,
  email TEXT
);

-- =============================================
-- APPOINTMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 45,
  type TEXT DEFAULT 'followup' CHECK (type IN ('initial', 'followup', 'final')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  session_number INTEGER,
  notes TEXT,
  exercises_assigned TEXT,
  pain_level_before INTEGER,
  pain_level_after INTEGER,
  techniques_used TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  patient_rating INTEGER
);

-- =============================================
-- SESSION NOTES
-- =============================================
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  session_date TEXT NOT NULL,
  session_number INTEGER,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  exercises TEXT,
  pain_before INTEGER,
  pain_after INTEGER,
  progress_rating TEXT CHECK (progress_rating IN ('excellent', 'good', 'fair', 'poor')),
  ai_summary TEXT
);

-- =============================================
-- INVOICES
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  date TEXT NOT NULL,
  sessions_count INTEGER,
  price_per_session NUMERIC,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  remaining NUMERIC,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  notes TEXT
);

-- =============================================
-- EXERCISE TEMPLATES
-- =============================================
CREATE TABLE IF NOT EXISTS exercise_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('spine', 'knee', 'shoulder', 'hip', 'ankle', 'neck', 'general')),
  description TEXT,
  instructions TEXT,
  sets INTEGER,
  reps INTEGER,
  duration_seconds INTEGER,
  frequency TEXT,
  precautions TEXT,
  image_url TEXT
);

-- =============================================
-- SOAP TEMPLATES
-- =============================================
CREATE TABLE IF NOT EXISTS soap_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('spine', 'knee', 'shoulder', 'hip', 'ankle', 'neck', 'general')),
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  exercises TEXT
);

-- =============================================
-- TREATMENT PLANS
-- =============================================
CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  goal TEXT NOT NULL,
  planned_sessions INTEGER,
  start_date TEXT,
  expected_end_date TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused'))
);

-- =============================================
-- HOME EXERCISE LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS home_exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  log_date TEXT NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'missed')),
  logged_by TEXT DEFAULT 'doctor' CHECK (logged_by IN ('patient', 'doctor', 'secretary')),
  notes TEXT
);

-- =============================================
-- PATIENT MESSAGES
-- =============================================
CREATE TABLE IF NOT EXISTS patient_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  message TEXT NOT NULL,
  reply TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'replied'))
);

-- =============================================
-- CLINIC SETTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  clinic_name TEXT NOT NULL,
  doctor_name TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  working_hours TEXT,
  default_session_price NUMERIC,
  initial_session_price NUMERIC,
  final_session_price NUMERIC
);

-- =============================================
-- TREATMENT PACKAGES
-- =============================================
CREATE TABLE IF NOT EXISTS treatment_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  package_name TEXT NOT NULL,
  sessions_count INTEGER NOT NULL,
  sessions_used INTEGER DEFAULT 0,
  price NUMERIC NOT NULL,
  start_date TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired'))
);

-- =============================================
-- WAITING LIST
-- =============================================
CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_date TEXT,
  preferred_time TEXT,
  notes TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'scheduled', 'cancelled'))
);

-- =============================================
-- EXERCISE COMPLETIONS
-- =============================================
CREATE TABLE IF NOT EXISTS exercise_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE
);

-- =============================================
-- DISABLE RLS (for single-clinic use)
-- You can enable it later with proper policies
-- =============================================
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE soap_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE home_exercise_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_completions DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Done! 13 tables created successfully.
-- =============================================

-- =============================================
-- ROW LEVEL SECURITY — تأمين البيانات
-- =============================================
-- سياسة بسيطة: أي مستخدم مسجّل (authenticated) يقدر يقرأ ويكتب
-- مناسب لعيادة واحدة عندها دكتور وسكرتيرة وموظفين موثوقين
-- لو عايز تقيّد أكتر (مثلاً: المريض يشوف بياناته بس) راجع الـ README

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE soap_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;

-- Policy: الـ authenticated users (دكتور / سكرتيرة) عندهم full access
CREATE POLICY "authenticated full access" ON patients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON appointments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON session_notes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON invoices
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON exercise_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON soap_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON treatment_plans
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON home_exercise_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON patient_messages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON clinic_settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON treatment_packages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON waiting_list
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated full access" ON exercise_completions
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- انتهى! المشروع آمن دلوقتي ✅
-- =============================================
