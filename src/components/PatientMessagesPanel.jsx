import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Send, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PatientMessagesPanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState({});
  const [sending, setSending] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const msgs = await base44.entities.PatientMessage.filter({ status: "pending" }, "-created_date", 20);
    setMessages(msgs);
    setLoading(false);
  }

  async function sendReply(msg) {
    const reply = replies[msg.id];
    if (!reply?.trim()) return;
    setSending(msg.id);
    await base44.entities.PatientMessage.update(msg.id, { reply: reply.trim(), status: "replied" });
    setSending(null);
    setReplies(r => { const n = { ...r }; delete n[msg.id]; return n; });
    load();
  }

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="font-bold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" /> رسائل المرضى
          {messages.length > 0 && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">{messages.length}</span>
          )}
        </h2>
      </div>

      {messages.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
          لا توجد رسائل معلقة
        </div>
      ) : (
        <div className="divide-y divide-border">
          {messages.map(msg => (
            <div key={msg.id} className="p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{msg.patient_name}</span>
                  <span className="text-xs text-muted-foreground">{msg.created_date?.split("T")[0]}</span>
                </div>
                <p className="text-sm bg-muted rounded-xl px-3 py-2">{msg.message}</p>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={replies[msg.id] || ""}
                  onChange={e => setReplies(r => ({ ...r, [msg.id]: e.target.value }))}
                  placeholder="اكتب ردك هنا..."
                  rows={2}
                  className="flex-1 rounded-xl border border-input bg-muted px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button size="sm" onClick={() => sendReply(msg)} disabled={sending === msg.id || !replies[msg.id]?.trim()} className="h-auto px-3">
                  {sending === msg.id ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}