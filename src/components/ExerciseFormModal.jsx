import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ExerciseFormModal({ exercise, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: exercise?.name || "",
    category: exercise?.category || "general",
    description: exercise?.description || "",
    instructions: exercise?.instructions || "",
    sets: exercise?.sets || "",
    reps: exercise?.reps || "",
    duration_seconds: exercise?.duration_seconds || "",
    frequency: exercise?.frequency || "",
    precautions: exercise?.precautions || "",
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function generateInstructions() {
    setGenerating(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `أنت معالج طبيعي خبير. اكتب تعليمات احترافية واضحة باللغة العربية للتمرين التالي:
اسم التمرين: ${form.name}
الفئة: ${form.category}
الوصف: ${form.description}

اكتب التعليمات خطوة بخطوة (3-5 خطوات) بشكل واضح وبسيط يفهمه المريض.`
    });
    set("instructions", res);
    setGenerating(false);
  }

  async function save() {
    setSaving(true);
    const data = {
      ...form,
      sets: form.sets ? Number(form.sets) : undefined,
      reps: form.reps ? Number(form.reps) : undefined,
      duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : undefined,
    };
    if (exercise?.id) {
      await base44.entities.ExerciseTemplate.update(exercise.id, data);
    } else {
      await base44.entities.ExerciseTemplate.create(data);
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-bold text-lg">{exercise ? "تعديل التمرين" : "تمرين جديد"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>اسم التمرين *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="مثل: تمرين تقوية الظهر" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>الفئة</Label>
              <select value={form.category} onChange={e => set("category", e.target.value)} className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                <option value="spine">العمود الفقري</option>
                <option value="knee">الركبة</option>
                <option value="shoulder">الكتف</option>
                <option value="hip">الورك</option>
                <option value="ankle">الكاحل</option>
                <option value="neck">الرقبة</option>
                <option value="general">عام</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>الوصف</Label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="وصف التمرين..." className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none h-16" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>التعليمات</Label>
              <Button size="sm" variant="ghost" onClick={generateInstructions} disabled={generating || !form.name} className="h-7 gap-1 text-xs text-primary">
                {generating ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                توليد AI
              </Button>
            </div>
            <textarea value={form.instructions} onChange={e => set("instructions", e.target.value)} placeholder="تعليمات التمرين خطوة بخطوة..." className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none h-24" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>مجموعات</Label>
              <Input type="number" value={form.sets} onChange={e => set("sets", e.target.value)} placeholder="3" className="mt-1" />
            </div>
            <div>
              <Label>تكرارات</Label>
              <Input type="number" value={form.reps} onChange={e => set("reps", e.target.value)} placeholder="10" className="mt-1" />
            </div>
            <div>
              <Label>ثواني</Label>
              <Input type="number" value={form.duration_seconds} onChange={e => set("duration_seconds", e.target.value)} placeholder="30" className="mt-1" />
            </div>
          </div>

          <div>
            <Label>التكرار</Label>
            <Input value={form.frequency} onChange={e => set("frequency", e.target.value)} placeholder="مثل: مرتين يومياً" className="mt-1" />
          </div>

          <div>
            <Label>تحذيرات</Label>
            <textarea value={form.precautions} onChange={e => set("precautions", e.target.value)} placeholder="أي تحذيرات أو موانع..." className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none h-14" />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border">
          <Button onClick={save} disabled={saving || !form.name} className="flex-1">
            {saving ? "جاري الحفظ..." : "حفظ التمرين"}
          </Button>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
        </div>
      </div>
    </div>
  );
}