import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, AlertTriangle, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

const STATUS_CFG = {
  completed: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 border-green-200", label: "✅ مكتمل" },
  partial:   { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "⚠️ جزئي" },
  missed:    { icon: XCircle, color: "text-red-500", bg: "bg-red-50 border-red-200", label: "❌ لم يتم" },
};

export default function HomeFollowupTab({ patient }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ log_date: format(new Date(), "yyyy-MM-dd"), status: "completed", notes: "", logged_by: "doctor" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [patient.id]);

  async function load() {
    setLoading(true);
    const data = await base44.entities.HomeExerciseLog.filter({ patient_id: patient.id }, "-log_date", 60);
    setLogs(data);
    setLoading(false);
  }

  async function save() {
    if (!form.log_date) return;
    setSaving(true);
    const data = { ...form, patient_id: patient.id, patient_name: patient.full_name };
    if (editingId) await base44.entities.HomeExerciseLog.update(editingId, data);
    else await base44.entities.HomeExerciseLog.create(data);
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm({ log_date: format(new Date(), "yyyy-MM-dd"), status: "completed", notes: "", logged_by: "doctor" });
    load();
  }

  function startEdit(log) {
    setForm({ log_date: log.log_date, status: log.status, notes: log.notes || "", logged_by: log.logged_by || "doctor" });
    setEditingId(log.id);
    setShowForm(true);
  }

  const totalLogs = logs.length;
  const completedLogs = logs.filter(l => l.status === "completed").length;
  const compliance = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "مكتمل", val: logs.filter(l => l.status === "completed").length, color: "text-green-700", bg: "bg-green-50 border-green-100" },
          { label: "جزئي",  val: logs.filter(l => l.status === "partial").length,   color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
          { label: "لم يتم", val: logs.filter(l => l.status === "missed").length,   color: "text-red-600",   bg: "bg-red-50 border-red-100" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 text-center border ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Compliance bar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">نسبة الالتزام</span>
          <span className={`text-lg font-bold ${compliance >= 75 ? "text-green-600" : compliance >= 50 ? "text-amber-600" : "text-red-600"}`}>
            {compliance}%
          </span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${compliance >= 75 ? "bg-green-500" : compliance >= 50 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${compliance}%` }}
          />
        </div>
      </div>

      <Button size="sm" variant="outline" className="w-full gap-2"
        onClick={() => { setShowForm(true); setEditingId(null); setForm({ log_date: format(new Date(), "yyyy-MM-dd"), status: "completed", notes: "", logged_by: "doctor" }); }}>
        <Plus className="w-4 h-4" /> إضافة سجل يوم
      </Button>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold">{editingId ? "تعديل السجل" : "سجل جديد"}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">التاريخ *</Label>
              <input type="date" value={form.log_date} onChange={e => setForm(f => ({ ...f, log_date: e.target.value }))}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">الحالة</Label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm">
                <option value="completed">✅ مكتمل</option>
                <option value="partial">⚠️ جزئي</option>
                <option value="missed">❌ لم يتم</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">سجّل بواسطة</Label>
            <select value={form.logged_by} onChange={e => setForm(f => ({ ...f, logged_by: e.target.value }))}
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm">
              <option value="doctor">الدكتور</option>
              <option value="secretary">السكرتيرة</option>
              <option value="patient">المريض</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">ملاحظة</Label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm resize-none" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving} className="flex-1">{saving ? "جاري الحفظ..." : "حفظ"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>لا توجد سجلات متابعة بعد</p>
        </div>
      ) : logs.map(log => {
        const cfg = STATUS_CFG[log.status] || STATUS_CFG.missed;
        const Icon = cfg.icon;
        return (
          <div key={log.id} onClick={() => startEdit(log)}
            className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer hover:opacity-90 transition-all ${cfg.bg}`}>
            <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.color}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{log.log_date}</p>
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
              </div>
              {log.notes && <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">
                بواسطة: {log.logged_by === "doctor" ? "الدكتور" : log.logged_by === "secretary" ? "السكرتيرة" : "المريض"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}