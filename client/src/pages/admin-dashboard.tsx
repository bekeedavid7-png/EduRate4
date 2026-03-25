import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";
import {
  Users, BookOpen, Star, Trash2, Plus, ShieldCheck,
  CalendarRange, Power, PowerOff, LayoutDashboard, ChevronRight,
  LogOut, GraduationCap, ClipboardList, BarChart3, Search, Download, FileText, FileSpreadsheet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Section = "overview" | "courses" | "users" | "evaluations" | "periods";

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading, logout, isLoggingOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [courseSearch, setCourseSearch] = useState("");

  // Course form
  const [newDept, setNewDept] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [deptMode, setDeptMode] = useState<"existing" | "new">("existing");

  // Period form
  const [periodName, setPeriodName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [periodActive, setPeriodActive] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== "admin")) setLocation("/login");
  }, [user, isAuthLoading, setLocation]);

  // === QUERIES ===
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/admin/users"], queryFn: async () => { const r = await fetch("/api/admin/users", { credentials: "include" }); if (!r.ok) throw new Error(); return r.json(); }, enabled: !!user && user.role === "admin" });
  const { data: courses = [] } = useQuery<any[]>({ queryKey: ["/api/admin/courses"], queryFn: async () => { const r = await fetch("/api/admin/courses", { credentials: "include" }); if (!r.ok) throw new Error(); return r.json(); }, enabled: !!user && user.role === "admin" });
  const { data: evaluations = [] } = useQuery<any[]>({ queryKey: ["/api/admin/evaluations"], queryFn: async () => { const r = await fetch("/api/admin/evaluations", { credentials: "include" }); if (!r.ok) throw new Error(); return r.json(); }, enabled: !!user && user.role === "admin" });
  const { data: periods = [] } = useQuery<any[]>({ queryKey: ["/api/admin/periods"], queryFn: async () => { const r = await fetch("/api/admin/periods", { credentials: "include" }); if (!r.ok) throw new Error(); return r.json(); }, enabled: !!user && user.role === "admin" });

  // === MUTATIONS ===
  const deleteUser = useMutation({ mutationFn: async (id: number) => { const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" }); if (!r.ok) throw new Error((await r.json()).message); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "User deleted" }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const createCourse = useMutation({ mutationFn: async () => { const dept = deptMode === "new" ? customDept : newDept; const r = await fetch("/api/admin/courses", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ department: dept, code: newCode, name: newName }) }); if (!r.ok) throw new Error((await r.json()).message); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] }); queryClient.invalidateQueries({ queryKey: ["/api/courses"] }); setNewDept(""); setNewCode(""); setNewName(""); setCustomDept(""); toast({ title: "Course created" }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const deleteCourse = useMutation({ mutationFn: async (id: number) => { const r = await fetch(`/api/admin/courses/${id}`, { method: "DELETE", credentials: "include" }); if (!r.ok) throw new Error((await r.json()).message); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] }); queryClient.invalidateQueries({ queryKey: ["/api/courses"] }); toast({ title: "Course deleted" }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const deleteEvaluation = useMutation({ mutationFn: async (id: number) => { const r = await fetch(`/api/admin/evaluations/${id}`, { method: "DELETE", credentials: "include" }); if (!r.ok) throw new Error(); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/evaluations"] }); toast({ title: "Evaluation deleted" }); }, onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to delete" }) });
  const createPeriod = useMutation({ mutationFn: async () => { const r = await fetch("/api/admin/periods", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: periodName, startDate: periodStart, endDate: periodEnd, isActive: periodActive }) }); if (!r.ok) throw new Error((await r.json()).message); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/periods"] }); setPeriodName(""); setPeriodStart(""); setPeriodEnd(""); setPeriodActive(true); toast({ title: "Period created" }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const activatePeriod = useMutation({ mutationFn: async (id: number) => { const r = await fetch(`/api/admin/periods/${id}/activate`, { method: "PUT", credentials: "include" }); if (!r.ok) throw new Error(); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/periods"] }); toast({ title: "Period activated" }); }, onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to activate" }) });
  const deactivatePeriod = useMutation({ mutationFn: async (id: number) => { const r = await fetch(`/api/admin/periods/${id}/deactivate`, { method: "PUT", credentials: "include" }); if (!r.ok) throw new Error(); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/periods"] }); toast({ title: "Period deactivated" }); }, onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to deactivate" }) });
  const deletePeriod = useMutation({ mutationFn: async (id: number) => { const r = await fetch(`/api/admin/periods/${id}`, { method: "DELETE", credentials: "include" }); if (!r.ok) throw new Error(); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/periods"] }); toast({ title: "Period deleted" }); }, onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to delete" }) });

  if (isAuthLoading) return <Layout><div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;

  const departments = Array.from(new Set(courses.map((c: any) => c.department))).sort() as string[];
  const students = users.filter((u: any) => u.role === "student");
  const lecturers = users.filter((u: any) => u.role === "lecturer");

  const formatDate = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const isPeriodOpen = (p: any) => { const now = new Date(); return new Date(p.startDate) <= now && now <= new Date(p.endDate); };

  // Department benchmarking data
  const deptBenchmarks = useMemo(() => {
    if (!evaluations.length) return [];
    const map: Record<string, { total: number; sum: number; count: number }> = {};
    evaluations.forEach((e: any) => {
      const course = courses.find((c: any) => c.code === e.courseCode);
      const dept = course?.department || "Unknown";
      if (!map[dept]) map[dept] = { total: 0, sum: 0, count: 0 };
      map[dept].sum += e.overallRating;
      map[dept].count += 1;
      map[dept].total += 1;
    });
    return Object.entries(map)
      .map(([dept, d]) => ({
        dept: dept.length > 14 ? dept.slice(0, 13) + "…" : dept,
        fullDept: dept,
        avg: parseFloat((d.sum / d.count).toFixed(2)),
        pct: parseFloat(((d.sum / d.count / 5) * 100).toFixed(1)),
        count: d.count,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [evaluations, courses]);

  // === EXPORT FUNCTIONS ===
  function exportUsersCSV() {
    const header = ["Name", "Username", "Email", "Role", "Department"];
    const rows = users.map((u: any) => [u.name, u.username, u.email || "", u.role, u.department || ""]);
    downloadCSV([header, ...rows], "users-export.csv");
  }

  function exportEvaluationsCSV() {
    const header = ["Lecturer", "Course", "Overall Rating", "Performance %", "Date"];
    const rows = evaluations.map((e: any) => [
      e.lecturerName, e.courseCode, e.overallRating,
      `${Math.round((e.overallRating / 5) * 100)}%`,
      e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ""
    ]);
    downloadCSV([header, ...rows], "evaluations-export.csv");
  }

  function exportDeptBenchmarkCSV() {
    const avgPct = deptBenchmarks.length ? deptBenchmarks.reduce((s: number, d: any) => s + d.pct, 0) / deptBenchmarks.length : 0;
    const header = ["Rank", "Department", "Avg Score", "Performance %", "Evaluations", "vs Average"];
    const rows = deptBenchmarks.map((d: any, i: number) => [
      `#${i + 1}`, d.fullDept, `${d.avg}/5`, `${d.pct}%`, d.count, `${(d.pct - avgPct) >= 0 ? "+" : ""}${(d.pct - avgPct).toFixed(1)}%`
    ]);
    downloadCSV([header, ...rows], "department-benchmark.csv");
  }

  function exportEvaluationsPDF() {
    const doc = new jsPDF();
    const exportDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    doc.setFontSize(18); doc.setTextColor(15, 23, 42); doc.text("EDURATE — Admin Evaluation Report", 14, 18);
    doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`Exported: ${exportDate}`, 14, 26);

    // Department benchmark
    doc.setFontSize(13); doc.setTextColor(15, 23, 42); doc.text("Department Performance Benchmark", 14, 38);
    const avgPct = deptBenchmarks.length ? deptBenchmarks.reduce((s: number, d: any) => s + d.pct, 0) / deptBenchmarks.length : 0;
    autoTable(doc, {
      startY: 42,
      head: [["Rank", "Department", "Avg Score", "Performance %", "Evaluations", "vs Average"]],
      body: deptBenchmarks.map((d: any, i: number) => [
        `#${i + 1}`, d.fullDept, `${d.avg}/5`, `${d.pct}%`, d.count,
        `${(d.pct - avgPct) >= 0 ? "+" : ""}${(d.pct - avgPct).toFixed(1)}%`
      ]),
      styles: { fontSize: 9 }, headStyles: { fillColor: [59, 130, 246] }, alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // All evaluations
    const lastY = (doc as any).lastAutoTable?.finalY ?? 60;
    doc.setFontSize(13); doc.setTextColor(15, 23, 42); doc.text("All Evaluations", 14, lastY + 14);
    autoTable(doc, {
      startY: lastY + 18,
      head: [["Lecturer", "Course", "Overall", "Performance %", "Date"]],
      body: evaluations.map((e: any) => [
        e.lecturerName, e.courseCode, `${e.overallRating}/5`,
        `${Math.round((e.overallRating / 5) * 100)}%`,
        e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—"
      ]),
      styles: { fontSize: 9 }, headStyles: { fillColor: [99, 102, 241] }, alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save("edurate-evaluations-report.pdf");
  }

  function exportUsersPDF() {
    const doc = new jsPDF();
    const exportDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    doc.setFontSize(18); doc.setTextColor(15, 23, 42); doc.text("EDURATE — Users Report", 14, 18);
    doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`Exported: ${exportDate} · ${users.length} users`, 14, 26);
    autoTable(doc, {
      startY: 32,
      head: [["Name", "Username", "Email", "Role", "Department"]],
      body: users.map((u: any) => [u.name, u.username, u.email || "—", u.role, u.department || "—"]),
      styles: { fontSize: 9 }, headStyles: { fillColor: [59, 130, 246] }, alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save("edurate-users-report.pdf");
  }

  function downloadCSV(rows: any[][], filename: string) {
    const csv = rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "overview",    label: "Overview",            icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "courses",     label: "Courses",             icon: <BookOpen className="w-4 h-4" /> },
    { id: "users",       label: "Users",               icon: <Users className="w-4 h-4" /> },
    { id: "evaluations", label: "Evaluation Reports",         icon: <BarChart3 className="w-4 h-4" /> },
    { id: "periods",     label: "Evaluation Periods",  icon: <CalendarRange className="w-4 h-4" /> },
  ];

  const stats = [
    { label: "Students",    value: students.length,    color: "bg-blue-50",    text: "text-blue-600" },
    { label: "Lecturers",   value: lecturers.length,   color: "bg-indigo-50",  text: "text-indigo-600" },
    { label: "Courses",     value: courses.length,     color: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Evaluations", value: evaluations.length, color: "bg-amber-50",   text: "text-amber-600" },
  ];

  return (
    <Layout>
      <div className="flex gap-6 min-h-[calc(100vh-140px)]">

        {/* Sidebar */}
        <aside className={`shrink-0 transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"}`}>
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {sidebarOpen && (
              <div className="px-5 py-5 border-b border-slate-100 bg-gradient-to-br from-rose-50 to-orange-50">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-3 border border-rose-200">
                  <ShieldCheck className="w-6 h-6 text-rose-600" />
                </div>
                <p className="font-bold text-slate-900 text-sm leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Administrator</p>
              </div>
            )}

            <nav className="p-3 space-y-1 flex-1">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === item.id ? "bg-primary text-white shadow-md shadow-primary/25" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                >
                  {item.icon}
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                  {sidebarOpen && activeSection === item.id && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
                </button>
              ))}
            </nav>

            <div className="p-3 border-t border-slate-100 space-y-1">
              <button onClick={() => logout()} disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>}
              </button>
              <button onClick={() => setSidebarOpen(o => !o)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
                {sidebarOpen && <span>Collapse</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">

            {/* OVERVIEW */}
            {activeSection === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Admin Panel</h1>
                <p className="text-slate-500 mb-8">System overview and quick stats</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {stats.map(s => (
                    <div key={s.label} className={`${s.color} rounded-2xl p-5 border border-white shadow-sm`}>
                      <p className="text-sm font-semibold text-slate-500">{s.label}</p>
                      <p className={`text-4xl font-display font-bold ${s.text} mt-1`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Navigate to Courses",            id: "courses" as Section,     icon: <BookOpen className="w-5 h-5 text-emerald-600" />,  bg: "bg-emerald-50",  desc: "Add or remove courses" },
                    { label: "Manage Users",                   id: "users" as Section,       icon: <Users className="w-5 h-5 text-blue-600" />,         bg: "bg-blue-50",     desc: "View all registered users" },
                    { label: "View Evaluation Analytics",      id: "evaluations" as Section, icon: <BarChart3 className="w-5 h-5 text-amber-600" />,    bg: "bg-amber-50",   desc: "Department benchmarks" },
                    { label: "Manage Evaluation Periods",      id: "periods" as Section,     icon: <CalendarRange className="w-5 h-5 text-violet-600" />, bg: "bg-violet-50", desc: "Control evaluation windows" },
                  ].map(item => (
                    <button key={item.id} onClick={() => setActiveSection(item.id)}
                      className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all text-left w-full group">
                      <div className={`${item.bg} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>{item.icon}</div>
                      <div>
                        <p className="font-semibold text-slate-800 group-hover:text-primary transition-colors">{item.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* COURSES */}
            {activeSection === "courses" && (
              <motion.div key="courses" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Courses</h1>
                <p className="text-slate-500 mb-8">Add and remove courses from the system</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Add New Course</h2>
                    <div className="space-y-4">
                      <div className="flex p-1 bg-slate-100 rounded-xl">
                        <button type="button" onClick={() => setDeptMode("existing")} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${deptMode === "existing" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}>Existing Dept</button>
                        <button type="button" onClick={() => setDeptMode("new")} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${deptMode === "new" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}>New Dept</button>
                      </div>
                      {deptMode === "existing" ? (
                        <div className="space-y-1"><Label>Department</Label>
                          <Select value={newDept} onValueChange={setNewDept}><SelectTrigger className="rounded-xl bg-slate-50/50"><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                        </div>
                      ) : (
                        <div className="space-y-1"><Label>New Department Name</Label><Input value={customDept} onChange={e => setCustomDept(e.target.value)} className="rounded-xl bg-slate-50/50" placeholder="e.g. Engineering" /></div>
                      )}
                      <div className="space-y-1"><Label>Course Code</Label><Input value={newCode} onChange={e => setNewCode(e.target.value)} className="rounded-xl bg-slate-50/50" placeholder="e.g. ENG101" /></div>
                      <div className="space-y-1"><Label>Course Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} className="rounded-xl bg-slate-50/50" placeholder="e.g. Introduction to Engineering" /></div>
                      <Button onClick={() => createCourse.mutate()} disabled={createCourse.isPending || !newCode || !newName || (deptMode === "existing" ? !newDept : !customDept)} className="w-full rounded-xl bg-gradient-to-r from-primary to-indigo-600">
                        {createCourse.isPending ? "Adding..." : "Add Course"}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-lg font-bold text-slate-800">All Courses ({courses.length})</h2>
                    </div>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={courseSearch}
                        onChange={e => setCourseSearch(e.target.value)}
                        placeholder="Search by department or course..."
                        className="pl-9 rounded-xl bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                      {(() => {
                        const q = courseSearch.toLowerCase().trim();
                        const filteredDepts = departments.filter(dept => {
                          if (!q) return true;
                          if (dept.toLowerCase().includes(q)) return true;
                          return courses.some((c: any) => c.department === dept && (c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)));
                        });
                        if (filteredDepts.length === 0) return <div className="text-center py-8 text-slate-400 text-sm">No courses match your search.</div>;
                        return filteredDepts.map(dept => {
                          const deptCourses = courses.filter((c: any) => c.department === dept && (!q || dept.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)));
                          if (deptCourses.length === 0) return null;
                          return (
                            <div key={dept}>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2">{dept}</p>
                              {deptCourses.map((course: any) => (
                                <div key={course.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 mb-2">
                                  <div><span className="text-sm font-bold text-slate-800">{course.code}</span><span className="text-sm text-slate-500 ml-2">{course.name}</span></div>
                                  <button onClick={() => { if (confirm(`Delete ${course.code}?`)) deleteCourse.mutate(course.id); }} className="text-slate-400 hover:text-rose-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              ))}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* USERS */}
            {activeSection === "users" && (
              <motion.div key="users" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Users</h1>
                <p className="text-slate-500 mb-8">All registered users in the system</p>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-slate-800">All Users ({users.length})</h2>
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">{students.length} students</span>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full text-xs font-semibold">{lecturers.length} lecturers</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={exportUsersPDF} className="rounded-xl flex items-center gap-1.5 text-xs border-rose-200 text-rose-600 hover:bg-rose-50">
                        <FileText className="w-3.5 h-3.5" /> PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={exportUsersCSV} className="rounded-xl flex items-center gap-1.5 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                        <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="text-left px-6 py-3">Name</th>
                          <th className="text-left px-6 py-3">Username</th>
                          <th className="text-left px-6 py-3">Email</th>
                          <th className="text-left px-6 py-3">Role</th>
                          <th className="text-left px-6 py-3">Department</th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u: any) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-800">{u.name}</td>
                            <td className="px-6 py-4 text-slate-600">{u.username}</td>
                            <td className="px-6 py-4 text-slate-600">{u.email || "—"}</td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === "admin" ? "bg-rose-100 text-rose-600" : u.role === "lecturer" ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"}`}>{u.role}</span></td>
                            <td className="px-6 py-4 text-slate-600">{u.department || "—"}</td>
                            <td className="px-6 py-4">{u.role !== "admin" && <button onClick={() => { if (confirm(`Delete user "${u.name}"? This cannot be undone.`)) deleteUser.mutate(u.id); }} className="text-slate-400 hover:text-rose-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {users.length === 0 && <div className="text-center py-12 text-slate-400">No users yet.</div>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* EVALUATIONS */}
            {activeSection === "evaluations" && (
              <motion.div key="evaluations" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Evaluation Reports</h1>
                <p className="text-slate-500 mb-8">Department performance benchmarks and evaluation data</p>

                {/* Department benchmark chart */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                  <div className="p-6 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Department Performance Benchmark</h2>
                      <p className="text-sm text-slate-500 mt-1">Average evaluation score per department (as % of maximum)</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={exportEvaluationsPDF} className="rounded-xl flex items-center gap-1.5 text-xs border-rose-200 text-rose-600 hover:bg-rose-50">
                        <FileText className="w-3.5 h-3.5" /> PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={exportDeptBenchmarkCSV} className="rounded-xl flex items-center gap-1.5 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                        <FileSpreadsheet className="w-3.5 h-3.5" /> CSV (Benchmark)
                      </Button>
                      <Button size="sm" variant="outline" onClick={exportEvaluationsCSV} className="rounded-xl flex items-center gap-1.5 text-xs border-blue-200 text-blue-600 hover:bg-blue-50">
                        <FileSpreadsheet className="w-3.5 h-3.5" /> CSV (All)
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    {deptBenchmarks.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">No evaluation data yet.</div>
                    ) : (
                      <>
                        <div className="h-[300px] mb-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptBenchmarks} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="dept" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} />
                              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={v => `${v}%`} />
                              <Tooltip
                                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                                formatter={(v: any, _: any, props: any) => [`${v}% (${props.payload.avg}/5) — ${props.payload.count} evaluation${props.payload.count !== 1 ? "s" : ""}`, props.payload.fullDept]}
                                labelFormatter={() => ""}
                              />
                              <Bar dataKey="pct" radius={[6, 6, 0, 0]} maxBarSize={64}>
                                {deptBenchmarks.map((entry, i) => (
                                  <Cell key={i} fill={entry.pct >= 80 ? "#10b981" : entry.pct >= 60 ? "#3b82f6" : entry.pct >= 40 ? "#f59e0b" : "#ef4444"} />
                                ))}
                                <LabelList dataKey="pct" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: 11, fontWeight: 700, fill: "#475569" }} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Benchmark table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                              <tr>
                                <th className="text-left px-4 py-3">Rank</th>
                                <th className="text-left px-4 py-3">Department</th>
                                <th className="text-left px-4 py-3">Avg Score</th>
                                <th className="text-left px-4 py-3">Performance</th>
                                <th className="text-left px-4 py-3">Evaluations</th>
                                <th className="text-left px-4 py-3">vs Average</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(() => {
                                const avgPct = deptBenchmarks.length ? deptBenchmarks.reduce((s, d) => s + d.pct, 0) / deptBenchmarks.length : 0;
                                return deptBenchmarks.map((d, i) => {
                                  const diff = d.pct - avgPct;
                                  const barColor = d.pct >= 80 ? "bg-emerald-500" : d.pct >= 60 ? "bg-blue-500" : d.pct >= 40 ? "bg-amber-500" : "bg-red-500";
                                  return (
                                    <tr key={d.fullDept} className="hover:bg-slate-50">
                                      <td className="px-4 py-3 font-bold text-slate-400">#{i + 1}</td>
                                      <td className="px-4 py-3 font-semibold text-slate-800">{d.fullDept}</td>
                                      <td className="px-4 py-3 font-bold text-slate-800">{d.avg}/5</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${d.pct}%` }} />
                                          </div>
                                          <span className="text-xs font-bold text-slate-600 w-10">{d.pct}%</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-slate-600">{d.count}</td>
                                      <td className="px-4 py-3">
                                        <span className={`text-xs font-bold ${diff >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                                          {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Raw evaluations — no student names */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">All Evaluations ({evaluations.length})</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="text-left px-6 py-3">Lecturer</th>
                          <th className="text-left px-6 py-3">Course</th>
                          <th className="text-left px-6 py-3">Overall</th>
                          <th className="text-left px-6 py-3">Performance</th>
                          <th className="text-left px-6 py-3">Date</th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {evaluations.map((e: any) => {
                          const pct = Math.round((e.overallRating / 5) * 100);
                          return (
                            <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-800">{e.lecturerName}</td>
                              <td className="px-6 py-4 text-slate-600">{e.courseCode}</td>
                              <td className="px-6 py-4"><span className="flex items-center gap-1 font-bold text-amber-500">★ {e.overallRating}/5</span></td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-slate-500">{pct}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs">{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—"}</td>
                              <td className="px-6 py-4"><button onClick={() => { if (confirm("Delete this evaluation?")) deleteEvaluation.mutate(e.id); }} className="text-slate-400 hover:text-rose-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {evaluations.length === 0 && <div className="text-center py-12 text-slate-400">No evaluations yet.</div>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PERIODS */}
            {activeSection === "periods" && (
              <motion.div key="periods" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Evaluation Periods</h1>
                <p className="text-slate-500 mb-8">Control when students can submit evaluations</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Create form */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Create Evaluation Period</h2>
                    <div className="space-y-4">
                      <div className="space-y-1"><Label>Period Name</Label><Input value={periodName} onChange={e => setPeriodName(e.target.value)} className="rounded-xl bg-slate-50/50" placeholder="e.g. 2025/2026 2nd Semester" /></div>
                      <div className="space-y-1"><Label>Start Date & Time</Label><Input type="datetime-local" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="rounded-xl bg-slate-50/50" /></div>
                      <div className="space-y-1"><Label>End Date & Time</Label><Input type="datetime-local" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="rounded-xl bg-slate-50/50" /></div>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" checked={periodActive} onChange={e => setPeriodActive(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
                        <span className="text-sm font-medium text-slate-700">Set as active period immediately</span>
                      </label>
                      <p className="text-xs text-slate-400">Setting a period as active will deactivate all other periods.</p>
                      <Button onClick={() => createPeriod.mutate()} disabled={createPeriod.isPending || !periodName || !periodStart || !periodEnd} className="w-full rounded-xl bg-gradient-to-r from-primary to-indigo-600">
                        {createPeriod.isPending ? "Creating..." : "Create Period"}
                      </Button>
                    </div>
                  </div>

                  {/* Period list */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-5">All Periods ({periods.length})</h2>
                    {periods.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <CalendarRange className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No evaluation periods created yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                        {periods.map((p: any) => {
                          const open = isPeriodOpen(p);
                          return (
                            <div key={p.id} className={`rounded-2xl border p-4 ${p.isActive ? "border-primary/30 bg-primary/5" : "border-slate-100 bg-slate-50"}`}>
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                                  <p className="text-xs text-slate-500 mt-0.5">{formatDate(p.startDate)} → {formatDate(p.endDate)}</p>
                                </div>
                                <div className="flex flex-wrap gap-1.5 shrink-0">
                                  {p.isActive && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Active</span>}
                                  {open && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Within Window</span>}
                                  {!open && p.isActive && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Outside Window</span>}
                                </div>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {!p.isActive ? (
                                  <Button size="sm" variant="outline" onClick={() => activatePeriod.mutate(p.id)} disabled={activatePeriod.isPending} className="rounded-lg text-xs flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
                                    <Power className="w-3 h-3" /> Activate
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => deactivatePeriod.mutate(p.id)} disabled={deactivatePeriod.isPending} className="rounded-lg text-xs flex items-center gap-1.5 border-amber-300 text-amber-600 hover:bg-amber-50">
                                    <PowerOff className="w-3 h-3" /> Deactivate
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => { if (confirm(`Delete "${p.name}"?`)) deletePeriod.mutate(p.id); }} disabled={deletePeriod.isPending} className="rounded-lg text-xs flex items-center gap-1.5 border-rose-200 text-rose-500 hover:bg-rose-50">
                                  <Trash2 className="w-3 h-3" /> Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </Layout>
  );
}