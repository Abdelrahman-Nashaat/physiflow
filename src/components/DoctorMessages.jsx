import { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function DoctorMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await api.entities.PatientMessage.filter({ status: "pending" }, "-created_date", 20);
    setMessages(data);
    setLoading(false);
  }

  async function sendReply(msg) {
    if (!replyText.trim()) return;
    setSaving(true);
    await api.entities.PatientMessage.update(msg.id, { reply: replyText.trim(), status: "replied" });
    setSaving(false);
    setReplyId(null);
    setReplyText("");
    load();
  }

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (messages.length === 0) return (
    <div className="bg-card border border-border rounded-2xl p-5 text-center text-muted-foreground text-sm">
      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
      لا توجد رسائل معلقة
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> رسائل المرضى
          <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{messages.length}</span>
        </h2>
      </div>
      <div className="divide-y divide-border">
        {messages.map(msg => (
          <div key={msg.id} className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold text-sm">{msg.patient_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(msg.created_date).toLocaleDateString("ar-EG")}</p>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">في الانتظار</span>
            </div>
            <p className="text-sm bg-muted rounded-xl px-3 py-2 mb-3">{msg.message}</p>

            {replyId === msg.id ? (
              <div className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="اكتب ردك..."
                  rows={3}
                  autoFocus
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5 flex-1" onClick={() => sendReply(msg)} disabled={saving || !replyText.trim()}>
                    <Send className="w-3.5 h-3.5" /> {saving ? "..." : "إرسال الرد"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setReplyId(null); setReplyText(""); }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setReplyId(msg.id); setReplyText(""); }}>
                <MessageSquare className="w-3.5 h-3.5" /> رد على الرسالة
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}