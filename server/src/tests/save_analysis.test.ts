import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { analysisRecordsTable } from '../db/schema';
import { type CreateAnalysisRecordInput } from '../schema';
import { saveAnalysis } from '../handlers/save_analysis';
import { eq } from 'drizzle-orm';

// Test input with complete analysis result structure
const testAnalysisInput: CreateAnalysisRecordInput = {
  analysisId: 'analysis-123-test',
  jobDescription: 'Software Engineer position requiring React, Node.js, and TypeScript skills',
  keywords: ['React', 'Node.js', 'TypeScript', 'JavaScript'],
  resumeFileName: 'john_doe_resume.pdf',
  atsScore: 85.75,
  analysisResult: {
    atsScore: 85.75,
    improvements: {
      spelling: {
        score: 95,
        issues: ['JavaScript misspelled as "JavaScipt"'],
        suggestions: ['Review spelling of technical terms']
      },
      grammar: {
        score: 88,
        issues: ['Missing comma in skills section'],
        suggestions: ['Add proper punctuation']
      },
      quantifiableAchievements: {
        score: 70,
        feedback: 'More metrics needed',
        suggestions: ['Add percentage improvements', 'Include specific numbers']
      },
      readability: {
        score: 85,
        feedback: 'Good overall structure',
        suggestions: ['Use bullet points consistently']
      },
      formatting: {
        score: 90,
        issues: ['Inconsistent font sizes'],
        suggestions: ['Standardize formatting']
      }
    },
    sectionAnalysis: {
      contactInfo: {
        score: 100,
        feedback: 'Complete contact information',
        suggestions: []
      },
      summary: {
        score: 80,
        feedback: 'Good summary but could be more targeted',
        suggestions: ['Tailor to specific role']
      },
      experience: {
        score: 85,
        feedback: 'Relevant experience shown',
        suggestions: ['Add more quantifiable results']
      },
      education: {
        score: 90,
        feedback: 'Education section is complete',
        suggestions: ['Consider adding relevant coursework']
      },
      skills: {
        score: 75,
        feedback: 'Good technical skills listed',
        suggestions: ['Organize by proficiency level']
      }
    },
    overallSuggestions: [
      'Add more quantifiable achievements',
      'Improve keyword matching',
      'Enhance formatting consistency'
    ],
    keywordMatches: {
      matched: ['React', 'JavaScript'],
      missing: ['Node.js', 'TypeScript'],
      matchPercentage: 50.0
    }
  }
};

// Test input with minimal required fields
const minimalTestInput: CreateAnalysisRecordInput = {
  analysisId: 'analysis-minimal-test',
  jobDescription: 'Basic job description',
  keywords: null,
  resumeFileName: null,
  atsScore: 60.0,
  analysisResult: {
    atsScore: 60.0,
    basicAnalysis: 'Simple analysis result'
  }
};

