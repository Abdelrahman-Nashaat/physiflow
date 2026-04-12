import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Activity, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categories = [
  { value: "spine", label: "العمود الفقري" },
  { value: "knee", label: "الركبة" },
  { value: "shoulder", label: "الكتف" },
  { value: "hip", label: "الورك" },
  { value: "ankle", label: "الكاحل" },
  { value: "neck", label: "الرقبة" },
  { value: "general", label: "عام" },
];

export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEx, setEditEx] = useState(null);
  const [form, setForm] = useState({ name: "", category: "general", description: "", instructions: "", sets: "", reps: "", duration_seconds: "", frequency: "", precautions: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadExercises(); }, []);

  useEffect(() => {
    let data = exercises;
    if (catFilter) data = data.filter(e => e.category === catFilter);
    if (search) data = data.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(data);
  }, [search, catFilter, exercises]);

  async function loadExercises() {
    setLoading(true);
    const data = await base44.entities.ExerciseTemplate.list("name", 200);
    setExercises(data);
    setFiltered(data);
    setLoading(false);
  }

  function openForm(ex = null) {
    setEditEx(ex);
    setForm(ex ? { name: ex.name, category: ex.category, description: ex.description || "", instructions: ex.instructions || "", sets: ex.sets || "", reps: ex.reps || "", duration_seconds: ex.duration_seconds || "", frequency: ex.frequency || "", precautions: ex.precautions || "" } : { name: "", category: "general", description: "", instructions: "", sets: "", reps: "", duration_seconds: "", frequency: "", precautions: "" });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, sets: form.sets ? Number(form.sets) : undefined, reps: form.reps ? Number(form.reps) : undefined, duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : undefined };
    if (editEx?.id) await base44.entities.ExerciseTemplate.update(editEx.id, data);
    else await base44.entities.ExerciseTemplate.create(data);
    setShowForm(false);
    setSaving(false);
    loadExercises();
  }

  const catLabel = (v) => categories.find(c => c.value === v)?.label || v;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">بنك التمارين</h1>
          <p className="text-muted-foreground text-sm mt-1">{exercises.length} تمرين مسجل</p>
        </div>
        <Button onClick={() => openForm()} className="gap-2"><Plus className="w-4 h-4" /> تمرين جديد</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
          <option value="">كل الفئات</option>
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium">لا توجد تمارين</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ex => (
            <div key={ex.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-all cursor-pointer" onClick={() => openForm(ex)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-accent-foreground" />
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">{catLabel(ex.category)}</span>
              </div>
              <h3 className="font-semibold">{ex.name}</h3>
              {ex.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ex.description}</p>}
              <div className="flex gap-2 mt-3 flex-wrap">
                {ex.sets && <span className="text-xs bg-muted px-2 py-0.5 rounded">{ex.sets} مجموعات</span>}
                {ex.reps && <span className="text-xs bg-muted px-2 py-0.5 rounded">{ex.reps} تكرار</span>}
                {ex.duration_seconds && <span className="text-xs bg-muted px-2 py-0.5 rounded">{ex.duration_seconds} ثانية</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-bold text-lg">{editEx ? "تعديل التمرين" : "تمرين جديد"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>اسم التمرين *</Label>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>الفئة</Label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>الوصف</Label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none" />
              </div>
              <div className="space-y-1">
                <Label>التعليمات</Label>
                <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={3}
                  placeholder="خطوات أداء التمرين..."
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label>مجموعات</Label><Input type="number" value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))} /></div>
                <div className="space-y-1"><Label>تكرارات</Label><Input type="number" value={form.reps} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} /></div>
                <div className="space-y-1"><Label>مدة (ثانية)</Label><Input type="number" value={form.duration_seconds} onChange={e => setForm(f => ({ ...f, duration_seconds: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label>التكرار اليومي</Label><Input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} placeholder="مثل: مرتين يومياً" /></div>
              <div className="space-y-1"><Label>تحذيرات</Label><Input value={form.precautions} onChange={e => setForm(f => ({ ...f, precautions: e.target.value }))} placeholder="تحذيرات أو موانع..." /></div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">{saving ? "جاري الحفظ..." : editEx ? "حفظ" : "إضافة"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}