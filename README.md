<div dir="rtl">

# 🏥 فيزيوفلو — نظام إدارة عيادة العلاج الطبيعي

نظام متكامل لإدارة عيادات العلاج الطبيعي مبني بـ React + Supabase + Groq AI

[![Live Demo](https://img.shields.io/badge/Live%20Demo-فيزيوفلو-0ea5e9?style=for-the-badge)](YOUR_VERCEL_URL)

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

## 🚀 تشغيل المشروع

### المتطلبات
- Node.js 18+
- حساب Supabase (مجاني)
- حساب Groq (مجاني)

### الخطوات

```bash
# 1. Clone المشروع
git clone https://github.com/Abdelrahman-Nashaat/physiflow.git
cd physiflow

# 2. تثبيت المكتبات
npm install

# 3. إنشاء ملف .env.local
cp .env.example .env.local
# عدّل القيم بـ credentials بتاعتك

# 4. إنشاء الجداول في Supabase
# افتح supabase_schema.sql وشغّله في SQL Editor

# 5. تشغيل المشروع
npm run dev
```

---

## ⚙️ إعداد .env.local

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

---

## 🎭 إعداد حسابات Demo

في Supabase → Authentication → Users، أضف 3 مستخدمين:

```sql
-- بعد إنشاء كل user في Supabase Auth، شغّل:

UPDATE auth.users SET raw_user_meta_data = 
  '{"full_name": "د. أحمد محمد", "role": "doctor"}'::jsonb
WHERE email = 'doctor@physiflow-demo.com';

UPDATE auth.users SET raw_user_meta_data = 
  '{"full_name": "سارة محمد", "role": "secretary"}'::jsonb
WHERE email = 'secretary@physiflow-demo.com';

UPDATE auth.users SET raw_user_meta_data = 
  '{"full_name": "محمود علي", "role": "patient"}'::jsonb
WHERE email = 'patient@physiflow-demo.com';
```

كلمة المرور للجميع: `Demo@physiflow1`

بعدين افتح `/demo-seeder` وأضف بيانات تجريبية.

---

## 🛠️ التقنيات المستخدمة

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **AI:** Groq API (llama-3.3-70b) — ملخص الجلسات بالعربي
- **PDF:** jsPDF + html2canvas
- **Charts:** Recharts

---

## 📁 هيكل المشروع

```
src/
├── api/          # Supabase client
├── components/   # مكونات قابلة للإعادة
├── pages/        # صفحات التطبيق
└── lib/          # Auth, utils
```

---

Built with ❤️ by [Abdelrahman Nashaat](https://github.com/Abdelrahman-Nashaat)

</div>
