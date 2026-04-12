import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronRight, ChevronLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, subDays, startOfWeek } from "date-fns";
import { ar } from "date-fns/locale";
import AppointmentFormModal from "@/components/AppointmentFormModal";

const statusColor = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  no_show: "bg-orange-100 text-orange-700 border-orange-200",
};
const statusLabel = { scheduled: "مجدول", confirmed: "مؤكد", completed: "منتهى", cancelled: "ملغى", no_show: "لم يحضر" };

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAppt, setEditAppt] = useState(null);

  useEffect(() => { loadAppointments(); }, [selectedDate]);

  async function loadAppointments() {
    setLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const data = await base44.entities.Appointment.filter({ date: dateStr }, "time", 50);
    setAppointments(data);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await base44.entities.Appointment.update(id, { status });
    loadAppointments();
  }

  // Week days for navigation
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المواعيد</h1>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> موعد جديد
        </Button>
      </div>

      {/* Date navigator */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setSelectedDate(d => subDays(d, 7))} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm">
            {format(selectedDate, "MMMM yyyy", { locale: ar })}
          </span>
          <button onClick={() => setSelectedDate(d => addDays(d, 7))} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all text-xs font-medium ${
                  isSelected ? "bg-primary text-primary-foreground" :
                  isToday ? "bg-accent text-accent-foreground" :
                  "hover:bg-muted text-muted-foreground"
                }`}
              >
                <span>{format(day, "EEE", { locale: ar })}</span>
                <span className="text-base mt-0.5">{format(day, "d")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Appointments list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium">لا توجد مواعيد في هذا اليوم</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> أضف موعداً
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(appt => (
            <div key={appt.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-center min-w-[52px] bg-accent rounded-xl p-2">
                    <p className="text-xs text-muted-foreground">الوقت</p>
                    <p className="font-bold text-sm text-accent-foreground">{appt.time}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{appt.patient_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{appt.duration_minutes} دقيقة · {appt.type === "initial" ? "أول زيارة" : appt.type === "final" ? "جلسة نهائية" : "متابعة"}</p>
                    {appt.notes && <p className="text-xs text-muted-foreground mt-1">{appt.notes}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor[appt.status]}`}>
                    {statusLabel[appt.status]}
                  </span>
                  <div className="flex gap-1">
                    {appt.status === "scheduled" && (
                      <button onClick={() => updateStatus(appt.id, "completed")}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors">
                        ✓ إتمام
                      </button>
                    )}
                    <button onClick={() => { setEditAppt(appt); setShowForm(true); }}
                      className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-lg hover:bg-muted/80 transition-colors">
                      تعديل
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AppointmentFormModal
          appointment={editAppt}
          defaultDate={format(selectedDate, "yyyy-MM-dd")}
          onClose={() => { setShowForm(false); setEditAppt(null); }}
          onSaved={() => { setShowForm(false); setEditAppt(null); loadAppointments(); }}
        />
      )}
    </div>
  );
}