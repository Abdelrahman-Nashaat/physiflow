import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Receipt, X } from "lucide-react";
import ReceiptPDFButton from "@/components/ReceiptPDFButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const statusColor = { pending: "bg-red-100 text-red-700", partial: "bg-orange-100 text-orange-700", paid: "bg-green-100 text-green-700" };
const statusLabel = { pending: "معلق", partial: "جزئي", paid: "مدفوع" };

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editInv, setEditInv] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({ patient_id: "", patient_name: "", date: new Date().toISOString().split("T")[0], sessions_count: "", price_per_session: "", total_amount: "", paid_amount: "", payment_method: "cash", status: "pending", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Invoice.list("-date", 200),
      base44.entities.Patient.list("-created_date", 200)
    ]).then(([invs, pats]) => { setInvoices(invs); setPatients(pats); setLoading(false); });
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handlePatientChange(id) {
    const p = patients.find(p => p.id === id);
    set("patient_id", id); set("patient_name", p?.full_name || "");
  }

  function calcTotal(sessions, price) {
    const total = (Number(sessions) || 0) * (Number(price) || 0);
    setForm(f => ({ ...f, total_amount: total, sessions_count: sessions, price_per_session: price }));
  }

  function openForm(inv = null) {
    setEditInv(inv);
    setForm(inv ? { patient_id: inv.patient_id, patient_name: inv.patient_name, date: inv.date, sessions_count: inv.sessions_count || "", price_per_session: inv.price_per_session || "", total_amount: inv.total_amount || "", paid_amount: inv.paid_amount || "", payment_method: inv.payment_method || "cash", status: inv.status || "pending", notes: inv.notes || "" }
      : { patient_id: "", patient_name: "", date: new Date().toISOString().split("T")[0], sessions_count: "", price_per_session: "", total_amount: "", paid_amount: "", payment_method: "cash", status: "pending", notes: "" });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const paid = Number(form.paid_amount) || 0;
    const total = Number(form.total_amount) || 0;
    const status = paid >= total ? "paid" : paid > 0 ? "partial" : "pending";
    const data = { ...form, sessions_count: Number(form.sessions_count) || 0, price_per_session: Number(form.price_per_session) || 0, total_amount: total, paid_amount: paid, remaining: total - paid, status };
    if (editInv?.id) await base44.entities.Invoice.update(editInv.id, data);
    else await base44.entities.Invoice.create(data);
    const updated = await base44.entities.Invoice.list("-date", 200);
    setInvoices(updated);
    setShowForm(false); setSaving(false);
  }

  const displayed = filterStatus ? invoices.filter(i => i.status === filterStatus) : invoices;
  const totalRevenue = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
  const totalPending = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الفواتير</h1>
          <p className="text-muted-foreground text-sm mt-1">{invoices.length} فاتورة</p>
        </div>
        <Button onClick={() => openForm()} className="gap-2"><Plus className="w-4 h-4" /> فاتورة جديدة</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
          <p className="text-sm text-green-700 mb-1">إجمالي المحصّل</p>
          <p className="text-2xl font-bold text-green-800">{totalRevenue.toLocaleString()} ج</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <p className="text-sm text-orange-700 mb-1">المتبقي للتحصيل</p>
          <p className="text-2xl font-bold text-orange-800">{totalPending.toLocaleString()} ج</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["", "pending", "partial", "paid"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {s === "" ? "الكل" : statusLabel[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Receipt className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium">لا توجد فواتير</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(inv => (
            <div key={inv.id} className="bg-card rounded-2xl border border-border p-4 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => openForm(inv)}>
                <div>
                  <p className="font-semibold">{inv.patient_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{inv.date} · {inv.sessions_count} جلسة</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{(inv.total_amount || 0).toLocaleString()} ج</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[inv.status]}`}>
                    {statusLabel[inv.status]}
                  </span>
                </div>
              </div>
              {inv.status !== "paid" && (
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>مدفوع: {(inv.paid_amount || 0).toLocaleString()} ج</span>
                  <span>متبقي: {((inv.total_amount || 0) - (inv.paid_amount || 0)).toLocaleString()} ج</span>
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <ReceiptPDFButton invoice={inv} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-bold text-lg">{editInv ? "تعديل الفاتورة" : "فاتورة جديدة"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>المريض *</Label>
                <select required value={form.patient_id} onChange={e => handlePatientChange(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="">اختر المريض</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>التاريخ</Label>
                <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>عدد الجلسات</Label>
                  <Input type="number" value={form.sessions_count} onChange={e => calcTotal(e.target.value, form.price_per_session)} />
                </div>
                <div className="space-y-1">
                  <Label>سعر الجلسة (ج)</Label>
                  <Input type="number" value={form.price_per_session} onChange={e => calcTotal(form.sessions_count, e.target.value)} />
                </div>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-sm text-muted-foreground">الإجمالي</p>
                <p className="text-2xl font-bold">{(Number(form.total_amount) || 0).toLocaleString()} ج</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>المبلغ المدفوع (ج)</Label>
                  <Input type="number" value={form.paid_amount} onChange={e => set("paid_amount", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>طريقة الدفع</Label>
                  <select value={form.payment_method} onChange={e => set("payment_method", e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="cash">نقداً</option>
                    <option value="card">بطاقة</option>
                    <option value="transfer">تحويل</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>ملاحظات</Label>
                <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="ملاحظات اختيارية..." />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">{saving ? "جاري الحفظ..." : editInv ? "حفظ" : "إضافة"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}