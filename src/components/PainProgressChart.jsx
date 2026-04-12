import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function PainProgressChart({ sessions }) {
  if (!sessions || sessions.length === 0) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      لا توجد بيانات ألم مسجلة
    </div>
  );

  const data = sessions
    .filter(s => s.pain_before !== undefined || s.pain_after !== undefined)
    .sort((a, b) => {
      if (a.session_number && b.session_number) return a.session_number - b.session_number;
      return a.session_date?.localeCompare(b.session_date);
    })
    .map((s, i) => ({
      label: `ج${s.session_number || i + 1}`,
      قبل: s.pain_before,
      بعد: s.pain_after,
    }));

  if (data.length === 0) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      لا توجد بيانات ألم مسجلة
    </div>
  );

  // Trend
  const firstBefore = data[0]?.قبل;
  const lastBefore = data[data.length - 1]?.قبل;
  const trend = firstBefore !== undefined && lastBefore !== undefined
    ? lastBefore - firstBefore : null;

  return (
    <div className="space-y-4">
      {/* Trend indicator */}
      {trend !== null && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium w-fit ${
          trend < 0 ? "bg-green-100 text-green-700" :
          trend > 0 ? "bg-red-100 text-red-700" :
          "bg-muted text-muted-foreground"
        }`}>
          {trend < 0 ? <TrendingDown className="w-4 h-4" /> :
           trend > 0 ? <TrendingUp className="w-4 h-4" /> :
           <Minus className="w-4 h-4" />}
          {trend < 0
            ? `تحسّن بمقدار ${Math.abs(trend)} نقطة ✓`
            : trend > 0
            ? `ازداد الألم بمقدار ${trend} نقطة`
            : "لا تغيير في مستوى الألم"}
        </div>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: "Cairo" }} />
          <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11 }} />
          <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 4" />
          <Tooltip
            formatter={(v, name) => [`${v}/10`, name]}
            contentStyle={{ fontFamily: "Cairo", borderRadius: 12, fontSize: 13 }}
          />
          <Line type="monotone" dataKey="قبل" stroke="#ef4444" strokeWidth={2.5}
            dot={{ r: 5, fill: "#ef4444" }} activeDot={{ r: 7 }} />
          <Line type="monotone" dataKey="بعد" stroke="#22c55e" strokeWidth={2.5}
            dot={{ r: 5, fill: "#22c55e" }} activeDot={{ r: 7 }} />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>قبل الجلسة</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>بعد الجلسة</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 border-t-2 border-dashed border-amber-400" />
          <span>منتصف (5/10)</span>
        </div>
      </div>
    </div>
  );
}