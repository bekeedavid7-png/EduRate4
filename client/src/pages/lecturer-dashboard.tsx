import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useLecturerSummary } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCourses } from "@/hooks/use-courses";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import {
  BookOpen, Users, Star, TrendingUp, UserCog,
  MessageSquare, Printer, FileDown, LayoutDashboard,
  BarChart3, ChevronRight, Lock, Save, Eye, EyeOff,
  GraduationCap, Award, Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PRINT_STYLE_ID = "lecturer-print-styles";
function ensurePrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.innerHTML = `@media print{body *{visibility:hidden}#lecturer-printable,#lecturer-printable *{visibility:visible}#lecturer-printable{position:absolute;inset:0;padding:24px}.no-print{display:none!important}}`;
  document.head.appendChild(style);
}

type Section = "overview" | "reports" | "profile";

export default function LecturerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: isSummaryLoading } = useLecturerSummary();
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== "lecturer")) setLocation("/login");
    ensurePrintStyles();
  }, [user, isAuthLoading, setLocation]);

  if (isAuthLoading || isSummaryLoading) {
    return (
      <Layout>
        <div className="flex gap-6">
          <div className="w-60 shrink-0 animate-pulse">
            <div className="h-[500px] bg-slate-200 rounded-3xl" />
          </div>
          <div className="flex-1 animate-pulse space-y-6">
            <div className="h-10 bg-slate-200 rounded w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!summary) return null;
  const courseBreakdowns = (summary as any).courseBreakdowns || [];

  const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview",            icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "reports",  label: "Evaluation Reports",  icon: <BarChart3 className="w-4 h-4" /> },
    { id: "profile",  label: "Profile & Settings",  icon: <UserCog className="w-4 h-4" /> },
  ];

  return (
    <Layout>
      <div id="lecturer-printable" className="flex gap-6 min-h-[calc(100vh-140px)]">

        {/* Sidebar */}
        <aside className={`shrink-0 transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"}`}>
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {sidebarOpen && (
              <div className="px-5 py-5 border-b border-slate-100 bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl mb-3 border border-indigo-200">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-slate-900 text-sm leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user?.department || "Lecturer"}</p>
              </div>
            )}

            <nav className="p-3 space-y-1">
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

            <div className="p-3 border-t border-slate-100">
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

        {/* Main */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeSection === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <OverviewSection summary={summary} courseBreakdowns={courseBreakdowns} user={user} />
              </motion.div>
            )}
            {activeSection === "reports" && (
              <motion.div key="reports" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <ReportsSection summary={summary} courseBreakdowns={courseBreakdowns} />
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

// ── OVERVIEW ─────────────────────────────────────────────────────────────────
function OverviewSection({ summary, courseBreakdowns, user }: any) {
  function handlePrint() { window.print(); }

  function handleExportPDF() {
    const doc = new jsPDF();
    const lecturerName = user?.name || "Lecturer";
    const exportDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    doc.setFontSize(20); doc.setTextColor(15, 23, 42); doc.text("Evaluation Report", 14, 18);
    doc.setFontSize(11); doc.setTextColor(100, 116, 139);
    doc.text(`Lecturer: ${lecturerName}`, 14, 26);
    doc.text(`Exported: ${exportDate}`, 14, 32);
    doc.setFontSize(13); doc.setTextColor(15, 23, 42); doc.text("Overall Summary", 14, 44);
    autoTable(doc, {
      startY: 48,
      head: [["Metric", "Score", "Performance"]],
      body: [
        ["Total Responses", summary.totalEvaluations.toString(), "—"],
        ["Avg Overall",      summary.averageOverall.toFixed(2),      `${((summary.averageOverall / 5) * 100).toFixed(0)}%`],
        ["Avg Clarity",      summary.averageClarity.toFixed(2),      `${((summary.averageClarity / 5) * 100).toFixed(0)}%`],
        ["Avg Engagement",   summary.averageEngagement.toFixed(2),   `${((summary.averageEngagement / 5) * 100).toFixed(0)}%`],
        ["Avg Materials",    summary.averageMaterials.toFixed(2),    `${((summary.averageMaterials / 5) * 100).toFixed(0)}%`],
        ["Avg Organization", summary.averageOrganization.toFixed(2), `${((summary.averageOrganization / 5) * 100).toFixed(0)}%`],
        ["Avg Feedback",     summary.averageFeedback.toFixed(2),     `${((summary.averageFeedback / 5) * 100).toFixed(0)}%`],
        ["Avg Pace",         summary.averagePace.toFixed(2),         `${((summary.averagePace / 5) * 100).toFixed(0)}%`],
        ["Avg Support",      summary.averageSupport.toFixed(2),      `${((summary.averageSupport / 5) * 100).toFixed(0)}%`],
        ["Avg Fairness",     summary.averageFairness.toFixed(2),     `${((summary.averageFairness / 5) * 100).toFixed(0)}%`],
        ["Avg Relevance",    summary.averageRelevance.toFixed(2),    `${((summary.averageRelevance / 5) * 100).toFixed(0)}%`],
      ],
      styles: { fontSize: 10 }, headStyles: { fillColor: [59, 130, 246] }, alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    courseBreakdowns.forEach((b: any) => {
      const lastY = (doc as any).lastAutoTable?.finalY ?? 60;
      const startY = lastY + 12;
      doc.setFontSize(13); doc.setTextColor(15, 23, 42); doc.text(`${b.course.code} — ${b.course.name}`, 14, startY);
      autoTable(doc, {
        startY: startY + 4,
        head: [["Metric", "Score", "Performance"]],
        body: [
          ["Total Responses", b.totalEvaluations.toString(), "—"],
          ["Overall",    b.averageOverall.toFixed(2),    `${((b.averageOverall / 5) * 100).toFixed(0)}%`],
          ["Clarity",    b.averageClarity.toFixed(2),    `${((b.averageClarity / 5) * 100).toFixed(0)}%`],
          ["Engagement", b.averageEngagement.toFixed(2), `${((b.averageEngagement / 5) * 100).toFixed(0)}%`],
          ["Materials",  b.averageMaterials.toFixed(2),  `${((b.averageMaterials / 5) * 100).toFixed(0)}%`],
          ["Feedback",   b.averageFeedback.toFixed(2),   `${((b.averageFeedback / 5) * 100).toFixed(0)}%`],
          ["Support",    b.averageSupport.toFixed(2),    `${((b.averageSupport / 5) * 100).toFixed(0)}%`],
          ["Relevance",  b.averageRelevance.toFixed(2),  `${((b.averageRelevance / 5) * 100).toFixed(0)}%`],
        ],
        styles: { fontSize: 10 }, headStyles: { fillColor: [99, 102, 241] }, alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      if (b.comments?.length > 0) {
        const cy = (doc as any).lastAutoTable?.finalY ?? 60;
        doc.setFontSize(11); doc.setTextColor(71, 85, 105); doc.text("Student Comments:", 14, cy + 8);
        b.comments.forEach((comment: string, i: number) => {
          const y = cy + 14 + i * 7;
          if (y > 280) doc.addPage();
          doc.setFontSize(9); doc.setTextColor(100, 116, 139);
          doc.text(doc.splitTextToSize(`• ${comment}`, 180), 14, y);
        });
      }
    });
    doc.save(`evaluation-report-${(user?.name || "lecturer").replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }

  const overallPct = summary.totalEvaluations > 0 ? ((summary.averageOverall / 5) * 100).toFixed(0) : null;
  const pieData = [
    { name: "Excellent (5)", value: summary.ratingDistribution.excellent, color: "#3b82f6" },
    { name: "Good (4)",      value: summary.ratingDistribution.good,      color: "#8b5cf6" },
    { name: "Average (3)",   value: summary.ratingDistribution.average,   color: "#f59e0b" },
    { name: "Poor (1-2)",    value: summary.ratingDistribution.poor,      color: "#ef4444" },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Overview</h1>
          <p className="text-slate-500 mt-1">Your performance at a glance</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2 rounded-xl border-slate-200">
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="flex items-center gap-2 rounded-xl border-slate-200 text-primary border-primary/30 hover:bg-primary/5">
            <FileDown className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      {summary.totalEvaluations === 0 ? (
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-12 text-center">
          <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-700">No Evaluations Yet</h3>
          <p className="text-slate-500 mt-2">Check back once students have submitted their feedback.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard title="Total Responses" value={summary.totalEvaluations.toString()} icon={<Users className="w-6 h-6 text-indigo-600" />} color="bg-indigo-50" />
            <StatCard title="Avg Overall"     value={summary.averageOverall.toFixed(1)}    icon={<Star className="w-6 h-6 text-amber-500" />}         color="bg-amber-50"   subtitle={`${((summary.averageOverall / 5) * 100).toFixed(0)}% performance`} />
            <StatCard title="Avg Clarity"     value={summary.averageClarity.toFixed(1)}    icon={<BookOpen className="w-6 h-6 text-blue-500" />}       color="bg-blue-50"    subtitle={`${((summary.averageClarity / 5) * 100).toFixed(0)}% performance`} />
            <StatCard title="Avg Engagement"  value={summary.averageEngagement.toFixed(1)} icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}  color="bg-emerald-50" subtitle={`${((summary.averageEngagement / 5) * 100).toFixed(0)}% performance`} />
          </div>

          {overallPct && (
            <div className="mb-8 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-sm font-semibold uppercase tracking-wider mb-1">Overall Performance Score</p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-display font-extrabold">{overallPct}%</span>
                  <RatingBadgeLight score={summary.averageOverall} />
                </div>
                <p className="text-indigo-200 text-sm mt-2">Based on {summary.totalEvaluations} student evaluation{summary.totalEvaluations !== 1 ? "s" : ""}</p>
              </div>
              <Award className="w-20 h-20 text-white/20" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-3xl shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="font-display font-bold">Category Averages</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: "Clarity",   score: summary.averageClarity },
                      { name: "Materials", score: summary.averageMaterials },
                      { name: "Feedback",  score: summary.averageFeedback },
                      { name: "Support",   score: summary.averageSupport },
                      { name: "Relevance", score: summary.averageRelevance },
                    ]} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontWeight: 500, fontSize: 12 }} />
                      <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} />
                      <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={55} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="font-display font-bold">Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
function ReportsSection({ summary, courseBreakdowns }: any) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");

  const filteredBreakdowns = useMemo(() => {
    if (selectedCourseId === "all") return courseBreakdowns;
    return courseBreakdowns.filter((b: any) => b.course.id === selectedCourseId);
  }, [courseBreakdowns, selectedCourseId]);

  const allComments = useMemo(() =>
    filteredBreakdowns.flatMap((b: any) =>
      (b.comments || []).map((c: string) => ({ comment: c, courseCode: b.course.code, courseName: b.course.name }))
    ), [filteredBreakdowns]);

  if (summary.totalEvaluations === 0 && courseBreakdowns.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Evaluation Reports</h1>
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-12 text-center mt-8">
          <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-700">No Reports Yet</h3>
          <p className="text-slate-500 mt-2">Data will appear here once students submit feedback.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Evaluation Reports</h1>
          <p className="text-slate-500 mt-1">Analytics and feedback for your courses</p>
        </div>
        {courseBreakdowns.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select
              value={selectedCourseId === "all" ? "all" : String(selectedCourseId)}
              onValueChange={v => setSelectedCourseId(v === "all" ? "all" : Number(v))}
            >
              <SelectTrigger className="w-56 rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courseBreakdowns.map((b: any) => (
                  <SelectItem key={b.course.id} value={String(b.course.id)}>
                    {b.course.code} — {b.course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Course analytics cards */}
      <div className="space-y-6 mb-10">
        {filteredBreakdowns.map((b: any) => <CourseBreakdownCard key={b.course.id} breakdown={b} />)}
        {filteredBreakdowns.length === 0 && (
          <div className="text-center py-12 text-slate-400">No data for selected course.</div>
        )}
      </div>

      {/* Anonymous feedback */}
      <div>
        <div className="flex items-center gap-2 mb-5 border-b border-slate-200 pb-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-slate-800">Anonymous Student Feedback</h2>
          <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
            {allComments.length} comment{allComments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {allComments.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No written feedback submitted yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allComments.map((item: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-primary/10 px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-bold text-primary">{item.courseCode}</span>
                  </div>
                  <span className="text-xs text-slate-400 truncate">{item.courseName}</span>
                </div>
                <p className="text-sm text-slate-600 italic leading-relaxed">"{item.comment}"</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Anonymous Student</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
function ProfileSection({ user }: any) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: courses } = useCourses();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [department, setDepartment] = useState(user?.department || "");
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: currentCourses } = useQuery({
    queryKey: ["/api/lecturer/courses"],
    queryFn: async () => {
      const res = await fetch("/api/lecturer/courses", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ id: number; code: string; name: string; department: string }[]>;
    },
    enabled: !!user && user.role === "lecturer",
  });

  useEffect(() => {
    if (user?.department) setDepartment(user.department);
    if (currentCourses?.length) setSelectedCourseIds(currentCourses.map((c: any) => c.id));
  }, [user, currentCourses]);

  const departments = useMemo(() => {
    if (!courses) return [];
    return Array.from(new Set((courses as any[]).map(c => c.department))).sort() as string[];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (!courses || !department) return [];
    return (courses as any[]).filter(c => c.department === department);
  }, [courses, department]);

  const toggleCourse = (id: number) =>
    setSelectedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSaveProfile = async () => {
    if (!department || selectedCourseIds.length === 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please select a department and at least one course." });
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/lecturer/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ department, courseIds: selectedCourseIds }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["/api/lecturer/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile Updated", description: "Your department and courses have been saved." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally { setIsSavingProfile(false); }
  };

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
      <p className="text-slate-500 mb-8">Manage your account details and security</p>

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
                { label: "Full Name",  value: user?.name },
                { label: "Username",   value: user?.username },
                { label: "Email",      value: user?.email || "—" },
                { label: "Role",       value: user?.role },
              ].map(field => (
                <div key={field.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{field.label}</p>
                  <p className="font-semibold text-slate-800 capitalize">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department & Courses */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-slate-800">Department & Courses</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={v => { setDepartment(v); setSelectedCourseIds([]); }}>
                <SelectTrigger className="rounded-xl bg-slate-50/50"><SelectValue placeholder="Select your department" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {department && (
              <div className="space-y-2">
                <Label>Assigned Courses <span className="text-slate-400 font-normal">(select all that apply)</span></Label>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 max-h-52 overflow-y-auto">
                  {filteredCourses.map((c: any) => (
                    <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={selectedCourseIds.includes(c.id)} onChange={() => toggleCourse(c.id)} className="w-4 h-4 rounded accent-primary" />
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{c.code} — {c.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedCourseIds.length > 0 && (
                  <p className="text-xs text-primary font-medium">{selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? "s" : ""} selected</p>
                )}
              </div>
            )}

            <Button onClick={handleSaveProfile} disabled={isSavingProfile || !department || selectedCourseIds.length === 0}
              className="w-full py-5 rounded-xl font-semibold bg-gradient-to-r from-primary to-indigo-600 hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {isSavingProfile ? "Saving..." : "Save Profile Changes"}
            </Button>
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
            <Button onClick={handleChangePassword}
              disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full py-5 rounded-xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              {isSavingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
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

function CourseBreakdownCard({ breakdown }: { breakdown: any }) {
  const { course, totalEvaluations, averageOverall, averageClarity, averageEngagement,
    averageMaterials, averageFeedback, averageSupport, averageRelevance } = breakdown;

  const metrics = [
    { label: "Clarity",    value: averageClarity },
    { label: "Engagement", value: averageEngagement },
    { label: "Materials",  value: averageMaterials },
    { label: "Feedback",   value: averageFeedback },
    { label: "Support",    value: averageSupport },
    { label: "Relevance",  value: averageRelevance },
  ];

  const radarData = metrics.map(m => ({ subject: m.label, score: parseFloat(((m.value / 5) * 100).toFixed(1)) }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl"><BookOpen className="w-5 h-5 text-primary" /></div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{course.code}</h3>
            <p className="text-sm text-slate-500">{course.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="w-4 h-4" />
          <span className="font-semibold text-slate-700">{totalEvaluations}</span>
          <span>{totalEvaluations === 1 ? "response" : "responses"}</span>
        </div>
      </div>

      <div className="p-6">
        {totalEvaluations === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No evaluations submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2.5 rounded-xl">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span className="text-2xl font-bold text-slate-900">{averageOverall.toFixed(1)}</span>
                <span className="text-sm text-slate-500 font-medium">/ 5 overall</span>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <span className="text-2xl font-bold text-indigo-700">{((averageOverall / 5) * 100).toFixed(0)}%</span>
                <span className="text-sm text-slate-500 font-medium">performance</span>
              </div>
              <RatingBadge score={averageOverall} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {metrics.map(m => {
                  const pct = Math.round((m.value / 5) * 100);
                  const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
                  return (
                    <div key={m.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{m.label}</div>
                      <div className="text-xl font-bold text-slate-800">{m.value.toFixed(1)}</div>
                      <div className="text-sm font-semibold text-slate-500">{pct}%</div>
                      <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 11 }} />
                    <Radar name="Performance %" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} formatter={(v: any) => [`${v}%`, "Score"]} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingBadge({ score }: { score: number }) {
  if (score >= 4.5) return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Excellent</span>;
  if (score >= 3.5) return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Good</span>;
  if (score >= 2.5) return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Average</span>;
  return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Needs Improvement</span>;
}

function RatingBadgeLight({ score }: { score: number }) {
  if (score >= 4.5) return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white">Excellent</span>;
  if (score >= 3.5) return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white">Good</span>;
  if (score >= 2.5) return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white">Average</span>;
  return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white">Needs Improvement</span>;
}

function StatCard({ title, value, icon, color, subtitle }: { title: string; value: string; icon: React.ReactNode; color: string; subtitle?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-display font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs font-semibold text-indigo-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}