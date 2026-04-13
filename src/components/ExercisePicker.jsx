import { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Activity, X, Search, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const CAT_LABELS = {
  spine: "العمود الفقري", knee: "الركبة", shoulder: "الكتف",
  hip: "الورك", ankle: "الكاحل", neck: "الرقبة", general: "عام"
};

export default function ExercisePicker({ selected = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && exercises.length === 0) {
      setLoading(true);
      api.entities.ExerciseTemplate.list("name", 200).then(data => {
        setExercises(data);
        setLoading(false);
      });
    }
  }, [open]);

  const filtered = exercises.filter(e => {
    const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || e.category === catFilter;
    return matchSearch && matchCat;
  });

  function toggle(ex) {
    const isSelected = selected.find(s => s.id === ex.id);
    if (isSelected) onChange(selected.filter(s => s.id !== ex.id));
    else onChange([...selected, ex]);
  }

  const selectedText = selected.length > 0
    ? selected.map(e => `${e.name} (${e.sets || ""}×${e.reps || ""})`).join("، ")
    : "";

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-2">
          <Activity className="w-4 h-4" /> اختر التمارين من البنك
        </Button>
        {selected.length > 0 && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            {selected.length} تمرين محدد
          </span>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map(ex => (
            <span key={ex.id} className="flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full">
              {ex.name}
              <button onClick={() => toggle(ex)} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold">اختر التمارين</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 border-b border-border">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="بحث في التمارين..."
                  className="w-full h-9 pr-9 rounded-lg border border-input bg-muted text-sm px-3 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm">
                <option value="">كل الفئات</option>
                {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {loading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">لا توجد تمارين</p>
              ) : filtered.map(ex => {
                const isSelected = !!selected.find(s => s.id === ex.id);
                return (
                  <button key={ex.id} onClick={() => toggle(ex)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all border ${isSelected ? "bg-primary/10 border-primary/30" : "hover:bg-muted border-transparent"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-primary text-white" : "bg-muted"}`}>
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {CAT_LABELS[ex.category] || ex.category}
                        {ex.sets && ` · ${ex.sets} مجموعات`}
                        {ex.reps && ` × ${ex.reps} تكرار`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-border">
              <Button className="w-full" onClick={() => setOpen(false)}>
                تم ({selected.length} تمرين)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden textarea for form value */}
      <textarea
        value={selectedText}
        readOnly
        className="hidden"
      />
    </div>
  );
}