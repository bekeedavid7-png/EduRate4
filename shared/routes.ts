import { z } from 'zod';
import { insertEvaluationSchema, courses, users, evaluations, evaluationPeriods, loginSchema, registerSchema, insertEvaluationPeriodSchema, updateEvaluationPeriodSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const userResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  role: z.string(),
  name: z.string(),
  email: z.string().optional(),
  department: z.string().nullable(),
  school: z.string().nullable().optional(),
  matriculationNumber: z.string().nullable().optional(),
  courseId: z.number().nullable(),
});

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: loginSchema,
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: registerSchema,
      responses: {
        201: userResponseSchema,
        400: errorSchemas.validation,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  courses: {
    list: {
      method: 'GET' as const,
      path: '/api/courses' as const,
      responses: {
        200: z.array(z.custom<typeof courses.$inferSelect>()),
      },
    },
  },
  lecturers: {
    list: {
      method: 'GET' as const,
      path: '/api/lecturers' as const,
      responses: {
        // Return lecturers with their course info
        200: z.array(z.object({
          id: z.number(),
          name: z.string(),
          department: z.string().nullable(),
          courseId: z.number().nullable(),
          courseCode: z.string().optional(),
          courseName: z.string().optional(),
        })),
      },
    },
  },
  evaluations: {
    list: {
      method: 'GET' as const,
      path: '/api/evaluations' as const,
      responses: {
        200: z.array(z.custom<typeof evaluations.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/evaluations' as const,
      input: insertEvaluationSchema,
      responses: {
        201: z.custom<typeof evaluations.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  evaluationPeriods: {
    active: {
      method: 'GET' as const,
      path: '/api/evaluation-periods/active' as const,
      responses: {
        200: z.custom<typeof evaluationPeriods.$inferSelect>().nullable(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  admin: {
    evaluationPeriods: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/evaluation-periods' as const,
        responses: {
          200: z.array(z.custom<typeof evaluationPeriods.$inferSelect>()),
          403: errorSchemas.unauthorized,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/evaluation-periods' as const,
        input: insertEvaluationPeriodSchema,
        responses: {
          201: z.custom<typeof evaluationPeriods.$inferSelect>(),
          400: errorSchemas.validation,
          403: errorSchemas.unauthorized,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/evaluation-periods/:id' as const,
        input: updateEvaluationPeriodSchema,
        responses: {
          200: z.custom<typeof evaluationPeriods.$inferSelect>(),
          400: errorSchemas.validation,
          403: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/evaluation-periods/:id' as const,
        responses: {
          200: z.object({ message: z.string() }),
          403: errorSchemas.unauthorized,
        },
      },
    },
  },
  dashboard: {
    lecturerSummary: {
      method: 'GET' as const,
      path: '/api/lecturer/summary' as const,
      responses: {
        200: z.object({
          averageOverall: z.number(),
          averageClarity: z.number(),
          averageEngagement: z.number(),
          averageMaterials: z.number(),
          averageOrganization: z.number(),
          averageFeedback: z.number(),
          averagePace: z.number(),
          averageSupport: z.number(),
          averageFairness: z.number(),
          averageRelevance: z.number(),
                    medianOverall: z.number(),
                    modeOverall: z.number(),
          ratingDistribution: z.object({
            excellent: z.number(),
            good: z.number(),
            average: z.number(),
            poor: z.number(),
          }),
          totalEvaluations: z.number(),
          course: z.custom<typeof courses.$inferSelect>().optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
