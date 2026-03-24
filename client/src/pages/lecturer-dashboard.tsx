import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useLecturerSummary } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  BookOpen, Users, Star, TrendingUp, UserCog,
  MessageSquare, Printer, FileDown
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Print styles injected once ───────────────────────────────────────────────
const PRINT_STYLE_ID = "lecturer-print-styles";
function ensurePrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.innerHTML = `
    @media print {
      body * { visibility: hidden; }
      #lecturer-printable, #lecturer-printable * { visibility: visible; }
      #lecturer-printable { position: absolute; inset: 0; padding: 24px; }
      .no-print { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}

export default function LecturerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: isSummaryLoading } = useLecturerSummary();

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== 'lecturer')) setLocation('/login');
    ensurePrintStyles();
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

  const courseBreakdowns = (summary as any).courseBreakdowns || [];

  const overallBarData = [
    { name: 'Clarity',    score: summary.averageClarity },
    { name: 'Materials',  score: summary.averageMaterials },
    { name: 'Feedback',   score: summary.averageFeedback },
    { name: 'Support',    score: summary.averageSupport },
    { name: 'Relevance',  score: summary.averageRelevance },
  ];

  const pieData = [
    { name: 'Excellent (5)', value: summary.ratingDistribution.excellent, color: '#3b82f6' },
    { name: 'Good (4)',      value: summary.ratingDistribution.good,      color: '#8b5cf6' },
    { name: 'Average (3)',   value: summary.ratingDistribution.average,   color: '#f59e0b' },
    { name: 'Poor (1-2)',    value: summary.ratingDistribution.poor,      color: '#ef4444' },
  ].filter(d => d.value > 0);

  // ── PDF export ─────────────────────────────────────────────────────────────
  function handleExportPDF() {
    const doc = new jsPDF();
    const lecturerName = user?.name || "Lecturer";
    const exportDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text("Evaluation Report", 14, 18);

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Lecturer: ${lecturerName}`, 14, 26);
    doc.text(`Exported: ${exportDate}`, 14, 32);

    // Overall summary table
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Overall Summary", 14, 44);

    autoTable(doc, {
      startY: 48,
      head: [["Metric", "Score", "Performance"]],
      body: [
        ["Total Responses",  summary.totalEvaluations.toString(), "—"],
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
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // Per-course breakdown
    courseBreakdowns.forEach((breakdown: any) => {
      const { course, totalEvaluations, comments,
        averageOverall, averageClarity, averageEngagement,
        averageMaterials, averageFeedback, averageSupport, averageRelevance } = breakdown;

      const lastY = (doc as any).lastAutoTable?.finalY ?? 60;
      const startY = lastY + 12;

      // Course title
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`${course.code} — ${course.name}`, 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [["Metric", "Score", "Performance"]],
        body: [
          ["Total Responses", totalEvaluations.toString(), "—"],
          ["Overall",    averageOverall.toFixed(2),    `${((averageOverall / 5) * 100).toFixed(0)}%`],
          ["Clarity",    averageClarity.toFixed(2),    `${((averageClarity / 5) * 100).toFixed(0)}%`],
          ["Engagement", averageEngagement.toFixed(2), `${((averageEngagement / 5) * 100).toFixed(0)}%`],
          ["Materials",  averageMaterials.toFixed(2),  `${((averageMaterials / 5) * 100).toFixed(0)}%`],
          ["Feedback",   averageFeedback.toFixed(2),   `${((averageFeedback / 5) * 100).toFixed(0)}%`],
          ["Support",    averageSupport.toFixed(2),    `${((averageSupport / 5) * 100).toFixed(0)}%`],
          ["Relevance",  averageRelevance.toFixed(2),  `${((averageRelevance / 5) * 100).toFixed(0)}%`],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [99, 102, 241] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      // Comments
      if (comments && comments.length > 0) {
        const commentsY = (doc as any).lastAutoTable?.finalY ?? 60;
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.text("Student Comments:", 14, commentsY + 8);

        comments.forEach((comment: string, i: number) => {
          const y = commentsY + 14 + i * 7;
          if (y > 280) { doc.addPage(); }
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          const lines = doc.splitTextToSize(`• ${comment}`, 180);
          doc.text(lines, 14, y);
        });
      }
    });

    doc.save(`evaluation-report-${lecturerName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }

  // ── Print ──────────────────────────────────────────────────────────────────
  function handlePrint() {
    window.print();
  }

  return (
    <Layout>
      <div id="lecturer-printable">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Lecturer Dashboard</h1>
            <p className="text-slate-500 mt-1">Analytics and feedback summary</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 no-print">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl border-slate-200"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="flex items-center gap-2 rounded-xl border-slate-200 text-primary border-primary/30 hover:bg-primary/5"
            >
              <FileDown className="w-4 h-4" />
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

        {summary.totalEvaluations === 0 && courseBreakdowns.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-12 text-center">
            <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-700">No Evaluations Yet</h3>
            <p className="text-slate-500 mt-2">Check back later once students have submitted their feedback.</p>
          </div>
        ) : (
          <>
            {/* OVERALL STATS */}
            {summary.totalEvaluations > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard title="Total Responses" value={summary.totalEvaluations.toString()} icon={<Users className="w-6 h-6 text-indigo-600" />} color="bg-indigo-50" />
                  <StatCard title="Avg Overall"     value={summary.averageOverall.toFixed(1)}     icon={<Star className="w-6 h-6 text-amber-500" />}   color="bg-amber-50"   subtitle={`${((summary.averageOverall / 5) * 100).toFixed(0)}% performance`} />
                  <StatCard title="Avg Clarity"     value={summary.averageClarity.toFixed(1)}     icon={<BookOpen className="w-6 h-6 text-blue-500" />} color="bg-blue-50"    subtitle={`${((summary.averageClarity / 5) * 100).toFixed(0)}% performance`} />
                  <StatCard title="Avg Engagement"  value={summary.averageEngagement.toFixed(1)}  icon={<TrendingUp className="w-6 h-6 text-emerald-500" />} color="bg-emerald-50" subtitle={`${((summary.averageEngagement / 5) * 100).toFixed(0)}% performance`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                  <Card className="rounded-3xl shadow-sm border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                      <CardTitle className="font-display font-bold">Category Averages (All Courses)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={overallBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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

            {/* PER-COURSE BREAKDOWN */}
            {courseBreakdowns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-slate-800">Results by Course</h2>
                </div>

                <div className="space-y-6">
                  {courseBreakdowns.map((breakdown: any) => (
                    <CourseBreakdownCard key={breakdown.course.id} breakdown={breakdown} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function CourseBreakdownCard({ breakdown }: { breakdown: any }) {
  const { course, totalEvaluations, averageOverall, averageClarity, averageEngagement,
    averageMaterials, averageFeedback, averageSupport, averageRelevance, comments } = breakdown;

  const metrics = [
    { label: 'Clarity',    value: averageClarity },
    { label: 'Engagement', value: averageEngagement },
    { label: 'Materials',  value: averageMaterials },
    { label: 'Feedback',   value: averageFeedback },
    { label: 'Support',    value: averageSupport },
    { label: 'Relevance',  value: averageRelevance },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{course.code}</h3>
            <p className="text-sm text-slate-500">{course.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="w-4 h-4" />
          <span className="font-semibold text-slate-700">{totalEvaluations}</span>
          <span>{totalEvaluations === 1 ? 'response' : 'responses'}</span>
        </div>
      </div>

      <div className="p-6">
        {totalEvaluations === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No evaluations submitted for this course yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {metrics.map(m => {
                const pct = Math.round((m.value / 5) * 100);
                const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <div key={m.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{m.label}</div>
                    <div className="text-xl font-bold text-slate-800">{m.value.toFixed(1)}</div>
                    <div className="text-sm font-semibold text-slate-500">{pct}%</div>
                    <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {comments && comments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-600">Student Comments</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {comments.map((comment: string, i: number) => (
                    <div key={i} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                      <p className="text-sm text-slate-600 italic">"{comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

function StatCard({ title, value, icon, color, subtitle }: { title: string, value: string, icon: React.ReactNode, color: string, subtitle?: string }) {
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