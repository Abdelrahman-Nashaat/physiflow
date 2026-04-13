import { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InvoiceFormModal({ invoice, onClose, onSaved }) {
  const [form, setForm] = useState({
    patient_id: invoice?.patient_id || "",
    patient_name: invoice?.patient_name || "",
    date: invoice?.date || new Date().toISOString().split("T")[0],
    sessions_count: invoice?.sessions_count || 1,
    price_per_session: invoice?.price_per_session || "",
    total_amount: invoice?.total_amount || "",
    paid_amount: invoice?.paid_amount || 0,
    payment_method: invoice?.payment_method || "cash",
    status: invoice?.status || "pending",
    notes: invoice?.notes || "",
  });
  const [patients, setPatients] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.entities.Patient.list("-full_name", 200).then(setPatients);
  }, []);

  const set = (k, v) => setForm(f => {
    const updated = { ...f, [k]: v };
    if (k === "sessions_count" || k === "price_per_session") {
      const total = Number(updated.sessions_count || 0) * Number(updated.price_per_session || 0);
      updated.total_amount = total;
    }
    if (k === "paid_amount" || k === "total_amount") {
      const remaining = Number(updated.total_amount || 0) - Number(updated.paid_amount || 0);
      updated.status = remaining <= 0 ? "paid" : Number(updated.paid_amount) > 0 ? "partial" : "pending";
    }
    return updated;
  });

  function selectPatient(id) {
    const p = patients.find(p => p.id === id);
    set("patient_id", id);
    if (p) setForm(f => ({ ...f, patient_id: id, patient_name: p.full_name }));
  }

  async function save() {
    setSaving(true);
    const data = {
      ...form,
      sessions_count: Number(form.sessions_count),
      price_per_session: Number(form.price_per_session),
      total_amount: Number(form.total_amount),
      paid_amount: Number(form.paid_amount),
      remaining: Number(form.total_amount) - Number(form.paid_amount),
    };
    if (invoice?.id) {
      await api.entities.Invoice.update(invoice.id, data);
    } else {
      await api.entities.Invoice.create(data);
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-bold text-lg">{invoice ? "تعديل الفاتورة" : "فاتورة جديدة"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label>المريض *</Label>
            <select value={form.patient_id} onChange={e => selectPatient(e.target.value)} className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
              <option value="">اختر مريضاً</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>

          <div>
            <Label>التاريخ *</Label>
            <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>عدد الجلسات</Label>
              <Input type="number" value={form.sessions_count} onChange={e => set("sessions_count", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>سعر الجلسة (ج)</Label>
              <Input type="number" value={form.price_per_session} onChange={e => set("price_per_session", e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="bg-muted rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">الإجمالي</p>
            <p className="text-2xl font-bold text-primary">{Number(form.total_amount || 0).toLocaleString()} ج</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>المدفوع (ج)</Label>
              <Input type="number" value={form.paid_amount} onChange={e => set("paid_amount", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>طريقة الدفع</Label>
              <select value={form.payment_method} onChange={e => set("payment_method", e.target.value)} className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                <option value="cash">نقدي</option>
                <option value="card">بطاقة</option>
                <option value="transfer">تحويل</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between bg-muted rounded-xl p-3">
            <span className="text-sm">المتبقي</span>
            <span className="font-bold text-orange-600">{Math.max(0, Number(form.total_amount || 0) - Number(form.paid_amount || 0)).toLocaleString()} ج</span>
          </div>

          <div>
            <Label>ملاحظات</Label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none h-16" />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border">
          <Button onClick={save} disabled={saving || !form.patient_id || !form.total_amount} className="flex-1">
            {saving ? "جاري الحفظ..." : "حفظ الفاتورة"}
          </Button>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
        </div>
      </div>
    </div>
  );
}