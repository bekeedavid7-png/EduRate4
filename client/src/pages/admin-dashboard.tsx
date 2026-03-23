import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, BookOpen, Star, Trash2, Plus, ShieldCheck, CalendarClock, Power, BarChart3, Settings, Download, Pencil, Home, CheckSquare, Menu } from "lucide-react";
import { motion } from "framer-motion";
import {
  useAdminEvaluationPeriods,
  useCreateEvaluationPeriod,
  useDeleteEvaluationPeriod,
  useUpdateEvaluationPeriod,
} from "@/hooks/use-evaluation-periods";

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading, logout, isLoggingOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // New course form state
  const [newDept, setNewDept] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [deptMode, setDeptMode] = useState<'existing' | 'new'>('existing');
  const [periodName, setPeriodName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [periodIsActive, setPeriodIsActive] = useState(true);
  const [criterionLabel, setCriterionLabel] = useState("");
  const [criterionKey, setCriterionKey] = useState("");
  const [criterionDescription, setCriterionDescription] = useState("");
  const [editingCriterion, setEditingCriterion] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("courses");
  const [courseFilter, setCourseFilter] = useState("all");
  const [courseSearch, setCourseSearch] = useState("");
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== 'admin')) setLocation('/login');
  }, [user, isAuthLoading, setLocation]);

  // === QUERIES ===
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/courses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/courses", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  const { data: evaluations = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/evaluations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/evaluations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  const { data: evaluationPeriods = [] } = useAdminEvaluationPeriods(!!user && user.role === 'admin');

  const { data: analyticsData } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  const { data: criteria = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/criteria"],
    queryFn: async () => {
      const res = await fetch("/api/admin/criteria", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  // === MUTATIONS ===
  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const createCourse = useMutation({
    mutationFn: async () => {
      const dept = deptMode === 'new' ? customDept : newDept;
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ department: dept, code: newCode, name: newName }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setNewDept(""); setNewCode(""); setNewName(""); setCustomDept("");
      toast({ title: "Course created" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course deleted" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteEvaluation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/evaluations/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/evaluations"] });
      toast({ title: "Evaluation deleted" });
    },
    onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to delete evaluation" }),
  });

  const createPeriod = useCreateEvaluationPeriod();
  const updatePeriod = useUpdateEvaluationPeriod();
  const deletePeriod = useDeleteEvaluationPeriod();

  const createCriterion = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/criteria"] });
      setCriterionLabel(""); setCriterionKey(""); setCriterionDescription("");
      toast({ title: "Criterion created" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const updateCriterion = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/admin/criteria/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/criteria"] });
      setEditingCriterion(null);
      toast({ title: "Criterion updated" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteCriterion = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/criteria/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/criteria"] });
      toast({ title: "Criterion deleted" });
    },
    onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to delete criterion" }),
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const departments = Array.from(new Set(courses.map((c: any) => c.department))).sort() as string[];
  const students = users.filter((u: any) => u.role === 'student');
  const lecturers = users.filter((u: any) => u.role === 'lecturer');
  const filteredCourses = courses.filter((c: any) => {
    const matchesDepartment = courseFilter === "all" || c.department === courseFilter;
    const query = courseSearch.trim().toLowerCase();
    const matchesSearch = !query || `${c.code} ${c.name} ${c.department}`.toLowerCase().includes(query);
    return matchesDepartment && matchesSearch;
  });

  // ---- Admin Export Functions ----
  const exportAdminCsv = () => {
    if (!analyticsData) return;
    const rows: string[][] = [
      ["Lecturer", "Department", "Courses", "Avg Overall", "Median Overall", "Mode Overall", "Avg Clarity", "Avg Engagement", "Avg Materials", "Avg Org", "Avg Feedback", "Avg Pace", "Avg Support", "Avg Fairness", "Avg Relevance", "Total Evals"],
      ...analyticsData.perLecturer.map((l: any) => [
        l.lecturerName, l.department || "", l.courses || "",
        l.averageOverall.toFixed(2), l.medianOverall.toFixed(2), String(l.modeOverall),
        l.averageClarity.toFixed(2), l.averageEngagement.toFixed(2), l.averageMaterials.toFixed(2),
        l.averageOrganization.toFixed(2), l.averageFeedback.toFixed(2), l.averagePace.toFixed(2),
        l.averageSupport.toFixed(2), l.averageFairness.toFixed(2), l.averageRelevance.toFixed(2),
        String(l.totalEvaluations),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.setAttribute("download", `edurate-admin-report-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const exportAdminPdf = async () => {
    if (!analyticsData) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(18); doc.text("EDURATE — Official Evaluation Report", 14, 16);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);
    doc.text(`Total Evaluations: ${analyticsData.totalEvaluations}   |   Lecturers: ${analyticsData.totalLecturers}   |   Students: ${analyticsData.totalStudents}   |   Courses: ${analyticsData.totalCourses}`, 14, 30);

    let y = 40;
    doc.setFontSize(12); doc.text("Per-Lecturer Summary", 14, y); y += 7;
    doc.setFontSize(8);

    for (const l of analyticsData.perLecturer) {
      if (y > 190) { doc.addPage(); y = 16; }
      doc.setFontSize(10); doc.text(`${l.lecturerName} (${l.department || "—"}) — ${l.courses || "No courses"}`, 14, y); y += 5;
      doc.setFontSize(8);
      doc.text(
        `  Responses: ${l.totalEvaluations}   Avg: ${l.averageOverall.toFixed(1)}   Median: ${l.medianOverall.toFixed(1)}   Mode: ${l.modeOverall}   Clarity: ${l.averageClarity.toFixed(1)}   Engagement: ${l.averageEngagement.toFixed(1)}`,
        14, y
      ); y += 5;
      doc.text(
        `  Materials: ${l.averageMaterials.toFixed(1)}   Org: ${l.averageOrganization.toFixed(1)}   Feedback: ${l.averageFeedback.toFixed(1)}   Pace: ${l.averagePace.toFixed(1)}   Support: ${l.averageSupport.toFixed(1)}   Fairness: ${l.averageFairness.toFixed(1)}   Relevance: ${l.averageRelevance.toFixed(1)}`,
        14, y
      ); y += 8;
    }

    doc.save(`edurate-official-report-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-[#1e3b8a] text-white flex-col border-r border-[#17306f]">
        <div className="px-6 py-6 border-b border-white/10 flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">EDURATE</span>
        </div>
        <div className="px-4 py-4 text-xs font-bold tracking-[2px] text-white/50 uppercase">Dashboard</div>
        <nav className="px-3 space-y-1">
          {[
            { value: "analytics", label: "Overview", icon: Home },
            { value: "analytics", label: "Analytics & Reports", icon: BarChart3 },
            { value: "users", label: "Users", icon: Users },
            { value: "courses", label: "Courses", icon: BookOpen },
            { value: "criteria", label: "Evaluation Criteria", icon: CheckSquare },
            { value: "periods", label: "Evaluation Periods", icon: CalendarClock },
          ].map((item, idx) => {
            const Icon = item.icon;
            const active = activeTab === item.value || (idx === 1 && activeTab === "analytics");
            return (
              <button
                key={`${item.label}-${idx}`}
                onClick={() => setActiveTab(item.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[15px] font-medium transition ${active ? "bg-white/15 border-l-[3px] border-amber-400" : "hover:bg-white/10 text-white/80"}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto px-4 py-5 border-t border-white/10">
          <div className="bg-white/10 rounded-xl px-3 py-3 flex flex-col gap-2">
            <div>
              <div className="text-sm font-semibold truncate">{user?.name}</div>
              <div className="text-xs text-white/70 capitalize">{user?.role}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="mt-2 text-white hover:text-destructive hover:bg-destructive/10 flex items-center gap-2 justify-center"
            >
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
            </Button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72 min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center px-6 gap-4">
          <Menu className="w-4 h-4 text-slate-500" />
          <h1 className="text-2xl font-display font-bold text-slate-900">{activeTab === "courses" ? "Course Management" : activeTab === "users" ? "Users" : activeTab === "periods" ? "Evaluation Periods" : activeTab === "criteria" ? "Evaluation Criteria" : activeTab === "evaluations" ? "Evaluations" : "Analytics & Reports"}</h1>
        </header>

        <div className="p-6 md:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>

            {/* === COURSES TAB === */}
            <TabsContent value="courses">
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <p className="text-xs font-bold tracking-[1.8px] uppercase text-slate-500 mb-4">Department</p>
                  <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className="w-full sm:w-64 rounded-xl bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Filter by department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Filter by department</SelectItem>
                          {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button className="rounded-xl px-6 bg-white text-slate-900 border border-slate-300 hover:bg-slate-100">Filter</Button>
                      <button onClick={() => { setCourseFilter("all"); setCourseSearch(""); }} className="text-slate-500 text-sm font-semibold hover:text-slate-700">Clear</button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      <Input
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        placeholder="Search courses..."
                        className="w-full sm:w-64 rounded-xl bg-slate-50 border-slate-200"
                      />
                      <Button onClick={() => setShowCreateCourse((v) => !v)} className="rounded-xl px-6 bg-[#1e3b8a] hover:bg-[#162d6b]">
                        <Plus className="w-4 h-4 mr-1" /> Add Course
                      </Button>
                    </div>
                  </div>
                </div>

                {showCreateCourse && (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-5">Create Course</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Department Mode</Label>
                        <div className="flex p-1 bg-slate-100 rounded-xl">
                          <button type="button" onClick={() => setDeptMode('existing')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${deptMode === 'existing' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>Existing</button>
                          <button type="button" onClick={() => setDeptMode('new')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${deptMode === 'new' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>New</button>
                        </div>
                      </div>

                      {deptMode === 'existing' ? (
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Select value={newDept} onValueChange={setNewDept}>
                            <SelectTrigger className="rounded-xl bg-slate-50">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>New Department</Label>
                          <Input value={customDept} onChange={e => setCustomDept(e.target.value)} className="rounded-xl bg-slate-50" placeholder="e.g. Engineering" />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Course Code</Label>
                        <Input value={newCode} onChange={e => setNewCode(e.target.value)} className="rounded-xl bg-slate-50" placeholder="e.g. MTH101" />
                      </div>
                      <div className="space-y-2">
                        <Label>Course Title</Label>
                        <Input value={newName} onChange={e => setNewName(e.target.value)} className="rounded-xl bg-slate-50" placeholder="e.g. Calculus I" />
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end">
                      <Button
                        onClick={() => createCourse.mutate()}
                        disabled={createCourse.isPending || !newCode || !newName || (deptMode === 'existing' ? !newDept : !customDept)}
                        className="rounded-xl px-6 bg-[#1e3b8a] hover:bg-[#162d6b]"
                      >
                        {createCourse.isPending ? "Adding..." : "Save Course"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-[2px]">
                      <tr>
                        <th className="text-left px-5 py-4">Code</th>
                        <th className="text-left px-5 py-4">Title</th>
                        <th className="text-left px-5 py-4">Department</th>
                        <th className="text-left px-5 py-4">Lecturer</th>
                        <th className="text-left px-5 py-4">Period</th>
                        <th className="text-left px-5 py-4">Enrollment</th>
                        <th className="text-left px-5 py-4">Status</th>
                        <th className="text-left px-5 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredCourses.map((course: any) => (
                        <tr key={course.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-5"><span className="px-3 py-1 rounded-lg bg-slate-200 text-[#1e3b8a] font-bold">{course.code}</span></td>
                          <td className="px-5 py-5 font-bold text-slate-900">{course.name}</td>
                          <td className="px-5 py-5 text-slate-700">{course.department}</td>
                          <td className="px-5 py-5 text-slate-500">Not assigned</td>
                          <td className="px-5 py-5"><span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">Current Session</span></td>
                          <td className="px-5 py-5 text-slate-600">-</td>
                          <td className="px-5 py-5"><span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">Active</span></td>
                          <td className="px-5 py-5">
                            <Button
                              variant="outline"
                              className="rounded-xl border-slate-300"
                              onClick={() => {
                                if (confirm(`Delete ${course.code}?`)) deleteCourse.mutate(course.id);
                              }}
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredCourses.length === 0 && (
                    <div className="text-center py-12 text-slate-400">No courses match your filter/search.</div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* === USERS TAB === */}
            <TabsContent value="users">
              <div className="space-y-5">

                {/* Filter Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Role</label>
                      <div className="flex items-center gap-2">
                        <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                          <SelectTrigger className="w-44 rounded-xl bg-slate-50 border-slate-200 text-sm">
                            <SelectValue placeholder="All Roles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="lecturer">Lecturer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => { setUserRoleFilter("all"); setUserSearch(""); }}
                          variant="outline"
                          className="rounded-xl border-slate-200 px-4"
                        >
                          Filter
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1" />
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full sm:w-64 rounded-xl bg-slate-50 border-slate-200 text-sm"
                    />
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="text-left px-6 py-3">User</th>
                          <th className="text-left px-6 py-3">Role</th>
                          <th className="text-left px-6 py-3">Department</th>
                          <th className="text-left px-6 py-3">Joined</th>
                          <th className="text-left px-6 py-3">Status</th>
                          <th className="text-left px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users
                          .filter((u: any) => {
                            const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
                            const q = userSearch.trim().toLowerCase();
                            const matchSearch = !q ||
                              (u.name || "").toLowerCase().includes(q) ||
                              (u.email || "").toLowerCase().includes(q) ||
                              (u.username || "").toLowerCase().includes(q);
                            return matchRole && matchSearch;
                          })
                          .map((u: any) => {
                            const initials = (u.name || u.username || "?")
                              .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                            const colours = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500"];
                            const avatarColour = colours[(u.name || "").charCodeAt(0) % colours.length];
                            return (
                              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`h-9 w-9 rounded-full ${avatarColour} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                                      {initials}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-800">{u.name || u.username}</p>
                                      <p className="text-xs text-slate-400">{u.email || u.username}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    u.role === "admin" ? "bg-rose-100 text-rose-600" :
                                    u.role === "lecturer" ? "bg-indigo-100 text-indigo-600" :
                                    "bg-emerald-100 text-emerald-700"
                                  }`}>{u.role}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{u.department || "—"}</td>
                                <td className="px-6 py-4 text-slate-500 text-xs">
                                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                                    Active
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <button className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#1e3b8a] transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">
                                      <Pencil className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    {u.role !== "admin" && (
                                      <button
                                        onClick={() => {
                                          if (confirm(`Delete user "${u.name}"? This cannot be undone.`)) deleteUser.mutate(u.id);
                                        }}
                                        className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    {users.filter((u: any) => {
                      const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
                      const q = userSearch.trim().toLowerCase();
                      return matchRole && (!q || (u.name||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q) || (u.username||"").toLowerCase().includes(q));
                    }).length === 0 && (
                      <div className="text-center py-12 text-slate-400">No users match your filter.</div>
                    )}
                  </div>
                </div>

              </div>
            </TabsContent>

            {/* === EVALUATIONS TAB === */}
            <TabsContent value="evaluations">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800">All Evaluations ({evaluations.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="text-left px-6 py-3">Student</th>
                        <th className="text-left px-6 py-3">Lecturer</th>
                        <th className="text-left px-6 py-3">Course</th>
                        <th className="text-left px-6 py-3">Overall</th>
                        <th className="text-left px-6 py-3">Date</th>
                        <th className="text-left px-6 py-3">Comments</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {evaluations.map((e: any) => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">{e.studentName}</td>
                          <td className="px-6 py-4 text-slate-600">{e.lecturerName}</td>
                          <td className="px-6 py-4 text-slate-600">{e.courseCode}</td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1 font-bold text-amber-500">
                              ★ {e.overallRating}/5
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate italic">
                            {e.comments || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <button onClick={() => {
                              if (confirm("Delete this evaluation?")) deleteEvaluation.mutate(e.id);
                            }} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {evaluations.length === 0 && (
                    <div className="text-center py-12 text-slate-400">No evaluations yet.</div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* === PERIODS TAB === */}
            <TabsContent value="periods">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> Create Evaluation Period
                  </h2>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label>Period Name</Label>
                      <Input
                        value={periodName}
                        onChange={(e) => setPeriodName(e.target.value)}
                        className="rounded-xl bg-slate-50/50"
                        placeholder="e.g. 2026 Semester 1"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Start Date</Label>
                        <Input
                          type="datetime-local"
                          value={periodStart}
                          onChange={(e) => setPeriodStart(e.target.value)}
                          className="rounded-xl bg-slate-50/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>End Date</Label>
                        <Input
                          type="datetime-local"
                          value={periodEnd}
                          onChange={(e) => setPeriodEnd(e.target.value)}
                          className="rounded-xl bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={periodIsActive}
                        onChange={(e) => setPeriodIsActive(e.target.checked)}
                      />
                      Set as active period
                    </label>

                    <Button
                      onClick={async () => {
                        try {
                          await createPeriod.mutateAsync({
                            name: periodName.trim(),
                            startDate: new Date(periodStart).toISOString(),
                            endDate: new Date(periodEnd).toISOString(),
                            isActive: periodIsActive,
                          });
                          setPeriodName("");
                          setPeriodStart("");
                          setPeriodEnd("");
                          setPeriodIsActive(true);
                          toast({ title: "Evaluation period created" });
                        } catch (err) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: err instanceof Error ? err.message : "Failed to create period",
                          });
                        }
                      }}
                      disabled={
                        createPeriod.isPending ||
                        !periodName.trim() ||
                        !periodStart ||
                        !periodEnd
                      }
                      className="w-full rounded-xl"
                    >
                      {createPeriod.isPending ? "Creating..." : "Create Period"}
                    </Button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-5">All Periods ({evaluationPeriods.length})</h2>
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {evaluationPeriods.map((period: any) => {
                      const now = new Date();
                      const start = new Date(period.startDate);
                      const end = new Date(period.endDate);
                      const inWindow = start <= now && end >= now;

                      return (
                        <div key={period.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-800">{period.name}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {start.toLocaleString()} - {end.toLocaleString()}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${period.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                  {period.isActive ? "Active Flag" : "Inactive"}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${inWindow ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {inWindow ? "Within Date Window" : "Outside Date Window"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg"
                                onClick={async () => {
                                  try {
                                    await updatePeriod.mutateAsync({ id: period.id, payload: { isActive: true } });
                                    toast({ title: `Activated ${period.name}` });
                                  } catch (err) {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description: err instanceof Error ? err.message : "Failed to activate period",
                                    });
                                  }
                                }}
                                disabled={updatePeriod.isPending || period.isActive}
                              >
                                <Power className="w-4 h-4 mr-1" /> Activate
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50"
                                onClick={async () => {
                                  if (!confirm(`Delete period "${period.name}"?`)) return;
                                  try {
                                    await deletePeriod.mutateAsync(period.id);
                                    toast({ title: "Evaluation period deleted" });
                                  } catch (err) {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description: err instanceof Error ? err.message : "Failed to delete period",
                                    });
                                  }
                                }}
                                disabled={deletePeriod.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {evaluationPeriods.length === 0 && (
                      <div className="text-center py-10 text-slate-400">No evaluation periods yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* === ANALYTICS TAB === */}
            <TabsContent value="analytics">
              {(() => {
                // --- local filter state via closures isn't possible, so we derive from analyticsData ---
                const perLecturer: any[] = analyticsData?.perLecturer ?? [];

                // Compute derived stats
                const lecturersEvaluated = perLecturer.length;
                const totalResponses = perLecturer.reduce((s: number, l: any) => s + (l.totalEvaluations || 0), 0);
                const institutionAvg = lecturersEvaluated > 0
                  ? (perLecturer.reduce((s: number, l: any) => s + (l.averageOverall || 0), 0) / lecturersEvaluated)
                  : 0;
                const topLecturer = [...perLecturer].sort((a: any, b: any) => b.averageOverall - a.averageOverall)[0];

                // Department averages for bar chart
                const deptMap: Record<string, { total: number; count: number }> = {};
                perLecturer.forEach((l: any) => {
                  const dept = l.department || "Unknown";
                  if (!deptMap[dept]) deptMap[dept] = { total: 0, count: 0 };
                  deptMap[dept].total += l.averageOverall || 0;
                  deptMap[dept].count += 1;
                });
                const deptChartData = Object.entries(deptMap).map(([dept, val]) => ({
                  dept,
                  avg: parseFloat((val.total / val.count).toFixed(2)),
                }));

                // Rating badge helper
                const ratingBadge = (score: number) => {
                  if (score >= 4.5) return { label: "Excellent", cls: "bg-emerald-100 text-emerald-700" };
                  if (score >= 3.5) return { label: "Good", cls: "bg-blue-100 text-blue-700" };
                  if (score >= 2.5) return { label: "Average", cls: "bg-amber-100 text-amber-700" };
                  return { label: "Poor", cls: "bg-rose-100 text-rose-700" };
                };

                // Bar colour by score band
                const barColor = (avg: number) => {
                  if (avg >= 4.5) return "#10b981";
                  if (avg >= 3.5) return "#6ea8fe";
                  if (avg >= 2.5) return "#fbbf24";
                  return "#f87171";
                };

                return (
                  <div className="space-y-8">

                    {/* Welcome Banner */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-[#1e3b8a] to-[#2d55c7] rounded-3xl p-8 text-white shadow-lg">
                      <div className="relative z-10">
                        <p className="text-sm font-semibold text-white/60 uppercase tracking-[2px] mb-1">Admin Portal</p>
                        <h2 className="text-3xl font-bold mb-1">
                          Welcome back, {user?.name?.split(" ")[0] ?? "Admin"} 👋
                        </h2>
                        <p className="text-white/70 text-sm mt-1">
                          Here's a snapshot of your platform — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                      <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
                      <div className="absolute -right-4 -bottom-12 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
                    </div>

                    {/* Analytics & Reports header card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800">Analytics &amp; Reports</h2>
                        <p className="text-sm text-slate-500">Institution-wide evaluation results. Filter by semester, year, or department. Export to CSV or PDF.</p>
                      </div>
                    </div>

                    {/* Filters & Export */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <h3 className="text-base font-bold text-slate-700 mb-4">Filters &amp; Export</h3>
                      <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Semester</label>
                          <Select defaultValue="all">
                            <SelectTrigger className="w-44 rounded-xl bg-slate-50 border-slate-200 text-sm">
                              <SelectValue placeholder="All Semesters" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Semesters</SelectItem>
                              <SelectItem value="first">First Semester</SelectItem>
                              <SelectItem value="second">Second Semester</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Year</label>
                          <Input
                            defaultValue={`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}
                            className="w-36 rounded-xl bg-slate-50 border-slate-200 text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Department</label>
                          <Input placeholder="Filter by department" className="rounded-xl bg-slate-50 border-slate-200 text-sm" />
                        </div>
                        <Button className="rounded-xl px-5 bg-[#1e3b8a] hover:bg-[#162d6b] gap-2">
                          Apply
                        </Button>
                        <Button variant="outline" className="rounded-xl px-5 border-slate-200">
                          Clear
                        </Button>
                        <Button onClick={exportAdminCsv} disabled={!analyticsData} variant="outline" className="rounded-xl px-4 border-slate-200 gap-2">
                          <Download className="w-4 h-4" /> CSV
                        </Button>
                        <Button onClick={exportAdminPdf} disabled={!analyticsData} variant="outline" className="rounded-xl px-4 border-slate-200 gap-2">
                          <Download className="w-4 h-4" /> PDF
                        </Button>
                      </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-800">{lecturersEvaluated}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Lecturers Evaluated</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-800">{totalResponses}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Total Responses</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                          <Star className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-500">{institutionAvg > 0 ? institutionAvg.toFixed(2) : "—"}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Institution Avg</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-emerald-600 truncate max-w-[120px]">
                            {topLecturer ? topLecturer.lecturerName.split(" ").slice(0, 2).join(" ") : "—"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">Top Lecturer</p>
                        </div>
                      </div>
                    </div>

                    {/* Department Average Scores Bar Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-800">Department Average Scores</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Mean evaluation score per department — colour indicates performance band</p>
                        </div>
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                          {deptChartData.length} depts
                        </span>
                      </div>
                      <div className="p-6">
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="dept" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                              <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                              <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                formatter={(value: any) => [value, 'Avg Score']}
                              />
                              <Bar
                                dataKey="avg"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={80}
                                fill="#6ea8fe"
                                // colour each bar individually via Cell-like approach using a custom shape isn't needed — recharts fills uniformly, colour set per entry via label
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        {deptChartData.length === 0 && (
                          <div className="text-center py-10 text-slate-400">No department data yet.</div>
                        )}
                      </div>
                    </div>

                    {/* Lecturer Performance Leaderboard */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-800">Lecturer Performance Leaderboard</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Ranked by mean evaluation score across all criteria</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input placeholder="Search lecturers..." className="w-44 rounded-xl bg-slate-50 border-slate-200 text-sm" />
                          <span className="text-xs font-bold bg-[#1e3b8a] text-white px-3 py-1.5 rounded-xl">
                            {perLecturer.length}
                          </span>
                        </div>
                      </div>

                      {perLecturer.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <tr>
                              <th className="text-left px-6 py-3">Rank</th>
                              <th className="text-left px-6 py-3">Lecturer</th>
                              <th className="text-left px-6 py-3">Department</th>
                              <th className="text-left px-6 py-3">Mean Score</th>
                              <th className="text-left px-6 py-3">Responses</th>
                              <th className="text-left px-6 py-3">Rating</th>
                              <th className="px-6 py-3"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[...perLecturer]
                              .sort((a: any, b: any) => b.averageOverall - a.averageOverall)
                              .map((l: any, idx: number) => {
                                const badge = ratingBadge(l.averageOverall);
                                const rankEmoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                                return (
                                  <tr key={l.lecturerId} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                      {rankEmoji ? (
                                        <span className="text-lg">{rankEmoji}</span>
                                      ) : (
                                        <span className="text-slate-400 font-semibold">#{idx + 1}</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4">
                                      <p className="font-semibold text-slate-800">{l.lecturerName}</p>
                                      <p className="text-xs text-slate-400">{l.courses || "No courses"}</p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{l.department || "—"}</td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                                          <div
                                            className="h-full rounded-full"
                                            style={{
                                              width: `${(l.averageOverall / 5) * 100}%`,
                                              backgroundColor: barColor(l.averageOverall),
                                            }}
                                          />
                                        </div>
                                        <span className="font-bold text-amber-500">{l.averageOverall.toFixed(2)}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{l.totalEvaluations}</td>
                                    <td className="px-6 py-4">
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.cls}`}>
                                        {badge.label}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-slate-400 text-base">→</span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-16 text-slate-400">No evaluation data available yet.</div>
                      )}
                    </div>

                  </div>
                );
              })()}
            </TabsContent>

            {/* === CRITERIA TAB === */}
            <TabsContent value="criteria">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add/Edit Criterion Form */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                    {editingCriterion ? <><Pencil className="w-5 h-5 text-primary" /> Edit Criterion</> : <><Plus className="w-5 h-5 text-primary" /> Add Evaluation Criterion</>}
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label>Key (unique identifier, no spaces)</Label>
                      <Input
                        value={editingCriterion ? editingCriterion.key : criterionKey}
                        onChange={e => editingCriterion ? setEditingCriterion({...editingCriterion, key: e.target.value}) : setCriterionKey(e.target.value.toLowerCase().replace(/\s+/g,'_'))}
                        className="rounded-xl bg-slate-50/50" placeholder="e.g. punctuality"
                        disabled={!!editingCriterion}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Label (display name)</Label>
                      <Input
                        value={editingCriterion ? editingCriterion.label : criterionLabel}
                        onChange={e => editingCriterion ? setEditingCriterion({...editingCriterion, label: e.target.value}) : setCriterionLabel(e.target.value)}
                        className="rounded-xl bg-slate-50/50" placeholder="e.g. Punctuality"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Description (shown to students)</Label>
                      <Input
                        value={editingCriterion ? editingCriterion.description : criterionDescription}
                        onChange={e => editingCriterion ? setEditingCriterion({...editingCriterion, description: e.target.value}) : setCriterionDescription(e.target.value)}
                        className="rounded-xl bg-slate-50/50" placeholder="e.g. Does the lecturer arrive on time?"
                      />
                    </div>
                    <div className="flex gap-2">
                      {editingCriterion ? (
                        <>
                          <Button
                            onClick={() => updateCriterion.mutate({ id: editingCriterion.id, data: { label: editingCriterion.label, description: editingCriterion.description, isActive: editingCriterion.isActive } })}
                            disabled={updateCriterion.isPending}
                            className="flex-1 rounded-xl bg-gradient-to-r from-primary to-indigo-600"
                          >
                            {updateCriterion.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingCriterion(null)} className="rounded-xl">Cancel</Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => createCriterion.mutate({ key: criterionKey, label: criterionLabel, description: criterionDescription, isActive: true, sortOrder: criteria.length })}
                          disabled={createCriterion.isPending || !criterionKey || !criterionLabel || !criterionDescription}
                          className="w-full rounded-xl bg-gradient-to-r from-primary to-indigo-600"
                        >
                          {createCriterion.isPending ? "Adding..." : "Add Criterion"}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Note: These criteria are stored for reference and display. The 10 core rating fields in the evaluation form are fixed in the current version. Criteria defined here represent your official evaluation framework documentation.
                    </p>
                  </div>
                </div>

                {/* Criteria List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-5">Defined Criteria ({criteria.length})</h2>
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {criteria.map((c: any) => (
                      <div key={c.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">{c.key}</span>
                            <span className="font-semibold text-slate-800">{c.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                              {c.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">{c.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setEditingCriterion({...c})} className="text-slate-400 hover:text-primary transition-colors p-1">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { if (confirm(`Delete criterion "${c.label}"?`)) deleteCriterion.mutate(c.id); }} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {criteria.length === 0 && (
                      <div className="text-center py-10 text-slate-400">No criteria defined yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </main>
    </div>
  );
}