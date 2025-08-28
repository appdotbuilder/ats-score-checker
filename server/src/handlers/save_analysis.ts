import { db } from '../db';
import { analysisRecordsTable } from '../db/schema';
import { type CreateAnalysisRecordInput, type AnalysisRecord } from '../schema';

export const saveAnalysis = async (input: CreateAnalysisRecordInput): Promise<AnalysisRecord> => {
  try {
    // Insert analysis record
    const result = await db.insert(analysisRecordsTable)
      .values({
        analysisId: input.analysisId,
        jobDescription: input.jobDescription,
        keywords: input.keywords,
        resumeFileName: input.resumeFileName,
        atsScore: input.atsScore.toString(), // Convert number to string for numeric column
        analysisResult: input.analysisResult
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and ensure proper typing
    const analysisRecord = result[0];
    return {
      ...analysisRecord,
      atsScore: parseFloat(analysisRecord.atsScore), // Convert string back to number
      keywords: analysisRecord.keywords as string[] | null, // Type assertion for JSONB field
      analysisResult: analysisRecord.analysisResult as Record<string, any> // Type assertion for JSONB field
    };
  } catch (error) {
    console.error('Analysis save failed:', error);
    throw error;
  }
};