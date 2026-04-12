import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AppointmentFormModal({ appointment, defaultDate, onClose, onSaved }) {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patient_id: appointment?.patient_id || "",
    patient_name: appointment?.patient_name || "",
    date: appointment?.date || defaultDate || "",
    time: appointment?.time || "09:00",
    duration_minutes: appointment?.duration_minutes || 45,
    type: appointment?.type || "followup",
    status: appointment?.status || "scheduled",
    session_number: appointment?.session_number || "",
    notes: appointment?.notes || "",
    pain_level_before: appointment?.pain_level_before || "",
    techniques_used: appointment?.techniques_used || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Patient.list("-created_date", 200).then(setPatients);
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handlePatientChange(id) {
    const p = patients.find(p => p.id === id);
    set("patient_id", id);
    set("patient_name", p?.full_name || "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      duration_minutes: Number(form.duration_minutes),
      session_number: form.session_number ? Number(form.session_number) : undefined,
      pain_level_before: form.pain_level_before ? Number(form.pain_level_before) : undefined,
    };
    if (appointment?.id) {
      await base44.entities.Appointment.update(appointment.id, data);
    } else {
      await base44.entities.Appointment.create(data);
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-bold text-lg">{appointment ? "تعديل الموعد" : "موعد جديد"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>التاريخ *</Label>
              <Input required type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>الوقت *</Label>
              <Input required type="time" value={form.time} onChange={e => set("time", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>المدة (دقائق)</Label>
              <Input type="number" value={form.duration_minutes} onChange={e => set("duration_minutes", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>رقم الجلسة</Label>
              <Input type="number" value={form.session_number} onChange={e => set("session_number", e.target.value)} placeholder="1" />
            </div>
            <div className="space-y-1">
              <Label>نوع الجلسة</Label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="initial">أول زيارة</option>
                <option value="followup">متابعة</option>
                <option value="final">جلسة نهائية</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>الحالة</Label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="scheduled">مجدول</option>
                <option value="confirmed">مؤكد</option>
                <option value="completed">منتهى</option>
                <option value="cancelled">ملغى</option>
                <option value="no_show">لم يحضر</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>التقنيات المستخدمة</Label>
            <Input value={form.techniques_used} onChange={e => set("techniques_used", e.target.value)} placeholder="مثل: TENS, يدوي, تمدد..." />
          </div>
          <div className="space-y-1">
            <Label>ملاحظات</Label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              rows={2} placeholder="ملاحظات الجلسة..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "جاري الحفظ..." : appointment ? "حفظ التعديلات" : "إضافة الموعد"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </form>
      </div>
    </div>
  );
}