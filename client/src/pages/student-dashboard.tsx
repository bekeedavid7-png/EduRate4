import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useLecturers } from "@/hooks/use-lecturers";
import { useEvaluations } from "@/hooks/use-evaluations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCourses } from "@/hooks/use-courses";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Book, User as UserIcon, CheckCircle2, AlertCircle, Building2,
  LayoutDashboard, UserCog, ChevronRight, LogOut, Lock,
  Save, Eye, EyeOff, ArrowRight, GraduationCap, Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

type Section = "dashboard" | "profile";

export default function StudentDashboard() {
  const { user, isLoading: isAuthLoading, logout, isLoggingOut } = useAuth();
  const [, setLocation] = useLocation();
  const { data: lecturers, isLoading: isLoadingLecturers } = useLecturers();
  const { data: evaluations, isLoading: isLoadingEvals } = useEvaluations();
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { pending, completed } = useMemo(() => {
    if (!lecturers || !evaluations || !user) return { pending: [], completed: [] };
    const pendingList = lecturers.filter(
      l => !evaluations.some(e => e.lecturerId === l.id && e.courseId === l.courseId && e.studentId === user.id)
    );
    const completedList = evaluations
      .filter(e => e.studentId === user.id)
      .map(e => {
        const lecturer = lecturers.find(l => l.id === e.lecturerId && l.courseId === e.courseId);
        return {
          ...e,
          lecturerName: lecturer?.name || "Unknown Lecturer",
          courseCode: lecturer?.courseCode || "Unknown Course",
          courseName: lecturer?.courseName || "",
          department: lecturer?.department || "",
        };
      });
    return { pending: pendingList, completed: completedList };
  }, [lecturers, evaluations, user]);

  if (isAuthLoading) return <LoadingDashboard />;
  if (!user || user.role !== "student") { setLocation("/login"); return null; }

  const isLoading = isLoadingLecturers || isLoadingEvals;

  const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "My Dashboard",       icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "profile",   label: "Profile & Settings", icon: <UserCog className="w-4 h-4" /> },
  ];

  return (
    <Layout>
      <div className="flex gap-6 min-h-[calc(100vh-140px)]">

        {/* Sidebar */}
        <aside className={`shrink-0 transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"}`}>
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {sidebarOpen && (
              <div className="px-5 py-5 border-b border-slate-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl mb-3 border border-blue-200">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-slate-900 text-sm leading-tight">{user.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user.department || "Student"}</p>
              </div>
            )}

            <nav className="p-3 space-y-1 flex-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeSection === item.id
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.icon}
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                  {sidebarOpen && activeSection === item.id && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
                </button>
              ))}
            </nav>

            {/* Bottom: collapse + logout */}
            <div className="p-3 border-t border-slate-100 space-y-1">
              <button
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>}
              </button>
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
                {sidebarOpen && <span>Collapse</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeSection === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <DashboardSection user={user} pending={pending} completed={completed} isLoading={isLoading} />
              </motion.div>
            )}
            {activeSection === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <ProfileSection user={user} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </Layout>
  );
}

// ── DASHBOARD SECTION ─────────────────────────────────────────────────────────
function DashboardSection({ user, pending, completed, isLoading }: any) {
  return (
    <div>
      {/* Welcome CTA */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-200" />
            <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider">Welcome back</p>
          </div>
          <h1 className="text-2xl font-display font-extrabold mb-2">{user.name} 👋</h1>
          {pending.length > 0 ? (
            <p className="text-blue-100 text-sm">
              You have <span className="font-bold text-white">{pending.length} pending evaluation{pending.length !== 1 ? "s" : ""}</span> — share your feedback below.
            </p>
          ) : (
            <p className="text-blue-100 text-sm">You're all caught up! No pending evaluations.</p>
          )}
        </div>
        <GraduationCap className="w-20 h-20 text-white/20 shrink-0" />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-12">
          {/* Pending */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-slate-800">Pending Evaluations ({pending.length})</h2>
            </div>

            {pending.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-slate-700">All caught up!</h3>
                <p className="text-slate-500">You have no pending evaluations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pending.map((lecturer: any) => (
                  <motion.div
                    key={`${lecturer.id}-${lecturer.courseId}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
                  >
                    <div className="mb-4 flex-1">
                      <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold tracking-wide mb-3">
                        {lecturer.department}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{lecturer.courseCode}</h3>
                      <p className="text-sm text-slate-500 font-medium mb-4">{lecturer.courseName}</p>
                      <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">{lecturer.name}</span>
                      </div>
                    </div>
                    <Link
                      href={`/evaluate/${lecturer.id}/${lecturer.courseId}`}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    >
                      Start Evaluation <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Completed */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-semibold text-slate-800">Completed ({completed.length})</h2>
            </div>

            {completed.length === 0 ? (
              <div className="text-center py-8 text-slate-500">You haven't completed any evaluations yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completed.map((evalData: any) => (
                  <div key={evalData.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-md font-bold text-slate-900">{evalData.courseCode}</h3>
                        <p className="text-sm text-slate-600">{evalData.lecturerName}</p>
                      </div>
                      <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <span className="text-amber-500 text-lg">★</span> {evalData.overallRating}/5
                        </div>
                      </div>
                    </div>
                    {evalData.comments && (
                      <p className="text-sm text-slate-500 italic border-l-2 border-slate-300 pl-3 mt-4 line-clamp-2">
                        "{evalData.comments}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// ── PROFILE SECTION ───────────────────────────────────────────────────────────
function ProfileSection({ user }: any) {
  const { toast } = useToast();
  const { data: courses } = useCourses();
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ variant: "destructive", title: "Validation Error", description: "All password fields are required." }); return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Validation Error", description: "New passwords do not match." }); return;
    }
    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Validation Error", description: "Password must be at least 8 characters." }); return;
    }
    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      toast({ title: "Password Changed", description: "Your password has been updated successfully." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message || "Failed to change password." });
    } finally { setIsSavingPassword(false); }
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Profile & Settings</h1>
      <p className="text-slate-500 mb-8">View your account details and manage security</p>

      <div className="space-y-6">
        {/* Account info */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-slate-800">Account Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name",   value: user?.name },
                { label: "Username",    value: user?.username },
                { label: "Email",       value: user?.email || "—" },
                { label: "Department",  value: user?.department || "—" },
                { label: "Role",        value: user?.role },
              ].map(field => (
                <div key={field.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{field.label}</p>
                  <p className="font-semibold text-slate-800 capitalize">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-slate-800">Change Password</h2>
          </div>
          <div className="p-6 space-y-4">
            <PasswordField label="Current Password"     value={currentPassword}  onChange={setCurrentPassword}  show={showCurrent}  onToggle={() => setShowCurrent(p => !p)} />
            <PasswordField label="New Password"         value={newPassword}      onChange={setNewPassword}      show={showNew}      onToggle={() => setShowNew(p => !p)} />
            <PasswordField label="Confirm New Password" value={confirmPassword}  onChange={setConfirmPassword}  show={showConfirm}  onToggle={() => setShowConfirm(p => !p)} />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
            )}
            <Button
              onClick={handleChangePassword}
              disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full py-5 rounded-xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {isSavingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SHARED ────────────────────────────────────────────────────────────────────
function PasswordField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          className="rounded-xl pr-10 bg-slate-50/50" placeholder="••••••••" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <Layout>
      <div className="flex gap-6">
        <div className="w-60 shrink-0 animate-pulse">
          <div className="h-[500px] bg-slate-200 rounded-3xl" />
        </div>
        <div className="flex-1 animate-pulse space-y-6">
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    </Layout>
  );
}