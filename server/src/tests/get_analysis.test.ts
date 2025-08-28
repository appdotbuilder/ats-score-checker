import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { analysisRecordsTable } from '../db/schema';
import { type CreateAnalysisRecordInput } from '../schema';
import { getAnalysis, getAllAnalyses } from '../handlers/get_analysis';

// Test data
const testAnalysis: CreateAnalysisRecordInput = {
  analysisId: 'test-analysis-001',
  jobDescription: 'Software Engineer position requiring Python and JavaScript skills',
  keywords: ['Python', 'JavaScript', 'React', 'Node.js'],
  resumeFileName: 'john_doe_resume.pdf',
  atsScore: 85.75,
  analysisResult: {
    atsScore: 85.75,
    improvements: {
      spelling: { score: 95, issues: [], suggestions: [] },
      grammar: { score: 90, issues: ['Missing comma'], suggestions: ['Add comma after introductory phrase'] }
    },
    sectionAnalysis: {
      contactInfo: { score: 100, feedback: 'Complete', suggestions: [] },
      summary: { score: 85, feedback: 'Good summary', suggestions: ['Add more keywords'] },
      experience: { score: 80, feedback: 'Relevant experience', suggestions: [] },
      education: { score: 90, feedback: 'Strong education', suggestions: [] },
      skills: { score: 85, feedback: 'Good skill set', suggestions: [] }
    },
    overallSuggestions: ['Add more quantifiable achievements'],
    keywordMatches: {
      matched: ['Python', 'JavaScript'],
      missing: ['React', 'Node.js'],
      matchPercentage: 50
    }
  }
};

const testAnalysis2: CreateAnalysisRecordInput = {
  analysisId: 'test-analysis-002',
  jobDescription: 'Data Scientist position requiring machine learning experience',
  keywords: ['Python', 'Machine Learning', 'TensorFlow'],
  resumeFileName: 'jane_smith_resume.pdf',
  atsScore: 72.25,
  analysisResult: {
    atsScore: 72.25,
    improvements: {
      spelling: { score: 100, issues: [], suggestions: [] },
      grammar: { score: 95, issues: [], suggestions: [] }
    },
    sectionAnalysis: {
      contactInfo: { score: 100, feedback: 'Complete', suggestions: [] },
      summary: { score: 75, feedback: 'Needs improvement', suggestions: ['Add ML keywords'] },
      experience: { score: 70, feedback: 'Limited ML experience', suggestions: [] },
      education: { score: 95, feedback: 'Strong education', suggestions: [] },
      skills: { score: 65, feedback: 'Missing key skills', suggestions: [] }
    },
    overallSuggestions: ['Highlight ML projects'],
    keywordMatches: {
      matched: ['Python'],
      missing: ['Machine Learning', 'TensorFlow'],
      matchPercentage: 33.33
    }
  }
};

describe('getAnalysis', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing analysis by ID', async () => {
    // Insert test analysis
    await db.insert(analysisRecordsTable)
      .values({
        analysisId: testAnalysis.analysisId,
        jobDescription: testAnalysis.jobDescription,
        keywords: testAnalysis.keywords,
        resumeFileName: testAnalysis.resumeFileName,
        atsScore: testAnalysis.atsScore.toString(), // Convert to string for insertion
        analysisResult: testAnalysis.analysisResult
      })
      .execute();

    const result = await getAnalysis(testAnalysis.analysisId);

    expect(result).toBeDefined();
    expect(result!.analysisId).toEqual('test-analysis-001');
    expect(result!.jobDescription).toEqual(testAnalysis.jobDescription);
    expect(result!.keywords).toEqual(testAnalysis.keywords);
    expect(result!.resumeFileName).toEqual('john_doe_resume.pdf');
    expect(result!.atsScore).toEqual(85.75);
    expect(typeof result!.atsScore).toEqual('number'); // Verify numeric conversion
    expect(result!.analysisResult).toEqual(testAnalysis.analysisResult);
    expect(result!.id).toBeDefined();
    expect(result!.createdAt).toBeInstanceOf(Date);
    expect(result!.updatedAt).toBeInstanceOf(Date);
  });

  it('should return null for non-existent analysis', async () => {
    const result = await getAnalysis('non-existent-id');
    
    expect(result).toBeNull();
  });

  it('should handle analysis with null keywords and resumeFileName', async () => {
    const analysisWithNulls: CreateAnalysisRecordInput = {
      ...testAnalysis,
      analysisId: 'test-null-fields',
      keywords: null,
      resumeFileName: null
    };

    await db.insert(analysisRecordsTable)
      .values({
        analysisId: analysisWithNulls.analysisId,
        jobDescription: analysisWithNulls.jobDescription,
        keywords: analysisWithNulls.keywords,
        resumeFileName: analysisWithNulls.resumeFileName,
        atsScore: analysisWithNulls.atsScore.toString(),
        analysisResult: analysisWithNulls.analysisResult
      })
      .execute();

    const result = await getAnalysis('test-null-fields');

    expect(result).toBeDefined();
    expect(result!.keywords).toBeNull();
    expect(result!.resumeFileName).toBeNull();
    expect(result!.atsScore).toEqual(85.75);
    expect(typeof result!.atsScore).toEqual('number');
  });
});

