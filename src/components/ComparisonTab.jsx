import { TrendingDown, TrendingUp, Minus, BarChart2 } from "lucide-react";
import PainProgressChart from "@/components/PainProgressChart";

export default function ComparisonTab({ sessions }) {
  if (!sessions || sessions.length === 0) return (
    <div className="text-center py-16 text-muted-foreground">
      <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p>لا توجد بيانات جلسات لعرضها</p>
    </div>
  );

  const sorted = [...sessions]
    .filter(s => s.pain_before !== undefined && s.pain_before !== null)
    .sort((a, b) => (a.session_number || 0) - (b.session_number || 0));

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const improvement =
    first && last && sorted.length >= 2 && first.pain_before > 0
      ? Math.round(((first.pain_before - last.pain_before) / first.pain_before) * 100)
      : null;

  return (
    <div className="space-y-5">
      {/* Pain Chart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold mb-4">تطور مستوى الألم عبر الجلسات</h3>
        <PainProgressChart sessions={sessions} />
      </div>

      {/* Before / After */}
      {first && last && sorted.length >= 2 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">مقارنة الجلسة الأولى والأخيرة</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">الجلسة الأولى · {first.session_date}</p>
              {first.pain_before !== undefined && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground">مستوى الألم</p>
                  <p className="text-3xl font-bold text-red-600">
                    {first.pain_before}<span className="text-sm text-muted-foreground">/10</span>
                  </p>
                </div>
              )}
              {first.subjective && (
                <p className="text-xs text-muted-foreground line-clamp-3 mt-2 border-t border-border pt-2">{first.subjective}</p>
              )}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-green-700 mb-2 font-medium">الجلسة الأخيرة · {last.session_date}</p>
              {last.pain_before !== undefined && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground">مستوى الألم</p>
                  <p className="text-3xl font-bold text-green-700">
                    {last.pain_before}<span className="text-sm text-muted-foreground">/10</span>
                  </p>
                </div>
              )}
              {last.subjective && (
                <p className="text-xs text-muted-foreground line-clamp-3 mt-2 border-t border-green-200 pt-2">{last.subjective}</p>
              )}
            </div>
          </div>

          {improvement !== null && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
              improvement > 0 ? "bg-green-100 text-green-700" :
              improvement < 0 ? "bg-red-100 text-red-700" :
              "bg-muted text-muted-foreground"
            }`}>
              {improvement > 0 ? <TrendingDown className="w-4 h-4" /> :
               improvement < 0 ? <TrendingUp className="w-4 h-4" /> :
               <Minus className="w-4 h-4" />}
              {improvement > 0
                ? `تحسّن بنسبة ${improvement}% منذ بداية العلاج ✓`
                : improvement < 0
                ? `ازداد الألم بنسبة ${Math.abs(improvement)}%`
                : "لا تغيير في مستوى الألم"}
            </div>
          )}

          {first?.objective && last?.objective && first.id !== last.id && (
            <div>
              <p className="text-sm font-semibold mb-3">مقارنة الفحص الموضوعي</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">الجلسة الأولى</p>
                  <p className="text-sm bg-muted rounded-xl p-3 leading-relaxed">{first.objective}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-2">الجلسة الأخيرة</p>
                  <p className="text-sm bg-green-50 border border-green-100 rounded-xl p-3 leading-relaxed">{last.objective}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}