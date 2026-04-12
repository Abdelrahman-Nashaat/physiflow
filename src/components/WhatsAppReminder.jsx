import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  if (cleaned.startsWith("0")) return "2" + cleaned;
  if (cleaned.startsWith("20")) return cleaned;
  return "2" + cleaned;
}

export default function WhatsAppReminder({ patient, nextAppointment }) {
  const phone = formatPhone(patient?.phone);
  if (!phone) return null;

  function buildMessage() {
    const name = patient.full_name;
    if (nextAppointment) {
      return `مرحباً ${name} 👋\nنذكّركم بموعدكم في عيادة فيزيوفلو:\n📅 التاريخ: ${nextAppointment.date}\n⏰ الوقت: ${nextAppointment.time}\nنتمنى لكم الشفاء العاجل 🌟`;
    }
    return `مرحباً ${name} 👋\nنتواصل معكم من عيادة فيزيوفلو.\nيسعدنا متابعة حالتكم وتحديد موعدكم القادم.\nللتواصل يرجى الرد على هذه الرسالة 🙏`;
  }

  function handleClick() {
    const msg = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="gap-2 text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800">
      <MessageCircle className="w-4 h-4" />
      إرسال تذكير واتساب
    </Button>
  );
}