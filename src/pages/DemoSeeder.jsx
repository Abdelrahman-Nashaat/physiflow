import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Database, Trash2, Loader2 } from "lucide-react";

// Demo data
const DEMO_PATIENTS = [
  { full_name: "أحمد محمد السيد", phone: "01012345678", age: 35, gender: "male", diagnosis: "ألم أسفل الظهر المزمن", medical_history: "ضغط دم مرتفع، لا يوجد عمليات سابقة", referred_by: "د. كريم عمر", status: "active", total_sessions_prescribed: 12, sessions_completed: 7, emergency_contact: "سارة محمد - 01098765432" },
  { full_name: "فاطمة علي حسن", phone: "01123456789", age: 28, gender: "female", diagnosis: "إصابة الركبة اليسرى - تمزق رباط", medical_history: "بدون أمراض مزمنة", referred_by: "مستشفى طنطا العام", status: "active", total_sessions_prescribed: 20, sessions_completed: 5, emergency_contact: "علي حسن - 01112345678" },
  { full_name: "محمود إبراهيم خليل", phone: "01234567890", age: 52, gender: "male", diagnosis: "التهاب المفاصل - الركبة اليمنى", medical_history: "سكري نوع 2، علاج بالإنسولين", referred_by: "عيادة د. منى", status: "active", total_sessions_prescribed: 15, sessions_completed: 15, emergency_contact: "نور إبراهيم - 01234567891" },
  { full_name: "نور الهدى عبدالله", phone: "01098765432", age: 22, gender: "female", diagnosis: "آلام الرقبة والكتف - عمل مكتبي", medical_history: "لا يوجد", status: "active", total_sessions_prescribed: 8, sessions_completed: 3 },
  { full_name: "كريم أحمد فاروق", phone: "01567891234", age: 45, gender: "male", diagnosis: "شلل جزئي في اليد اليسرى - بعد جلطة", medical_history: "جلطة دماغية منذ 6 أشهر، أدوية مضادة للتخثر", status: "active", total_sessions_prescribed: 30, sessions_completed: 12 },
];

const DEMO_EXERCISES = [
  { name: "تمرين تقوية عضلات الظهر", category: "spine", description: "تقوية العضلات المحيطة بالعمود الفقري", instructions: "استلقِ على بطنك، ارفع رأسك وصدرك ببطء، احتفظ 5 ثوان ثم نزل", sets: 3, reps: 10, frequency: "مرتين يومياً", precautions: "توقف فور الشعور بألم حاد" },
  { name: "تمرين القرفصاء للركبة", category: "knee", description: "تقوية عضلات الفخذ والحماية من إجهاد الركبة", instructions: "قف مستقيماً، انزل ببطء كأنك ستجلس على كرسي، لا تتجاوز 90 درجة", sets: 3, reps: 15, frequency: "مرة يومياً", precautions: "لا تتجاوز زاوية 90 درجة" },
  { name: "تمرين إطالة عضلة الهامسترينج", category: "knee", description: "إطالة عضلات الفخذ الخلفية", instructions: "استلقِ على ظهرك، ارفع ساقك مستقيمة حتى تشعر بشد في الفخذ، احتفظ 30 ثانية", sets: 3, reps: 1, duration_seconds: 30, frequency: "3 مرات يومياً" },
  { name: "تمرين دوران الكتف", category: "shoulder", description: "تحسين مدى حركة مفصل الكتف", instructions: "قف مستقيماً، دوّر ذراعك في دوائر كبيرة للأمام 10 مرات ثم للخلف 10 مرات", sets: 2, reps: 10, frequency: "مرتين يومياً" },
  { name: "تمرين إطالة عضلات الرقبة", category: "neck", description: "تخفيف توتر عضلات الرقبة والكتف", instructions: "أمِل رأسك للجانب الأيمن حتى تشعر بإطالة، احتفظ 20 ثانية، كرر للجانب الأيسر", sets: 3, reps: 1, duration_seconds: 20, frequency: "كل ساعتين أثناء العمل" },
];

const DEMO_SOAP_TEMPLATES = [
  { name: "ظهر - جلسة متابعة", category: "spine", subjective: "يشكو المريض من استمرار آلام أسفل الظهر مع تحسن جزئي منذ الجلسة الماضية", objective: "ROM محدود في الانحناء الأمامي 50%، توتر عضلي في المنطقة القطنية", assessment: "تحسن تدريجي في الأعراض مع استجابة جيدة للعلاج", plan: "مواصلة البروتوكول العلاجي مع تكثيف تمارين التقوية" },
  { name: "ركبة - بعد الإصابة", category: "knee", subjective: "المريض يشكو من ألم عند الحركة وتورم طفيف في الركبة", objective: "تورم درجة 1، ألم عند الضغط على الرباط الجانبي، ROM 0-80 درجة", assessment: "التهاب حاد مع بدء التعافي، الاستجابة للعلاج إيجابية", plan: "تبريد وتحفيز كهربي + بدء تمارين ROM بلطف" },
  { name: "كتف - جلسة أولى", category: "shoulder", subjective: "المريض يعاني من ألم وتيبس في الكتف الأيمن منذ 3 أسابيع", objective: "تقييم شامل: ROM منخفض 40% في جميع الاتجاهات، ألم في بداية الحركة", assessment: "التهاب في النسيج الرخو المحيط بالمفصل", plan: "موجات صوتية + مسودة علاجية لمدة 8 جلسات" },
];

