// =============================================
// base44Client.js - Supabase Replacement
// Same API as Base44 → zero changes in pages
// =============================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Map Base44 entity names → Supabase table names
const TABLE_MAP = {
  Patient: 'patients',
  Appointment: 'appointments',
  SessionNote: 'session_notes',
  Invoice: 'invoices',
  ExerciseTemplate: 'exercise_templates',
  SoapTemplate: 'soap_templates',
  TreatmentPlan: 'treatment_plans',
  HomeExerciseLog: 'home_exercise_logs',
  PatientMessage: 'patient_messages',
  ClinicSettings: 'clinic_settings',
  TreatmentPackage: 'treatment_packages',
  WaitingList: 'waiting_list',
  ExerciseCompletion: 'exercise_completions',
};

// Parse sort field: "-created_date" → { field: "created_at", ascending: false }
function parseSort(sortField) {
  if (!sortField) return { field: 'created_at', ascending: false };
  
  const isDesc = sortField.startsWith('-');
  let field = isDesc ? sortField.slice(1) : sortField;
  
  // Map Base44 field names to Supabase
  const fieldMap = {
    'created_date': 'created_at',
    'date': 'date',
    'time': 'time',
    'session_date': 'session_date',
    'session_number': 'session_number',
  };
  
  field = fieldMap[field] || field;
  return { field, ascending: !isDesc };
}

// Create entity wrapper with same API as Base44
function createEntityWrapper(entityName) {
  const table = TABLE_MAP[entityName];
  if (!table) throw new Error(`Unknown entity: ${entityName}`);

  return {
    // list(sortField, limit)
    async list(sortField = '-created_at', limit = 500) {
      const { field, ascending } = parseSort(sortField);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(field, { ascending })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data || [];
    },

    // filter(filters, sortField, limit)
    async filter(filters = {}, sortField = '-created_at', limit = 100) {
      const { field, ascending } = parseSort(sortField);
      let query = supabase.from(table).select('*');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
      
      const { data, error } = await query
        .order(field, { ascending })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data || [];
    },

    // create(data) → returns created record
    async create(data) {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return result;
    },

    // update(id, data) → returns updated record
    async update(id, data) {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return result;
    },

    // delete(id)
    async delete(id) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    },
  };
}

// AI Integration using Groq (replaces base44.integrations.Core.InvokeLLM)
const integrations = {
  Core: {
    async InvokeLLM({ prompt }) {
      const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
      
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Groq API error');
      }
      
      const data = await res.json();
      return data.choices[0]?.message?.content || '';
    },
  },
};

// Auth (simple role-based using Supabase Auth)
const auth = {
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      role: user.user_metadata?.role || 'doctor',
    };
  },
  
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },
  
  async logout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  },
  
  redirectToLogin() {
    window.location.href = '/login';
  },
};

// =============================================
// Main export - same interface as Base44
// =============================================
export const base44 = {
  entities: new Proxy({}, {
    get(_, entityName) {
      return createEntityWrapper(entityName);
    },
  }),
  integrations,
  auth,
};

export default base44;
