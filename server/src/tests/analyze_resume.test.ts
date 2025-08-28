import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type ATSAnalysisInput } from '../schema';
import { analyzeResume } from '../handlers/analyze_resume';

// Sample base64 encoded resume content (simplified)
const sampleResumeBase64 = Buffer.from(`
  John Doe
  Software Engineer
  john.doe@email.com | (555) 123-4567 | LinkedIn: /in/johndoe
  
  SUMMARY
  Experienced software engineer with 5 years of experience developing web applications using JavaScript, React, and Node.js.
  
  EXPERIENCE
  Senior Software Engineer - TechCorp (2021-Present)
  • Developed React-based web applications serving 100k+ users
  • Led team of 3 developers implementing new features
  • Improved application performance by 30% through optimization
  
  EDUCATION
  Bachelor of Science in Computer Science - State University (2019)
  
  SKILLS
  JavaScript, TypeScript, React, Node.js, Python, SQL, Git
`).toString('base64');

const sampleJobDescription = `
  We are seeking a Senior Software Engineer with expertise in JavaScript, React, and Node.js.
  The ideal candidate should have experience with TypeScript, AWS, Docker, and agile development.
  Strong communication skills and leadership experience are preferred.
`;

const testKeywords = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'leadership'];

const basicInput: ATSAnalysisInput = {
  jobDescription: sampleJobDescription,
  keywords: testKeywords,
  resumeFile: sampleResumeBase64
};