export default function DemoSeeder() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);

  async function seedData() {
    if (!confirm("هتضاف بيانات تجريبية (5 مرضى + تمارين + قوالب). متابع؟")) return;
    setLoading(true);
    setDone(false);

    try {
      setStatus("إضافة المرضى...");
      const patients = [];
      for (const p of DEMO_PATIENTS) {
        const created = await base44.entities.Patient.create(p);
        patients.push(created);
      }

      setStatus("إضافة التمارين...");
      for (const ex of DEMO_EXERCISES) {
        await base44.entities.ExerciseTemplate.create(ex);
      }

      setStatus("إضافة قوالب SOAP...");
      for (const t of DEMO_SOAP_TEMPLATES) {
        await base44.entities.SoapTemplate.create(t);
      }

      setStatus("إضافة المواعيد...");
      const today = new Date();
      const times = ["09:00", "10:00", "11:00", "14:00", "15:00"];
      for (let i = 0; i < 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        await base44.entities.Appointment.create({
          patient_id: patients[i].id,
          patient_name: patients[i].full_name,
          date: dateStr,
          time: times[i],
          duration_minutes: 45,
          type: i === 0 ? "initial" : "followup",
          status: i === 0 ? "confirmed" : "scheduled",
          session_number: patients[i].sessions_completed + 1,
        });
      }

      setStatus("إضافة الجلسات...");
      const sessionData = [
        { pain_before: 8, pain_after: 6, progress_rating: "good", subjective: "ألم شديد في أسفل الظهر عند الوقوف", assessment: "التهاب حاد في المنطقة القطنية" },
        { pain_before: 6, pain_after: 4, progress_rating: "good", subjective: "تحسن ملحوظ، الألم أخف عند المشي", assessment: "استجابة جيدة للعلاج" },
        { pain_before: 4, pain_after: 2, progress_rating: "excellent", subjective: "الألم خفيف جداً، عاد للعمل", assessment: "تحسن ممتاز، قريب من الشفاء" },
      ];
      for (let i = 0; i < sessionData.length; i++) {
        const sd = new Date(today);
        sd.setDate(today.getDate() - (3 - i) * 3);
        await base44.entities.SessionNote.create({
          patient_id: patients[0].id,
          patient_name: patients[0].full_name,
          session_date: sd.toISOString().split("T")[0],
          session_number: i + 1,
          ...sessionData[i],
          plan: "استمرار البروتوكول العلاجي + تمارين منزلية",
          exercises: "تمرين تقوية الظهر x3 يومياً",
        });
      }

      setStatus("إضافة الفواتير...");
      await base44.entities.Invoice.create({
        patient_id: patients[0].id,
        patient_name: patients[0].full_name,
        date: today.toISOString().split("T")[0],
        sessions_count: 7,
        price_per_session: 200,
        total_amount: 1400,
        paid_amount: 1000,
        remaining: 400,
        status: "partial",
        payment_method: "cash",
      });
      await base44.entities.Invoice.create({
        patient_id: patients[1].id,
        patient_name: patients[1].full_name,
        date: today.toISOString().split("T")[0],
        sessions_count: 5,
        price_per_session: 250,
        total_amount: 1250,
        paid_amount: 1250,
        remaining: 0,
        status: "paid",
        payment_method: "card",
      });

      setStatus("✅ تمت إضافة البيانات التجريبية بنجاح!");
      setDone(true);
    } catch (err) {
      setStatus("❌ خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-8">
      <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <Database className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">بيانات تجريبية</h2>
        <p className="text-sm text-muted-foreground">
          أضف بيانات وهمية لاختبار النظام أو عرضه على عملاء محتملين
        </p>
        <div className="bg-muted rounded-xl p-4 text-right text-sm space-y-1">
          <p>✅ 5 مرضى بحالات مختلفة</p>
          <p>✅ 5 تمارين منزلية</p>
          <p>✅ 3 قوالب SOAP جاهزة</p>
          <p>✅ 3 مواعيد قادمة</p>
          <p>✅ 3 جلسات مع تقدم ملحوظ</p>
          <p>✅ فاتورتان (مدفوعة وجزئية)</p>
        </div>
        {status && (
          <div className={`text-sm font-medium ${done ? "text-green-600" : "text-primary"}`}>
            {loading && <Loader2 className="w-4 h-4 animate-spin inline ml-2" />}
            {status}
          </div>
        )}
        <Button onClick={seedData} disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {done ? "أضف مجموعة ثانية" : "إضافة البيانات التجريبية"}
        </Button>
        {done && (
          <Button variant="outline" className="w-full" onClick={() => window.location.href = "/"}>
            العودة للرئيسية
          </Button>
        )}
      </div>
    </div>
  );
}
