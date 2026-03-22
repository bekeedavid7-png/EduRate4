import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useCourses } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserCog, BookOpen, Save } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function LecturerProfile() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: courses, isLoading: isLoadingCourses } = useCourses();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [department, setDepartment] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch lecturer's current courses
  const { data: currentCourses, isLoading: isLoadingCurrentCourses } = useQuery({
    queryKey: ["/api/lecturer/courses"],
    queryFn: async () => {
      const res = await fetch("/api/lecturer/courses", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json() as Promise<{ id: number, code: string, name: string, department: string }[]>;
    },
    enabled: !!user && user.role === 'lecturer',
  });

  // Pre-fill form when data loads
  useEffect(() => {
    if (user?.department) setDepartment(user.department);
    if (currentCourses && currentCourses.length > 0) {
      setSelectedCourseIds(currentCourses.map(c => c.id));
    }
  }, [user, currentCourses]);

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== 'lecturer')) setLocation('/login');
  }, [user, isAuthLoading, setLocation]);

  const departments = useMemo(() => {
    if (!courses) return [];
    return Array.from(new Set(courses.map(c => c.department))).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (!courses || !department) return [];
    return courses.filter(c => c.department === department);
  }, [courses, department]);

  const toggleCourse = (courseId: number) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleDepartmentChange = (val: string) => {
    setDepartment(val);
    setSelectedCourseIds([]); // reset courses when dept changes
  };

  const handleSave = async () => {
    if (!department || selectedCourseIds.length === 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please select a department and at least one course." });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/lecturer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ department, courseIds: selectedCourseIds }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      // Invalidate queries so dashboard refreshes
      queryClient.invalidateQueries({ queryKey: ["/api/lecturer/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lecturer/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      toast({ title: "Profile Updated", description: "Your department and courses have been saved." });
      setLocation('/lecturer');
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isAuthLoading || isLoadingCourses || isLoadingCurrentCourses;

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse max-w-xl mx-auto space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <Link href="/lecturer" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-8 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 p-8 border border-slate-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <UserCog className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">Edit Profile</h1>
                <p className="text-slate-500 text-sm">Update your department and assigned courses</p>
              </div>
            </div>

            {/* Read-only info */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Name</span>
                <span className="text-slate-800 font-semibold">{user?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Username</span>
                <span className="text-slate-800 font-semibold">{user?.username}</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Department */}
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={department} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="py-5 rounded-xl bg-slate-50/50">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Courses */}
              {department && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <Label>
                    Assigned Courses
                    <span className="text-slate-400 font-normal ml-1">(select all that apply)</span>
                  </Label>
                  <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-3 max-h-56 overflow-y-auto">
                    {filteredCourses.map(c => (
                      <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedCourseIds.includes(c.id)}
                          onChange={() => toggleCourse(c.id)}
                          className="w-4 h-4 rounded accent-primary"
                        />
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">
                            {c.code} — {c.name}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedCourseIds.length > 0 && (
                    <p className="text-xs text-primary font-medium">
                      {selectedCourseIds.length} course{selectedCourseIds.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </motion.div>
              )}

              <Button
                onClick={handleSave}
                disabled={isSaving || !department || selectedCourseIds.length === 0}
                className="w-full py-6 rounded-xl font-semibold bg-gradient-to-r from-primary to-indigo-600 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}