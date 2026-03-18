import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import {
  users,
  courses,
  evaluations,
  type User,
  type InsertUser,
  type Course,
  type Evaluation,
  type EvaluationSummary
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getLecturers(): Promise<(User & { courseCode?: string, courseName?: string })[]>;
  getEvaluationsByStudent(studentId: number): Promise<Evaluation[]>;
  getEvaluationsByLecturer(lecturerId: number): Promise<Evaluation[]>;
  createEvaluation(evaluation: Omit<Evaluation, 'id' | 'createdAt'>): Promise<Evaluation>;
  getLecturerSummary(lecturerId: number): Promise<EvaluationSummary>;
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
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.resetPasswordToken, token),
          gt(users.resetPasswordExpiry, new Date())
        )
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

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getLecturers(): Promise<(User & { courseCode?: string, courseName?: string })[]> {
    const result = await db.select({
      user: users,
      course: courses,
    }).from(users).leftJoin(courses, eq(users.courseId, courses.id)).where(eq(users.role, 'lecturer'));
    
    return result.map(r => ({
      ...r.user,
      courseCode: r.course?.code,
      courseName: r.course?.name,
    }));
  }

  async getEvaluationsByStudent(studentId: number): Promise<Evaluation[]> {
    return await db.select().from(evaluations).where(eq(evaluations.studentId, studentId));
  }

  async getEvaluationsByLecturer(lecturerId: number): Promise<Evaluation[]> {
    return await db.select().from(evaluations).where(eq(evaluations.lecturerId, lecturerId));
  }

  async createEvaluation(evalData: Omit<Evaluation, 'id' | 'createdAt'>): Promise<Evaluation> {
    const [evaluation] = await db.insert(evaluations).values(evalData).returning();
    return evaluation;
  }

  async getLecturerSummary(lecturerId: number): Promise<EvaluationSummary> {
    const evals = await this.getEvaluationsByLecturer(lecturerId);
    
    if (evals.length === 0) {
      return {
        averageOverall: 0,
        averageClarity: 0,
        averageEngagement: 0,
        averageMaterials: 0,
        averageOrganization: 0,
        averageFeedback: 0,
        averagePace: 0,
        averageSupport: 0,
        averageFairness: 0,
        averageRelevance: 0,
        ratingDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
        totalEvaluations: 0,
      };
    }

    let sumOverall = 0, sumClarity = 0, sumEngagement = 0, sumMaterials = 0;
    let sumOrganization = 0, sumFeedback = 0, sumPace = 0, sumSupport = 0;
    let sumFairness = 0, sumRelevance = 0;
    const dist = { excellent: 0, good: 0, average: 0, poor: 0 };

    for (const e of evals) {
      sumOverall += e.overallRating;
      sumClarity += e.clarityRating;
      sumEngagement += e.engagementRating;
      sumMaterials += e.materialsRating;
      sumOrganization += e.organizationRating;
      sumFeedback += e.feedbackRating;
      sumPace += e.paceRating;
      sumSupport += e.supportRating;
      sumFairness += e.fairnessRating;
      sumRelevance += e.relevanceRating;

      if (e.overallRating === 5) dist.excellent++;
      else if (e.overallRating === 4) dist.good++;
      else if (e.overallRating === 3) dist.average++;
      else dist.poor++;
    }

    const count = evals.length;
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
}

export const storage = new DatabaseStorage();
