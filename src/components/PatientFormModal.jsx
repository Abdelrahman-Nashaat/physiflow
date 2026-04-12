import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PatientFormModal({ patient, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: patient?.full_name || "",
    phone: patient?.phone || "",
    age: patient?.age || "",
    gender: patient?.gender || "male",
    diagnosis: patient?.diagnosis || "",
    medical_history: patient?.medical_history || "",
    total_sessions_prescribed: patient?.total_sessions_prescribed || "",
    referred_by: patient?.referred_by || "",
    emergency_contact: patient?.emergency_contact || "",
    notes: patient?.notes || "",
    status: patient?.status || "active",
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, age: form.age ? Number(form.age) : undefined, total_sessions_prescribed: form.total_sessions_prescribed ? Number(form.total_sessions_prescribed) : undefined };
    if (patient?.id) {
      await base44.entities.Patient.update(patient.id, data);
    } else {
      await base44.entities.Patient.create(data);
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-bold text-lg">{patient ? "تعديل المريض" : "مريض جديد"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>الاسم الكامل *</Label>
              <Input required value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="اسم المريض" />
            </div>
            <div className="space-y-1">
              <Label>رقم الهاتف *</Label>
              <Input required value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="01xxxxxxxxx" />
            </div>
            <div className="space-y-1">
              <Label>العمر</Label>
              <Input type="number" value={form.age} onChange={e => set("age", e.target.value)} placeholder="العمر" />
            </div>
            <div className="space-y-1">
              <Label>الجنس</Label>
              <select value={form.gender} onChange={e => set("gender", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>الحالة</Label>
              <select value={form.status} onChange={e => set("status", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="completed">مكتمل</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>التشخيص</Label>
              <Input value={form.diagnosis} onChange={e => set("diagnosis", e.target.value)} placeholder="التشخيص الطبي" />
            </div>
            <div className="space-y-1">
              <Label>عدد الجلسات المقررة</Label>
              <Input type="number" value={form.total_sessions_prescribed} onChange={e => set("total_sessions_prescribed", e.target.value)} placeholder="12" />
            </div>
            <div className="space-y-1">
              <Label>محول من</Label>
              <Input value={form.referred_by} onChange={e => set("referred_by", e.target.value)} placeholder="اسم الطبيب أو المستشفى" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>التاريخ المرضي</Label>
              <textarea value={form.medical_history} onChange={e => set("medical_history", e.target.value)}
                placeholder="الأمراض السابقة، العمليات، الأدوية..." rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>جهة الاتصال في الطوارئ</Label>
              <Input value={form.emergency_contact} onChange={e => set("emergency_contact", e.target.value)} placeholder="الاسم ورقم الهاتف" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>ملاحظات</Label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder="ملاحظات إضافية..." rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "جاري الحفظ..." : patient ? "حفظ التعديلات" : "إضافة المريض"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </form>
      </div>
    </div>
  );
}