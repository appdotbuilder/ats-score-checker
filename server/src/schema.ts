import { z } from 'zod';

// ATS Analysis Input Schema
export const atsAnalysisInputSchema = z.object({
  jobDescription: z.string().min(1, "Job description is required"),
  keywords: z.array(z.string()).optional(),
  resumeFile: z.string(), // Base64 encoded PDF or file path
});

export type ATSAnalysisInput = z.infer<typeof atsAnalysisInputSchema>;

// Section Analysis Schema
export const sectionAnalysisSchema = z.object({
  contactInfo: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    suggestions: z.array(z.string()),
  }),
  summary: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    suggestions: z.array(z.string()),
  }),
  experience: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    suggestions: z.array(z.string()),
  }),
  education: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    suggestions: z.array(z.string()),
  }),
  skills: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    suggestions: z.array(z.string()),
  }),
});

export type SectionAnalysis = z.infer<typeof sectionAnalysisSchema>;

// Improvement Categories Schema
export const improvementCategoriesSchema = z.object({
  spelling: z.object({
    score: z.number().min(0).max(100),
    issues: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  grammar: z.object({
    score: z.number().min(0).max(100),
    issues: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  quantifiableAchievements: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    suggestions: z.array(z.string()),
  }),
  readability: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    suggestions: z.array(z.string()),
  }),
  formatting: z.object({
    score: z.number().min(0).max(100),
    issues: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
});

export type ImprovementCategories = z.infer<typeof improvementCategoriesSchema>;

// ATS Analysis Result Schema
export const atsAnalysisResultSchema = z.object({
  atsScore: z.number().min(0).max(100),
  improvements: improvementCategoriesSchema,
  sectionAnalysis: sectionAnalysisSchema,
  overallSuggestions: z.array(z.string()),
  keywordMatches: z.object({
    matched: z.array(z.string()),
    missing: z.array(z.string()),
    matchPercentage: z.number().min(0).max(100),
  }),
  analysisId: z.string(),
  createdAt: z.coerce.date(),
});

export type ATSAnalysisResult = z.infer<typeof atsAnalysisResultSchema>;

// Database Schema for storing analysis results
export const analysisRecordSchema = z.object({
  id: z.number(),
  analysisId: z.string(),
  jobDescription: z.string(),
  keywords: z.array(z.string()).nullable(),
  resumeFileName: z.string().nullable(),
  atsScore: z.number(),
  analysisResult: z.record(z.any()), // JSON object storing the full analysis
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type AnalysisRecord = z.infer<typeof analysisRecordSchema>;

// Input schema for creating analysis records
export const createAnalysisRecordInputSchema = z.object({
  analysisId: z.string(),
  jobDescription: z.string(),
  keywords: z.array(z.string()).nullable(),
  resumeFileName: z.string().nullable(),
  atsScore: z.number(),
  analysisResult: z.record(z.any()),
});

export type CreateAnalysisRecordInput = z.infer<typeof createAnalysisRecordInputSchema>;