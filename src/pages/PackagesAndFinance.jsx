import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, subMonths } from "date-fns";
import { ar } from "date-fns/locale";
import { Package, AlertTriangle, TrendingUp, Plus, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";

export default function PackagesAndFinance() {
  const [packages, setPackages] = useState([]);
  const [patients, setPatients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: "", patient_name: "", package_name: "", sessions_count: "", sessions_used: 0, price: "", start_date: format(new Date(), "yyyy-MM-dd") });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [pkgs, pats, invs] = await Promise.all([
      base44.entities.TreatmentPackage.list("-created_date", 200),
      base44.entities.Patient.list("-created_date", 200),
      base44.entities.Invoice.list("-date", 500),
    ]);
    setPackages(pkgs);
    setPatients(pats);
    setInvoices(invs);
    setLoading(false);
  }

  function handlePatient(id) {
    const p = patients.find(p => p.id === id);
    setForm(f => ({ ...f, patient_id: id, patient_name: p?.full_name || "" }));
  }

  async function savePackage(e) {
    e.preventDefault();
    if (!form.patient_id || !form.package_name || !form.sessions_count || !form.price) return;
    setSaving(true);
    await base44.entities.TreatmentPackage.create({
      ...form,
      sessions_count: Number(form.sessions_count),
      sessions_used: 0,
      price: Number(form.price),
      status: "active",
    });
    setSaving(false);
    setShowForm(false);
    setForm({ patient_id: "", patient_name: "", package_name: "", sessions_count: "", sessions_used: 0, price: "", start_date: format(new Date(), "yyyy-MM-dd") });
    loadData();
  }

  async function updateUsed(pkg, delta) {
    const used = Math.max(0, Math.min(pkg.sessions_count, (pkg.sessions_used || 0) + delta));
    const status = used >= pkg.sessions_count ? "completed" : "active";
    await base44.entities.TreatmentPackage.update(pkg.id, { sessions_used: used, status });
    loadData();
  }

  // Financial report
  const thisMonth = format(new Date(), "yyyy-MM");
  const lastMonth = format(subMonths(new Date(), 1), "yyyy-MM");

  const thisMonthInvs = invoices.filter(i => i.date?.startsWith(thisMonth));
  const lastMonthInvs = invoices.filter(i => i.date?.startsWith(lastMonth));

  const thisRevenue = thisMonthInvs.reduce((s, i) => s + (i.paid_amount || 0), 0);
  const lastRevenue = lastMonthInvs.reduce((s, i) => s + (i.paid_amount || 0), 0);
  const thisPending = thisMonthInvs.filter(i => i.status !== "paid").reduce((s, i) => s + Math.max(0, (i.total_amount || 0) - (i.paid_amount || 0)), 0);
  const change = lastRevenue > 0 ? (((thisRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1) : null;

  const nearEndPackages = packages.filter(p => p.status === "active" && (p.sessions_used || 0) >= p.sessions_count - 2);

  function exportFinancialPDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 20;
    let y = M;

    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, W, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PhysioFlow - Financial Report", W - M, 12);
    doc.setFontSize(9);
    doc.text(format(new Date(), "yyyy-MM-dd"), W - M, 20);
    doc.setTextColor(30, 30, 30);
    y = 35;

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("This Month Summary", W - M, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const rows = [
      ["Total Collected:", `${thisRevenue.toLocaleString()} EGP`],
      ["Total Pending:", `${thisPending.toLocaleString()} EGP`],
      ["vs Last Month:", change ? `${change > 0 ? "+" : ""}${change}%` : "N/A"],
    ];
    rows.forEach(([l, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(l, M, y);
      doc.setFont("helvetica", "normal");
      doc.text(v, M + 60, y);
      y += 7;
    });

    y += 5;
    doc.setDrawColor(200);
    doc.line(M, y, W - M, y);
    y += 8;

    // Invoices table
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Invoices This Month (${thisMonthInvs.length})`, W - M, y);
    y += 7;

    const cols = ["Patient", "Date", "Total", "Paid", "Status"];
    const widths = [50, 28, 25, 25, 22];
    doc.setFontSize(9);
    let x = M;
    doc.setFont("helvetica", "bold");
    cols.forEach((c, i) => { doc.text(c, x, y); x += widths[i]; });
    y += 4;
    doc.line(M, y, W - M, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    thisMonthInvs.slice(0, 30).forEach(inv => {
      if (y > 270) { doc.addPage(); y = M; }
      x = M;
      const row = [
        inv.patient_name || "-",
        inv.date || "-",
        `${(inv.total_amount || 0).toLocaleString()}`,
        `${(inv.paid_amount || 0).toLocaleString()}`,
        inv.status === "paid" ? "Paid" : inv.status === "partial" ? "Partial" : "Pending",
      ];
      row.forEach((v, i) => { doc.text(v.toString().substring(0, 18), x, y); x += widths[i]; });
      y += 5.5;
    });

    doc.save(`financial_report_${thisMonth}.pdf`);
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activePackages = packages.filter(p => p.status === "active");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">الباقات والتقارير المالية</h1>
          <p className="text-muted-foreground text-sm mt-1">{activePackages.length} باقة نشطة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportFinancialPDF}>
            <Download className="w-4 h-4" /> تقرير مالي PDF
          </Button>
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> باقة جديدة
          </Button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "محصّل هذا الشهر", val: `${thisRevenue.toLocaleString()} ج`, color: "text-green-700", bg: "bg-green-50 border-green-100" },
          { label: "معلق هذا الشهر", val: `${thisPending.toLocaleString()} ج`, color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
          { label: "الشهر الماضي", val: `${lastRevenue.toLocaleString()} ج`, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
          { label: "النمو", val: change ? `${change > 0 ? "+" : ""}${change}%` : "—", color: Number(change) > 0 ? "text-green-700" : "text-red-700", bg: "bg-muted border-border" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-4 border ${s.bg}`}>
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Near End Packages Warning */}
      {nearEndPackages.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="font-bold text-amber-800">باقات على وشك الانتهاء ({nearEndPackages.length})</p>
          </div>
          <div className="space-y-2">
            {nearEndPackages.map(pkg => (
              <div key={pkg.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{pkg.patient_name}</p>
                  <p className="text-xs text-muted-foreground">{pkg.package_name}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  {pkg.sessions_used}/{pkg.sessions_count} جلسة
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packages List */}
      <div>
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> باقات العلاج
        </h2>
        {packages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>لا توجد باقات بعد</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {packages.map(pkg => {
              const pct = Math.round(((pkg.sessions_used || 0) / pkg.sessions_count) * 100);
              const isNearEnd = (pkg.sessions_used || 0) >= pkg.sessions_count - 2;
              return (
                <div key={pkg.id} className={`bg-card border rounded-2xl p-5 ${isNearEnd && pkg.status === "active" ? "border-amber-300" : "border-border"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold">{pkg.patient_name}</p>
                      <p className="text-sm text-muted-foreground">{pkg.package_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isNearEnd && pkg.status === "active" && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        pkg.status === "active" ? "bg-green-100 text-green-700" :
                        pkg.status === "completed" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"
                      }`}>
                        {pkg.status === "active" ? "نشطة" : pkg.status === "completed" ? "منتهية" : "منتهية الصلاحية"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{pkg.sessions_used || 0} / {pkg.sessions_count} جلسة</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all ${
                      pct >= 80 ? "bg-amber-500" : "bg-primary"
                    }`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary">{(pkg.price || 0).toLocaleString()} ج</p>
                    {pkg.status === "active" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateUsed(pkg, -1)}>-</Button>
                        <Button size="sm" className="h-7 text-xs" onClick={() => updateUsed(pkg, 1)}>+جلسة</Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-bold">باقة علاج جديدة</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={savePackage} className="p-5 space-y-4">
              <div className="space-y-1">
                <Label>المريض *</Label>
                <select required value={form.patient_id} onChange={e => handlePatient(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm">
                  <option value="">اختر المريض</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>اسم الباقة *</Label>
                <Input required value={form.package_name} onChange={e => setForm(f => ({ ...f, package_name: e.target.value }))} placeholder="مثال: باقة 10 جلسات" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>عدد الجلسات *</Label>
                  <Input required type="number" value={form.sessions_count} onChange={e => setForm(f => ({ ...f, sessions_count: e.target.value }))} placeholder="10" />
                </div>
                <div className="space-y-1">
                  <Label>السعر (ج) *</Label>
                  <Input required type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="1000" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>تاريخ البداية</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="flex-1">{saving ? "جاري الحفظ..." : "إضافة الباقة"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}