import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { useAuth } from "@/hooks/use-auth";
import { useCreateEvaluation } from "@/hooks/use-evaluations";
import { useLecturers } from "@/hooks/use-lecturers";
import { ArrowLeft, BookOpen, User } from "lucide-react";
import { Link } from "wouter";

export default function Evaluate() {
  const [, params] = useRoute("/evaluate/:lecturerId/:courseId");
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: lecturers, isLoading: isLecturersLoading } = useLecturers();
  const createMutation = useCreateEvaluation();

  const [overallRating, setOverallRating] = useState(0);
  const [clarityRating, setClarityRating] = useState(0);
  const [engagementRating, setEngagementRating] = useState(0);
  const [materialsRating, setMaterialsRating] = useState(0);
  const [organizationRating, setOrganizationRating] = useState(0);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [paceRating, setPaceRating] = useState(0);
  const [supportRating, setSupportRating] = useState(0);
  const [fairnessRating, setFairnessRating] = useState(0);
  const [relevanceRating, setRelevanceRating] = useState(0);
  const [comments, setComments] = useState("");

  const lecturerId = params?.lecturerId ? parseInt(params.lecturerId) : 0;
  const courseId = params?.courseId ? parseInt(params.courseId) : 0;

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== 'student')) {
      setLocation('/login');
    }
  }, [user, isAuthLoading, setLocation]);

  const targetLecturer = lecturers?.find(l => l.id === lecturerId && l.courseId === courseId);

  if (isAuthLoading || isLecturersLoading) {
    return <Layout><div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></Layout>;
  }

  if (!targetLecturer) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-slate-800">Lecturer not found</h2>
          <Link href="/student" className="text-primary hover:underline mt-4 inline-block">Return to Dashboard</Link>
        </div>
      </Layout>
    );
  }

  const isFormValid = overallRating > 0 && clarityRating > 0 && engagementRating > 0 && 
                      materialsRating > 0 && organizationRating > 0 && feedbackRating > 0 && 
                      paceRating > 0 && supportRating > 0 && fairnessRating > 0 && relevanceRating > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    await createMutation.mutateAsync({
      lecturerId,
      courseId,
      overallRating,
      clarityRating,
      engagementRating,
      materialsRating,
      organizationRating,
      feedbackRating,
      paceRating,
      supportRating,
      fairnessRating,
      relevanceRating,
      comments: comments.trim() || null,
    });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Link href="/student" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-8 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg shadow-black/5 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-8">
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-4">Course Evaluation</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Course</div>
                  <div className="font-bold text-slate-800">{targetLecturer.courseCode}</div>
                </div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-slate-300"></div>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Lecturer</div>
                  <div className="font-bold text-slate-800">{targetLecturer.name}</div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid gap-8 sm:grid-cols-1">
              <RatingSection 
                title="Overall Performance" 
                description="How would you rate the lecturer's overall effectiveness?"
                value={overallRating}
                onChange={setOverallRating}
                size="lg"
              />
              <div className="h-px bg-slate-100"></div>
              <RatingSection 
                title="Clarity of Explanation" 
                description="Did the lecturer explain complex concepts clearly?"
                value={clarityRating}
                onChange={setClarityRating}
              />
              <div className="h-px bg-slate-100"></div>
              <RatingSection 
                title="Engagement & Interaction" 
                description="Did the lecturer encourage participation and keep the class engaged?"
                value={engagementRating}
                onChange={setEngagementRating}
              />
              <div className="h-px bg-slate-100"></div>
              <RatingSection 
                title="Quality of Materials" 
                description="Were the course materials helpful and well-designed?"
                value={materialsRating}
                onChange={setMaterialsRating}
              />
              <div className="h-px bg-slate-100"></div>
              <RatingSection 
                title="Organization" 
                description="Was the course well-structured and organized?"
                value={organizationRating}
                onChange={setOrganizationRating}
              />
              <div className="h-px bg-slate-100"></div>
              <RatingSection 
                title="Feedback Quality" 
                description="Was the feedback provided on assignments timely and helpful?"
                value={feedbackRating}
                onChange={setFeedbackRating}
              />
              <div className="h-px bg-slate-100"></div>
              <RatingSection 
                title="Teaching Pace" 
                description="Was the pace of the course appropriate for your learning?"
                value={paceRating}
                onChange={setPaceRating}
              />
              <div className="h-px bg-slate-100"></div>
              <RatingSection 
                title="Student Support" 
                description="Did the lecturer provide adequate support outside of class?"
                value={supportRating}
                onChange={setSupportRating}
              />
              <div className="h-px bg-slate-100"></div>
              <RatingSection 
                title="Assessment Fairness" 
                description="Were the assessments fair and aligned with course content?"
                value={fairnessRating}
                onChange={setFairnessRating}
              />
              <div className="h-px bg-slate-100"></div>
              <RatingSection 
                title="Content Relevance" 
                description="Was the course content relevant to your field of study?"
                value={relevanceRating}
                onChange={setRelevanceRating}
              />
            </div>

            <div className="space-y-3 pt-4">
              <Label htmlFor="comments" className="text-base font-semibold">Additional Comments (Optional)</Label>
              <p className="text-sm text-slate-500">Share any specific feedback, strengths, or areas for improvement.</p>
              <Textarea 
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="The course was..."
                className="min-h-[120px] rounded-xl border-slate-200 resize-none focus:bg-slate-50 transition-colors p-4"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                disabled={!isFormValid || createMutation.isPending}
                className="px-8 py-6 rounded-xl text-md font-semibold bg-gradient-to-r from-primary to-indigo-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto"
              >
                {createMutation.isPending ? "Submitting..." : "Submit Evaluation"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

function RatingSection({ title, description, value, onChange, size = "md" }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="max-w-md">
        <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shrink-0 self-start sm:self-center">
        <StarRating value={value} onChange={onChange} size={size} />
      </div>
    </div>
  );
}
