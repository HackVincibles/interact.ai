import { Request, Response } from 'express';
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from 'zod';
import Interview from '../models/Interview';
import Feedback from '../models/Feedback';

const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z.object({
    communicationSkills: z.number(),
    technicalKnowledge: z.number(),
    problemSolving: z.number(),
    culturalFit: z.number(),
    confidenceClarity: z.number(),
  }),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
});

export const createFeedback = async (req: any, res: Response) => {
  const { interviewId, userId, transcript, feedbackId } = req.body;

  try {
    const formattedTranscript = transcript
      .map((sentence: any) => `- ${sentence.role}: ${sentence.content}\n`)
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: feedbackSchema,
      prompt: `
        Analyze this mock interview. Score from 0 to 100.
        Transcript:
        ${formattedTranscript}
      `,
    });

    const feedbackData = {
      interviewId,
      userId,
      ...object,
    };

    let feedback;
    if (feedbackId) {
      feedback = await Feedback.findByIdAndUpdate(feedbackId, feedbackData, { new: true, upsert: true });
    } else {
      feedback = await Feedback.create(feedbackData);
    }

    res.status(200).json({ success: true, data: feedback });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInterviewsByUser = async (req: any, res: Response) => {
  try {
    const interviews = await Interview.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: interviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInterviewById = async (req: Request, res: Response) => {
  try {
    const interview = await Interview.findById(req.params.id);
    res.status(200).json({ success: true, data: interview });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeedbackByInterviewId = async (req: Request, res: Response) => {
  try {
    const feedback = await Feedback.findOne({ interviewId: req.params.interviewId });
    res.status(200).json({ success: true, data: feedback });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
