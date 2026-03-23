import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import {
  users, courses, evaluations, lecturerCourses, evaluationPeriods, evaluationCriteria,
  type User, type InsertUser, type Course, type Evaluation, type EvaluationSummary, type EvaluationPeriod, type EvaluationCriterion
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: { department: string; code: string; name: string }): Promise<Course>;
  deleteCourse(id: number): Promise<void>;
  getLecturers(): Promise<(User & { courseCode?: string, courseName?: string })[]>;
  getLecturerCoursesDetails(lecturerId: number): Promise<Course[]>;
  setLecturerCourses(lecturerId: number, courseIds: number[]): Promise<void>;
  getEvaluationsByStudent(studentId: number): Promise<Evaluation[]>;
  getEvaluationsByLecturer(lecturerId: number): Promise<Evaluation[]>;
  getAllEvaluations(): Promise<Evaluation[]>;
  createEvaluation(evaluation: Omit<Evaluation, 'id' | 'createdAt'>): Promise<Evaluation>;
  deleteEvaluation(id: number): Promise<void>;
  getLecturerSummary(lecturerId: number, courseId?: number): Promise<EvaluationSummary>;
  getEvaluationPeriods(): Promise<EvaluationPeriod[]>;
  getActiveEvaluationPeriod(): Promise<EvaluationPeriod | undefined>;
  createEvaluationPeriod(period: Omit<EvaluationPeriod, 'id' | 'createdAt'>): Promise<EvaluationPeriod>;
  updateEvaluationPeriod(id: number, data: Partial<Omit<EvaluationPeriod, 'id' | 'createdAt'>>): Promise<EvaluationPeriod | undefined>;
  deleteEvaluationPeriod(id: number): Promise<void>;
  getEvaluationCriteria(): Promise<EvaluationCriterion[]>;
  createEvaluationCriterion(data: Omit<EvaluationCriterion, 'id' | 'createdAt'>): Promise<EvaluationCriterion>;
  updateEvaluationCriterion(id: number, data: Partial<Omit<EvaluationCriterion, 'id' | 'createdAt'>>): Promise<EvaluationCriterion | undefined>;
  deleteEvaluationCriterion(id: number): Promise<void>;
  hasStudentEvaluatedLecturerInPeriod(studentId: number, lecturerId: number, courseId: number, periodId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.resetPasswordToken, token), gt(users.resetPasswordExpiry, new Date()))
    );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(lecturerCourses).where(eq(lecturerCourses.lecturerId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: { department: string; code: string; name: string }): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(lecturerCourses).where(eq(lecturerCourses.courseId, id));
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getLecturers(): Promise<(User & { courseCode?: string, courseName?: string })[]> {
    const result = await db.select({ user: users, course: courses })
      .from(users)
      .innerJoin(lecturerCourses, eq(users.id, lecturerCourses.lecturerId))
      .innerJoin(courses, eq(lecturerCourses.courseId, courses.id))
      .where(eq(users.role, 'lecturer'));

    return result.map(r => ({
      ...r.user,
      courseId: r.course.id,
      courseCode: r.course.code,
      courseName: r.course.name,
    }));
  }

  async getLecturerCoursesDetails(lecturerId: number): Promise<Course[]> {
    const result = await db.select({ course: courses })
      .from(lecturerCourses)
      .innerJoin(courses, eq(lecturerCourses.courseId, courses.id))
      .where(eq(lecturerCourses.lecturerId, lecturerId));
    return result.map(r => r.course);
  }

  async setLecturerCourses(lecturerId: number, courseIds: number[]): Promise<void> {
    await db.delete(lecturerCourses).where(eq(lecturerCourses.lecturerId, lecturerId));
    if (courseIds.length > 0) {
      await db.insert(lecturerCourses).values(courseIds.map(courseId => ({ lecturerId, courseId })));
    }
  }

  async getEvaluationsByStudent(studentId: number): Promise<Evaluation[]> {
    return await db.select().from(evaluations).where(eq(evaluations.studentId, studentId));
  }

  async getEvaluationsByLecturer(lecturerId: number): Promise<Evaluation[]> {
    return await db.select().from(evaluations).where(eq(evaluations.lecturerId, lecturerId));
  }

  async getAllEvaluations(): Promise<Evaluation[]> {
    return await db.select().from(evaluations);
  }

  async createEvaluation(evalData: Omit<Evaluation, 'id' | 'createdAt'>): Promise<Evaluation> {
    const [evaluation] = await db.insert(evaluations).values(evalData).returning();
    return evaluation;
  }

  async deleteEvaluation(id: number): Promise<void> {
    await db.delete(evaluations).where(eq(evaluations.id, id));
  }

  async getLecturerSummary(lecturerId: number, courseId?: number): Promise<EvaluationSummary> {
    let evals = await this.getEvaluationsByLecturer(lecturerId);
    if (courseId) {
      evals = evals.filter(e => e.courseId === courseId);
    }

    if (evals.length === 0) {
      return {
        averageOverall: 0, averageClarity: 0, averageEngagement: 0, averageMaterials: 0,
        averageOrganization: 0, averageFeedback: 0, averagePace: 0, averageSupport: 0,
        averageFairness: 0, averageRelevance: 0,
        medianOverall: 0, modeOverall: 0,
        ratingDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
        totalEvaluations: 0,
      };
    }

    let sumOverall = 0, sumClarity = 0, sumEngagement = 0, sumMaterials = 0;
    let sumOrganization = 0, sumFeedback = 0, sumPace = 0, sumSupport = 0;
    let sumFairness = 0, sumRelevance = 0;
    const dist = { excellent: 0, good: 0, average: 0, poor: 0 };
    const overallRatings: number[] = [];

    for (const e of evals) {
      sumOverall += e.overallRating; sumClarity += e.clarityRating;
      sumEngagement += e.engagementRating; sumMaterials += e.materialsRating;
      sumOrganization += e.organizationRating; sumFeedback += e.feedbackRating;
      sumPace += e.paceRating; sumSupport += e.supportRating;
      sumFairness += e.fairnessRating; sumRelevance += e.relevanceRating;
      overallRatings.push(e.overallRating);
      if (e.overallRating === 5) dist.excellent++;
      else if (e.overallRating === 4) dist.good++;
      else if (e.overallRating === 3) dist.average++;
      else dist.poor++;
    }

    const count = evals.length;

    // Median
    const sorted = [...overallRatings].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianOverall = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;

    // Mode
    const freq: Record<number, number> = {};
    for (const r of overallRatings) freq[r] = (freq[r] || 0) + 1;
    const modeOverall = parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);

    return {
      averageOverall: sumOverall / count, averageClarity: sumClarity / count,
      averageEngagement: sumEngagement / count, averageMaterials: sumMaterials / count,
      averageOrganization: sumOrganization / count, averageFeedback: sumFeedback / count,
      averagePace: sumPace / count, averageSupport: sumSupport / count,
      averageFairness: sumFairness / count, averageRelevance: sumRelevance / count,
      medianOverall, modeOverall,
      ratingDistribution: dist, totalEvaluations: count,
    };
  }

  async getEvaluationPeriods(): Promise<EvaluationPeriod[]> {
    return await db.select().from(evaluationPeriods);
  }

  async getActiveEvaluationPeriod(): Promise<EvaluationPeriod | undefined> {
    const now = new Date();
    const periods = await db.select().from(evaluationPeriods).where(eq(evaluationPeriods.isActive, true));
    return periods.find((p) => p.startDate <= now && p.endDate >= now);
  }

  async createEvaluationPeriod(period: Omit<EvaluationPeriod, 'id' | 'createdAt'>): Promise<EvaluationPeriod> {
    if (period.isActive) {
      await db.update(evaluationPeriods).set({ isActive: false });
    }
    const [created] = await db.insert(evaluationPeriods).values(period).returning();
    return created;
  }

  async updateEvaluationPeriod(id: number, data: Partial<Omit<EvaluationPeriod, 'id' | 'createdAt'>>): Promise<EvaluationPeriod | undefined> {
    if (data.isActive) {
      await db.update(evaluationPeriods).set({ isActive: false });
    }
    const [updated] = await db.update(evaluationPeriods).set(data).where(eq(evaluationPeriods.id, id)).returning();
    return updated;
  }

  async deleteEvaluationPeriod(id: number): Promise<void> {
    await db.delete(evaluationPeriods).where(eq(evaluationPeriods.id, id));
  }

  async getEvaluationCriteria(): Promise<EvaluationCriterion[]> {
    return await db.select().from(evaluationCriteria).orderBy(evaluationCriteria.sortOrder);
  }

  async createEvaluationCriterion(data: Omit<EvaluationCriterion, 'id' | 'createdAt'>): Promise<EvaluationCriterion> {
    const [created] = await db.insert(evaluationCriteria).values(data).returning();
    return created;
  }

  async updateEvaluationCriterion(id: number, data: Partial<Omit<EvaluationCriterion, 'id' | 'createdAt'>>): Promise<EvaluationCriterion | undefined> {
    const [updated] = await db.update(evaluationCriteria).set(data).where(eq(evaluationCriteria.id, id)).returning();
    return updated;
  }

  async deleteEvaluationCriterion(id: number): Promise<void> {
    await db.delete(evaluationCriteria).where(eq(evaluationCriteria.id, id));
  }

  async hasStudentEvaluatedLecturerInPeriod(studentId: number, lecturerId: number, courseId: number, periodId: number): Promise<boolean> {
    // We store evaluations without a direct periodId. Instead we check:
    // if the student already has an evaluation for this lecturer+course, prevent another submission.
    // (The evaluation period prevents temporal re-submission by its date window.)
    const existing = await db.select().from(evaluations)
      .where(and(
        eq(evaluations.studentId, studentId),
        eq(evaluations.lecturerId, lecturerId),
        eq(evaluations.courseId, courseId),
      ));
    return existing.length > 0;
  }
}

export const storage = new DatabaseStorage();