import { useState, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useCourses } from "@/hooks/use-courses";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, ShieldCheck } from "lucide-react";

export default function Register() {
  const { register, isRegistering, user } = useAuth();
  const { data: courses, isLoading: isLoadingCourses } = useCourses();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const isAdminMode = params.get("secret") === "EDURATE_ADMIN_2024";

  const [role, setRole] = useState<'student' | 'lecturer' | 'admin'>('student');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [matriculationNumber, setMatriculationNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [studentDepartment, setStudentDepartment] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [adminSecret, setAdminSecret] = useState("");
  const [registered, setRegistered] = useState(false);

  const departments = useMemo(() => {
    if (!courses) return [];
    return Array.from(new Set(courses.map(c => c.department))).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (!courses || !department) return [];
    return courses.filter(c => c.department === department);
  }, [courses, department]);

  if (user && !registered) {
    if (user.role === 'admin') setLocation('/admin');
    else setLocation(user.role === 'student' ? '/student' : '/lecturer');
    return null;
  }

  const toggleCourse = (courseId: number) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        username, password, email, role, name,
        department: role === 'lecturer' ? department : role === 'student' ? studentDepartment : undefined,
        school: role === 'lecturer' ? school : undefined,
        matriculationNumber: role === 'student' ? matriculationNumber : undefined,
        courseIds: role === 'lecturer' ? selectedCourseIds : undefined,
        adminSecret: role === 'admin' ? adminSecret : undefined,
      } as any);
      setRegistered(true);
    } catch {}
  };

  if (registered) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 p-10 border border-slate-100 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-100 p-4 rounded-full">
                  <Mail className="w-10 h-10 text-indigo-600" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 mb-6">We've sent a verification link to <span className="font-semibold text-slate-700">{email}</span>.</p>
              <Button
                onClick={() => {
                  if (role === 'admin') setLocation('/admin');
                  else setLocation(role === 'student' ? '/student' : '/lecturer');
                }}
                className="w-full py-5 rounded-xl font-semibold bg-gradient-to-r from-primary to-indigo-600"
              >
                Go to Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const isLecturerValid = role === 'lecturer' && department && selectedCourseIds.length > 0 && school;
  const isStudentValid = role === 'student' && studentDepartment && matriculationNumber;
  const isAdminValid = role === 'admin' && adminSecret;
  const isSubmitDisabled = isRegistering || isLoadingCourses || !(isLecturerValid || isStudentValid || isAdminValid);

  return (
    <Layout>
      <div className="flex items-center justify-center py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 p-8 border border-slate-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-slate-900">Create an Account</h2>
              <p className="text-slate-500 mt-2">Join EDURATE to start {role === 'student' ? 'evaluating' : role === 'lecturer' ? 'receiving feedback' : 'managing the platform'}</p>
            </div>

            {/* Role Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
              <button type="button" onClick={() => setRole('student')}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${role === 'student' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Student
              </button>
              <button type="button" onClick={() => setRole('lecturer')}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${role === 'lecturer' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Lecturer
              </button>
              {isAdminMode && (
                <button type="button" onClick={() => setRole('admin')}
                  className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${role === 'admin' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  Admin
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required className="px-4 py-5 rounded-xl bg-slate-50/50" placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={username} onChange={e => setUsername(e.target.value)} required className="px-4 py-5 rounded-xl bg-slate-50/50" placeholder="janedoe" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="pl-10 py-5 rounded-xl bg-slate-50/50" placeholder="you@example.com" />
                </div>
                {role !== 'admin' && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Only Babcock University emails allowed
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="px-4 py-5 rounded-xl bg-slate-50/50" placeholder="Min. 8 characters" />
              </div>

              {role === 'lecturer' && (
                <div className="space-y-2">
                  <Label>School / Faculty</Label>
                  <Input value={school} onChange={e => setSchool(e.target.value)} required className="px-4 py-5 rounded-xl bg-slate-50/50" placeholder="e.g. School of Computing & Engineering" />
                </div>
              )}

              {/* STUDENT */}
              {role === 'student' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <Label>Matriculation Number</Label>
                    <Input value={matriculationNumber} onChange={e => setMatriculationNumber(e.target.value)} required className="px-4 py-5 rounded-xl bg-slate-50/50" placeholder="e.g. 22/54321" />
                  </div>
                  <div className="space-y-2">
                    <Label>Your Department</Label>
                    <p className="text-xs text-slate-400">Cannot be changed after registration.</p>
                    <Select value={studentDepartment} onValueChange={setStudentDepartment}>
                      <SelectTrigger className="py-5 rounded-xl bg-slate-50/50">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {/* LECTURER */}
              {role === 'lecturer' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5 pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={department} onValueChange={val => { setDepartment(val); setSelectedCourseIds([]); }}>
                      <SelectTrigger className="py-5 rounded-xl bg-slate-50/50">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {department && (
                    <div className="space-y-2">
                      <Label>Assigned Courses <span className="text-slate-400 font-normal">(select all that apply)</span></Label>
                      <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-3 max-h-48 overflow-y-auto">
                        {filteredCourses.map(c => (
                          <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={selectedCourseIds.includes(c.id)} onChange={() => toggleCourse(c.id)} className="w-4 h-4 rounded accent-primary" />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{c.code} — {c.name}</span>
                          </label>
                        ))}
                      </div>
                      {selectedCourseIds.length > 0 && (
                        <p className="text-xs text-primary font-medium">{selectedCourseIds.length} course{selectedCourseIds.length > 1 ? 's' : ''} selected</p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ADMIN */}
              {role === 'admin' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                    <Label className="text-rose-600">Admin Secret Key</Label>
                  </div>
                  <Input
                    type="password"
                    value={adminSecret}
                    onChange={e => setAdminSecret(e.target.value)}
                    required
                    className="px-4 py-5 rounded-xl bg-rose-50/50 border-rose-200"
                    placeholder="Enter admin secret key"
                  />
                </motion.div>
              )}

              <Button type="submit" disabled={isSubmitDisabled}
                className={`w-full py-6 mt-4 rounded-xl text-md font-semibold transition-all duration-300 ${role === 'admin' ? 'bg-gradient-to-r from-rose-500 to-rose-700 hover:shadow-lg hover:shadow-rose-300' : 'bg-gradient-to-r from-primary to-indigo-600 hover:shadow-lg hover:shadow-primary/30'}`}>
                {isRegistering ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline cursor-pointer">Log in</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}