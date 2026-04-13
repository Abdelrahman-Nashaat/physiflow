import { useEffect, useState } from "react";
import { api } from "@/api/apiClient";
import { Link } from "react-router-dom";
import { Plus, Search, User, Phone, ArrowLeft, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PatientFormModal from "@/components/PatientFormModal";

const statusBadge = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  completed: "bg-blue-100 text-blue-700",
};
const statusLabel = { active: "نشط", inactive: "غير نشط", completed: "مكتمل" };

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPatient, setEditPatient] = useState(null);

  useEffect(() => { loadPatients(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(patients);
    const q = search.toLowerCase();
    setFiltered(patients.filter(p =>
      p.full_name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.diagnosis?.toLowerCase().includes(q)
    ));
  }, [search, patients]);

  async function loadPatients() {
    setLoading(true);
    const data = await api.entities.Patient.list("-created_date", 200);
    setPatients(data);
    setFiltered(data);
    setLoading(false);
  }

  function handleSaved() {
    setShowForm(false);
    setEditPatient(null);
    loadPatients();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المرضى</h1>
          <p className="text-muted-foreground text-sm mt-1">{patients.length} مريض مسجل</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> مريض جديد
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو الهاتف أو التشخيص..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium">لا يوجد مرضى</p>
          <p className="text-sm">أضف أول مريض الآن</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(patient => (
            <div key={patient.id} className="bg-card rounded-2xl border border-border p-4 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold">
                    {patient.full_name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{patient.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{patient.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge[patient.status] || statusBadge.active}`}>
                    {statusLabel[patient.status] || "نشط"}
                  </span>
                  <Link to={`/patients/${patient.id}`} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>
              {patient.diagnosis && (
                <p className="text-sm text-muted-foreground mt-3 pr-14">{patient.diagnosis}</p>
              )}
              {patient.total_sessions_prescribed && (
                <div className="mt-3 pr-14">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>تقدم الجلسات</span>
                    <span>{patient.sessions_completed || 0} / {patient.total_sessions_prescribed}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((patient.sessions_completed || 0) / patient.total_sessions_prescribed) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(showForm || editPatient) && (
        <PatientFormModal
          patient={editPatient}
          onClose={() => { setShowForm(false); setEditPatient(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}