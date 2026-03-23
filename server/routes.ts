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

const ADMIN_SECRET = process.env.ADMIN_SECRET || "EDURATE_ADMIN_2024";

function isAdmin(req: any) {
  return req.isAuthenticated() && req.user.role === 'admin';
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const { hashPassword } = setupAuth(app);

  // === REGISTER ===
  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) return res.status(400).send({ message: "Username already exists" });

      if (req.body.role === 'admin') {
        if (req.body.adminSecret !== ADMIN_SECRET) {
          return res.status(403).json({ message: "Invalid admin secret key" });
        }
      }

      if (req.body.email) {
        if (req.body.role !== 'admin') {
          const emailLower = req.body.email.toLowerCase();
          const allowedDomains = ['@student.babcock.edu.ng', '@babcock.edu.ng'];
          const isAllowed = allowedDomains.some(domain => emailLower.endsWith(domain));
          if (!isAllowed) {
            return res.status(400).json({ message: "Only Babcock University email addresses are allowed (@student.babcock.edu.ng or @babcock.edu.ng)" });
          }
        }
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) return res.status(400).json({ message: "An account with this email already exists" });
      }

      const input = api.auth.register.input.parse(req.body);
      const courseIds: number[] = req.body.courseIds || [];
      const hashedPassword = await hashPassword(input.password);
      const verificationToken = crypto.randomBytes(32).toString("hex");

      const user = await storage.createUser({
        ...input,
        courseId: null,
        password: hashedPassword,
        email: input.email || "",
        emailVerified: false,
        verificationToken,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      });

      if (input.role === 'lecturer' && courseIds.length > 0) {
        await storage.setLecturerCourses(user.id, courseIds);
      }

      if (user.email) {
        sendVerificationEmail(user.email, verificationToken, user.name).catch(console.error);
      }

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, verificationToken: vt, resetPasswordToken, resetPasswordExpiry, ...safe } = user;
        res.status(201).json(safe);
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
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
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const { password, verificationToken, resetPasswordToken, resetPasswordExpiry, ...safe } = req.user as any;
    res.json(safe);
  });

  // === VERIFY EMAIL ===
  app.get("/api/auth/verify-email/:token", async (req, res) => {
    try {
      const user = await storage.getUserByVerificationToken(req.params.token);
      if (!user) return res.status(400).json({ message: "Invalid or expired verification link" });
      await storage.updateUser(user.id, { emailVerified: true, verificationToken: null });
      res.json({ message: "Email verified successfully" });
    } catch {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // === FORGOT PASSWORD ===
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) return res.json({ message: "If that email exists, a reset link has been sent." });
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000);
      await storage.updateUser(user.id, { resetPasswordToken: token, resetPasswordExpiry: expiry });
      sendPasswordResetEmail(user.email, token, user.name).catch(console.error);
      res.json({ message: "If that email exists, a reset link has been sent." });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // === RESET PASSWORD ===
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      const user = await storage.getUserByResetToken(token);
      if (!user) return res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });
      const hashed = await hashPassword(password);
      await storage.updateUser(user.id, { password: hashed, resetPasswordToken: null, resetPasswordExpiry: null });
      res.json({ message: "Password reset successfully. You can now log in." });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
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
    if (req.isAuthenticated() && (req.user as any).role === 'student') {
      const studentDept = (req.user as any).department;
      if (studentDept) filtered = allLecturers.filter(l => l.department === studentDept);
    }
    const safe = filtered.map(({ password, verificationToken, resetPasswordToken, resetPasswordExpiry, ...rest }) => rest);
    res.json(safe);
  });

  // === EVALUATIONS ===
  app.get(api.evaluations.list.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'student') return res.status(401).json({ message: "Unauthorized" });
    const evals = await storage.getEvaluationsByStudent(req.user.id);
    res.json(evals);
  });

  app.post(api.evaluations.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'student') return res.status(401).json({ message: "Unauthorized" });
    try {
      // === EVALUATION PERIOD CHECK ===
      const activePeriod = await storage.getActivePeriod();
      if (!activePeriod) {
        return res.status(403).json({ message: "Evaluations are currently closed. No active evaluation period." });
      }
      const now = new Date();
      if (now < activePeriod.startDate || now > activePeriod.endDate) {
        return res.status(403).json({
          message: `Evaluations are closed. The active period "${activePeriod.name}" runs from ${activePeriod.startDate.toLocaleDateString()} to ${activePeriod.endDate.toLocaleDateString()}.`,
          periodClosed: true,
        });
      }

      const input = api.evaluations.create.input.parse(req.body);
      const studentDept = (req.user as any).department;
      if (studentDept) {
        const allLecturers = await storage.getLecturers();
        const targetLecturer = allLecturers.find(l => l.id === input.lecturerId);
        if (!targetLecturer || targetLecturer.department !== studentDept) {
          return res.status(403).json({ message: "You can only evaluate lecturers in your department" });
        }
      }
      const evalData = await storage.createEvaluation({ ...input, studentId: req.user.id });
      res.status(201).json(evalData);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === PUBLIC: Get active period (used by student evaluate page) ===
  app.get("/api/periods/active", async (req, res) => {
    const period = await storage.getActivePeriod();
    res.json(period || null);
  });

  // === LECTURER DASHBOARD ===
  app.get(api.dashboard.lecturerSummary.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'lecturer') return res.status(401).json({ message: "Unauthorized" });
    const summary = await storage.getLecturerSummary(req.user.id);
    const lecturerCoursesData = await storage.getLecturerCoursesDetails(req.user.id);
    res.json({ ...summary, courses: lecturerCoursesData });
  });

  // === LECTURER PROFILE - GET COURSES ===
  app.get("/api/lecturer/courses", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'lecturer') return res.status(401).json({ message: "Unauthorized" });
    const lecturerCoursesData = await storage.getLecturerCoursesDetails(req.user.id);
    res.json(lecturerCoursesData);
  });

  // === LECTURER PROFILE - UPDATE ===
  app.put("/api/lecturer/profile", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'lecturer') return res.status(401).json({ message: "Unauthorized" });
    try {
      const { department, courseIds } = req.body;
      if (!department || !Array.isArray(courseIds) || courseIds.length === 0) {
        return res.status(400).json({ message: "Department and at least one course are required" });
      }
      await storage.updateUser(req.user.id, { department });
      await storage.setLecturerCourses(req.user.id, courseIds);
      const updated = await storage.getUser(req.user.id);
      const { password, verificationToken, resetPasswordToken, resetPasswordExpiry, ...safe } = updated!;
      res.json(safe);
    } catch {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ============================================================
  // === ADMIN ROUTES ===
  // ============================================================

  app.get("/api/admin/users", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const allUsers = await storage.getAllUsers();
    const safe = allUsers.map(({ password, verificationToken, resetPasswordToken, resetPasswordExpiry, ...rest }) => rest);
    res.json(safe);
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const id = parseInt(req.params.id);
    if ((req.user as any).id === id) return res.status(400).json({ message: "You cannot delete your own account" });
    await storage.deleteUser(id);
    res.json({ message: "User deleted" });
  });

  app.get("/api/admin/courses", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const allCourses = await storage.getCourses();
    res.json(allCourses);
  });

  app.post("/api/admin/courses", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const { department, code, name } = req.body;
    if (!department || !code || !name) return res.status(400).json({ message: "Department, code and name are required" });
    const course = await storage.createCourse({ department: department.trim(), code: code.trim().toUpperCase(), name: name.trim() });
    res.status(201).json(course);
  });

  app.delete("/api/admin/courses/:id", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteCourse(parseInt(req.params.id));
    res.json({ message: "Course deleted" });
  });

  app.get("/api/admin/evaluations", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const allEvals = await storage.getAllEvaluations();
    const allUsers = await storage.getAllUsers();
    const allCourses = await storage.getCourses();
    const enriched = allEvals.map(e => ({
      ...e,
      studentName: allUsers.find(u => u.id === e.studentId)?.name || "Unknown",
      lecturerName: allUsers.find(u => u.id === e.lecturerId)?.name || "Unknown",
      courseName: allCourses.find(c => c.id === e.courseId)?.name || "Unknown",
      courseCode: allCourses.find(c => c.id === e.courseId)?.code || "Unknown",
    }));
    res.json(enriched);
  });

  app.delete("/api/admin/evaluations/:id", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteEvaluation(parseInt(req.params.id));
    res.json({ message: "Evaluation deleted" });
  });

  // === ADMIN: EVALUATION PERIODS ===
  app.get("/api/admin/periods", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const periods = await storage.getAllPeriods();
    res.json(periods);
  });

  app.post("/api/admin/periods", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try {
      const { name, startDate, endDate, isActive } = req.body;
      if (!name || !startDate || !endDate) {
        return res.status(400).json({ message: "Name, start date and end date are required" });
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      if (end <= start) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
      const period = await storage.createPeriod({ name, startDate: start, endDate: end, isActive: !!isActive });
      res.status(201).json(period);
    } catch {
      res.status(500).json({ message: "Failed to create period" });
    }
  });

  app.put("/api/admin/periods/:id/activate", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try {
      const period = await storage.activatePeriod(parseInt(req.params.id));
      res.json(period);
    } catch {
      res.status(500).json({ message: "Failed to activate period" });
    }
  });

  app.delete("/api/admin/periods/:id", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    await storage.deletePeriod(parseInt(req.params.id));
    res.json({ message: "Period deleted" });
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