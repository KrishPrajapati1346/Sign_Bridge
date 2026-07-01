import { Router, type Request, type Response } from 'express';
import type {
  ApiResponse,
  LessonProgress as LessonProgressDTO,
  SignMastery as SignMasteryDTO,
} from '@signbridge/shared-types';
import type { LessonProgress, SignMastery } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { updateLessonSchema, practiceAttemptSchema } from '../validation/learning.schema.js';

function toLessonProgress(p: LessonProgress): LessonProgressDTO {
  return { lessonId: p.lessonId, status: p.status, score: p.score };
}
function toMastery(m: SignMastery): SignMasteryDTO {
  return { label: m.label, attemptCount: m.attemptCount, correctCount: m.correctCount };
}

export const learningRouter: Router = Router();

learningRouter.use(requireAuth);

learningRouter.get(
  '/progress',
  asyncHandler(
    async (
      req: Request,
      res: Response<ApiResponse<{ xp: number; streakDays: number; lessons: LessonProgressDTO[]; mastery: SignMasteryDTO[] }>>,
    ) => {
      const userId = req.user!.id;
      const [user, lessons, mastery] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { xp: true, streakDays: true } }),
        prisma.lessonProgress.findMany({ where: { userId } }),
        prisma.signMastery.findMany({ where: { userId } }),
      ]);
      res.json({
        success: true,
        data: { 
          xp: user?.xp ?? 0, 
          streakDays: user?.streakDays ?? 0, 
          lessons: lessons.map(toLessonProgress), 
          mastery: mastery.map(toMastery) 
        },
      });
    },
  ),
);

learningRouter.patch(
  '/lessons/:lessonId',
  validateBody(updateLessonSchema),
  asyncHandler(
    async (
      req: Request<{ lessonId: string }>,
      res: Response<ApiResponse<{ progress: LessonProgressDTO }>>,
    ) => {
      const userId = req.user!.id;
      const { status, score } = req.body;
      const progress = await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: req.params.lessonId } },
        create: { userId, lessonId: req.params.lessonId, status, score: score ?? null },
        update: { status, ...(score === undefined ? {} : { score }) },
      });
      res.json({ success: true, data: { progress: toLessonProgress(progress) } });
    },
  ),
);

learningRouter.post(
  '/practice',
  validateBody(practiceAttemptSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ mastery: SignMasteryDTO }>>) => {
    const userId = req.user!.id;
    const { label, correct } = req.body;
    const mastery = await prisma.signMastery.upsert({
      where: { userId_label: { userId, label } },
      create: { userId, label, attemptCount: 1, correctCount: correct ? 1 : 0 },
      update: {
        attemptCount: { increment: 1 },
        ...(correct ? { correctCount: { increment: 1 } } : {}),
      },
    });
    res.json({ success: true, data: { mastery: toMastery(mastery) } });
  }),
);

learningRouter.post(
  '/xp',
  asyncHandler(
    async (
      req: Request,
      res: Response<ApiResponse<{ xp: number; streakDays: number }>>,
    ) => {
      const userId = req.user!.id;
      const { amount } = req.body;
      const xpToAdd = typeof amount === 'number' ? amount : 10;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      const now = new Date();
      const lastActive = user.lastActiveAt;
      let newStreak = user.streakDays;

      if (!lastActive) {
        newStreak = 1;
      } else {
        const lastDate = new Date(lastActive.getTime());
        lastDate.setHours(0, 0, 0, 0);
        const today = new Date(now.getTime());
        today.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
        // If diffDays === 0, they already played today, streak remains the same.
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpToAdd },
          streakDays: newStreak,
          lastActiveAt: now,
        },
      });

      res.json({
        success: true,
        data: {
          xp: updatedUser.xp,
          streakDays: updatedUser.streakDays,
        },
      });
    },
  ),
);
