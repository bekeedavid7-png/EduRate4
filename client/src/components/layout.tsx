import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {user ? (
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-xl">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-gradient">
                  EDURATE
                </span>
              </div>
            ) : (
              <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-gradient">
                  EDURATE
                </span>
              </Link>
            )}

            <nav className="flex items-center gap-4">
              {user ? (
                <>
                  <Link 
                    href={user.role === 'student' ? '/student' : user.role === 'admin' ? '/admin' : '/lecturer'}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      location.includes(user.role === 'admin' ? 'admin' : user.role)
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-slate-100"
                    )}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  

                </>
              ) : (
                <>
                  <Link 
                    href="/login"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 cursor-pointer"
                  >
                    Log in
                  </Link>
                  <Link 
                    href="/register"
                    className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}