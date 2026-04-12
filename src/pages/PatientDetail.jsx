import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Phone, Edit, Calendar, FileText, Receipt, Sparkles, BarChart2, Target, Home } from "lucide-react";
import WhatsAppReminder from "@/components/WhatsAppReminder";
import PDFExportButton from "@/components/PDFExportButton";
import TreatmentPlanTab from "@/components/TreatmentPlanTab";
import HomeFollowupTab from "@/components/HomeFollowupTab";
import ComparisonTab from "@/components/ComparisonTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientFormModal from "@/components/PatientFormModal";

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => { loadAll(); }, [id]);

  async function loadAll() {
    const [p, appts, ns, invs] = await Promise.all([
      base44.entities.Patient.filter({ id }, "-created_date", 1),
      base44.entities.Appointment.filter({ patient_id: id }, "-date", 50),
      base44.entities.SessionNote.filter({ patient_id: id }, "-session_date", 50),
      base44.entities.Invoice.filter({ patient_id: id }, "-date", 50),
    ]);
    setPatient(p[0]);
    setAppointments(appts);
    setNotes(ns);
    setInvoices(invs);
  }

  async function generateAISummary() {
    setLoadingAI(true);
    const notesText = notes.map(n =>
      `جلسة ${n.session_number}: ${n.subjective || ""} | تقييم: ${n.assessment || ""} | خطة: ${n.plan || ""} | ألم قبل: ${n.pain_before}/10 بعد: ${n.pain_after}/10`
    ).join("\n");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `أنت دكتور علاج طبيعي خبير. قدم ملخصاً احترافياً شاملاً لحالة المريض التالي باللغة العربية:
المريض: ${patient.full_name}
التشخيص: ${patient.diagnosis || "غير محدد"}
التاريخ المرضي: ${patient.medical_history || "غير محدد"}
عدد الجلسات المكتملة: ${patient.sessions_completed || 0} من ${patient.total_sessions_prescribed || "غير محدد"}
ملاحظات الجلسات:
${notesText || "لا توجد ملاحظات بعد"}
اكتب ملخصاً يشمل: التقدم العام، المستجدات، التوصيات للجلسات القادمة.`
    });
    setAiSummary(res);
    setLoadingAI(false);
  }

  if (!patient) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalPaid = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
  const totalDue  = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);

  const nextAppointment = appointments
    .filter(a => a.status !== "completed" && a.status !== "cancelled" && a.date >= new Date().toISOString().split("T")[0])
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/patients" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="w-4 h-4" /> العودة للمرضى
      </Link>

      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-2xl font-bold text-accent-foreground">
              {patient.full_name?.[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold">{patient.full_name}</h1>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                <Phone className="w-3 h-3" />
                <span>{patient.phone}</span>
                {patient.age && <><span>•</span><span>{patient.age} سنة</span></>}
                {patient.gender && <><span>•</span><span>{patient.gender === "male" ? "ذكر" : "أنثى"}</span></>}
              </div>
              {patient.diagnosis && <p className="mt-2 text-sm text-muted-foreground">{patient.diagnosis}</p>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <WhatsAppReminder patient={patient} nextAppointment={nextAppointment} />
            <PDFExportButton patient={patient} appointments={appointments} sessions={notes} invoices={invoices} />
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-2">
              <Edit className="w-4 h-4" /> تعديل
            </Button>
          </div>
        </div>

        {/* Progress */}
        {patient.total_sessions_prescribed && (
          <div className="mt-5 pt-5 border-t border-border">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">تقدم الجلسات</span>
              <span className="text-muted-foreground">{patient.sessions_completed || 0} / {patient.total_sessions_prescribed} جلسة</span>
            </div>
            <div className="h-2 bg-muted rounded-full">
              <div className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, ((patient.sessions_completed || 0) / patient.total_sessions_prescribed) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Financials */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-muted rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{totalDue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">إجمالي الفواتير</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-700">{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">المدفوع</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-orange-700">{(totalDue - totalPaid).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">المتبقي</p>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> ملخص AI</h3>
          <Button size="sm" variant="outline" onClick={generateAISummary} disabled={loadingAI} className="gap-2">
            {loadingAI ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loadingAI ? "جاري التوليد..." : "توليد ملخص"}
          </Button>
        </div>
        {aiSummary
          ? <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
          : <p className="text-sm text-muted-foreground">اضغط "توليد ملخص" للحصول على تقرير شامل عن حالة المريض</p>
        }
      </div>

      {/* Tabs */}
      <Tabs defaultValue="appointments">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="appointments" className="flex-1 gap-1 text-xs">
            <Calendar className="w-3.5 h-3.5" /> المواعيد ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex-1 gap-1 text-xs">
            <FileText className="w-3.5 h-3.5" /> الجلسات ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex-1 gap-1 text-xs">
            <Target className="w-3.5 h-3.5" /> خطة العلاج
          </TabsTrigger>
          <TabsTrigger value="followup" className="flex-1 gap-1 text-xs">
            <Home className="w-3.5 h-3.5" /> المتابعة المنزلية
          </TabsTrigger>
          <TabsTrigger value="chart" className="flex-1 gap-1 text-xs">
            <BarChart2 className="w-3.5 h-3.5" /> المقارنة
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 gap-1 text-xs">
            <Receipt className="w-3.5 h-3.5" /> الفواتير ({invoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-4 space-y-2">
          {appointments.length === 0
            ? <p className="text-center text-muted-foreground py-8">لا توجد مواعيد</p>
            : appointments.map(a => (
              <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{a.date} — {a.time}</p>
                  <p className="text-xs text-muted-foreground">جلسة {a.session_number || ""} · {a.duration_minutes} دقيقة</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  a.status === "completed" ? "bg-gray-100 text-gray-600" :
                  a.status === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {a.status === "completed" ? "منتهى" : a.status === "cancelled" ? "ملغى" : "مجدول"}
                </span>
              </div>
            ))
          }
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-3">
          {notes.length === 0
            ? <p className="text-center text-muted-foreground py-8">لا توجد ملاحظات جلسات</p>
            : notes.map(n => (
              <div key={n.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">جلسة {n.session_number} — {n.session_date}</p>
                  {n.pain_before != null && (
                    <span className="text-xs text-muted-foreground">ألم: {n.pain_before} ← {n.pain_after}</span>
                  )}
                </div>
                {n.assessment && <p className="text-sm text-muted-foreground">{n.assessment}</p>}
                {n.exercises && <p className="text-xs bg-accent text-accent-foreground px-3 py-2 rounded-lg">تمارين: {n.exercises}</p>}
              </div>
            ))
          }
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <TreatmentPlanTab patient={patient} />
        </TabsContent>

        <TabsContent value="followup" className="mt-4">
          <HomeFollowupTab patient={patient} />
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          <ComparisonTab sessions={notes} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-2">
          {invoices.length === 0
            ? <p className="text-center text-muted-foreground py-8">لا توجد فواتير</p>
            : invoices.map(inv => (
              <div key={inv.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{inv.date}</p>
                  <p className="text-xs text-muted-foreground">{inv.sessions_count} جلسة × {inv.price_per_session} ج</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{inv.total_amount?.toLocaleString()} ج</p>
                  <span className={`text-xs ${inv.status === "paid" ? "text-green-600" : inv.status === "partial" ? "text-orange-600" : "text-red-600"}`}>
                    {inv.status === "paid" ? "مدفوع" : inv.status === "partial" ? "جزئي" : "معلق"}
                  </span>
                </div>
              </div>
            ))
          }
        </TabsContent>
      </Tabs>

      {showEdit && (
        <PatientFormModal
          patient={patient}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); loadAll(); }}
        />
      )}
    </div>
  );
}