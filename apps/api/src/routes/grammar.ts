import { Router, type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import type { ApiResponse } from '@signbridge/shared-types';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const grammarRouter: Router = Router();

grammarRouter.use(requireAuth);

let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.warn('Could not initialize GoogleGenAI', e);
}

grammarRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ sentence: string }>>) => {
    const { words, language } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      res.json({ success: true, data: { sentence: '' } });
      return;
    }

    try {
      if (!ai) {
        res.json({ success: true, data: { sentence: words.join(' ') } });
        return;
      }

      const prompt = `You are a Sign Language grammar reconstructor. You receive a list of disjointed signed words in ${language || 'English'} and your job is to output a single, grammatically correct, natural sounding sentence.
      
      Words: ${words.join(', ')}
      
      Output ONLY the reconstructed sentence without any quotes or explanations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const sentence = response.text?.trim() ?? words.join(' ');
      res.json({ success: true, data: { sentence } });
    } catch (error) {
      console.error('Grammar AI Error:', error);
      res.json({ success: true, data: { sentence: words.join(' ') } });
    }
  }),
);
