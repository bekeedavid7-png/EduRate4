import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import {
  users, courses, evaluations, lecturerCourses,
  type User, type InsertUser, type Course, type Evaluation, type EvaluationSummary
} from "@shared/schema";

export interface CourseSummary {
  course: Course;
  totalEvaluations: number;
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
  comments: string[];
}

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
  getLecturers(): Promise<(User & { courseCode?: string, courseName?: string, courseId?: number })[]>;
  getLecturerCoursesDetails(lecturerId: number): Promise<Course[]>;
  setLecturerCourses(lecturerId: number, courseIds: number[]): Promise<void>;
  getEvaluationsByStudent(studentId: number): Promise<Evaluation[]>;
  getEvaluationsByLecturer(lecturerId: number): Promise<Evaluation[]>;
  getAllEvaluations(): Promise<Evaluation[]>;
  createEvaluation(evaluation: Omit<Evaluation, 'id' | 'createdAt'>): Promise<Evaluation>;
  deleteEvaluation(id: number): Promise<void>;
  getLecturerSummary(lecturerId: number): Promise<EvaluationSummary & { courseBreakdowns: CourseSummary[] }>;
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

  async getLecturers(): Promise<(User & { courseCode?: string, courseName?: string, courseId?: number })[]> {
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

  // Helper to compute summary stats for a list of evaluations
  private computeSummary(evals: Evaluation[]) {
    const count = evals.length;
    if (count === 0) return null;

    let sumOverall = 0, sumClarity = 0, sumEngagement = 0, sumMaterials = 0;
    let sumOrganization = 0, sumFeedback = 0, sumPace = 0, sumSupport = 0;
    let sumFairness = 0, sumRelevance = 0;
    const dist = { excellent: 0, good: 0, average: 0, poor: 0 };

    for (const e of evals) {
      sumOverall += e.overallRating; sumClarity += e.clarityRating;
      sumEngagement += e.engagementRating; sumMaterials += e.materialsRating;
      sumOrganization += e.organizationRating; sumFeedback += e.feedbackRating;
      sumPace += e.paceRating; sumSupport += e.supportRating;
      sumFairness += e.fairnessRating; sumRelevance += e.relevanceRating;
      if (e.overallRating === 5) dist.excellent++;
      else if (e.overallRating === 4) dist.good++;
      else if (e.overallRating === 3) dist.average++;
      else dist.poor++;
    }

    return {
      averageOverall: sumOverall / count,
      averageClarity: sumClarity / count,
      averageEngagement: sumEngagement / count,
      averageMaterials: sumMaterials / count,
      averageOrganization: sumOrganization / count,
      averageFeedback: sumFeedback / count,
      averagePace: sumPace / count,
      averageSupport: sumSupport / count,
      averageFairness: sumFairness / count,
      averageRelevance: sumRelevance / count,
      ratingDistribution: dist,
      totalEvaluations: count,
    };
  }

  async getLecturerSummary(lecturerId: number): Promise<EvaluationSummary & { courseBreakdowns: CourseSummary[] }> {
    const [allEvals, assignedCourses] = await Promise.all([
      this.getEvaluationsByLecturer(lecturerId),
      this.getLecturerCoursesDetails(lecturerId),
    ]);

    const empty: EvaluationSummary & { courseBreakdowns: CourseSummary[] } = {
      averageOverall: 0, averageClarity: 0, averageEngagement: 0, averageMaterials: 0,
      averageOrganization: 0, averageFeedback: 0, averagePace: 0, averageSupport: 0,
      averageFairness: 0, averageRelevance: 0,
      ratingDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
      totalEvaluations: 0,
      courseBreakdowns: assignedCourses.map(course => ({
        course,
        totalEvaluations: 0,
        averageOverall: 0, averageClarity: 0, averageEngagement: 0, averageMaterials: 0,
        averageOrganization: 0, averageFeedback: 0, averagePace: 0, averageSupport: 0,
        averageFairness: 0, averageRelevance: 0,
        comments: [],
      })),
    };

    if (allEvals.length === 0) return empty;

    // Overall summary
    const overall = this.computeSummary(allEvals)!;

    // Per-course breakdown — one entry per assigned course (even if no evals yet)
    const courseBreakdowns: CourseSummary[] = assignedCourses.map(course => {
      const courseEvals = allEvals.filter(e => e.courseId === course.id);
      const stats = this.computeSummary(courseEvals);

      return {
        course,
        totalEvaluations: courseEvals.length,
        averageOverall: stats?.averageOverall ?? 0,
        averageClarity: stats?.averageClarity ?? 0,
        averageEngagement: stats?.averageEngagement ?? 0,
        averageMaterials: stats?.averageMaterials ?? 0,
        averageOrganization: stats?.averageOrganization ?? 0,
        averageFeedback: stats?.averageFeedback ?? 0,
        averagePace: stats?.averagePace ?? 0,
        averageSupport: stats?.averageSupport ?? 0,
        averageFairness: stats?.averageFairness ?? 0,
        averageRelevance: stats?.averageRelevance ?? 0,
        comments: courseEvals.filter(e => e.comments).map(e => e.comments as string),
      };
    });

    return { ...overall, courseBreakdowns };
  }
}

export const storage = new DatabaseStorage();