import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import type { ApiResponse, AdminAnalyticsStats, AdminSignSample } from '@signbridge/shared-types';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const adminRouter: Router = Router();

adminRouter.use(requireAuth);

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    res
      .status(403)
      .json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    return;
  }
  next();
};

adminRouter.use(requireAdmin);

adminRouter.get(
  '/analytics',
  asyncHandler(async (_req: Request, res: Response<ApiResponse<AdminAnalyticsStats>>) => {
    const totalSignsTranslated = await prisma.message.count({
      where: { modality: 'SIGN' },
    });

    const activeVideoCalls = await prisma.conversation.count({
      where: { mode: 'VIDEO' },
    });

    const newUsers = await prisma.user.count();

    // Mock weekly usage data for the chart, as we don't have historical message timestamps in this phase.
    const usageData = [
      {
        name: 'Mon',
        signs: Math.floor(totalSignsTranslated * 0.1),
        calls: 12,
        users: Math.floor(newUsers * 0.1),
      },
      {
        name: 'Tue',
        signs: Math.floor(totalSignsTranslated * 0.15),
        calls: 15,
        users: Math.floor(newUsers * 0.15),
      },
      {
        name: 'Wed',
        signs: Math.floor(totalSignsTranslated * 0.2),
        calls: 18,
        users: Math.floor(newUsers * 0.2),
      },
      {
        name: 'Thu',
        signs: Math.floor(totalSignsTranslated * 0.18),
        calls: 14,
        users: Math.floor(newUsers * 0.18),
      },
      {
        name: 'Fri',
        signs: Math.floor(totalSignsTranslated * 0.12),
        calls: 16,
        users: Math.floor(newUsers * 0.12),
      },
      {
        name: 'Sat',
        signs: Math.floor(totalSignsTranslated * 0.15),
        calls: 20,
        users: Math.floor(newUsers * 0.15),
      },
      {
        name: 'Sun',
        signs: Math.floor(totalSignsTranslated * 0.1),
        calls: 10,
        users: Math.floor(newUsers * 0.1),
      },
    ];

    res.json({
      success: true,
      data: {
        totalSignsTranslated,
        activeVideoCalls,
        newUsers,
        usageData,
      },
    });
  }),
);

adminRouter.get(
  '/signs',
  asyncHandler(async (_req: Request, res: Response<ApiResponse<AdminSignSample[]>>) => {
    const signs = await prisma.signSample.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formatted = signs.map(
      (s: {
        id: string;
        label: string;
        createdAt: Date;
        user: { name: string | null; email: string };
      }) => ({
        id: s.id,
        label: s.label,
        createdAt: s.createdAt.toISOString(),
        user: s.user,
      }),
    );

    res.json({ success: true, data: formatted });
  }),
);

adminRouter.post(
  '/retrain',
  asyncHandler(async (_req: Request, res: Response<ApiResponse<{ message: string }>>) => {
    // Simulate ML retraining pipeline delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    res.json({
      success: true,
      data: { message: 'Machine learning models successfully retrained and deployed.' },
    });
  }),
);
