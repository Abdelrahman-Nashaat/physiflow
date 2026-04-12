import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";
import {
  LayoutDashboard, Users, Calendar, FileText,
  Receipt, Menu, LogOut, Stethoscope, ChevronLeft, Activity, BarChart2, User, Settings
} from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/", label: "الرئيسية", icon: LayoutDashboard, roles: ["doctor", "admin"] },
  { path: "/appointments", label: "المواعيد", icon: Calendar, roles: ["doctor", "admin", "secretary"] },
  { path: "/patients", label: "المرضى", icon: Users, roles: ["doctor", "admin", "secretary"] },
  { path: "/sessions", label: "الجلسات", icon: FileText, roles: ["doctor", "admin"] },
  { path: "/exercises", label: "التمارين", icon: Activity, roles: ["doctor", "admin"] },
  { path: "/invoices", label: "الفواتير", icon: Receipt, roles: ["doctor", "admin", "secretary"] },
  { path: "/packages", label: "الباقات المالية", icon: Receipt, roles: ["doctor", "admin"] },
  { path: "/analytics", label: "التحليلات", icon: BarChart2, roles: ["doctor", "admin"] },
  { path: "/secretary", label: "لوحة السكرتيرة", icon: Calendar, roles: ["secretary", "admin"] },
  { path: "/portal", label: "بوابتي", icon: User, roles: ["patient"] },
  { path: "/settings", label: "إعدادات العيادة", icon: Settings, roles: ["doctor", "admin"] },
];

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleLabel = { doctor: "دكتور", admin: "دكتور", secretary: "سكرتيرة", patient: "مريض" };
  const allowedNav = navItems.filter(item => item.roles.includes(user?.role || "doctor"));

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed right-0 top-0 h-full w-64 bg-card border-l border-border z-50 transition-transform duration-300 flex flex-col",
        "lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-base">فيزيوفلو</h1>
              <p className="text-xs text-muted-foreground">نظام إدارة العيادة</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allowedNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {active && <ChevronLeft className="w-4 h-4 mr-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
              {user?.full_name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{roleLabel[user?.role] || "دكتور"}</p>
            </div>
            <button onClick={() => base44.auth.logout()} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">فيزيوفلو</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <div className="hidden lg:block px-6 pt-4">
          <GlobalSearch />
        </div>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}