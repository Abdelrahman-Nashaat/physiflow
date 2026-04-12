import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ReceiptPDFButton({ invoice }) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const remaining = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
      const methodMap = { cash: "نقداً", card: "بطاقة بنكية", transfer: "تحويل بنكي" };
      const statusMap = { paid: "مدفوع بالكامل", partial: "مدفوع جزئياً", pending: "معلق" };
      const statusColor = { paid: "#16a34a", partial: "#f59e0b", pending: "#dc2626" };

      const container = document.createElement("div");
      container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:420px;background:white;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;color:#1a1a1a;";

      container.innerHTML = `
        <div style="padding:0;margin:0;">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:20px 24px;color:white;text-align:center;">
            <div style="font-size:20px;font-weight:700;margin-bottom:2px;">فيزيوفلو</div>
            <div style="font-size:12px;opacity:0.85;">إيصال دفع</div>
          </div>

          <!-- Receipt Info -->
          <div style="padding:20px 24px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:11px;color:#64748b;">رقم الإيصال</div>
                <div style="font-size:13px;font-weight:600;">#${invoice.id?.substring(0, 8).toUpperCase() || "N/A"}</div>
              </div>
              <div style="text-align:left;">
                <div style="font-size:11px;color:#64748b;">التاريخ</div>
                <div style="font-size:13px;font-weight:600;">${invoice.date || new Date().toLocaleDateString("ar-EG")}</div>
              </div>
            </div>
          </div>

          <!-- Patient & Sessions -->
          <div style="padding:20px 24px;space-y:12px;">
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed #e2e8f0;">
              <span style="font-size:12px;color:#64748b;">اسم المريض</span>
              <span style="font-size:13px;font-weight:600;">${invoice.patient_name || "—"}</span>
            </div>
            ${invoice.sessions_count ? `
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed #e2e8f0;">
              <span style="font-size:12px;color:#64748b;">عدد الجلسات</span>
              <span style="font-size:13px;">${invoice.sessions_count} جلسة × ${(invoice.price_per_session || 0).toLocaleString("ar-EG")} ج</span>
            </div>` : ""}
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed #e2e8f0;">
              <span style="font-size:12px;color:#64748b;">طريقة الدفع</span>
              <span style="font-size:13px;">${methodMap[invoice.payment_method] || invoice.payment_method || "—"}</span>
            </div>
            ${invoice.notes ? `
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed #e2e8f0;">
              <span style="font-size:12px;color:#64748b;">ملاحظات</span>
              <span style="font-size:13px;">${invoice.notes}</span>
            </div>` : ""}
          </div>

          <!-- Amounts -->
          <div style="margin:0 24px;background:#f8fafc;border-radius:10px;padding:16px;border:1px solid #e2e8f0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
              <span style="font-size:12px;color:#64748b;">الإجمالي</span>
              <span style="font-size:14px;font-weight:600;">${(invoice.total_amount || 0).toLocaleString("ar-EG")} ج</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e2e8f0;">
              <span style="font-size:12px;color:#64748b;">المدفوع</span>
              <span style="font-size:14px;font-weight:600;color:#16a34a;">${(invoice.paid_amount || 0).toLocaleString("ar-EG")} ج</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;color:#64748b;">المتبقي</span>
              <span style="font-size:15px;font-weight:700;color:${remaining > 0 ? "#dc2626" : "#16a34a"};">${remaining.toLocaleString("ar-EG")} ج</span>
            </div>
          </div>

          <!-- Status Badge -->
          <div style="text-align:center;padding:16px;">
            <span style="background:${statusColor[invoice.status] || "#64748b"}20;color:${statusColor[invoice.status] || "#64748b"};padding:6px 20px;border-radius:20px;font-size:13px;font-weight:600;border:1px solid ${statusColor[invoice.status] || "#64748b"}40;">
              ${statusMap[invoice.status] || invoice.status}
            </span>
          </div>

          <!-- Footer -->
          <div style="background:#f8fafc;padding:14px 24px;text-align:center;border-top:1px solid #e2e8f0;">
            <div style="font-size:12px;color:#64748b;">شكراً لثقتكم في فيزيوفلو</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">نظام إدارة عيادة العلاج الطبيعي</div>
          </div>
        </div>
      `;

      document.body.appendChild(container);
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a6" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const ratio = pdfW / canvas.width;
      const imgH = canvas.height * ratio;
      if (imgH <= pdfH) {
        pdf.addImage(imgData, "PNG", 0, (pdfH - imgH) / 2, pdfW, imgH);
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, imgH);
      }
      pdf.save(`إيصال-${invoice.patient_name}-${invoice.date || "now"}.pdf`);
    } catch (err) {
      console.error(err);
      alert("فشل تصدير الإيصال: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
      {loading ? "..." : "إيصال PDF"}
    </Button>
  );
}
