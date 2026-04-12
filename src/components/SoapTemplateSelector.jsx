import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LayoutTemplate, Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categoryLabel = {
  spine: "العمود الفقري", knee: "الركبة", shoulder: "الكتف",
  hip: "الورك", ankle: "الكاحل", neck: "الرقبة", general: "عام"
};

export default function SoapTemplateSelector({ onApply }) {
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: "", category: "general", subjective: "", objective: "", assessment: "", plan: "", exercises: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) loadTemplates(); }, [open]);

  async function loadTemplates() {
    const data = await base44.entities.SoapTemplate.list("name", 50);
    setTemplates(data);
  }

  async function saveTemplate(e) {
    e.preventDefault();
    setSaving(true);
    await base44.entities.SoapTemplate.create(form);
    setSaving(false);
    setShowCreate(false);
    setForm({ name: "", category: "general", subjective: "", objective: "", assessment: "", plan: "", exercises: "" });
    loadTemplates();
  }

  async function deleteTemplate(id) {
    await base44.entities.SoapTemplate.delete(id);
    setConfirmDelete(null);
    loadTemplates();
  }

  function applyTemplate(t) {
    onApply({ subjective: t.subjective || "", objective: t.objective || "", assessment: t.assessment || "", plan: t.plan || "", exercises: t.exercises || "" });
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(o => !o)} className="gap-2">
        <LayoutTemplate className="w-4 h-4" /> قوالب SOAP
      </Button>

      {open && (
        <div className="absolute right-0 top-10 w-96 bg-card border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h4 className="font-semibold text-sm">قوالب الجلسات</h4>
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(true)} className="p-1.5 rounded-lg hover:bg-accent text-primary">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {templates.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">لا توجد قوالب بعد</p>
            ) : templates.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-0">
                <div className="flex-1 cursor-pointer" onClick={() => applyTemplate(t)}>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{categoryLabel[t.category] || t.category}</p>
                </div>
                <button onClick={() => setConfirmDelete(t.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {showCreate && (
            <form onSubmit={saveTemplate} className="p-4 border-t border-border space-y-3 bg-muted/30">
              <p className="text-sm font-semibold">قالب جديد</p>
              <div className="space-y-1">
                <Label className="text-xs">اسم القالب *</Label>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الفئة</Label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm">
                  {Object.entries(categoryLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {["subjective", "objective", "assessment", "plan", "exercises"].map(field => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs">{field === "subjective" ? "الشكوى" : field === "objective" ? "الفحص" : field === "assessment" ? "التقييم" : field === "plan" ? "الخطة" : "التمارين"}</Label>
                  <textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm resize-none" />
                </div>
              ))}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving} className="flex-1">{saving ? "جاري الحفظ..." : "حفظ"}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold mb-2">حذف القالب</h3>
            <p className="text-sm text-muted-foreground mb-5">هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع.</p>
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={() => deleteTemplate(confirmDelete)}>نعم، احذف</Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}