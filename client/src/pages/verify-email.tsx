import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [, params] = useRoute("/verify-email/:token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params?.token;
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }
    fetch(`/api/auth/verify-email/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [params?.token]);

  return (
    <Layout>
      <div className="flex items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 p-10 border border-slate-100 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
            </div>

            {status === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-slate-600 font-medium">Verifying your email...</p>
              </div>
            )}

            {status === "success" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex justify-center mb-4">
                  <div className="bg-emerald-100 p-4 rounded-full">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Email Verified!</h2>
                <p className="text-slate-500 mb-6">{message}</p>
                <Button asChild className="w-full py-5 rounded-xl font-semibold bg-gradient-to-r from-primary to-indigo-600">
                  <Link href="/login">Continue to Sign In</Link>
                </Button>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex justify-center mb-4">
                  <div className="bg-red-100 p-4 rounded-full">
                    <XCircle className="w-10 h-10 text-red-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Verification Failed</h2>
                <p className="text-slate-500 mb-6">{message}</p>
                <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
                  Back to Sign In
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
