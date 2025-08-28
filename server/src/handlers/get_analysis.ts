import { db } from '../db';
import { analysisRecordsTable } from '../db/schema';
import { type AnalysisRecord } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getAnalysis(analysisId: string): Promise<AnalysisRecord | null> {
  try {
    const results = await db.select()
      .from(analysisRecordsTable)
      .where(eq(analysisRecordsTable.analysisId, analysisId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const record = results[0];
    
    // Convert numeric fields and properly type JSON fields
    return {
      ...record,
      atsScore: parseFloat(record.atsScore), // Convert string back to number
      keywords: record.keywords as string[] | null, // Type assertion for JSON field
      analysisResult: record.analysisResult as Record<string, any> // Type assertion for JSON field
    };
  } catch (error) {
    console.error('Failed to get analysis:', error);
    throw error;
  }
}

export async function getAllAnalyses(limit?: number): Promise<AnalysisRecord[]> {
  try {
    // Build query with conditional limit
    const baseQuery = db.select()
      .from(analysisRecordsTable)
      .orderBy(desc(analysisRecordsTable.createdAt));

    // Execute query with or without limit
    const results = limit !== undefined 
      ? await baseQuery.limit(limit).execute()
      : await baseQuery.execute();

    // Convert numeric fields and properly type JSON fields for all records
    return results.map(record => ({
      ...record,
      atsScore: parseFloat(record.atsScore), // Convert string back to number
      keywords: record.keywords as string[] | null, // Type assertion for JSON field
      analysisResult: record.analysisResult as Record<string, any> // Type assertion for JSON field
    }));
  } catch (error) {
    console.error('Failed to get all analyses:', error);
    throw error;
  }
}