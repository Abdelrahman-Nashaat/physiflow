import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PatientMessages({ patient }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [patient.id]);

  async function load() {
    setLoading(true);
    const data = await base44.entities.PatientMessage.filter({ patient_id: patient.id }, "-created_date", 20);
    setMessages(data);
    setLoading(false);
  }

  async function send() {
    if (!newMessage.trim()) return;
    setSending(true);
    await base44.entities.PatientMessage.create({
      patient_id: patient.id,
      patient_name: patient.full_name,
      message: newMessage.trim(),
      status: "pending",
    });
    setNewMessage("");
    setSending(false);
    load();
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Send New */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" /> اسأل طبيبك
        </h3>
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="اكتب سؤالك أو ملاحظتك هنا..."
          rows={3}
          className="flex w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground resize-none"
        />
        <Button className="w-full gap-2" onClick={send} disabled={sending || !newMessage.trim()}>
          <Send className="w-4 h-4" />
          {sending ? "جاري الإرسال..." : "إرسال السؤال"}
        </Button>
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">لم ترسل أي رسائل بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              {/* Patient message */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {patient.full_name?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{new Date(msg.created_date).toLocaleDateString("ar-EG")}</p>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
              {/* Doctor reply */}
              {msg.reply ? (
                <div className="flex items-start gap-3 bg-accent rounded-xl p-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    د
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-green-700 font-medium mb-1">رد الدكتور</p>
                    <p className="text-sm">{msg.reply}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                  <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                  في انتظار رد الدكتور...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}