describe('getAllAnalyses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve all analyses ordered by creation date (newest first)', async () => {
    // Insert multiple test analyses
    await db.insert(analysisRecordsTable)
      .values([
        {
          analysisId: testAnalysis.analysisId,
          jobDescription: testAnalysis.jobDescription,
          keywords: testAnalysis.keywords,
          resumeFileName: testAnalysis.resumeFileName,
          atsScore: testAnalysis.atsScore.toString(),
          analysisResult: testAnalysis.analysisResult
        },
        {
          analysisId: testAnalysis2.analysisId,
          jobDescription: testAnalysis2.jobDescription,
          keywords: testAnalysis2.keywords,
          resumeFileName: testAnalysis2.resumeFileName,
          atsScore: testAnalysis2.atsScore.toString(),
          analysisResult: testAnalysis2.analysisResult
        }
      ])
      .execute();

    const results = await getAllAnalyses();

    expect(results).toHaveLength(2);
    
    // Verify ordering (newest first)
    expect(results[0].createdAt >= results[1].createdAt).toBe(true);
    
    // Verify numeric conversions
    results.forEach(result => {
      expect(typeof result.atsScore).toEqual('number');
    });

    // Verify specific data
    const analysis1 = results.find(r => r.analysisId === 'test-analysis-001');
    const analysis2 = results.find(r => r.analysisId === 'test-analysis-002');

    expect(analysis1).toBeDefined();
    expect(analysis1!.atsScore).toEqual(85.75);
    expect(analysis1!.keywords).toEqual(['Python', 'JavaScript', 'React', 'Node.js']);

    expect(analysis2).toBeDefined();
    expect(analysis2!.atsScore).toEqual(72.25);
    expect(analysis2!.keywords).toEqual(['Python', 'Machine Learning', 'TensorFlow']);
  });

  it('should return empty array when no analyses exist', async () => {
    const results = await getAllAnalyses();
    
    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should respect limit parameter', async () => {
    // Insert 3 test analyses
    for (let i = 0; i < 3; i++) {
      await db.insert(analysisRecordsTable)
        .values({
          analysisId: `test-analysis-${i}`,
          jobDescription: `Job description ${i}`,
          keywords: [`Skill${i}`],
          resumeFileName: `resume_${i}.pdf`,
          atsScore: (70 + i * 10).toString(),
          analysisResult: { score: 70 + i * 10 }
        })
        .execute();
    }

    const results = await getAllAnalyses(2);

    expect(results).toHaveLength(2);
    
    // Verify numeric conversion
    results.forEach(result => {
      expect(typeof result.atsScore).toEqual('number');
    });

    // Should get the 2 newest records
    expect(results[0].atsScore >= results[1].atsScore).toBe(true);
  });

  it('should handle limit of 0', async () => {
    // Insert test analysis
    await db.insert(analysisRecordsTable)
      .values({
        analysisId: testAnalysis.analysisId,
        jobDescription: testAnalysis.jobDescription,
        keywords: testAnalysis.keywords,
        resumeFileName: testAnalysis.resumeFileName,
        atsScore: testAnalysis.atsScore.toString(),
        analysisResult: testAnalysis.analysisResult
      })
      .execute();

    const results = await getAllAnalyses(0);

    expect(results).toHaveLength(0);
  });

  it('should work without limit parameter', async () => {
    // Insert test analysis
    await db.insert(analysisRecordsTable)
      .values({
        analysisId: testAnalysis.analysisId,
        jobDescription: testAnalysis.jobDescription,
        keywords: testAnalysis.keywords,
        resumeFileName: testAnalysis.resumeFileName,
        atsScore: testAnalysis.atsScore.toString(),
        analysisResult: testAnalysis.analysisResult
      })
      .execute();

    const results = await getAllAnalyses();

    expect(results).toHaveLength(1);
    expect(results[0].analysisId).toEqual('test-analysis-001');
    expect(typeof results[0].atsScore).toEqual('number');
  });
});