describe('saveAnalysis', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should save analysis with complete data', async () => {
    const result = await saveAnalysis(testAnalysisInput);

    // Verify basic fields
    expect(result.analysisId).toEqual('analysis-123-test');
    expect(result.jobDescription).toEqual(testAnalysisInput.jobDescription);
    expect(result.keywords).toEqual(['React', 'Node.js', 'TypeScript', 'JavaScript']);
    expect(result.resumeFileName).toEqual('john_doe_resume.pdf');
    expect(result.atsScore).toEqual(85.75);
    expect(typeof result.atsScore).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);

    // Verify analysis result structure
    expect(result.analysisResult).toEqual(testAnalysisInput.analysisResult);
    expect(result.analysisResult['improvements']).toBeDefined();
    expect(result.analysisResult['sectionAnalysis']).toBeDefined();
    expect(result.analysisResult['keywordMatches']).toBeDefined();
  });

  it('should save analysis with minimal data (null fields)', async () => {
    const result = await saveAnalysis(minimalTestInput);

    expect(result.analysisId).toEqual('analysis-minimal-test');
    expect(result.jobDescription).toEqual('Basic job description');
    expect(result.keywords).toBeNull();
    expect(result.resumeFileName).toBeNull();
    expect(result.atsScore).toEqual(60.0);
    expect(typeof result.atsScore).toBe('number');
    expect(result.analysisResult).toEqual({ atsScore: 60.0, basicAnalysis: 'Simple analysis result' });
  });

  it('should persist analysis record to database', async () => {
    const result = await saveAnalysis(testAnalysisInput);

    // Query database to verify persistence
    const savedRecords = await db.select()
      .from(analysisRecordsTable)
      .where(eq(analysisRecordsTable.id, result.id))
      .execute();

    expect(savedRecords).toHaveLength(1);
    const savedRecord = savedRecords[0];

    expect(savedRecord.analysisId).toEqual('analysis-123-test');
    expect(savedRecord.jobDescription).toEqual(testAnalysisInput.jobDescription);
    expect(savedRecord.keywords).toEqual(['React', 'Node.js', 'TypeScript', 'JavaScript']);
    expect(savedRecord.resumeFileName).toEqual('john_doe_resume.pdf');
    expect(parseFloat(savedRecord.atsScore)).toEqual(85.75);
    expect(savedRecord.analysisResult).toEqual(testAnalysisInput.analysisResult);
    expect(savedRecord.createdAt).toBeInstanceOf(Date);
    expect(savedRecord.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle analysis with complex JSON structure', async () => {
    const complexInput: CreateAnalysisRecordInput = {
      analysisId: 'complex-analysis-test',
      jobDescription: 'Complex role description',
      keywords: ['Python', 'Machine Learning', 'AWS'],
      resumeFileName: 'data_scientist_resume.pdf',
      atsScore: 92.33,
      analysisResult: {
        nested: {
          deep: {
            structure: {
              with: ['arrays', 'and', 'objects'],
              numbers: [1, 2, 3.14, 99.99],
              booleans: [true, false],
              nullValue: null
            }
          }
        },
        specialCharacters: 'Test with émojis 🚀 and spëcial chars',
        largeArray: new Array(100).fill(0).map((_, i) => ({ id: i, value: `item-${i}` }))
      }
    };

    const result = await saveAnalysis(complexInput);

    expect(result.analysisResult['nested']['deep']['structure']['with']).toEqual(['arrays', 'and', 'objects']);
    expect(result.analysisResult['nested']['deep']['structure']['numbers']).toEqual([1, 2, 3.14, 99.99]);
    expect(result.analysisResult['specialCharacters']).toEqual('Test with émojis 🚀 and spëcial chars');
    expect(result.analysisResult['largeArray']).toHaveLength(100);
    expect(result.analysisResult['largeArray'][50]).toEqual({ id: 50, value: 'item-50' });
  });

  it('should handle precise numeric values correctly', async () => {
    const preciseInput: CreateAnalysisRecordInput = {
      analysisId: 'precise-numeric-test',
      jobDescription: 'Test numeric precision',
      keywords: [],
      resumeFileName: 'test.pdf',
      atsScore: 73.46, // Use 2 decimal places to match PostgreSQL numeric precision
      analysisResult: {
        precisionTest: true,
        scores: [99.99, 0.01, 50.00, 100.00]
      }
    };

    const result = await saveAnalysis(preciseInput);

    // Verify numeric precision is maintained
    expect(result.atsScore).toEqual(73.46);
    expect(typeof result.atsScore).toBe('number');

    // Verify in database
    const savedRecords = await db.select()
      .from(analysisRecordsTable)
      .where(eq(analysisRecordsTable.analysisId, 'precise-numeric-test'))
      .execute();

    expect(parseFloat(savedRecords[0].atsScore)).toEqual(73.46);
  });

  it('should enforce unique analysis ID constraint', async () => {
    // Create unique input for this test to avoid conflicts
    const uniqueTestInput: CreateAnalysisRecordInput = {
      ...testAnalysisInput,
      analysisId: 'unique-constraint-test-id'
    };

    // Save first analysis
    await saveAnalysis(uniqueTestInput);

    // Attempt to save duplicate analysis ID should fail
    const duplicateInput = {
      ...uniqueTestInput,
      jobDescription: 'Different job description'
    };

    await expect(saveAnalysis(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});