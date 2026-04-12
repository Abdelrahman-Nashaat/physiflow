import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PDFExportButton({ patient, appointments = [], sessions = [], invoices = [] }) {
  const [loading, setLoading] = useState(false);

  function infoRow(label, value) {
    return `<div style="background:white;border-radius:6px;padding:10px 12px;border:1px solid #e2e8f0;"><div style="font-size:11px;color:#64748b;margin-bottom:2px;">${label}</div><div style="font-size:13px;font-weight:500;">${value || "—"}</div></div>`;
  }

  async function exportPDF() {
    setLoading(true);
    try {
      const totalPaid = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
      const totalAmount = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
      const firstPain = sessions.length > 0 ? sessions[sessions.length - 1]?.pain_before : null;
      const lastPain = sessions.length > 0 ? sessions[0]?.pain_after : null;
      const improvement = firstPain && lastPain ? Math.round(((firstPain - lastPain) / firstPain) * 100) : null;

      const container = document.createElement("div");
      container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:794px;background:white;padding:40px;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;color:#1a1a1a;";

      container.innerHTML = `
        <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:28px 32px;border-radius:12px;margin-bottom:28px;color:white;display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-size:22px;font-weight:700;margin-bottom:4px;">فيزيوفلو</div><div style="font-size:13px;opacity:0.85;">نظام إدارة عيادة العلاج الطبيعي</div></div>
          <div style="text-align:left;"><div style="font-size:12px;opacity:0.8;">تاريخ التقرير</div><div style="font-size:14px;font-weight:600;">${new Date().toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"})}</div></div>
        </div>
        <div style="background:#f8fafc;border-radius:10px;padding:24px;margin-bottom:20px;border:1px solid #e2e8f0;">
          <div style="font-size:16px;font-weight:700;color:#0ea5e9;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #e2e8f0;">بيانات المريض</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            ${infoRow("الاسم الكامل", patient.full_name)}
            ${infoRow("رقم الهاتف", patient.phone)}
            ${infoRow("العمر", patient.age ? patient.age + " سنة" : "-")}
            ${infoRow("الجنس", patient.gender === "male" ? "ذكر" : patient.gender === "female" ? "أنثى" : "-")}
            ${infoRow("التشخيص", patient.diagnosis)}
            ${infoRow("الحالة", patient.status === "active" ? "نشط" : patient.status === "completed" ? "مكتمل" : "غير نشط")}
            ${infoRow("الجلسات المقررة", patient.total_sessions_prescribed)}
            ${infoRow("الجلسات المكتملة", patient.sessions_completed || 0)}
          </div>
          ${patient.medical_history ? `<div style="margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0;"><div style="font-size:12px;color:#64748b;margin-bottom:4px;">التاريخ المرضي</div><div style="font-size:13px;">${patient.medical_history}</div></div>` : ""}
        </div>
        ${improvement !== null ? `
        <div style="background:#f0fdf4;border-radius:10px;padding:20px;margin-bottom:20px;border:1px solid #bbf7d0;">
          <div style="font-size:16px;font-weight:700;color:#16a34a;margin-bottom:14px;">ملخص التقدم</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center;">
            <div style="background:white;border-radius:8px;padding:14px;"><div style="font-size:24px;font-weight:700;color:#0ea5e9;">${sessions.length}</div><div style="font-size:12px;color:#64748b;margin-top:4px;">جلسة مكتملة</div></div>
            <div style="background:white;border-radius:8px;padding:14px;"><div style="font-size:24px;font-weight:700;color:#f59e0b;">${firstPain}/10</div><div style="font-size:12px;color:#64748b;margin-top:4px;">ألم أول جلسة</div></div>
            <div style="background:white;border-radius:8px;padding:14px;"><div style="font-size:24px;font-weight:700;color:#16a34a;">${improvement}%</div><div style="font-size:12px;color:#64748b;margin-top:4px;">نسبة التحسن</div></div>
          </div>
        </div>` : ""}
        ${sessions.length > 0 ? `
        <div style="margin-bottom:20px;">
          <div style="font-size:16px;font-weight:700;color:#0ea5e9;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #e2e8f0;">سجل الجلسات (${sessions.length} جلسة)</div>
          ${sessions.slice(0, 6).map((s, i) => `
            <div style="background:#f8fafc;border-radius:8px;padding:14px;margin-bottom:10px;border:1px solid #e2e8f0;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-weight:600;color:#0ea5e9;">جلسة رقم ${s.session_number || i + 1}</span><span style="font-size:12px;color:#64748b;">${s.session_date || ""}</span></div>
              ${s.subjective ? `<div style="margin-bottom:5px;font-size:12px;"><span style="font-weight:600;color:#64748b;">الشكوى: </span>${s.subjective}</div>` : ""}
              ${s.assessment ? `<div style="margin-bottom:5px;font-size:12px;"><span style="font-weight:600;color:#64748b;">التقييم: </span>${s.assessment}</div>` : ""}
              ${s.pain_before || s.pain_after ? `<div style="display:flex;gap:10px;margin-top:6px;">${s.pain_before ? `<span style="font-size:11px;background:#fef3c7;padding:2px 8px;border-radius:4px;">قبل: ${s.pain_before}/10</span>` : ""}${s.pain_after ? `<span style="font-size:11px;background:#d1fae5;padding:2px 8px;border-radius:4px;">بعد: ${s.pain_after}/10</span>` : ""}</div>` : ""}
            </div>
          `).join("")}
          ${sessions.length > 6 ? `<p style="text-align:center;font-size:12px;color:#64748b;">... و ${sessions.length - 6} جلسة أخرى</p>` : ""}
        </div>` : ""}
        ${invoices.length > 0 ? `
        <div style="background:#fff7ed;border-radius:10px;padding:20px;border:1px solid #fed7aa;">
          <div style="font-size:16px;font-weight:700;color:#ea580c;margin-bottom:14px;">الملخص المالي</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:center;">
            <div style="background:white;border-radius:8px;padding:14px;"><div style="font-size:20px;font-weight:700;color:#16a34a;">${totalPaid.toLocaleString("ar-EG")} ج</div><div style="font-size:12px;color:#64748b;margin-top:4px;">إجمالي المدفوع</div></div>
            <div style="background:white;border-radius:8px;padding:14px;"><div style="font-size:20px;font-weight:700;color:#dc2626;">${(totalAmount - totalPaid).toLocaleString("ar-EG")} ج</div><div style="font-size:12px;color:#64748b;margin-top:4px;">المتبقي</div></div>
          </div>
        </div>` : ""}
        <div style="margin-top:28px;padding-top:16px;border-top:2px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:11px;">تقرير صادر من نظام فيزيوفلو لإدارة عيادة العلاج الطبيعي</div>
      `;

      document.body.appendChild(container);
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const ratio = pdfW / canvas.width;
      const totalH = canvas.height * ratio;
      let offset = 0;
      while (offset < totalH) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -offset, pdfW, totalH);
        offset += pdfH;
      }
      pdf.save(`تقرير-${patient.full_name}-${new Date().toLocaleDateString("ar-EG").replace(/\//g, "-")}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      alert("حدث خطأ أثناء تصدير PDF: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={exportPDF} disabled={loading} variant="outline" size="sm" className="gap-2">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      تصدير PDF
    </Button>
  );
}
