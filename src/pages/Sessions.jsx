import { useEffect, useState } from "react";
import { api } from "@/api/apiClient";
import { Plus, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SessionNoteModal from "@/components/SessionNoteModal";

const progressColor = { excellent: "bg-green-100 text-green-700", good: "bg-blue-100 text-blue-700", fair: "bg-yellow-100 text-yellow-700", poor: "bg-red-100 text-red-700" };
const progressLabel = { excellent: "ممتاز", good: "جيد", fair: "متوسط", poor: "ضعيف" };

export default function Sessions() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState(null);

  useEffect(() => { loadNotes(); }, []);

  async function loadNotes() {
    setLoading(true);
    const data = await api.entities.SessionNote.list("-session_date", 100);
    setNotes(data);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الجلسات</h1>
          <p className="text-muted-foreground text-sm mt-1">سجل جلسات المرضى وتقدمهم</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> جلسة جديدة
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium">لا توجد جلسات مسجلة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">
                      {note.patient_name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{note.patient_name}</p>
                      <p className="text-xs text-muted-foreground">جلسة {note.session_number || ""} · {note.session_date}</p>
                    </div>
                  </div>

                  {note.assessment && (
                    <p className="mt-3 text-sm text-muted-foreground border-r-2 border-primary pr-3">{note.assessment}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {note.pain_before !== undefined && note.pain_after !== undefined && (
                      <span className="text-xs bg-muted px-2.5 py-1 rounded-full">
                        ألم: {note.pain_before}/10 → {note.pain_after}/10
                        {note.pain_before > note.pain_after ? " ✓" : ""}
                      </span>
                    )}
                    {note.progress_rating && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${progressColor[note.progress_rating]}`}>
                        {progressLabel[note.progress_rating]}
                      </span>
                    )}
                    {note.ai_summary && (
                      <span className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> لديه ملخص AI
                      </span>
                    )}
                  </div>

                  {note.exercises && (
                    <div className="mt-3 bg-accent rounded-xl p-3">
                      <p className="text-xs font-semibold text-accent-foreground mb-1">التمارين المنزلية:</p>
                      <p className="text-xs text-accent-foreground">{note.exercises}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setEditNote(note); setShowForm(true); }}
                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-all"
                >
                  تعديل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SessionNoteModal
          note={editNote}
          onClose={() => { setShowForm(false); setEditNote(null); }}
          onSaved={() => { setShowForm(false); setEditNote(null); loadNotes(); }}
        />
      )}
    </div>
  );
}