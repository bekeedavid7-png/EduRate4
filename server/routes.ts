import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth } from "./auth";
import { z } from "zod";
import { courses } from "@shared/schema";
import { db } from "./db";
import passport from "passport";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const { hashPassword } = setupAuth(app);

  // === REGISTER ===
  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send({ message: "Username already exists" });
      }

      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          return res.status(400).json({ message: "An account with this email already exists" });
        }
      }

      const input = api.auth.register.input.parse(req.body);
      const hashedPassword = await hashPassword(input.password);
      const verificationToken = crypto.randomBytes(32).toString("hex");

      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
        email: input.email || "",
        emailVerified: false,
        verificationToken,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      });

      if (user.email) {
        sendVerificationEmail(user.email, verificationToken, user.name).catch(console.error);
      }

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, verificationToken: vt, resetPasswordToken, resetPasswordExpiry, ...safe } = user;
        res.status(201).json(safe);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      next(err);
    }
  });

  // === LOGIN ===
  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      req.login(user, (err: any) => {
        if (err) return next(err);
        const { password, verificationToken, resetPasswordToken, resetPasswordExpiry, ...safe } = user;
        res.json(safe);
      });
    })(req, res, next);
  });

  // === LOGOUT ===
  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  // === ME ===
  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { password, verificationToken, resetPasswordToken, resetPasswordExpiry, ...safe } = req.user as any;
    res.json(safe);
  });

  // === VERIFY EMAIL ===
  app.get("/api/auth/verify-email/:token", async (req, res) => {
    try {
      const user = await storage.getUserByVerificationToken(req.params.token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification link" });
      }
      await storage.updateUser(user.id, {
        emailVerified: true,
        verificationToken: null,
      });
      res.json({ message: "Email verified successfully" });
    } catch (err) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // === FORGOT PASSWORD ===
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      // Always respond with success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If that email exists, a reset link has been sent." });
      }
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await storage.updateUser(user.id, {
        resetPasswordToken: token,
        resetPasswordExpiry: expiry,
      });
      sendPasswordResetEmail(user.email, token, user.name).catch(console.error);
      res.json({ message: "If that email exists, a reset link has been sent." });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // === RESET PASSWORD ===
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });
      }
      const hashed = await hashPassword(password);
      await storage.updateUser(user.id, {
        password: hashed,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      });
      res.json({ message: "Password reset successfully. You can now log in." });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // === COURSES ===
  app.get(api.courses.list.path, async (req, res) => {
    const allCourses = await storage.getCourses();
    res.json(allCourses);
  });

  // === LECTURERS ===
  app.get(api.lecturers.list.path, async (req, res) => {
    const allLecturers = await storage.getLecturers();

    let filtered = allLecturers;
    // Hard-lock: students only see lecturers in their own department
    if (req.isAuthenticated() && (req.user as any).role === 'student') {
      const studentDept = (req.user as any).department;
      if (studentDept) {
        filtered = allLecturers.filter(l => l.department === studentDept);
      }
    }

    const safe = filtered.map(({ password, verificationToken, resetPasswordToken, resetPasswordExpiry, ...rest }) => rest);
    res.json(safe);
  });

  // === EVALUATIONS ===
  app.get(api.evaluations.list.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'student') {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const evals = await storage.getEvaluationsByStudent(req.user.id);
    res.json(evals);
  });

  app.post(api.evaluations.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'student') {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const input = api.evaluations.create.input.parse(req.body);

      // Security: prevent students from evaluating lecturers outside their department
      const studentDept = (req.user as any).department;
      if (studentDept) {
        const allLecturers = await storage.getLecturers();
        const targetLecturer = allLecturers.find(l => l.id === input.lecturerId);
        if (!targetLecturer || targetLecturer.department !== studentDept) {
          return res.status(403).json({ message: "You can only evaluate lecturers in your department" });
        }
      }

      const evalData = await storage.createEvaluation({
        ...input,
        studentId: req.user.id,
      });
      res.status(201).json(evalData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === LECTURER DASHBOARD ===
  app.get(api.dashboard.lecturerSummary.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'lecturer') {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const summary = await storage.getLecturerSummary(req.user.id);
    let courseInfo = undefined;
    if (req.user.courseId) {
      courseInfo = await storage.getCourse(req.user.courseId);
    }
    res.json({ ...summary, course: courseInfo });
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingCourses = await storage.getCourses();
  if (existingCourses.length === 0) {
    await db.insert(courses).values([
      { department: 'Computer Science', code: 'CS101', name: 'Intro to Computer Science' },
      { department: 'Computer Science', code: 'CS201', name: 'Data Structures' },
      { department: 'Computer Science', code: 'CS301', name: 'Algorithms' },
      { department: 'Mathematics', code: 'MATH101', name: 'Calculus I' },
      { department: 'Mathematics', code: 'MATH201', name: 'Linear Algebra' },
      { department: 'Mathematics', code: 'MATH301', name: 'Complex Analysis' },
      { department: 'Physics', code: 'PHYS101', name: 'Physics I' },
      { department: 'Physics', code: 'PHYS201', name: 'Quantum Mechanics' },
      { department: 'Biology', code: 'BIO101', name: 'General Biology' },
      { department: 'Biology', code: 'BIO302', name: 'Genetics' },
    ]);
  }
}
