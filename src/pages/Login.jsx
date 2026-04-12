import { useState } from 'react';
import { supabase } from '@/api/base44Client';
import { Stethoscope, LogIn, Loader2, FlaskConical } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'doctor', label: 'دكتور', description: 'لوحة تحكم كاملة + AI + جلسات + مرضى', email: 'doctor@physiflow-demo.com', password: 'Demo@physiflow1', color: 'bg-blue-500', emoji: '🩺' },
  { role: 'secretary', label: 'سكرتيرة', description: 'مواعيد + مرضى + فواتير + قائمة انتظار', email: 'secretary@physiflow-demo.com', password: 'Demo@physiflow1', color: 'bg-purple-500', emoji: '📋' },
  { role: 'patient', label: 'مريض', description: 'بوابة المريض + تمارين + تقدم + مواعيد', email: 'patient@physiflow-demo.com', password: 'Demo@physiflow1', color: 'bg-green-500', emoji: '👤' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    setLoading(false);
  }

  async function loginAsDemo(account) {
    setDemoLoading(account.role);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: account.email, password: account.password });
    if (error) setError('حساب Demo غير متاح حالياً. راجع README لإعداده.');
    setDemoLoading(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">فيزيوفلو</h1>
          <p className="text-gray-500 text-sm mt-1">نظام إدارة عيادة العلاج الطبيعي</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">جرّب النظام مجاناً</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Demo</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">اختر دوراً وادخل مباشرة بدون تسجيل</p>
          <div className="space-y-3">
            {DEMO_ACCOUNTS.map((account) => (
              <button key={account.role} onClick={() => loginAsDemo(account)} disabled={!!demoLoading}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-right group disabled:opacity-60">
                <div className={`w-10 h-10 ${account.color} rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                  {demoLoading === account.role ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : account.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">{account.label}</div>
                  <div className="text-xs text-muted-foreground">{account.description}</div>
                </div>
                <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">دخول ←</span>
              </button>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl border border-red-200">{error}</div>}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">أو سجّل دخول بحسابك</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {!showLogin ? (
          <button onClick={() => setShowLogin(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-muted text-sm font-medium text-muted-foreground transition-colors">
            <LogIn className="w-4 h-4" />
            تسجيل دخول بحساب خاص
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@clinic.com" required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-primary text-white rounded-lg py-2.5 font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">فيزيوفلو © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
