import { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { LayoutTemplate, Plus, X, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categoryLabel = {
  spine: "العمود الفقري", knee: "الركبة", shoulder: "الكتف",
  hip: "الورك", ankle: "الكاحل", neck: "الرقبة", general: "عام"
};

const EMPTY = { name: "", category: "general", subjective: "", objective: "", assessment: "", plan: "", exercises: "" };

export default function SoapTemplateSelector({ onApply }) {
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (open) loadTemplates(); }, [open]);

  async function loadTemplates() {
    try {
      const data = await api.entities.SoapTemplate.list("name", 50);
      setTemplates(data);
    } catch (e) { console.error(e); }
  }

  async function saveTemplate() {
    if (!form.name.trim()) { setError("اسم القالب مطلوب"); return; }
    setError("");
    setSaving(true);
    try {
      await api.entities.SoapTemplate.create({ ...form });
      setShowCreate(false);
      setForm(EMPTY);
      await loadTemplates();
    } catch (e) {
      setError("فشل الحفظ: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id) {
    try {
      await api.entities.SoapTemplate.delete(id);
      setConfirmDelete(null);
      await loadTemplates();
    } catch (e) { console.error(e); }
  }

  function applyTemplate(t) {
    onApply({ subjective: t.subjective || "", objective: t.objective || "", assessment: t.assessment || "", plan: t.plan || "", exercises: t.exercises || "" });
    setOpen(false);
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="relative">
      <Button type="button" variant="outline" size="sm" onClick={() => { setOpen(o => !o); setShowCreate(false); }} className="gap-2">
        <LayoutTemplate className="w-4 h-4" /> قوالب SOAP
      </Button>

      {open && (
        <div className="absolute right-0 top-10 w-96 bg-card border border-border rounded-2xl shadow-2xl z-[100]" style={{ maxHeight: "480px", overflowY: "auto" }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
            <h4 className="font-semibold text-sm">قوالب الجلسات</h4>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCreate(s => !s)} className="p-1.5 rounded-lg hover:bg-accent text-primary">
                <Plus className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Create Form */}
          {showCreate && (
            <div className="p-4 border-b border-border bg-muted/30 space-y-3">
              <p className="text-sm font-semibold">قالب جديد</p>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="space-y-1">
                <Label className="text-xs">اسم القالب *</Label>
                <Input value={form.name} onChange={e => set("name", e.target.value)} className="h-8 text-sm" placeholder="مثال: ركبة - جلسة متابعة" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الفئة</Label>
                <select value={form.category} onChange={e => set("category", e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                  {Object.entries(categoryLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {[["subjective", "الشكوى (S)"], ["objective", "الفحص (O)"], ["assessment", "التقييم (A)"], ["plan", "الخطة (P)"], ["exercises", "التمارين"]].map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <textarea value={form[field]} onChange={e => set(field, e.target.value)} rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm resize-none" />
                </div>
              ))}
              <div className="flex gap-2">
                <Button type="button" size="sm" disabled={saving} onClick={saveTemplate} className="flex-1">
                  {saving ? "جاري الحفظ..." : "حفظ القالب"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setShowCreate(false); setError(""); }}>إلغاء</Button>
              </div>
            </div>
          )}

          {/* Templates List */}
          <div>
            {templates.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">لا توجد قوالب — اضغط + لإضافة قالب</p>
            ) : templates.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-0">
                <div className="flex-1 cursor-pointer" onClick={() => applyTemplate(t)}>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{categoryLabel[t.category] || t.category}</p>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => applyTemplate(t)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="تطبيق">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(t.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg" title="حذف">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold mb-2">حذف القالب</h3>
            <p className="text-sm text-muted-foreground mb-5">هل أنت متأكد؟ لا يمكن التراجع.</p>
            <div className="flex gap-3">
              <Button type="button" variant="destructive" className="flex-1" onClick={() => deleteTemplate(confirmDelete)}>حذف</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
