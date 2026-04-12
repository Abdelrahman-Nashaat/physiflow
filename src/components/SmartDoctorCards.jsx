import { AlertTriangle, Award, Clock, TrendingDown } from "lucide-react";
import WhatsAppReminder from "@/components/WhatsAppReminder";

function getPhoneLink(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  return cleaned.startsWith("0") ? "2" + cleaned : cleaned;
}

export default function SmartDoctorCards({ patients, sessions, appointments }) {
  if (!patients || !sessions || !appointments) return null;

  // --- Card 1: Patients with 5+ sessions and no improvement ---
  const stagnantPatients = patients.filter(patient => {
    const pSessions = sessions
      .filter(s => s.patient_id === patient.id && s.pain_before != null)
      .sort((a, b) => (a.session_number || 0) - (b.session_number || 0));
    if (pSessions.length < 5) return false;
    const recent = pSessions.slice(-3);
    const first = recent[0]?.pain_before;
    const last = recent[recent.length - 1]?.pain_before;
    return last !== undefined && first !== undefined && last >= first;
  });

  // --- Card 2: Patients with pain score 1-2 (near recovery) ---
  const nearRecovery = patients.filter(patient => {
    const pSessions = sessions
      .filter(s => s.patient_id === patient.id && s.pain_after != null)
      .sort((a, b) => (a.session_number || 0) - (b.session_number || 0));
    if (pSessions.length === 0) return false;
    const last = pSessions[pSessions.length - 1];
    return last.pain_after <= 2;
  });

  // --- Card 3: Patients absent 7+ days ---
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

  const absentPatients = patients.filter(patient => {
    const pAppts = appointments
      .filter(a => a.patient_id === patient.id && a.status === "completed")
      .sort((a, b) => b.date?.localeCompare(a.date));
    if (pAppts.length === 0) return false;
    const lastDate = pAppts[0]?.date;
    return lastDate && lastDate < oneWeekAgoStr;
  }).slice(0, 8);

  // --- Card 4: Top 5 diagnoses ---
  const diagMap = {};
  patients.forEach(p => {
    if (p.diagnosis) {
      const key = p.diagnosis.substring(0, 30);
      diagMap[key] = (diagMap[key] || 0) + 1;
    }
  });
  const topDiagnoses = Object.entries(diagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const hasSomething = stagnantPatients.length > 0 || nearRecovery.length > 0 || absentPatients.length > 0 || topDiagnoses.length > 0;
  if (!hasSomething) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4">

      {/* Warning: stagnant patients */}
      {stagnantPatients.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-orange-800">مرضى بحاجة مراجعة</h3>
            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-medium">{stagnantPatients.length}</span>
          </div>
          <p className="text-xs text-orange-600 mb-3">5+ جلسات والألم لم يتحسن</p>
          <div className="space-y-2">
            {stagnantPatients.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.diagnosis || "بدون تشخيص"}</p>
                </div>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg">
                  {p.sessions_completed || 0} جلسة
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement: near recovery */}
      {nearRecovery.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-800">🎉 قريبون من الشفاء</h3>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">{nearRecovery.length}</span>
          </div>
          <p className="text-xs text-green-600 mb-3">pain score وصل 1-2 — أداء رائع!</p>
          <div className="space-y-2">
            {nearRecovery.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.diagnosis || "بدون تشخيص"}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">ألم ≤ 2/10</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Absent patients */}
      {absentPatients.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-800">لم يحضروا منذ أسبوع+</h3>
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-medium">{absentPatients.length}</span>
          </div>
          <div className="space-y-2">
            {absentPatients.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.phone}</p>
                </div>
                <WhatsAppReminder patient={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top diagnoses */}
      {topDiagnoses.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-primary" />
            <h3 className="font-bold">أكثر التشخيصات شيوعاً</h3>
          </div>
          <div className="space-y-3">
            {topDiagnoses.map(([diag, count], i) => {
              const max = topDiagnoses[0][1];
              return (
                <div key={diag} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium line-clamp-1">{diag}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}