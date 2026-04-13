import { useEffect, useState } from "react";
import { api } from "@/api/apiClient";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, Users, Calendar, Receipt, Award, Target } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";

const COLORS = ["#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe", "#f0f9ff"];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [patients, appointments, invoices, sessions] = await Promise.all([
      api.entities.Patient.list("-created_date", 500),
      api.entities.Appointment.list("-date", 500),
      api.entities.Invoice.list("-date", 500),
      api.entities.SessionNote.list("-session_date", 500),
    ]);

    // Monthly revenue (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const label = format(month, "MMM", { locale: ar });
      const monthStr = format(month, "yyyy-MM");
      const revenue = invoices
        .filter(inv => inv.date?.startsWith(monthStr))
        .reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
      const pending = invoices
        .filter(inv => inv.date?.startsWith(monthStr))
        .reduce((sum, inv) => sum + Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0)), 0);
      monthlyRevenue.push({ label, revenue, pending });
    }

    // Appointments per month
    const monthlyAppts = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const label = format(month, "MMM", { locale: ar });
      const monthStr = format(month, "yyyy-MM");
      const count = appointments.filter(a => a.date?.startsWith(monthStr)).length;
      const completed = appointments.filter(a => a.date?.startsWith(monthStr) && a.status === "completed").length;
      monthlyAppts.push({ label, count, completed });
    }

    // Diagnosis breakdown
    const diagMap = {};
    patients.forEach(p => {
      if (p.diagnosis) {
        const key = p.diagnosis.substring(0, 25);
        diagMap[key] = (diagMap[key] || 0) + 1;
      }
    });
    const diagnoses = Object.entries(diagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    // Status breakdown
    const statusMap = { scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
    appointments.forEach(a => { if (statusMap[a.status] !== undefined) statusMap[a.status]++; });
    const statusData = [
      { name: "مكتمل", value: statusMap.completed },
      { name: "مجدول", value: statusMap.scheduled + statusMap.confirmed },
      { name: "ملغى", value: statusMap.cancelled },
      { name: "لم يحضر", value: statusMap.no_show },
    ].filter(s => s.value > 0);

    // KPIs
    const thisMonth = format(new Date(), "yyyy-MM");
    const lastMonth = format(subMonths(new Date(), 1), "yyyy-MM");
    const thisMonthRev = invoices.filter(i => i.date?.startsWith(thisMonth)).reduce((s, i) => s + (i.paid_amount || 0), 0);
    const lastMonthRev = invoices.filter(i => i.date?.startsWith(lastMonth)).reduce((s, i) => s + (i.paid_amount || 0), 0);
    const revenueGrowth = lastMonthRev > 0 ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : null;

    const activePatients = patients.filter(p => p.status === "active").length;
    const completionRate = appointments.length > 0
      ? ((statusMap.completed / appointments.length) * 100).toFixed(0) : 0;
    const totalRevenue = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
    const pendingRevenue = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + Math.max(0, (i.total_amount || 0) - (i.paid_amount || 0)), 0);

    setData({ monthlyRevenue, monthlyAppts, diagnoses, statusData, activePatients, completionRate, totalRevenue, pendingRevenue, thisMonthRev, revenueGrowth, totalSessions: sessions.length });
    setLoading(false);
  }

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const kpis = [
    { label: "إيراد الشهر", value: `${data.thisMonthRev.toLocaleString()} ج`, icon: TrendingUp, color: "text-primary", bg: "bg-accent",
      sub: data.revenueGrowth ? `${data.revenueGrowth > 0 ? "+" : ""}${data.revenueGrowth}% عن الشهر الماضي` : "أول شهر" },
    { label: "مرضى نشطون", value: data.activePatients, icon: Users, color: "text-green-600", bg: "bg-green-50",
      sub: "حاليًا في العلاج" },
    { label: "معدل الإتمام", value: `${data.completionRate}%`, icon: Target, color: "text-blue-600", bg: "bg-blue-50",
      sub: "من إجمالي المواعيد" },
    { label: "إجمالي الجلسات", value: data.totalSessions, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50",
      sub: "جلسة مسجلة" },
    { label: "إجمالي المحصّل", value: `${data.totalRevenue.toLocaleString()} ج`, icon: Receipt, color: "text-emerald-600", bg: "bg-emerald-50",
      sub: "منذ البداية" },
    { label: "متبقي للتحصيل", value: `${data.pendingRevenue.toLocaleString()} ج`, icon: Award, color: "text-orange-600", bg: "bg-orange-50",
      sub: "فواتير غير مسددة" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">التحليلات والإحصائيات</h1>
        <p className="text-muted-foreground text-sm mt-1">نظرة شاملة على أداء العيادة</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5">
            <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-sm font-medium mt-0.5">{k.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold mb-6">الإيرادات — آخر 6 أشهر</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.monthlyRevenue} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: "Cairo" }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, n) => [`${v.toLocaleString()} ج`, n === "revenue" ? "محصّل" : "معلق"]}
              contentStyle={{ fontFamily: "Cairo", borderRadius: 12, fontSize: 13 }} />
            <Bar dataKey="revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="محصّل" />
            <Bar dataKey="pending" fill="#fed7aa" radius={[6, 6, 0, 0]} name="معلق" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Appointments Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold mb-6">المواعيد — آخر 6 أشهر</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthlyAppts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: "Cairo" }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [v, n === "count" ? "إجمالي" : "منتهية"]}
                contentStyle={{ fontFamily: "Cairo", borderRadius: 12, fontSize: 13 }} />
              <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4 }} name="إجمالي" />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} name="منتهية" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment Status */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold mb-4">توزيع حالات المواعيد</h2>
          {data.statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {data.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={v => <span style={{ fontFamily: "Cairo", fontSize: 13 }}>{v}</span>} />
                <Tooltip contentStyle={{ fontFamily: "Cairo", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-16">لا توجد بيانات</p>}
        </div>
      </div>

      {/* Top Diagnoses */}
      {data.diagnoses.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold mb-6">أشيع التشخيصات</h2>
          <div className="space-y-3">
            {data.diagnoses.map((d, i) => {
              const max = data.diagnoses[0].value;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5 text-center font-bold">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{d.name}</span>
                      <span className="text-xs text-muted-foreground">{d.value} مريض</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(d.value / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}