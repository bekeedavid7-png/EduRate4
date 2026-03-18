import { useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useLecturerSummary } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { BookOpen, Users, Star, TrendingUp } from "lucide-react";

export default function LecturerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: isSummaryLoading } = useLecturerSummary();

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== 'lecturer')) {
      setLocation('/login');
    }
  }, [user, isAuthLoading, setLocation]);

  if (isAuthLoading || isSummaryLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[400px] bg-slate-200 rounded-2xl"></div>
            <div className="h-[400px] bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!summary) return null;

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
    { name: 'Excellent (5)', value: summary.ratingDistribution.excellent, color: '#3b82f6' }, // Blue
    { name: 'Good (4)', value: summary.ratingDistribution.good, color: '#8b5cf6' },      // Indigo
    { name: 'Average (3)', value: summary.ratingDistribution.average, color: '#f59e0b' },   // Amber
    { name: 'Poor (1-2)', value: summary.ratingDistribution.poor, color: '#ef4444' },       // Red
  ].filter(d => d.value > 0);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900">Lecturer Dashboard</h1>
        <p className="text-slate-500 mt-1">Analytics and feedback summary</p>
      </div>

      {summary.course && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 flex items-center gap-4">
          <div className="bg-primary/10 p-4 rounded-xl">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Assigned Course</div>
            <h2 className="text-xl font-bold text-slate-800">{summary.course.code} - {summary.course.name}</h2>
            <div className="text-sm font-medium text-slate-600 mt-1">{summary.course.department}</div>
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
            <StatCard 
              title="Total Responses" 
              value={summary.totalEvaluations.toString()} 
              icon={<Users className="w-6 h-6 text-indigo-600" />}
              color="bg-indigo-50"
            />
            <StatCard 
              title="Avg Overall" 
              value={summary.averageOverall.toFixed(1)} 
              icon={<Star className="w-6 h-6 text-amber-500" />}
              color="bg-amber-50"
            />
            <StatCard 
              title="Avg Clarity" 
              value={summary.averageClarity.toFixed(1)} 
              icon={<BookOpen className="w-6 h-6 text-blue-500" />}
              color="bg-blue-50"
            />
            <StatCard 
              title="Avg Engagement" 
              value={summary.averageEngagement.toFixed(1)} 
              icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}
              color="bg-emerald-50"
            />
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
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      />
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
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-display font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
