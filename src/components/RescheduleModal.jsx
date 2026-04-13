import { useState } from "react";
import { api } from "@/api/apiClient";
import { X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RescheduleModal({ appointment, onClose, onSaved }) {
  const [form, setForm] = useState({
    date: appointment.date || "",
    time: appointment.time || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.date) { setError("يرجى تحديد التاريخ الجديد"); return; }
    if (!form.time) { setError("يرجى تحديد الوقت الجديد"); return; }
    setSaving(true);
    await api.entities.Appointment.update(appointment.id, {
      date: form.date,
      time: form.time,
      status: "scheduled",
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> تأجيل الموعد
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-muted rounded-xl p-3 text-sm text-muted-foreground">
            المريض: <span className="font-semibold text-foreground">{appointment.patient_name}</span><br />
            الموعد الحالي: {appointment.date} — {appointment.time}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-1">
            <Label>التاريخ الجديد *</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>الوقت الجديد *</Label>
            <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "جاري الحفظ..." : "تأجيل الموعد"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </form>
      </div>
    </div>
  );
}