describe('analyzeResume', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should analyze resume and return complete ATS analysis', async () => {
    const result = await analyzeResume(basicInput);

    // Basic structure validation
    expect(result.analysisId).toBeDefined();
    expect(result.analysisId).toMatch(/^ats_\d+_[a-z0-9]+$/);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(typeof result.atsScore).toBe('number');
    expect(result.atsScore).toBeGreaterThanOrEqual(0);
    expect(result.atsScore).toBeLessThanOrEqual(100);

    // Verify improvements section structure
    expect(result.improvements).toBeDefined();
    expect(result.improvements.spelling).toBeDefined();
    expect(typeof result.improvements.spelling.score).toBe('number');
    expect(Array.isArray(result.improvements.spelling.issues)).toBe(true);
    expect(Array.isArray(result.improvements.spelling.suggestions)).toBe(true);

    expect(result.improvements.grammar).toBeDefined();
    expect(typeof result.improvements.grammar.score).toBe('number');
    
    expect(result.improvements.quantifiableAchievements).toBeDefined();
    expect(typeof result.improvements.quantifiableAchievements.score).toBe('number');
    expect(typeof result.improvements.quantifiableAchievements.feedback).toBe('string');

    expect(result.improvements.readability).toBeDefined();
    expect(typeof result.improvements.readability.score).toBe('number');
    
    expect(result.improvements.formatting).toBeDefined();
    expect(typeof result.improvements.formatting.score).toBe('number');

    // Verify section analysis structure
    expect(result.sectionAnalysis).toBeDefined();
    expect(result.sectionAnalysis.contactInfo).toBeDefined();
    expect(typeof result.sectionAnalysis.contactInfo.score).toBe('number');
    expect(typeof result.sectionAnalysis.contactInfo.feedback).toBe('string');
    expect(Array.isArray(result.sectionAnalysis.contactInfo.suggestions)).toBe(true);

    expect(result.sectionAnalysis.summary).toBeDefined();
    expect(result.sectionAnalysis.experience).toBeDefined();
    expect(result.sectionAnalysis.education).toBeDefined();
    expect(result.sectionAnalysis.skills).toBeDefined();

    // Verify keyword analysis
    expect(result.keywordMatches).toBeDefined();
    expect(Array.isArray(result.keywordMatches.matched)).toBe(true);
    expect(Array.isArray(result.keywordMatches.missing)).toBe(true);
    expect(typeof result.keywordMatches.matchPercentage).toBe('number');

    // Verify overall suggestions
    expect(Array.isArray(result.overallSuggestions)).toBe(true);
    expect(result.overallSuggestions.length).toBeGreaterThan(0);
  });

  it('should handle keyword matching correctly', async () => {
    const result = await analyzeResume(basicInput);

    // Should find JavaScript, React, Node.js in the sample resume
    expect(result.keywordMatches.matched).toContain('JavaScript');
    expect(result.keywordMatches.matched).toContain('React');
    expect(result.keywordMatches.matched).toContain('Node.js');

    // Should identify missing keywords like AWS, Docker
    expect(result.keywordMatches.missing).toContain('AWS');
    expect(result.keywordMatches.missing).toContain('Docker');

    // Match percentage should be calculated correctly
    const expectedPercentage = Math.round((result.keywordMatches.matched.length / testKeywords.length) * 100);
    expect(result.keywordMatches.matchPercentage).toBe(expectedPercentage);
  });

  it('should analyze resume without keywords', async () => {
    const inputWithoutKeywords: ATSAnalysisInput = {
      jobDescription: sampleJobDescription,
      resumeFile: sampleResumeBase64
    };

    const result = await analyzeResume(inputWithoutKeywords);

    expect(result.keywordMatches.matched).toEqual([]);
    expect(result.keywordMatches.missing).toEqual([]);
    expect(result.keywordMatches.matchPercentage).toBe(0);
    expect(typeof result.atsScore).toBe('number');
    expect(result.atsScore).toBeGreaterThan(0);
  });

  it('should analyze resume with empty keywords array', async () => {
    const inputWithEmptyKeywords: ATSAnalysisInput = {
      jobDescription: sampleJobDescription,
      keywords: [],
      resumeFile: sampleResumeBase64
    };

    const result = await analyzeResume(inputWithEmptyKeywords);

    expect(result.keywordMatches.matched).toEqual([]);
    expect(result.keywordMatches.missing).toEqual([]);
    expect(result.keywordMatches.matchPercentage).toBe(0);
  });

  it('should analyze contact information correctly', async () => {
    const result = await analyzeResume(basicInput);

    // Sample resume has email and phone, so contact score should be high
    expect(result.sectionAnalysis.contactInfo.score).toBeGreaterThan(80);
    expect(result.sectionAnalysis.contactInfo.feedback).toContain('professional');
  });

  it('should detect quantifiable achievements', async () => {
    const result = await analyzeResume(basicInput);

    // Sample resume has "100k+ users", "3 developers", "30%"
    expect(result.improvements.quantifiableAchievements.score).toBeGreaterThan(60);
    expect(result.improvements.quantifiableAchievements.feedback).not.toContain('No quantifiable achievements found');
  });

  it('should handle resume with poor content', async () => {
    const poorResumeBase64 = Buffer.from(`
      John
      No contact info
      I worked somewhere doing things.
      I have skills.
    `).toString('base64');

    const poorInput: ATSAnalysisInput = {
      jobDescription: sampleJobDescription,
      keywords: testKeywords,
      resumeFile: poorResumeBase64
    };

    const result = await analyzeResume(poorInput);

    // Should still return valid analysis with lower scores
    expect(typeof result.atsScore).toBe('number');
    expect(result.atsScore).toBeLessThan(80); // Poor resume should score lower
    expect(result.sectionAnalysis.contactInfo.score).toBeLessThan(80);
    expect(result.improvements.quantifiableAchievements.score).toBeLessThan(60);
    expect(result.keywordMatches.matchPercentage).toBe(0);
  });

  it('should provide relevant suggestions based on analysis', async () => {
    const result = await analyzeResume(basicInput);

    // Should have meaningful suggestions
    expect(result.overallSuggestions.length).toBeGreaterThan(3);
    expect(result.overallSuggestions.some(s => s.includes('scored'))).toBe(true);
    
    // Section suggestions should be arrays
    expect(Array.isArray(result.sectionAnalysis.contactInfo.suggestions)).toBe(true);
    expect(Array.isArray(result.sectionAnalysis.summary.suggestions)).toBe(true);
    expect(Array.isArray(result.sectionAnalysis.experience.suggestions)).toBe(true);
    expect(Array.isArray(result.sectionAnalysis.education.suggestions)).toBe(true);
    expect(Array.isArray(result.sectionAnalysis.skills.suggestions)).toBe(true);
  });

  it('should handle malformed base64 input gracefully', async () => {
    const malformedInput: ATSAnalysisInput = {
      jobDescription: sampleJobDescription,
      keywords: testKeywords,
      resumeFile: 'invalid-base64-content!!!'
    };

    const result = await analyzeResume(malformedInput);

    // Should still complete analysis with fallback content
    expect(result.analysisId).toBeDefined();
    expect(typeof result.atsScore).toBe('number');
    expect(result.atsScore).toBeGreaterThanOrEqual(0);
    expect(result.atsScore).toBeLessThanOrEqual(100);
  });

  it('should calculate scores within valid ranges', async () => {
    const result = await analyzeResume(basicInput);

    // All scores should be between 0 and 100
    expect(result.atsScore).toBeGreaterThanOrEqual(0);
    expect(result.atsScore).toBeLessThanOrEqual(100);
    
    expect(result.improvements.spelling.score).toBeGreaterThanOrEqual(0);
    expect(result.improvements.spelling.score).toBeLessThanOrEqual(100);
    
    expect(result.improvements.grammar.score).toBeGreaterThanOrEqual(0);
    expect(result.improvements.grammar.score).toBeLessThanOrEqual(100);
    
    expect(result.improvements.quantifiableAchievements.score).toBeGreaterThanOrEqual(0);
    expect(result.improvements.quantifiableAchievements.score).toBeLessThanOrEqual(100);
    
    expect(result.improvements.readability.score).toBeGreaterThanOrEqual(0);
    expect(result.improvements.readability.score).toBeLessThanOrEqual(100);
    
    expect(result.improvements.formatting.score).toBeGreaterThanOrEqual(0);
    expect(result.improvements.formatting.score).toBeLessThanOrEqual(100);

    // Section analysis scores
    expect(result.sectionAnalysis.contactInfo.score).toBeGreaterThanOrEqual(0);
    expect(result.sectionAnalysis.contactInfo.score).toBeLessThanOrEqual(100);
    
    expect(result.sectionAnalysis.summary.score).toBeGreaterThanOrEqual(0);
    expect(result.sectionAnalysis.summary.score).toBeLessThanOrEqual(100);
    
    expect(result.sectionAnalysis.experience.score).toBeGreaterThanOrEqual(0);
    expect(result.sectionAnalysis.experience.score).toBeLessThanOrEqual(100);
    
    expect(result.sectionAnalysis.education.score).toBeGreaterThanOrEqual(0);
    expect(result.sectionAnalysis.education.score).toBeLessThanOrEqual(100);
    
    expect(result.sectionAnalysis.skills.score).toBeGreaterThanOrEqual(0);
    expect(result.sectionAnalysis.skills.score).toBeLessThanOrEqual(100);
  });
});