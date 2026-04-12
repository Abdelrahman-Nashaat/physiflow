import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Users, Calendar, TrendingUp, Receipt, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import SmartDoctorCards from "@/components/SmartDoctorCards";
import PatientMessagesPanel from "@/components/PatientMessagesPanel";
import DoctorMessages from "@/components/DoctorMessages";

export default function Dashboard() {
  const [stats, setStats] = useState({ patients: 0, todayAppts: 0, pendingInvoices: 0, completedToday: 0 });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const today = format(new Date(), "yyyy-MM-dd");
    const [patients, appointments, invoices, sessions, allAppts] = await Promise.all([
      base44.entities.Patient.list("-created_date", 500),
      base44.entities.Appointment.filter({ date: today }, "time", 20),
      base44.entities.Invoice.filter({ status: "pending" }, "-created_date", 100),
      base44.entities.SessionNote.list("-session_date", 500),
      base44.entities.Appointment.list("-date", 500),
    ]);

    const completed = appointments.filter(a => a.status === "completed").length;
    setStats({
      patients: patients.length,
      todayAppts: appointments.length,
      pendingInvoices: invoices.length,
      completedToday: completed,
    });
    setTodayAppointments(appointments);
    setAllPatients(patients);
    setAllSessions(sessions);
    setAllAppointments(allAppts);
    setLoading(false);
  }

  const statusColor = {
    scheduled: "bg-blue-100 text-blue-700",
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-orange-100 text-orange-700",
  };
  const statusLabel = {
    scheduled: "مجدول", confirmed: "مؤكد", completed: "منتهى", cancelled: "ملغى", no_show: "لم يحضر"
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">{format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المرضى",   value: stats.patients,        icon: Users,       color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "مواعيد اليوم",    value: stats.todayAppts,      icon: Calendar,    color: "text-primary",    bg: "bg-accent" },
          { label: "جلسات منتهية",    value: stats.completedToday,  icon: CheckCircle, color: "text-green-600",  bg: "bg-green-50" },
          { label: "فواتير معلقة",    value: stats.pendingInvoices, icon: Receipt,     color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Patient Messages */}
      <DoctorMessages />

      {/* Smart Cards */}
      <SmartDoctorCards
        patients={allPatients}
        sessions={allSessions}
        appointments={allAppointments}
      />

      {/* Patient Messages */}
      <PatientMessagesPanel />

      {/* Today's appointments */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> مواعيد اليوم
          </h2>
          <Link to="/appointments" className="text-sm text-primary flex items-center gap-1 hover:underline">
            عرض الكل <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        {todayAppointments.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد مواعيد اليوم</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayAppointments.map(appt => (
              <div key={appt.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">
                    {appt.patient_name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{appt.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{appt.time} — {appt.duration_minutes} دقيقة</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[appt.status]}`}>
                  {statusLabel[appt.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}