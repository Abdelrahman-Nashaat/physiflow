import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Target, Edit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { differenceInDays } from "date-fns";

export default function TreatmentPlanTab({ patient }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ goal: "", planned_sessions: "", start_date: "", expected_end_date: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [patient.id]);

  async function load() {
    setLoading(true);
    const plans = await base44.entities.TreatmentPlan.filter({ patient_id: patient.id }, "-created_date", 1);
    if (plans[0]) {
      setPlan(plans[0]);
      setForm({
        goal: plans[0].goal || "",
        planned_sessions: plans[0].planned_sessions || "",
        start_date: plans[0].start_date || "",
        expected_end_date: plans[0].expected_end_date || "",
        notes: plans[0].notes || ""
      });
    }
    setLoading(false);
  }

  async function save() {
    if (!form.goal.trim()) return;
    setSaving(true);
    const data = {
      patient_id: patient.id, patient_name: patient.full_name, ...form,
      planned_sessions: form.planned_sessions ? Number(form.planned_sessions) : undefined
    };
    if (plan?.id) await base44.entities.TreatmentPlan.update(plan.id, data);
    else await base44.entities.TreatmentPlan.create(data);
    setSaving(false);
    setEditing(false);
    load();
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const progress = plan?.planned_sessions
    ? Math.min(100, Math.round(((patient.sessions_completed || 0) / plan.planned_sessions) * 100))
    : null;

  const daysLeft = plan?.expected_end_date
    ? differenceInDays(new Date(plan.expected_end_date), new Date())
    : null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> خطة العلاج
        </h3>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-2">
            <Edit2 className="w-4 h-4" /> {plan ? "تعديل" : "إنشاء خطة"}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>إلغاء</Button>
          </div>
        )}
      </div>

      {!plan && !editing ? (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-3">لم يتم تحديد خطة علاج بعد</p>
          <Button size="sm" onClick={() => setEditing(true)} className="gap-2">
            <Plus className="w-4 h-4" /> إنشاء خطة
          </Button>
        </div>
      ) : editing ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>هدف العلاج *</Label>
            <textarea
              value={form.goal}
              onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
              placeholder="مثال: العودة للمشي بدون ألم، تحسين نطاق الحركة..."
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>عدد الجلسات المخططة</Label>
              <Input type="number" value={form.planned_sessions} onChange={e => setForm(f => ({ ...f, planned_sessions: e.target.value }))} placeholder="12" />
            </div>
            <div className="space-y-1">
              <Label>تاريخ البداية</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>تاريخ الانتهاء المتوقع</Label>
            <Input type="date" value={form.expected_end_date} onChange={e => setForm(f => ({ ...f, expected_end_date: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>ملاحظات</Label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-accent rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">🎯 هدف العلاج</p>
            <p className="text-sm font-medium">{plan.goal}</p>
          </div>

          {progress !== null && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">تقدم الجلسات</span>
                <span className="text-muted-foreground">{patient.sessions_completed || 0} / {plan.planned_sessions} جلسة ({progress}%)</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {plan.start_date && (
              <div>
                <p className="text-muted-foreground text-xs">تاريخ البداية</p>
                <p className="font-medium">{plan.start_date}</p>
              </div>
            )}
            {plan.expected_end_date && (
              <div>
                <p className="text-muted-foreground text-xs">الانتهاء المتوقع</p>
                <p className="font-medium">{plan.expected_end_date}</p>
                {daysLeft !== null && daysLeft >= 0 && <p className="text-xs text-primary">باقي {daysLeft} يوم</p>}
                {daysLeft !== null && daysLeft < 0 && <p className="text-xs text-orange-600">تجاوز بـ {Math.abs(daysLeft)} يوم</p>}
              </div>
            )}
          </div>

          {plan.notes && <p className="text-sm text-muted-foreground border-t border-border pt-3">{plan.notes}</p>}
        </div>
      )}
    </div>
  );
}