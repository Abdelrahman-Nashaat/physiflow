import { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { X, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WhatsAppReminder from "@/components/WhatsAppReminder";

export default function WaitingListModal({ onClose }) {
  const [list, setList] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patient_id: "", patient_name: "", phone: "", preferred_date: "", preferred_time: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); api.entities.Patient.list("-created_date", 200).then(setPatients); }, []);

  async function load() {
    const data = await api.entities.WaitingList.filter({ status: "waiting" }, "-created_date", 50);
    setList(data);
  }

  function handlePatient(id) {
    const p = patients.find(p => p.id === id);
    setForm(f => ({ ...f, patient_id: id, patient_name: p?.full_name || "", phone: p?.phone || "" }));
  }

  async function save() {
    if (!form.patient_name || !form.phone) return;
    setSaving(true);
    await api.entities.WaitingList.create({ ...form, status: "waiting" });
    setSaving(false);
    setShowForm(false);
    setForm({ patient_id: "", patient_name: "", phone: "", preferred_date: "", preferred_time: "", notes: "" });
    load();
  }

  async function remove(id) {
    await api.entities.WaitingList.delete(id);
    setConfirmDel(null);
    load();
  }

  async function markScheduled(id) {
    await api.entities.WaitingList.update(id, { status: "scheduled" });
    load();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> قائمة الانتظار
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{list.length}</span>
          </h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowForm(s => !s)}>+ إضافة</Button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {showForm && (
          <div className="p-4 border-b border-border bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">المريض</Label>
                <select value={form.patient_id} onChange={e => handlePatient(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm">
                  <option value="">اختر مريض</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الاسم * (لو غير مسجل)</Label>
                <Input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">الهاتف *</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">التاريخ المفضل</Label>
                <Input type="date" value={form.preferred_date} onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">الوقت المفضل</Label>
                <Input type="time" value={form.preferred_time} onChange={e => setForm(f => ({ ...f, preferred_time: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ملاحظات</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={saving || !form.patient_name || !form.phone} className="flex-1">
                {saving ? "جاري الحفظ..." : "إضافة للانتظار"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {list.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>قائمة الانتظار فارغة</p>
            </div>
          ) : list.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{item.patient_name}</p>
                  <p className="text-xs text-muted-foreground">{item.phone}</p>
                  {(item.preferred_date || item.preferred_time) && (
                    <p className="text-xs text-primary mt-1">
                      {item.preferred_date && `📅 ${item.preferred_date}`}
                      {item.preferred_time && ` ⏰ ${item.preferred_time}`}
                    </p>
                  )}
                  {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <WhatsAppReminder patient={{ full_name: item.patient_name, phone: item.phone }} />
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => markScheduled(item.id)}>
                    ✓ تم الجدولة
                  </Button>
                  <button onClick={() => setConfirmDel(item.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmDel && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm">
            <h3 className="font-bold mb-2">حذف من قائمة الانتظار</h3>
            <p className="text-sm text-muted-foreground mb-5">هل أنت متأكد من الحذف؟</p>
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={() => remove(confirmDel)}>نعم، احذف</Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDel(null)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}