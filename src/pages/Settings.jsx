import { useEffect, useState } from "react";
import { base44, supabase } from "@/api/base44Client";
import { Settings2, Save, Clock, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = [
  { key: "sat", label: "السبت" }, { key: "sun", label: "الأحد" },
  { key: "mon", label: "الاثنين" }, { key: "tue", label: "الثلاثاء" },
  { key: "wed", label: "الأربعاء" }, { key: "thu", label: "الخميس" },
  { key: "fri", label: "الجمعة" },
];

const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map(d => [d.key, { open: d.key !== "fri", from: "09:00", to: "18:00" }])
);

export default function Settings() {
  const [settingsId, setSettingsId] = useState(null);
  const [form, setForm] = useState({
    clinic_name: "", doctor_name: "", phone: "", address: "",
    logo_url: "", default_session_price: "", initial_session_price: "", final_session_price: "",
  });
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const data = await base44.entities.ClinicSettings.list("-created_at", 1);
      if (data[0]) {
        const s = data[0];
        setSettingsId(s.id);
        setForm({
          clinic_name: s.clinic_name || "",
          doctor_name: s.doctor_name || "",
          phone: s.phone || "",
          address: s.address || "",
          logo_url: s.logo_url || "",
          default_session_price: s.default_session_price || "",
          initial_session_price: s.initial_session_price || "",
          final_session_price: s.final_session_price || "",
        });
        if (s.working_hours) {
          try { setHours(JSON.parse(s.working_hours)); } catch {}
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setHour(day, field, val) { setHours(h => ({ ...h, [day]: { ...h[day], [field]: val } })); }

  async function uploadLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("clinic-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("clinic-assets").getPublicUrl(path);
      set("logo_url", data.publicUrl);
    } catch (e) {
      alert("فشل رفع الصورة. تأكد من إنشاء bucket باسم 'clinic-assets' في Supabase Storage");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.clinic_name.trim()) { alert("اسم العيادة مطلوب"); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        default_session_price: form.default_session_price ? Number(form.default_session_price) : null,
        initial_session_price: form.initial_session_price ? Number(form.initial_session_price) : null,
        final_session_price: form.final_session_price ? Number(form.final_session_price) : null,
        working_hours: JSON.stringify(hours),
      };
      if (settingsId) {
        await base44.entities.ClinicSettings.update(settingsId, data);
      } else {
        const created = await base44.entities.ClinicSettings.create(data);
        setSettingsId(created.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("فشل الحفظ: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">إعدادات العيادة</h1>
          <p className="text-sm text-muted-foreground">بيانات العيادة وساعات العمل والأسعار</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Clinic Info */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" /> بيانات العيادة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>اسم العيادة *</Label>
              <Input value={form.clinic_name} onChange={e => set("clinic_name", e.target.value)} placeholder="عيادة د. أحمد للعلاج الطبيعي" required />
            </div>
            <div className="space-y-1.5">
              <Label>اسم الدكتور</Label>
              <Input value={form.doctor_name} onChange={e => set("doctor_name", e.target.value)} placeholder="د. أحمد محمد" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم التليفون</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="01xxxxxxxxx" />
            </div>
            <div className="space-y-1.5">
              <Label>العنوان</Label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="طنطا، شارع..." />
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label>شعار العيادة</Label>
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img src={form.logo_url} alt="logo" className="w-16 h-16 rounded-xl object-contain border border-border bg-muted" />
              ) : (
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => document.getElementById("logo-input").click()}>
                    {uploading ? "جاري الرفع..." : "رفع شعار"}
                  </Button>
                  <input id="logo-input" type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                </label>
                <p className="text-xs text-muted-foreground mt-1">PNG أو JPG — يظهر في الـ PDFs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> ساعات العمل
          </h2>
          <div className="space-y-3">
            {DAYS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-4">
                <div className="w-24 flex items-center gap-2">
                  <input type="checkbox" checked={hours[key]?.open || false} onChange={e => setHour(key, "open", e.target.checked)}
                    className="w-4 h-4 accent-primary" id={`day-${key}`} />
                  <label htmlFor={`day-${key}`} className="text-sm font-medium cursor-pointer">{label}</label>
                </div>
                {hours[key]?.open ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input type="time" value={hours[key]?.from || "09:00"} onChange={e => setHour(key, "from", e.target.value)} className="w-32 h-8 text-sm" />
                    <span className="text-muted-foreground text-sm">إلى</span>
                    <Input type="time" value={hours[key]?.to || "18:00"} onChange={e => setHour(key, "to", e.target.value)} className="w-32 h-8 text-sm" />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">مغلق</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Prices */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-base">أسعار الجلسات</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>سعر الجلسة الافتراضي (ج)</Label>
              <Input type="number" value={form.default_session_price} onChange={e => set("default_session_price", e.target.value)} placeholder="200" />
            </div>
            <div className="space-y-1.5">
              <Label>سعر الجلسة الأولى (ج)</Label>
              <Input type="number" value={form.initial_session_price} onChange={e => set("initial_session_price", e.target.value)} placeholder="300" />
            </div>
            <div className="space-y-1.5">
              <Label>سعر جلسة الإنهاء (ج)</Label>
              <Input type="number" value={form.final_session_price} onChange={e => set("final_session_price", e.target.value)} placeholder="250" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} className="gap-2 px-8">
            <Save className="w-4 h-4" />
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
          {saved && <span className="text-green-600 text-sm font-medium">✅ تم الحفظ بنجاح</span>}
        </div>
      </form>
    </div>
  );
}
