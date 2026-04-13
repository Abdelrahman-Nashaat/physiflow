import { useEffect, useState, useRef } from "react";
import { api } from "@/api/apiClient";
import { Calendar, Activity, BarChart2, MessageCircle, Clock, Stethoscope, AlertCircle, Star, CheckCircle, Send, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, differenceInDays, differenceInHours, differenceInMinutes, parseISO } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import PainProgressChart from "@/components/PainProgressChart";

const POSTPONE_REASONS = [
  "ظروف عمل",
  "مرض مفاجئ",
  "ظروف عائلية",
  "مشاكل في المواصلات",
  "سفر",
  "سبب آخر",
];

function Countdown({ appt }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  if (!appt?.date || !appt?.time) return null;
  const apptDate = parseISO(`${appt.date}T${appt.time}`);
  const days = differenceInDays(apptDate, now);
  const hours = differenceInHours(apptDate, now) % 24;
  const mins = differenceInMinutes(apptDate, now) % 60;

  if (days < 0) return <p className="text-xs text-muted-foreground">الموعد قد مضى</p>;
  return (
    <p className="text-primary font-bold text-sm mt-1">
      ⏱ {days > 0 ? `بعد ${days} يوم ` : ""}{hours > 0 ? `و${hours} ساعة` : ""}{days === 0 && hours === 0 ? `بعد ${mins} دقيقة` : ""}
    </p>
  );
}

