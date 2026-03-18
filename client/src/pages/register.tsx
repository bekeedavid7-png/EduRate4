import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useCourses } from "@/hooks/use-courses";
import { motion } from "framer-motion";
import { Mail, CheckCircle2 } from "lucide-react";

export default function Register() {
  const { register, isRegistering, user } = useAuth();
  const { data: courses, isLoading: isLoadingCourses } = useCourses();
  const [, setLocation] = useLocation();

  const [role, setRole] = useState<'student' | 'lecturer'>('student');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [studentDepartment, setStudentDepartment] = useState("");
  const [courseId, setCourseId] = useState("");
  const [registered, setRegistered] = useState(false);

  // ✅ All hooks before early returns
  const departments = useMemo(() => {
    if (!courses) return [];
    return Array.from(new Set(courses.map(c => c.department))).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (!courses || !department) return [];
    return courses.filter(c => c.department === department);
  }, [courses, department]);

  // ✅ Early returns after all hooks
  if (user && !registered) {
    setLocation(user.role === 'student' ? '/student' : '/lecturer');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        username,
        password,
        email,
        role,
        name,
        department: role === 'lecturer' ? department : studentDepartment,
        courseId: role === 'lecturer' && courseId ? parseInt(courseId) : undefined,
      });
      setRegistered(true);
    } catch {}
  };

  if (registered) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 p-10 border border-slate-100 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-100 p-4 rounded-full">
                  <Mail className="w-10 h-10 text-indigo-600" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 mb-2">
                We've sent a verification link to <span className="font-semibold text-slate-700">{email}</span>.
              </p>
              <p className="text-sm text-slate-400 mb-6">
                Click the link in the email to verify your account. You can still use the app while unverified.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setLocation(role === 'student' ? '/student' : '/lecturer')}
                  className="w-full py-5 rounded-xl font-semibold bg-gradient-to-r from-primary to-indigo-600"
                  data-testid="button-go-to-dashboard"
                >
                  Go to Dashboard
                </Button>
                <p className="text-xs text-slate-400">Didn't receive it? Check spam or <Link href="/login" className="text-primary hover:underline">sign in again</Link>.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 p-8 border border-slate-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-slate-900">Create an Account</h2>
              <p className="text-slate-500 mt-2">Join EDURATE to start {role === 'student' ? 'evaluating' : 'receiving feedback'}</p>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
              <button
                type="button"
                onClick={() => setRole('student')}
                data-testid="button-role-student"
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
                  role === 'student' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                I'm a Student
              </button>
              <button
                type="button"
                onClick={() => setRole('lecturer')}
                data-testid="button-role-lecturer"
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
                  role === 'lecturer' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                I'm a Lecturer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name" value={name} onChange={(e) => setName(e.target.value)} required
                    className="px-4 py-5 rounded-xl bg-slate-50/50" placeholder="Jane Doe"
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username" value={username} onChange={(e) => setUsername(e.target.value)} required
                    className="px-4 py-5 rounded-xl bg-slate-50/50" placeholder="janedoe"
                    data-testid="input-username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="pl-10 py-5 rounded-xl bg-slate-50/50" placeholder="you@example.com"
                    data-testid="input-email"
                  />
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Used for account verification and password reset
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  minLength={8}
                  className="px-4 py-5 rounded-xl bg-slate-50/50" placeholder="Min. 8 characters"
                  data-testid="input-password"
                />
              </div>

              {role === 'student' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-5 pt-2 border-t border-slate-100"
                >
                  <div className="space-y-2">
                    <Label>Your Department</Label>
                    <p className="text-xs text-slate-400">This determines which lecturers you can evaluate. It cannot be changed after registration.</p>
                    <Select value={studentDepartment} onValueChange={setStudentDepartment}>
                      <SelectTrigger className="py-5 rounded-xl bg-slate-50/50" data-testid="select-student-department">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {role === 'lecturer' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-5 pt-2 border-t border-slate-100"
                >
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={department} onValueChange={(val) => { setDepartment(val); setCourseId(""); }}>
                      <SelectTrigger className="py-5 rounded-xl bg-slate-50/50" data-testid="select-department">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {department && (
                    <div className="space-y-2">
                      <Label>Assigned Course</Label>
                      <Select value={courseId} onValueChange={setCourseId}>
                        <SelectTrigger className="py-5 rounded-xl bg-slate-50/50" data-testid="select-course">
                          <SelectValue placeholder="Select the course you teach" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCourses.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.code} - {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isRegistering || isLoadingCourses || (role === 'lecturer' && (!department || !courseId)) || (role === 'student' && !studentDepartment)}
                data-testid="button-create-account"
                className="w-full py-6 mt-4 rounded-xl text-md font-semibold bg-gradient-to-r from-primary to-indigo-600 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              >
                {isRegistering ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline cursor-pointer" data-testid="link-login">
                Log in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}