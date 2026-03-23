import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, UserCog, ShieldCheck } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) {
    return <>{children}</>;
  }

  const navItems =
    user.role === "student"
      ? [
          { label: "Dashboard", href: "/student", icon: LayoutDashboard },
          { label: "My Profile", href: "/student/profile", icon: UserCog },
        ]
      : user.role === "lecturer"
        ? [
            { label: "Dashboard", href: "/lecturer", icon: LayoutDashboard },
            { label: "My Profile", href: "/lecturer/profile", icon: UserCog },
          ]
        : [{ label: "Admin Panel", href: "/admin", icon: ShieldCheck }];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
      <aside className="bg-[#1e3b8a] rounded-2xl border border-[#1a3277] p-4 h-fit md:sticky md:top-24 shadow-[0_8px_24px_rgba(30,59,138,0.25)]">
        <p className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-3">Navigation</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-white/15 text-white border-l-[3px] border-amber-400"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div>{children}</div>
    </div>
  );
}
