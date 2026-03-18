import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  department: text("department").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ['student', 'lecturer'] }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpiry: timestamp("reset_password_expiry"),
  department: text("department"),
  courseId: integer("course_id").references(() => courses.id),
});

export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  lecturerId: integer("lecturer_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  overallRating: integer("overall_rating").notNull(),
  clarityRating: integer("clarity_rating").notNull(),
  engagementRating: integer("engagement_rating").notNull(),
  materialsRating: integer("materials_rating").notNull().default(0),
  organizationRating: integer("organization_rating").notNull().default(0),
  feedbackRating: integer("feedback_rating").notNull().default(0),
  paceRating: integer("pace_rating").notNull().default(0),
  supportRating: integer("support_rating").notNull().default(0),
  fairnessRating: integer("fairness_rating").notNull().default(0),
  relevanceRating: integer("relevance_rating").notNull().default(0),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const usersRelations = relations(users, ({ one, many }) => ({
  course: one(courses, {
    fields: [users.courseId],
    references: [courses.id],
  }),
  givenEvaluations: many(evaluations, { relationName: 'student' }),
  receivedEvaluations: many(evaluations, { relationName: 'lecturer' }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  lecturers: many(users),
  evaluations: many(evaluations),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  student: one(users, {
    fields: [evaluations.studentId],
    references: [users.id],
    relationName: 'student'
  }),
  lecturer: one(users, {
    fields: [evaluations.lecturerId],
    references: [users.id],
    relationName: 'lecturer'
  }),
  course: one(courses, {
    fields: [evaluations.courseId],
    references: [courses.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, emailVerified: true, verificationToken: true, resetPasswordToken: true, resetPasswordExpiry: true });
export const insertEvaluationSchema = createInsertSchema(evaluations).omit({ id: true, createdAt: true, studentId: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Course = typeof courses.$inferSelect;
export type User = typeof users.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UserWithoutPassword = Omit<User, 'password'>;

// Requests
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof loginSchema>;

export const registerSchema = insertUserSchema.extend({
  courseId: z.coerce.number().optional(),
  email: z.string().email("Please enter a valid email address"),
});
export type RegisterRequest = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateEvaluationRequest = z.infer<typeof insertEvaluationSchema>;

export interface EvaluationSummary {
  averageOverall: number;
  averageClarity: number;
  averageEngagement: number;
  averageMaterials: number;
  averageOrganization: number;
  averageFeedback: number;
  averagePace: number;
  averageSupport: number;
  averageFairness: number;
  averageRelevance: number;
  ratingDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  totalEvaluations: number;
}
