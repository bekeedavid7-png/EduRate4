import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { DashboardShell } from "@/components/dashboard-shell";
import { useAuth } from "@/hooks/use-auth";
import { useLecturerSummary } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { BookOpen, Users, Star, TrendingUp, UserCog, Download, Filter } from "lucide-react";

export default function LecturerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(undefined);
  const { data: summary, isLoading: isSummaryLoading } = useLecturerSummary(selectedCourseId);

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== 'lecturer')) setLocation('/login');
  }, [user, isAuthLoading, setLocation]);

  if (isAuthLoading || isSummaryLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!summary) return null;

  const exportCsv = () => {
    const lecturerCourses = (summary as any).courses || [];
    const rows = [
      ["Metric", "Value"],
      ["Average Overall", summary.averageOverall.toFixed(2)],
      ["Median Overall", summary.medianOverall.toFixed(2)],
      ["Mode Overall", String(summary.modeOverall)],
      ["Average Clarity", summary.averageClarity.toFixed(2)],
      ["Average Engagement", summary.averageEngagement.toFixed(2)],
      ["Average Materials", summary.averageMaterials.toFixed(2)],
      ["Average Organization", summary.averageOrganization.toFixed(2)],
      ["Average Feedback", summary.averageFeedback.toFixed(2)],
      ["Average Pace", summary.averagePace.toFixed(2)],
      ["Average Support", summary.averageSupport.toFixed(2)],
      ["Average Fairness", summary.averageFairness.toFixed(2)],
      ["Average Relevance", summary.averageRelevance.toFixed(2)],
      ["Total Evaluations", String(summary.totalEvaluations)],
      ["Excellent (5)", String(summary.ratingDistribution.excellent)],
      ["Good (4)", String(summary.ratingDistribution.good)],
      ["Average (3)", String(summary.ratingDistribution.average)],
      ["Poor (1-2)", String(summary.ratingDistribution.poor)],
      ["", ""],
      ["Assigned Courses", ""],
      ["Code", "Name"],
      ...lecturerCourses.map((course: any) => [course.code, course.name]),
    ];

    const csvContent = rows
      .map((row: string[]) => row.map((value: string) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `lecturer-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const lecturerCourses = (summary as any).courses || [];
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Lecturer Analytics Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    let y = 32;
    const line = (label: string, value: string) => {
      doc.text(`${label}: ${value}`, 14, y);
      y += 6;
    };

    line("Average Overall", summary.averageOverall.toFixed(2));
    line("Median Overall", summary.medianOverall.toFixed(2));
    line("Mode Overall", String(summary.modeOverall));
    line("Average Clarity", summary.averageClarity.toFixed(2));
    line("Average Engagement", summary.averageEngagement.toFixed(2));
    line("Average Materials", summary.averageMaterials.toFixed(2));
    line("Average Organization", summary.averageOrganization.toFixed(2));
    line("Average Feedback", summary.averageFeedback.toFixed(2));
    line("Average Pace", summary.averagePace.toFixed(2));
    line("Average Support", summary.averageSupport.toFixed(2));
    line("Average Fairness", summary.averageFairness.toFixed(2));
    line("Average Relevance", summary.averageRelevance.toFixed(2));
    line("Total Evaluations", String(summary.totalEvaluations));
    line("Excellent (5)", String(summary.ratingDistribution.excellent));
    line("Good (4)", String(summary.ratingDistribution.good));
    line("Average (3)", String(summary.ratingDistribution.average));
    line("Poor (1-2)", String(summary.ratingDistribution.poor));

    y += 4;
    doc.setFontSize(12);
    doc.text("Assigned Courses", 14, y);
    y += 7;
    doc.setFontSize(10);

    for (const course of lecturerCourses) {
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
      doc.text(`${course.code} - ${course.name}`, 14, y);
      y += 6;
    }

    doc.save(`lecturer-analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const barData = [
    { name: 'Overall', score: summary.averageOverall },
    { name: 'Clarity', score: summary.averageClarity },
    { name: 'Engagement', score: summary.averageEngagement },
    { name: 'Materials', score: summary.averageMaterials },
    { name: 'Organization', score: summary.averageOrganization },
    { name: 'Feedback', score: summary.averageFeedback },
    { name: 'Pace', score: summary.averagePace },
    { name: 'Support', score: summary.averageSupport },
    { name: 'Fairness', score: summary.averageFairness },
    { name: 'Relevance', score: summary.averageRelevance },
  ];

  const pieData = [
    { name: 'Excellent (5)', value: summary.ratingDistribution.excellent, color: '#3b82f6' },
    { name: 'Good (4)', value: summary.ratingDistribution.good, color: '#8b5cf6' },
    { name: 'Average (3)', value: summary.ratingDistribution.average, color: '#f59e0b' },
    { name: 'Poor (1-2)', value: summary.ratingDistribution.poor, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const lecturerCourses = (summary as any).courses || [];

  return (
    <Layout>
      <DashboardShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Lecturer Dashboard</h1>
          <p className="text-slate-500 mt-1">Analytics and feedback summary</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lecturerCourses.length > 1 && (
            <Select
              value={selectedCourseId?.toString() ?? "all"}
              onValueChange={val => setSelectedCourseId(val === "all" ? undefined : parseInt(val))}
            >
              <SelectTrigger className="w-52 rounded-xl border-slate-200">
                <Filter className="w-4 h-4 mr-1 text-slate-400" />
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {lecturerCourses.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={exportCsv} className="flex items-center gap-2 rounded-xl border-slate-200">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportPdf} className="flex items-center gap-2 rounded-xl border-slate-200">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Link href="/lecturer/profile">
            <Button variant="outline" className="flex items-center gap-2 rounded-xl border-slate-200">
              <UserCog className="w-4 h-4" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Assigned Courses */}
      {lecturerCourses.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Courses</div>
              <div className="text-sm text-slate-600">{lecturerCourses[0]?.department}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lecturerCourses.map((course: any) => (
              <span key={course.id} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-semibold">
                {course.code} — {course.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {summary.totalEvaluations === 0 ? (
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-12 text-center">
          <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-700">No Evaluations Yet</h3>
          <p className="text-slate-500 mt-2">Check back later once students have submitted their feedback.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Responses" value={summary.totalEvaluations.toString()} icon={<Users className="w-6 h-6 text-indigo-600" />} color="bg-indigo-50" />
            <StatCard title="Avg Overall" value={summary.averageOverall.toFixed(1)} icon={<Star className="w-6 h-6 text-amber-500" />} color="bg-amber-50" />
            <StatCard title="Median Overall" value={summary.medianOverall.toFixed(1)} icon={<TrendingUp className="w-6 h-6 text-emerald-500" />} color="bg-emerald-50" />
            <StatCard title="Mode Overall" value={summary.modeOverall.toString()} icon={<BookOpen className="w-6 h-6 text-blue-500" />} color="bg-blue-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-3xl shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="font-display font-bold">Category Averages</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 500 }} />
                      <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="font-display font-bold">Rating Distribution (Overall)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      </DashboardShell>
    </Layout>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-display font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}