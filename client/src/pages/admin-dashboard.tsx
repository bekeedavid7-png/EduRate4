import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, Star, Trash2, Plus, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // New course form state
  const [newDept, setNewDept] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [deptMode, setDeptMode] = useState<'existing' | 'new'>('existing');

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

  if (isAuthLoading) return <Layout><div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></Layout>;

  const departments = Array.from(new Set(courses.map((c: any) => c.department))).sort() as string[];
  const students = users.filter((u: any) => u.role === 'student');
  const lecturers = users.filter((u: any) => u.role === 'lecturer');

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-rose-100 p-3 rounded-2xl">
          <ShieldCheck className="w-7 h-7 text-rose-600" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-500 text-sm">Manage courses, users and evaluations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Students", value: students.length, color: "bg-blue-50", text: "text-blue-600" },
          { label: "Lecturers", value: lecturers.length, color: "bg-indigo-50", text: "text-indigo-600" },
          { label: "Courses", value: courses.length, color: "bg-emerald-50", text: "text-emerald-600" },
          { label: "Evaluations", value: evaluations.length, color: "bg-amber-50", text: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-5 border border-white shadow-sm`}>
            <p className="text-sm font-semibold text-slate-500">{s.label}</p>
            <p className={`text-4xl font-display font-bold ${s.text} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="courses">
        <TabsList className="bg-slate-100 rounded-xl mb-6 p-1">
          <TabsTrigger value="courses" className="rounded-lg flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Courses
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg flex items-center gap-2">
            <Users className="w-4 h-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="rounded-lg flex items-center gap-2">
            <Star className="w-4 h-4" /> Evaluations
          </TabsTrigger>
        </TabsList>

        {/* === COURSES TAB === */}
        <TabsContent value="courses">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Course Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Add New Course
              </h2>
              <div className="space-y-4">
                {/* Department mode toggle */}
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button type="button" onClick={() => setDeptMode('existing')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${deptMode === 'existing' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                    Existing Dept
                  </button>
                  <button type="button" onClick={() => setDeptMode('new')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${deptMode === 'new' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                    New Dept
                  </button>
                </div>

                {deptMode === 'existing' ? (
                  <div className="space-y-1">
                    <Label>Department</Label>
                    <Select value={newDept} onValueChange={setNewDept}>
                      <SelectTrigger className="rounded-xl bg-slate-50/50">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label>New Department Name</Label>
                    <Input value={customDept} onChange={e => setCustomDept(e.target.value)} className="rounded-xl bg-slate-50/50" placeholder="e.g. Engineering" />
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Course Code</Label>
                  <Input value={newCode} onChange={e => setNewCode(e.target.value)} className="rounded-xl bg-slate-50/50" placeholder="e.g. ENG101" />
                </div>
                <div className="space-y-1">
                  <Label>Course Name</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} className="rounded-xl bg-slate-50/50" placeholder="e.g. Introduction to Engineering" />
                </div>
                <Button
                  onClick={() => createCourse.mutate()}
                  disabled={createCourse.isPending || !newCode || !newName || (deptMode === 'existing' ? !newDept : !customDept)}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-indigo-600"
                >
                  {createCourse.isPending ? "Adding..." : "Add Course"}
                </Button>
              </div>
            </div>

            {/* Course List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-5">All Courses ({courses.length})</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {departments.map(dept => (
                  <div key={dept}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2">{dept}</p>
                    {courses.filter((c: any) => c.department === dept).map((course: any) => (
                      <div key={course.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 mb-2">
                        <div>
                          <span className="text-sm font-bold text-slate-800">{course.code}</span>
                          <span className="text-sm text-slate-500 ml-2">{course.name}</span>
                        </div>
                        <button onClick={() => {
                          if (confirm(`Delete ${course.code}?`)) deleteCourse.mutate(course.id);
                        }} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* === USERS TAB === */}
        <TabsContent value="users">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">All Users ({users.length})</h2>
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
                    <th className="text-left px-6 py-3">Verified</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{u.name}</td>
                      <td className="px-6 py-4 text-slate-600">{u.username}</td>
                      <td className="px-6 py-4 text-slate-600">{u.email || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          u.role === 'admin' ? 'bg-rose-100 text-rose-600' :
                          u.role === 'lecturer' ? 'bg-indigo-100 text-indigo-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{u.department || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.emailVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {u.emailVerified ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.role !== 'admin' && (
                          <button onClick={() => {
                            if (confirm(`Delete user "${u.name}"? This cannot be undone.`)) deleteUser.mutate(u.id);
                          }} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      </Tabs>
    </Layout>
  );
}