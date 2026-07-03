import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from './auth.js';
import { usersRouter } from './users.js';
import { conversationsRouter } from './conversations.js';
import { signSamplesRouter } from './sign-samples.js';
import { translateRouter } from './translate.js';
import { callsRouter } from './calls.js';
import { emergencyRouter } from './emergency.js';
import { learningRouter } from './learning.js';
import { grammarRouter } from './grammar.js';
import { adminRouter } from './admin.js';
import { documentsRouter } from './documents.js';

export const apiRouter: Router = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/emergency', emergencyRouter);
apiRouter.use('/translate', translateRouter);
apiRouter.use('/grammar', grammarRouter);
apiRouter.use('/sign-samples', signSamplesRouter);
apiRouter.use('/calls', callsRouter);
apiRouter.use('/conversations', conversationsRouter);
apiRouter.use('/learning', learningRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/documents', documentsRouter);
