import { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { X, Sparkles, Download } from "lucide-react";
import SoapTemplateSelector from "@/components/SoapTemplateSelector";
import ExercisePicker from "@/components/ExercisePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function PainScale({ value, onChange, label }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1.5 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all border ${
              value === n
                ? n <= 3 ? "bg-green-500 text-white border-green-500"
                : n <= 6 ? "bg-amber-500 text-white border-amber-500"
                : "bg-red-500 text-white border-red-500"
                : "bg-muted text-muted-foreground border-transparent hover:border-border"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SessionNoteModal({ note, patientId, onClose, onSaved }) {
  const [patients, setPatients] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [form, setForm] = useState({
    patient_id: note?.patient_id || patientId || "",
    patient_name: note?.patient_name || "",
    session_date: note?.session_date || new Date().toISOString().split("T")[0],
    session_number: note?.session_number || "",
    subjective: note?.subjective || "",
    objective: note?.objective || "",
    assessment: note?.assessment || "",
    plan: note?.plan || "",
    exercises: note?.exercises || "",
    pain_before: note?.pain_before ?? null,
    pain_after: note?.pain_after ?? null,
    progress_rating: note?.progress_rating || "",
    ai_summary: note?.ai_summary || "",
  });
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [loadingLast, setLoadingLast] = useState(false);

  useEffect(() => {
    api.entities.Patient.list("-created_date", 200).then(setPatients);
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handlePatientChange(id) {
    const p = patients.find(p => p.id === id);
    set("patient_id", id);
    set("patient_name", p?.full_name || "");
  }

  function applyTemplate(t) {
    setForm(f => ({ ...f, ...t }));
  }

  async function importLastSession() {
    const pid = form.patient_id;
    if (!pid) return;
    setLoadingLast(true);
    const prev = await api.entities.SessionNote.filter({ patient_id: pid }, "-session_number", 2);
    const last = prev.find(s => !note || s.id !== note.id);
    if (last) {
      setForm(f => ({
        ...f,
        subjective: last.subjective || "",
        objective: last.objective || "",
        assessment: last.assessment || "",
        plan: last.plan || "",
        exercises: last.exercises || "",
        pain_before: last.pain_before ?? null,
        pain_after: last.pain_after ?? null,
      }));
    }
    setLoadingLast(false);
  }

  function handleExercisesChange(exs) {
    setSelectedExercises(exs);
    const text = exs.map(e => `${e.name}${e.sets ? ` - ${e.sets} مجموعات` : ""}${e.reps ? ` × ${e.reps} تكرار` : ""}`).join("\n");
    set("exercises", text);
  }

  async function generateAI() {
    setGeneratingAI(true);
    const res = await api.integrations.Core.InvokeLLM({
      prompt: `أنت معالج طبيعي. قدم ملخصاً احترافياً موجزاً للجلسة التالية باللغة العربية:
الشكوى: ${form.subjective}
الفحص: ${form.objective}
التقييم: ${form.assessment}
الخطة: ${form.plan}
الألم قبل: ${form.pain_before}/10، بعد: ${form.pain_after}/10
اكتب ملخصاً من 2-3 جمل فقط.`
    });
    set("ai_summary", res);
    setGeneratingAI(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patient_id) return;
    setSaving(true);
    const data = {
      ...form,
      session_number: form.session_number ? Number(form.session_number) : undefined,
      pain_before: form.pain_before !== null ? Number(form.pain_before) : undefined,
      pain_after: form.pain_after !== null ? Number(form.pain_after) : undefined,
    };
    if (note?.id) await api.entities.SessionNote.update(note.id, data);
    else await api.entities.SessionNote.create(data);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-bold text-lg">{note ? "تعديل ملاحظات الجلسة" : "جلسة جديدة"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Toolbar */}
          <div className="flex gap-2 flex-wrap justify-between">
            <SoapTemplateSelector onApply={applyTemplate} />
            <Button type="button" size="sm" variant="outline" onClick={importLastSession} disabled={!form.patient_id || loadingLast} className="gap-2">
              {loadingLast ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
              استيراد من آخر جلسة
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>المريض *</Label>
              <select
                required
                value={form.patient_id}
                onChange={e => handlePatientChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">اختر المريض</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>تاريخ الجلسة *</Label>
              <Input required type="date" value={form.session_date} onChange={e => set("session_date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>رقم الجلسة</Label>
              <Input type="number" value={form.session_number} onChange={e => set("session_number", e.target.value)} />
            </div>
          </div>

          {/* SOAP fields */}
          {[
            { key: "subjective", label: "الشكوى (S)", placeholder: "ما يقوله المريض عن حالته..." },
            { key: "objective",  label: "الفحص (O)",  placeholder: "نتائج الفحص الموضوعي..." },
            { key: "assessment", label: "التقييم (A)", placeholder: "تقييم الحالة..." },
            { key: "plan",       label: "الخطة (P)",  placeholder: "خطة الجلسات القادمة..." },
          ].map(f => (
            <div key={f.key} className="space-y-1">
              <Label>{f.label}</Label>
              <textarea
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none"
              />
            </div>
          ))}

          {/* Exercise Picker */}
          <div className="space-y-1">
            <Label>التمارين المنزلية</Label>
            <ExercisePicker selected={selectedExercises} onChange={handleExercisesChange} />
            <textarea
              value={form.exercises}
              onChange={e => set("exercises", e.target.value)}
              rows={2}
              placeholder="أو اكتب التمارين يدوياً..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none mt-2"
            />
          </div>

          {/* Pain Scale */}
          <div className="space-y-4">
            <PainScale value={form.pain_before} onChange={v => set("pain_before", v)} label="مستوى الألم قبل الجلسة (0-10)" />
            <PainScale value={form.pain_after}  onChange={v => set("pain_after", v)}  label="مستوى الألم بعد الجلسة (0-10)" />
          </div>

          <div className="space-y-1">
            <Label>تقييم التقدم</Label>
            <select value={form.progress_rating} onChange={e => set("progress_rating", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option value="">اختر</option>
              <option value="excellent">ممتاز</option>
              <option value="good">جيد</option>
              <option value="fair">متوسط</option>
              <option value="poor">ضعيف</option>
            </select>
          </div>

          {/* AI Summary */}
          <div className="space-y-2 bg-accent rounded-xl p-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> ملخص AI
              </Label>
              <Button type="button" size="sm" variant="outline" onClick={generateAI} disabled={generatingAI} className="gap-1 text-xs">
                {generatingAI
                  ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  : <Sparkles className="w-3 h-3" />}
                {generatingAI ? "جاري التوليد..." : "توليد"}
              </Button>
            </div>
            <textarea
              value={form.ai_summary}
              onChange={e => set("ai_summary", e.target.value)}
              rows={3}
              placeholder="سيتم توليد الملخص تلقائياً..."
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "جاري الحفظ..." : note ? "حفظ التعديلات" : "إضافة الجلسة"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </form>
      </div>
    </div>
  );
}