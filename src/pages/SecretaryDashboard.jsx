import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, addDays, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { Clock, AlertCircle, Calendar, TrendingUp, Users, CheckCircle, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import WhatsAppReminder from "@/components/WhatsAppReminder";
import RescheduleModal from "@/components/RescheduleModal";
import WaitingListModal from "@/components/WaitingListModal";

const STATUS_COLOR = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-orange-100 text-orange-700",
};
const STATUS_LABEL = { scheduled: "مجدول", confirmed: "مؤكد", completed: "منتهى", cancelled: "ملغى", no_show: "لم يحضر" };

export default function SecretaryDashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const [todayAppts, setTodayAppts] = useState([]);
  const [tomorrowAppts, setTomorrowAppts] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [absentPatients, setAbsentPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [showWaiting, setShowWaiting] = useState(false);
  const [updating, setUpdating] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [tAppts, tmAppts, invoices, patients, allAppts, waiting] = await Promise.all([
      base44.entities.Appointment.filter({ date: today }, "time", 30),
      base44.entities.Appointment.filter({ date: tomorrow }, "time", 30),
      base44.entities.Invoice.list("-date", 500),
      base44.entities.Patient.list("-created_date", 500),
      base44.entities.Appointment.list("-date", 500),
      base44.entities.WaitingList.filter({ status: "waiting" }, "-created_date", 50),
    ]);

    // Pending invoices older than 7 days
    const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const oldPending = invoices.filter(i => i.status !== "paid" && i.date && i.date <= sevenDaysAgo);

    // Absent patients (active, no completed appt in last 7 days)
    const absent = patients.filter(p => {
      if (p.status !== "active") return false;
      const pAppts = allAppts.filter(a => a.patient_id === p.id && a.status === "completed");
      if (pAppts.length === 0) return false;
      const last = pAppts.sort((a, b) => b.date?.localeCompare(a.date))[0];
      return last?.date < weekAgo;
    }).slice(0, 8);

    setTodayAppts(tAppts);
    setTomorrowAppts(tmAppts);
    setPendingInvoices(oldPending.slice(0, 10));
    setAbsentPatients(absent);
    setAllPatients(patients);
    setAllAppointments(allAppts);
    setWaitingCount(waiting.length);
    setLoading(false);
  }

  async function confirmAttendance(appt) {
    setUpdating(appt.id);
    await base44.entities.Appointment.update(appt.id, { status: "confirmed" });
    setUpdating(null);
    loadData();
  }

  async function markCompleted(appt) {
    setUpdating(appt.id);
    await base44.entities.Appointment.update(appt.id, { status: "completed" });
    setUpdating(null);
    loadData();
  }

  // Quick stats
  const todayRevenue = todayAppts
    .filter(a => a.status === "completed")
    .reduce((s, _) => s + 0, 0); // placeholder — real revenue from invoices
  const todayInvoiceRevenue = allAppointments
    .filter(a => a.date === today)
    .length;

  const weekAppts = allAppointments.filter(a => a.date >= format(subDays(new Date(), 7), "yyyy-MM-dd") && a.date <= today);
  const weekAttendance = weekAppts.length > 0
    ? Math.round((weekAppts.filter(a => a.status === "completed").length / weekAppts.length) * 100)
    : 0;

  const tomorrowUnconfirmed = tomorrowAppts.filter(a => a.status === "scheduled");

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">لوحة السكرتيرة</h1>
          <p className="text-muted-foreground text-sm mt-1">{format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setShowWaiting(true)}>
          <List className="w-4 h-4" /> قائمة الانتظار {waitingCount > 0 && <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">{waitingCount}</span>}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
          <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{todayAppts.length}</p>
          <p className="text-xs text-muted-foreground">مواعيد اليوم</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-700">{weekAttendance}%</p>
          <p className="text-xs text-muted-foreground">نسبة الحضور هذا الأسبوع</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-700">{todayAppts.filter(a => a.status === "completed").length}</p>
          <p className="text-xs text-muted-foreground">حضروا اليوم</p>
        </div>
      </div>

      {/* Today Schedule */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> جدول اليوم
          </h2>
          <span className="text-sm text-muted-foreground">{todayAppts.length} موعد</span>
        </div>
        {todayAppts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>لا توجد مواعيد اليوم</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayAppts.map(appt => (
              <div key={appt.id} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                <div className="text-center min-w-[50px]">
                  <p className="font-bold text-sm text-primary">{appt.time}</p>
                  <p className="text-xs text-muted-foreground">{appt.duration_minutes}د</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{appt.patient_name}</p>
                  <p className="text-xs text-muted-foreground">
                    جلسة {appt.session_number || "-"} · {appt.type === "initial" ? "أول زيارة" : appt.type === "final" ? "نهائية" : "متابعة"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[appt.status]}`}>
                    {STATUS_LABEL[appt.status]}
                  </span>
                  {appt.status === "scheduled" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                      disabled={updating === appt.id}
                      onClick={() => confirmAttendance(appt)}>
                      {updating === appt.id ? "..." : <><CheckCircle className="w-3 h-3" /> أكد</>}
                    </Button>
                  )}
                  {(appt.status === "scheduled" || appt.status === "confirmed") && (
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => setRescheduleAppt(appt)}>
                      أجّل
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Urgent Tasks */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" /> المهام العاجلة
          </h2>
        </div>
        <div className="divide-y divide-border">

          {/* Tomorrow unconfirmed */}
          {tomorrowUnconfirmed.length > 0 && (
            <div className="p-4">
              <p className="text-sm font-semibold text-orange-700 mb-3">
                📅 مواعيد بكره لم تُؤكد ({tomorrowUnconfirmed.length})
              </p>
              <div className="space-y-2">
                {tomorrowUnconfirmed.map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-orange-50 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{a.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <WhatsAppReminder patient={{ full_name: a.patient_name, phone: allPatients.find(p => p.id === a.patient_id)?.phone }} nextAppointment={a} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Old pending invoices */}
          {pendingInvoices.length > 0 && (
            <div className="p-4">
              <p className="text-sm font-semibold text-red-700 mb-3">
                💸 فواتير معلقة +7 أيام ({pendingInvoices.length})
              </p>
              <div className="space-y-2">
                {pendingInvoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{inv.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.date} · متبقي: {((inv.total_amount || 0) - (inv.paid_amount || 0)).toLocaleString()} ج</p>
                    </div>
                    <WhatsAppReminder
                      patient={{ full_name: inv.patient_name, phone: allPatients.find(p => p.id === inv.patient_id)?.phone }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Absent patients */}
          {absentPatients.length > 0 && (
            <div className="p-4">
              <p className="text-sm font-semibold text-blue-700 mb-3">
                🚶 لم يحضروا منذ أسبوع ({absentPatients.length})
              </p>
              <div className="space-y-2">
                {absentPatients.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">{p.phone}</p>
                    </div>
                    <WhatsAppReminder patient={p} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tomorrowUnconfirmed.length === 0 && pendingInvoices.length === 0 && absentPatients.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
              لا توجد مهام عاجلة 🎉
            </div>
          )}
        </div>
      </div>

      {rescheduleAppt && (
        <RescheduleModal
          appointment={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onSaved={() => { setRescheduleAppt(null); loadData(); }}
        />
      )}

      {showWaiting && <WaitingListModal onClose={() => { setShowWaiting(false); loadData(); }} />}
    </div>
  );
}