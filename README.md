# 🏥 PhysioFlow

### A full-stack clinic management system for physiotherapy — free & open source

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-physiflow.vercel.app-0ea5e9?style=for-the-badge)](https://physiflow.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Abdelrahman--Nashaat-181717?style=for-the-badge&logo=github)](https://github.com/Abdelrahman-Nashaat/physiflow)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

---

## What is PhysioFlow?

Most physiotherapy clinics still run on Excel or paper. PhysioFlow is a complete clinic management system that covers everything the doctor, secretary, and patient need — in one place. It includes an AI that automatically writes Arabic SOAP session summaries using Groq.

---

## Features

### 👨‍⚕️ Doctor
| Feature | Description |
|---|---|
| 🩺 **Full Patient Profile** | Medical history, sessions, exercises, invoices — all in one place |
| 📝 **SOAP Notes + AI** | Professional form with automatic Arabic AI summary |
| 📈 **Progress Tracking** | Pain level chart across sessions |
| 🔍 **Global Search** | Instant search across all patients and appointments |

### 👩‍💼 Secretary
| Feature | Description |
|---|---|
| 📅 **Appointment Management** | Daily calendar, confirm, reschedule, cancel |
| ⏳ **Waiting List** | Manage patients waiting for a slot |
| 💬 **Patient Messages** | Receive and reply to patient messages |
| 📊 **Daily Stats** | Quick overview of today's schedule |

### 💰 Finance
| Feature | Description |
|---|---|
| 🧾 **Invoices** | Create invoices and export PDF receipts |
| 📦 **Session Packages** | Manage patient packages and track usage |
| 📊 **Analytics** | Revenue, stats, top diagnoses |

### 📱 Patient Portal
- View upcoming appointments with live countdown
- Track home exercises
- Rate sessions
- Message the doctor

---

## Tech Stack

```
Frontend    → React 18 + Vite + Tailwind CSS + shadcn/ui
Database    → Supabase (PostgreSQL) with Row Level Security
Auth        → Supabase Auth  (role-based: doctor / secretary / patient)
AI          → Groq llama-3.3-70b via Supabase Edge Function (secure ✅)
PDF         → jsPDF + html2canvas
Charts      → Recharts
Deploy      → Vercel
```

---

## Getting Started

### Requirements
- Node.js 18+
- [Supabase](https://supabase.com) account (free)
- [Groq](https://console.groq.com) account (free)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### 1. Clone & Install

```bash
git clone https://github.com/Abdelrahman-Nashaat/physiflow.git
cd physiflow
npm install
```

### 2. Environment Variables

```bash
cp env.example .env.local
```

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ Do **not** add `GROQ_API_KEY` here — it lives in Supabase Secrets only.

### 3. Database Setup

Open **Supabase Dashboard → SQL Editor** and run the full contents of `supabase_schema.sql`.

This creates 13 tables with RLS policies ready to go ✅

### 4. Deploy the AI Edge Function

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy groq-proxy
```

Then in **Supabase Dashboard → Edge Functions → Secrets** add:
```
GROQ_API_KEY = your_groq_api_key
```

### 5. Run

```bash
npm run dev
# Open http://localhost:5173
```

---

## User Setup

### Doctor or Secretary

In **Supabase → Authentication → Users → Add user**, then set User Metadata:

```json
{ "full_name": "Dr. Ahmed", "role": "doctor" }
```
```json
{ "full_name": "Sara", "role": "secretary" }
```

### Patient

1. Create the patient record in the Patients page and copy their UUID
2. Create an Auth account for the patient
3. Set User Metadata:

```json
{
  "full_name": "Patient Name",
  "role": "patient",
  "patient_id": "UUID_from_patients_table"
}
```

### Demo Accounts

```sql
UPDATE auth.users SET raw_user_meta_data =
  '{"full_name": "Dr. Ahmed", "role": "doctor"}'::jsonb
WHERE email = 'doctor@physiflow-demo.com';

UPDATE auth.users SET raw_user_meta_data =
  '{"full_name": "Sara", "role": "secretary"}'::jsonb
WHERE email = 'secretary@physiflow-demo.com';
```

Password for all: `Demo@physiflow1`

Then open `/demo-seeder` to populate sample data.

---

## Security

- ✅ Row Level Security enabled on all 13 tables
- ✅ Groq API key stored in Supabase Secrets (never sent to the browser)
- ✅ JWT authentication on every request
- ✅ Role-based access per user type
- ✅ Patient portal scoped strictly to the logged-in patient's data

---

## Project Structure

```
physiflow/
├── src/
│   ├── api/
│   │   └── base44Client.js       # Supabase client + entity wrappers
│   ├── components/
│   │   ├── SessionNoteModal.jsx  # SOAP notes + AI summary
│   │   ├── Layout.jsx            # Sidebar & navigation
│   │   └── ...
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── PatientDetail.jsx
│   │   ├── PatientPortal.jsx
│   │   ├── SecretaryDashboard.jsx
│   │   ├── Appointments.jsx
│   │   ├── Invoices.jsx
│   │   ├── Analytics.jsx
│   │   └── ...
│   └── lib/
│       └── AuthContext.jsx       # Role-based auth context
├── supabase/
│   └── functions/
│       └── groq-proxy/           # Secure AI proxy (Edge Function)
│           └── index.ts
├── supabase_schema.sql           # 13 tables + RLS policies
├── vercel.json                   # SPA routing
└── env.example
```

---

## Roadmap

- [ ] WhatsApp appointment reminders
- [ ] Full PDF clinic reports
- [ ] Multi-clinic support
- [ ] Mobile app

---

Built with ❤️ by [Abdelrahman Nashaat](https://github.com/Abdelrahman-Nashaat)