export default function PatientPortal() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  // Rating
  const [ratingAppt, setRatingAppt] = useState(null);
  const [starRating, setStarRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [savingRating, setSavingRating] = useState(false);

  // Postpone
  const [postponeAppt, setPostponeAppt] = useState(null);
  const [postponeReason, setPostponeReason] = useState("");
  const [savingPostpone, setSavingPostpone] = useState(false);

  // Message
  const [newMsg, setNewMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Confirm action
  const [confirmAction, setConfirmAction] = useState(null);
  const [updating, setUpdating] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Match patient to logged-in user:
      // Priority 1: patient_id stored in Supabase user_metadata (most reliable)
      // Priority 2: email match against patients.email field
      let found = null;

      if (user?.patient_id) {
        // Best case: admin linked the account via user_metadata → patient_id
        const { supabase } = await import("@/api/apiClient");
        const { data } = await supabase
          .from("patients")
          .select("*")
          .eq("id", user.patient_id)
          .single();
        found = data || null;
      }

      if (!found && user?.email) {
        // Fallback: match by email stored in the patient record
        const allPatients = await api.entities.Patient.list("-created_at", 500);
        found = allPatients.find(
          p => p.email && p.email.toLowerCase() === user.email.toLowerCase()
        ) || null;
      }

      // No match → don't load any data (never leak another patient's records)
      if (found) {
        setPatient(found);
        const [appts, notes, exs, comps, msgs] = await Promise.all([
          api.entities.Appointment.filter({ patient_id: found.id }, "-date", 30),
          api.entities.SessionNote.filter({ patient_id: found.id }, "-session_date", 30),
          api.entities.ExerciseTemplate.list("name", 50),
          api.entities.ExerciseCompletion.filter({ patient_id: found.id, log_date: today }, "-created_at", 50),
          api.entities.PatientMessage.filter({ patient_id: found.id }, "-created_at", 30),
        ]);
        setAppointments(appts);
        setSessions(notes);
        setExercises(exs);
        setCompletions(comps);
        setMessages(msgs);
      }
    } catch (e) {
      console.error("PatientPortal loadData error:", e);
    }
    setLoading(false);
  }

  const nextAppt = appointments
    .filter(a => a.status !== "completed" && a.status !== "cancelled" && a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const rateableAppts = appointments.filter(a => a.status === "completed" && !a.patient_rating);

  // Improvement %
  const sortedSessions = [...sessions]
    .filter(s => s.pain_before != null)
    .sort((a, b) => (a.session_number || 0) - (b.session_number || 0));
  const firstSession = sortedSessions[0];
  const lastSession = sortedSessions[sortedSessions.length - 1];
  const improvement = firstSession && lastSession && firstSession !== lastSession && firstSession.pain_before > 0
    ? Math.round(((firstSession.pain_before - lastSession.pain_before) / firstSession.pain_before) * 100)
    : null;

  const encouragement = improvement == null ? null
    : improvement >= 60 ? `تحسنت ${improvement}%! أنت بطل 🏆`
    : improvement >= 30 ? `تحسنت ${improvement}%! واصل 💪`
    : improvement > 0 ? `تحسنت ${improvement}%! أنت على الطريق الصح ✨`
    : "استمر، التحسن قادم! 🌟";

  // Today exercises
  const completedNames = new Set(completions.filter(c => c.completed).map(c => c.exercise_name));
  const todayExs = exercises.slice(0, 6); // show all or last assigned
  const completedCount = todayExs.filter(e => completedNames.has(e.name)).length;

  async function toggleExercise(ex) {
    const exists = completions.find(c => c.exercise_name === ex.name && c.log_date === today);
    if (exists) {
      await api.entities.ExerciseCompletion.update(exists.id, { completed: !exists.completed });
    } else {
      await api.entities.ExerciseCompletion.create({ patient_id: patient.id, log_date: today, exercise_name: ex.name, completed: true });
    }
    const comps = await api.entities.ExerciseCompletion.filter({ patient_id: patient.id, log_date: today }, "-created_date", 50);
    setCompletions(comps);
  }

  async function completeAll() {
    await Promise.all(todayExs.map(async ex => {
      const exists = completions.find(c => c.exercise_name === ex.name && c.log_date === today);
      if (!exists) await api.entities.ExerciseCompletion.create({ patient_id: patient.id, log_date: today, exercise_name: ex.name, completed: true });
      else if (!exists.completed) await api.entities.ExerciseCompletion.update(exists.id, { completed: true });
    }));
    const comps = await api.entities.ExerciseCompletion.filter({ patient_id: patient.id, log_date: today }, "-created_date", 50);
    setCompletions(comps);
  }

  async function submitRating() {
    setSavingRating(true);
    await api.entities.Appointment.update(ratingAppt.id, { patient_rating: starRating, notes: ratingComment || ratingAppt.notes });
    setSavingRating(false);
    setRatingAppt(null);
    setRatingComment("");
    loadData();
  }

  async function submitPostpone() {
    if (!postponeReason) return;
    setSavingPostpone(true);
    await api.entities.Appointment.update(postponeAppt.id, {
      status: "cancelled",
      notes: `طلب تأجيل من المريض — السبب: ${postponeReason}`,
    });
    setSavingPostpone(false);
    setPostponeAppt(null);
    setPostponeReason("");
    loadData();
  }

  async function sendMessage() {
    if (!newMsg.trim()) return;
    setSendingMsg(true);
    await api.entities.PatientMessage.create({
      patient_id: patient.id,
      patient_name: patient.full_name,
      message: newMsg.trim(),
      status: "pending",
    });
    setNewMsg("");
    setSendingMsg(false);
    const msgs = await api.entities.PatientMessage.filter({ patient_id: patient.id }, "-created_date", 30);
    setMessages(msgs);
  }

  async function handleApptAction(id, action) {
    setUpdating(true);
    await api.entities.Appointment.update(id, { status: action === "confirm" ? "confirmed" : "cancelled" });
    setConfirmAction(null);
    setUpdating(false);
    loadData();
  }

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!patient) return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
      <AlertCircle className="w-16 h-16 text-primary mb-4 opacity-40" />
      <h2 className="text-xl font-bold mb-2">لم يتم ربط حسابك بمريض</h2>
      <p className="text-muted-foreground text-sm">تواصل مع العيادة لربط حسابك بملفك الطبي</p>
    </div>
  );

  const tabs = [
    { id: "home", label: "الرئيسية", icon: Stethoscope },
    { id: "exercises", label: "تمارين اليوم", icon: Activity },
    { id: "progress", label: "تقدمي", icon: BarChart2 },
    { id: "messages", label: "رسائلي", icon: MessageCircle, badge: messages.filter(m => m.status === "replied").length },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/10 to-accent border border-border rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
            {patient.full_name?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold">أهلاً، {patient.full_name} 👋</h1>
            {patient.diagnosis && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Stethoscope className="w-3 h-3" /> {patient.diagnosis}
              </p>
            )}
            {encouragement && (
              <div className="mt-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl inline-block">
                {encouragement}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating alert */}
      {rateableAppts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> لديك جلسة تنتظر تقييمك
          </p>
          <Button size="sm" className="text-xs" onClick={() => { setStarRating(5); setRatingAppt(rateableAppts[0]); }}>
            قيّم الآن
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap relative ${activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.badge > 0 && <span className="absolute -top-1 -left-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* HOME TAB */}
      {activeTab === "home" && (
        <div className="space-y-4">
          {/* Next appointment */}
          {nextAppt ? (
            <div className="bg-card border border-primary/30 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">موعدك القادم</p>
              <p className="text-2xl font-bold">{nextAppt.date}</p>
              <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {nextAppt.time} — {nextAppt.duration_minutes} دقيقة
              </p>
              <Countdown appt={nextAppt} />
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                {nextAppt.status === "scheduled" && (
                  <Button size="sm" className="flex-1 gap-1.5" onClick={() => setConfirmAction({ id: nextAppt.id, action: "confirm" })}>
                    <CheckCircle className="w-3.5 h-3.5" /> تأكيد الحضور
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setPostponeAppt(nextAppt)}>
                  أريد التأجيل
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted rounded-2xl p-6 text-center text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>لا توجد مواعيد قادمة</p>
            </div>
          )}

          {/* Progress */}
          {patient.total_sessions_prescribed && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-sm font-semibold mb-2">تقدم الجلسات</p>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>{patient.sessions_completed || 0} جلسة مكتملة</span>
                <span>من {patient.total_sessions_prescribed}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((patient.sessions_completed || 0) / patient.total_sessions_prescribed) * 100)}%` }} />
              </div>
            </div>
          )}

          {/* Past appointments */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-sm font-semibold mb-3">مواعيد سابقة</p>
            <div className="space-y-2">
              {appointments.filter(a => a.status === "completed").slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{a.date} — جلسة {a.session_number || ""}</span>
                  {a.patient_rating && (
                    <span className="flex items-center gap-1 text-amber-500">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= a.patient_rating ? "fill-amber-400" : ""}`} />)}
                    </span>
                  )}
                </div>
              ))}
              {appointments.filter(a => a.status === "completed").length === 0 && (
                <p className="text-muted-foreground text-sm">لا توجد جلسات مكتملة بعد</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXERCISES TAB */}
      {activeTab === "exercises" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">تمارين اليوم</p>
              <span className="text-sm text-muted-foreground">{completedCount}/{todayExs.length}</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-5">
              <div className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${todayExs.length > 0 ? (completedCount / todayExs.length) * 100 : 0}%` }} />
            </div>
            {todayExs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد تمارين محددة بعد</p>
            ) : (
              <div className="space-y-3">
                {todayExs.map(ex => {
                  const done = completedNames.has(ex.name);
                  return (
                    <div key={ex.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${done ? "bg-green-50 border-green-200" : "bg-muted border-transparent"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-500" : "bg-muted-foreground/20"}`}>
                        {done ? <CheckCircle className="w-4 h-4 text-white" /> : <Activity className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{ex.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ex.sets && `${ex.sets} مجموعات`}{ex.reps && ` × ${ex.reps} تكرار`}
                        </p>
                      </div>
                      <Button size="sm" variant={done ? "outline" : "default"} className="text-xs h-7 flex-shrink-0"
                        onClick={() => toggleExercise(ex)}>
                        {done ? "إلغاء" : "أتممت"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            {todayExs.length > 0 && completedCount < todayExs.length && (
              <Button className="w-full mt-4 gap-2" onClick={completeAll}>
                <CheckCircle className="w-4 h-4" /> أتممت كل التمارين
              </Button>
            )}
            {completedCount === todayExs.length && todayExs.length > 0 && (
              <div className="mt-4 text-center bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-green-700 font-bold">🎉 أحسنت! أتممت كل تمارين اليوم!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROGRESS TAB */}
      {activeTab === "progress" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-4">تطور مستوى الألم</h3>
            <PainProgressChart sessions={sessions} />
          </div>
          {firstSession && lastSession && firstSession !== lastSession && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold">مقارنة أول وآخر جلسة</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">الجلسة الأولى</p>
                  <p className="text-3xl font-bold text-red-600">{firstSession.pain_before}<span className="text-sm">/10</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{firstSession.session_date}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">آخر جلسة</p>
                  <p className="text-3xl font-bold text-green-600">{lastSession.pain_before}<span className="text-sm">/10</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{lastSession.session_date}</p>
                </div>
              </div>
              {encouragement && (
                <div className="text-center bg-primary/5 border border-primary/20 rounded-xl p-3 font-bold text-primary">
                  {encouragement}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MESSAGES TAB */}
      {activeTab === "messages" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="font-semibold">رسائلي للدكتور</p>
            </div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 text-sm">لا توجد رسائل بعد</p>
              ) : messages.map(m => (
                <div key={m.id} className="p-4 space-y-2">
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">سؤالك:</p>
                    <p className="text-sm">{m.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{m.created_date?.split("T")[0]}</p>
                  </div>
                  {m.reply ? (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                      <p className="text-xs text-primary font-semibold mb-1">رد الدكتور:</p>
                      <p className="text-sm">{m.reply}</p>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground px-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> بانتظار رد الدكتور
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <textarea
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="اكتب سؤالك للدكتور..."
                  rows={2}
                  className="flex-1 rounded-xl border border-input bg-muted px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button size="sm" onClick={sendMessage} disabled={sendingMsg || !newMsg.trim()} className="h-auto px-4">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingAppt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm p-6">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" /> تقييم الجلسة
            </h3>
            <p className="text-sm text-muted-foreground mb-4">كيف كانت جلستك بتاريخ {ratingAppt.date}؟</p>
            <div className="flex gap-2 justify-center mb-5">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setStarRating(s)}
                  className={`w-12 h-12 rounded-xl transition-all text-2xl ${s <= starRating ? "bg-amber-100" : "bg-muted"}`}>
                  <Star className={`w-6 h-6 mx-auto ${s <= starRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              placeholder="تعليق اختياري..."
              rows={2}
              className="w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm resize-none mb-4 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex gap-3">
              <Button className="flex-1" onClick={submitRating} disabled={savingRating}>
                {savingRating ? "جاري الإرسال..." : "إرسال التقييم"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setRatingAppt(null)}>تراجع</Button>
            </div>
          </div>
        </div>
      )}

      {/* Postpone Modal */}
      {postponeAppt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm p-6">
            <h3 className="font-bold text-lg mb-2">طلب تأجيل الموعد</h3>
            <p className="text-sm text-muted-foreground mb-4">موعد {postponeAppt.date} — {postponeAppt.time}</p>
            {!postponeReason && <p className="text-xs text-destructive mb-2">يرجى اختيار سبب التأجيل</p>}
            <div className="space-y-2 mb-4">
              {POSTPONE_REASONS.map(r => (
                <button key={r} onClick={() => setPostponeReason(r)}
                  className={`w-full text-right px-4 py-2.5 rounded-xl border text-sm transition-all ${postponeReason === r ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:bg-muted"}`}>
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={submitPostpone} disabled={savingPostpone || !postponeReason}>
                {savingPostpone ? "جاري الإرسال..." : "تأكيد التأجيل"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setPostponeAppt(null)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Attendance */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm p-6">
            <h3 className="font-bold text-lg mb-2">تأكيد الحضور</h3>
            <p className="text-muted-foreground text-sm mb-5">هل تريد تأكيد حضورك في هذا الموعد؟</p>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => handleApptAction(confirmAction.id, confirmAction.action)} disabled={updating}>
                {updating ? "..." : "نعم، تأكيد"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)}>تراجع</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}