import { serial, text, pgTable, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';

export const analysisRecordsTable = pgTable('analysis_records', {
  id: serial('id').primaryKey(),
  analysisId: text('analysis_id').notNull().unique(),
  jobDescription: text('job_description').notNull(),
  keywords: jsonb('keywords'), // JSON array of strings, nullable
  resumeFileName: text('resume_file_name'), // Nullable for storing original file name
  atsScore: numeric('ats_score', { precision: 5, scale: 2 }).notNull(), // Score out of 100 with 2 decimal places
  analysisResult: jsonb('analysis_result').notNull(), // Full JSON analysis result
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type AnalysisRecord = typeof analysisRecordsTable.$inferSelect; // For SELECT operations
export type NewAnalysisRecord = typeof analysisRecordsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { analysisRecords: analysisRecordsTable };