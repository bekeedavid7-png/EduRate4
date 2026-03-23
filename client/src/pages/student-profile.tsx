import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { DashboardShell } from "@/components/dashboard-shell";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserCog, Save } from "lucide-react";

export default function StudentProfile() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== "student")) setLocation("/login");
    if (user?.name) setName(user.name);
  }, [user, isAuthLoading, setLocation]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (name.trim() && name.trim() !== user?.name) payload.name = name.trim();
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      toast({ title: "Profile updated", description: "Your account details were saved successfully." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading) {
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
      <DashboardShell>
        <div className="max-w-xl">
          <Link href="/student" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-6 transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>

          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/40 p-8 border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <UserCog className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500 text-sm">View and edit your account details</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl bg-slate-50/50" />
              </div>

              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user?.username || ""} disabled className="rounded-xl bg-slate-100" />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="rounded-xl bg-slate-100" />
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <p className="text-sm font-semibold text-slate-700">Change Password</p>
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-xl bg-slate-50/50" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} className="rounded-xl bg-slate-50/50" />
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full py-6 rounded-xl font-semibold bg-gradient-to-r from-primary to-indigo-600">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </DashboardShell>
    </Layout>
  );
}
