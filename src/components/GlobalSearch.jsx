import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Search, User, Calendar, Receipt, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults(null); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query.trim()), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function doSearch(q) {
    setLoading(true);
    setOpen(true);
    const [patients, appointments, invoices] = await Promise.all([
      base44.entities.Patient.list("-created_date", 200),
      base44.entities.Appointment.list("-date", 200),
      base44.entities.Invoice.list("-date", 200),
    ]);
    const ql = q.toLowerCase();
    setResults({
      patients: patients.filter(p => p.full_name?.toLowerCase().includes(ql) || p.phone?.includes(q) || p.diagnosis?.toLowerCase().includes(ql)).slice(0, 5),
      appointments: appointments.filter(a => a.patient_name?.toLowerCase().includes(ql) || a.date?.includes(q)).slice(0, 5),
      invoices: invoices.filter(i => i.patient_name?.toLowerCase().includes(ql) || i.date?.includes(q)).slice(0, 5),
    });
    setLoading(false);
  }

  function handleSelect(type, item) {
    setQuery("");
    setOpen(false);
    setResults(null);
    if (type === "patient") navigate(`/patients/${item.id}`);
    else if (type === "appointment") navigate("/appointments");
    else if (type === "invoice") navigate("/invoices");
  }

  const hasResults = results && (results.patients.length + results.appointments.length + results.invoices.length) > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="بحث في المرضى، المواعيد، الفواتير..."
          className="w-full h-9 pr-9 pl-8 rounded-xl border border-input bg-muted text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults(null); setOpen(false); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-11 right-0 w-full bg-card border border-border rounded-2xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && !hasResults && (
            <p className="text-center text-muted-foreground text-sm py-6">لا توجد نتائج</p>
          )}
          {!loading && hasResults && (
            <div className="divide-y divide-border">
              {results.patients.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground px-4 py-2 bg-muted">المرضى</p>
                  {results.patients.map(p => (
                    <button key={p.id} onClick={() => handleSelect("patient", p)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-right transition-colors">
                      <User className="w-4 h-4 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground">{p.phone} {p.diagnosis ? `· ${p.diagnosis}` : ""}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.appointments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground px-4 py-2 bg-muted">المواعيد</p>
                  {results.appointments.map(a => (
                    <button key={a.id} onClick={() => handleSelect("appointment", a)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-right transition-colors">
                      <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{a.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{a.date} — {a.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.invoices.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground px-4 py-2 bg-muted">الفواتير</p>
                  {results.invoices.map(inv => (
                    <button key={inv.id} onClick={() => handleSelect("invoice", inv)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-right transition-colors">
                      <Receipt className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{inv.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{inv.date} · {inv.total_amount?.toLocaleString()} ج</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}