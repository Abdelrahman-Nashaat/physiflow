# 🚀 دليل تشغيل فيزيوفلو - خطوة بخطوة

## الخطوة 1: إعداد Supabase Database

1. افتح https://supabase.com/dashboard
2. اختر مشروعك
3. اذهب لـ **SQL Editor**
4. افتح ملف `supabase_schema.sql` من هنا
5. انسخ كل المحتوى والصقه في الـ SQL Editor
6. اضغط **Run**
7. هتشوف رسالة "Success" — ده معناه الـ 13 table اتعملوا ✅

---

## الخطوة 2: إنشاء أول مستخدم (الدكتور)

1. في Supabase Dashboard → **Authentication** → **Users**
2. اضغط **Add user** → **Create new user**
3. أدخل:
   - Email: doctor@physiflow.com (أو أي email)
   - Password: اختار password قوي
4. بعد إنشاء المستخدم، اضغط عليه
5. في **User Metadata** أضف:
```json
{
  "full_name": "د. أحمد محمد",
  "role": "doctor"
}
```
6. اضغط **Save** ✅

---

## الخطوة 3: تعديل ملفات المشروع

### 3أ - استبدل هذه الملفات:

| الملف الجديد | يحل محل |
|---|---|
| `base44Client.js` | `src/api/base44Client.js` |
| `AuthContext.jsx` | `src/lib/AuthContext.jsx` |
| `App.jsx` | `src/App.jsx` |
| `package.json` | `package.json` |
| `vite.config.js` | `vite.config.js` |

### 3ب - أضف ملف Login:
- انسخ `Login.jsx` إلى `src/pages/Login.jsx`

### 3ج - أضف ملف .env:
- انسخ `.env.local` إلى root المشروع (جنب package.json)

---

## الخطوة 4: تشغيل المشروع

```bash
# في مجلد المشروع
npm install
npm run dev
```

افتح http://localhost:5173 ✅

---

## الخطوة 5: تسجيل الدخول

استخدم الـ email والـ password اللي عملتهم في Supabase

---

## ملاحظات مهمة

### الـ AI Summary شغال بـ Groq (مجاني)
- بدل Claude API استخدمنا Groq
- نفس النتيجة بس أسرع وبدون تكلفة
- الـ model: `llama-3.3-70b-versatile` بيدعم العربي كويس

### لو حصل أي خطأ في الـ console:
```
Error: relation "patients" does not exist
```
ده معناه الـ SQL Schema لم يتنفذ - ارجع للخطوة 1

```
Invalid API key
```
ده معناه الـ .env.local مش في المكان الصح

### أضف سكرتيرة:
نفس خطوة إنشاء المستخدم بس الـ role = "secretary"

### أضف مريض:
role = "patient" + ربطه بملف المريض عن طريق الـ patient_id

---

## الملفات اللي مش محتاج تغيرها

**كل الـ pages والـ components الأخرى مش محتاجة أي تغيير!**
- Dashboard.jsx ✅
- Patients.jsx ✅
- PatientDetail.jsx ✅
- وكل حاجة تانية ✅

ده لأن الـ base44Client.js الجديد بيستخدم نفس الـ API بالظبط.

---

🎉 **مبروك! فيزيوفلو شغال على infrastructure بتاعك بالكامل**
