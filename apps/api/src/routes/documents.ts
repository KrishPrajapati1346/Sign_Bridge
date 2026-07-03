import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../lib/prisma.js';

export const documentsRouter: Router = Router();

documentsRouter.use(requireAuth);

documentsRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const doc = await prisma.translatedDocument.create({
      data: {
        userId: req.user!.id,
        title,
        content,
      },
    });

    res.json({ success: true, data: doc });
  })
);

documentsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Retrieve documents from the last 7 days
    const docs = await prisma.translatedDocument.findMany({
      where: {
        userId: req.user!.id,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ success: true, data: docs });
  })
);
