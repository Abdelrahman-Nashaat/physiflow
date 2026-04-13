<div dir="rtl">

# 🏥 فيزيوفلو — نظام إدارة عيادة العلاج الطبيعي

نظام متكامل لإدارة عيادات العلاج الطبيعي مبني بـ React + Supabase + Groq AI

---

## ✨ المميزات

| المميزة | الوصف |
|---|---|
| 🩺 **ملف المريض الكامل** | تاريخ طبي، جلسات، تمارين، فواتير |
| 📅 **إدارة المواعيد** | تقويم أسبوعي، تأكيد، تأجيل، قائمة انتظار |
| 📝 **جلسات SOAP** | نموذج احترافي + ملخص AI تلقائي بالعربي |
| 📈 **تتبع التقدم** | رسم بياني للألم عبر الجلسات |
| 💰 **الفواتير والباقات** | إيصالات PDF، باقات جلسات، تقارير مالية |
| 📱 **بوابة المريض** | مواعيد، تمارين، تقدم، رسائل |
| 👩‍💼 **لوحة السكرتيرة** | جدول اليوم، مهام عاجلة، إحصائيات |
| 📊 **Analytics** | إيرادات، إحصائيات، تشخيصات شائعة |

---

## 🛠️ التقنيات

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL) مع RLS مفعّل
- **Auth:** Supabase Auth
- **AI:** Groq API عبر Supabase Edge Function (آمن)
- **PDF:** jsPDF + html2canvas
- **Charts:** Recharts

---

## 🚀 تشغيل المشروع

### الخطوة 1: قاعدة البيانات

1. افتح Supabase Dashboard → SQL Editor
2. شغّل محتوى `supabase_schema.sql` كامل
3. هتشوف Success — 13 table + RLS policies

### الخطوة 2: نشر Edge Function للـ AI

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy groq-proxy
```

ثم في Supabase Dashboard → Edge Functions → groq-proxy → Secrets أضف:
```
GROQ_API_KEY = your_groq_api_key
```

### الخطوة 3: ملف `.env.local`

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

لا تضع GROQ_API_KEY هنا — تبقى في Supabase Secrets فقط.

### الخطوة 4: تشغيل

```bash
npm install
npm run dev
```

---

## 👥 إضافة المستخدمين

### دكتور / سكرتيرة

User Metadata في Supabase Auth:
```json
{ "full_name": "د. أحمد محمد", "role": "doctor" }
```

### مريض

1. أنشئ ملف المريض في Patients وخذ الـ UUID
2. أنشئ حساب Auth للمريض
3. User Metadata:
```json
{ "full_name": "محمود علي", "role": "patient", "patient_id": "UUID_هنا" }
```

---

## 🔒 الأمان

- RLS مفعّل على كل الجداول
- Groq API key على السيرفر فقط (Edge Function)
- المريض يشوف بياناته فقط عبر patient_id

---

## 📁 هيكل المشروع

```
physiflow/
├── src/
│   ├── api/           # Supabase client
│   ├── components/    # مكونات قابلة للإعادة
│   ├── pages/         # صفحات التطبيق
│   └── lib/           # Auth context
├── supabase/
│   └── functions/
│       └── groq-proxy/  # Edge Function للـ AI
├── supabase_schema.sql
└── vercel.json
```

Built with love by [Abdelrahman Nashaat](https://github.com/Abdelrahman-Nashaat)

</div>
