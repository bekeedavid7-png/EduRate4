import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { ArrowRight, Star, BarChart3, ShieldCheck, Users, BookOpen, GraduationCap, ClipboardList, ListChecks, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: stats } = useQuery<{
    totalStudents: number;
    totalLecturers: number;
    totalEvaluations: number;
    totalCourses: number;
    evaluationCriteriaCount: number;
  }>({
    queryKey: ["/api/stats/public"],
  });

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Platform is Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
            Elevate education with <br className="hidden md:block" />
            <span className="text-gradient">transparent feedback</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            EDURATE bridges the gap between students and lecturers. Provide meaningful course evaluations that drive academic excellence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isAuthLoading && user ? (
              <Link 
                href={user.role === 'student' ? '/student' : '/lecturer'}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-primary to-indigo-600 text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-primary to-indigo-600 text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 cursor-pointer"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* PLATFORM STATISTICS SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24 w-full max-w-6xl mx-auto px-6 py-16 bg-slate-50 rounded-[3rem] border border-slate-100"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">Platform at a Glance</h2>
            <p className="text-slate-500">Live insights into the EDURATE community</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <StatCard
              icon={<GraduationCap className="w-6 h-6 text-indigo-600" />}
              bgClass="bg-indigo-50"
              label="Students"
              value={stats?.totalStudents ?? "—"}
            />
            <StatCard
              icon={<Users className="w-6 h-6 text-violet-600" />}
              bgClass="bg-violet-50"
              label="Lecturers"
              value={stats?.totalLecturers ?? "—"}
            />
            <StatCard
              icon={<ClipboardList className="w-6 h-6 text-emerald-600" />}
              bgClass="bg-emerald-50"
              label="Evaluations"
              value={stats?.totalEvaluations ?? "—"}
            />
            <StatCard
              icon={<BookOpen className="w-6 h-6 text-amber-600" />}
              bgClass="bg-amber-50"
              label="Courses"
              value={stats?.totalCourses ?? "—"}
            />
            <StatCard
              icon={<ListChecks className="w-6 h-6 text-rose-600" />}
              bgClass="bg-rose-50"
              label="Eval. Criteria"
              value={stats?.evaluationCriteriaCount ?? 10}
              className="col-span-2 md:col-span-1"
            />
          </div>
        </motion.section>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl"
        >
          <FeatureCard 
            icon={<Star className="w-6 h-6 text-amber-500" />}
            title="Quality Evaluations"
            description="Detailed 10-point evaluation system covering all aspects of the learning experience."
          />
          <FeatureCard 
            icon={<BarChart3 className="w-6 h-6 text-primary" />}
            title="Actionable Analytics"
            description="Lecturers get detailed dashboards to understand their impact."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
            title="Secure & Private"
            description="Evaluations are securely tied to courses ensuring data integrity."
          />
        </motion.div>
      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-glass p-8 rounded-3xl shadow-soft hover:shadow-lg transition-all duration-300 border border-slate-100 hover:-translate-y-1 text-left">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-display font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ icon, bgClass, label, value, className }: {
  icon: React.ReactNode;
  bgClass: string;
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center gap-3 ${className ?? ""}`}
    >
      <div className={`w-12 h-12 rounded-2xl ${bgClass} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-display font-extrabold text-slate-900">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
      </div>
    </motion.div>
  );
}