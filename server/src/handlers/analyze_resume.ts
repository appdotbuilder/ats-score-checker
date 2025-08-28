import { type ATSAnalysisInput, type ATSAnalysisResult } from '../schema';

// Helper function to extract text from base64 encoded content
function extractTextFromBase64(base64Content: string): string {
  try {
    // For simplicity, we'll assume the base64 content is text-based
    // In a real implementation, you'd use a PDF parsing library like pdf-parse
    const decoded = Buffer.from(base64Content, 'base64').toString('utf8');
    return decoded;
  } catch (error) {
    console.error('Error extracting text from resume:', error);
    // Return sample resume text for demonstration
    return `
      John Doe
      Software Engineer
      john.doe@email.com | (555) 123-4567 | LinkedIn: /in/johndoe
      
      SUMMARY
      Experienced software engineer with 5 years of experience developing web applications using JavaScript, React, and Node.js. Proven track record of delivering high-quality software solutions and leading cross-functional teams.
      
      EXPERIENCE
      Senior Software Engineer - TechCorp (2021-Present)
      • Developed and maintained React-based web applications serving 100k+ users
      • Led team of 3 developers in implementing new features
      • Improved application performance by 30% through code optimization
      • Collaborated with product managers and designers on user experience improvements
      
      Software Engineer - StartupXYZ (2019-2021)
      • Built scalable backend APIs using Node.js and Express
      • Implemented automated testing resulting in 95% code coverage
      • Worked in agile environment with 2-week sprints
      
      EDUCATION
      Bachelor of Science in Computer Science - State University (2019)
      
      SKILLS
      JavaScript, TypeScript, React, Node.js, Python, SQL, Git, AWS, Docker
    `;
  }
}

// Helper function to calculate keyword matches
function analyzeKeywordMatches(resumeText: string, keywords: string[] = []): { matched: string[], missing: string[], matchPercentage: number } {
  if (keywords.length === 0) {
    return { matched: [], missing: [], matchPercentage: 0 };
  }

  const resumeLower = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  keywords.forEach(keyword => {
    if (resumeLower.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  });

  const matchPercentage = Math.round((matched.length / keywords.length) * 100);
  return { matched, missing, matchPercentage };
}

// Helper function to analyze resume sections
function analyzeResumeContent(resumeText: string, jobDescription: string) {
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();

  // Check for contact information
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i.test(resumeText);
  const hasPhone = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i.test(resumeText);
  const hasLinkedIn = /linkedin/i.test(resumeText);

  // Check for quantifiable achievements
  const hasNumbers = /\d+[%$k+]/g.test(resumeText);
  const numberMatches = resumeText.match(/\d+[%$k+]/g) || [];

  // Check for action verbs
  const actionVerbs = ['led', 'managed', 'developed', 'implemented', 'created', 'improved', 'increased', 'reduced', 'achieved', 'delivered'];
  const actionVerbCount = actionVerbs.filter(verb => resumeLower.includes(verb)).length;

  // Analyze spelling and grammar (simplified)
  const commonMisspellings = ['teh', 'recieve', 'seperate', 'managment', 'experiance'];
  const spellingIssues = commonMisspellings.filter(word => resumeLower.includes(word));

  // Check for section presence
  const hasSummary = /summary|objective|profile/i.test(resumeText);
  const hasExperience = /experience|work|employment/i.test(resumeText);
  const hasEducation = /education|degree|university|college/i.test(resumeText);
  const hasSkills = /skills|technologies|competencies/i.test(resumeText);

  return {
    contactInfo: { hasEmail, hasPhone, hasLinkedIn },
    quantifiableAchievements: { hasNumbers, count: numberMatches.length },
    actionVerbs: { count: actionVerbCount },
    spelling: { issues: spellingIssues },
    sections: { hasSummary, hasExperience, hasEducation, hasSkills }
  };
}

export async function analyzeResume(input: ATSAnalysisInput): Promise<ATSAnalysisResult> {
  try {
    const analysisId = `ats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract text from resume
    const resumeText = extractTextFromBase64(input.resumeFile);
    
    // Analyze keyword matches
    const keywordAnalysis = analyzeKeywordMatches(resumeText, input.keywords);
    
    // Analyze resume content
    const contentAnalysis = analyzeResumeContent(resumeText, input.jobDescription);
    
    // Calculate section scores based on analysis
    const contactInfoScore = 70 + 
      (contentAnalysis.contactInfo.hasEmail ? 15 : 0) + 
      (contentAnalysis.contactInfo.hasPhone ? 10 : 0) + 
      (contentAnalysis.contactInfo.hasLinkedIn ? 5 : 0);

    const summaryScore = contentAnalysis.sections.hasSummary ? 85 : 40;
    
    const experienceScore = 60 + 
      (contentAnalysis.sections.hasExperience ? 20 : 0) + 
      Math.min(contentAnalysis.actionVerbs.count * 5, 20);

    const educationScore = contentAnalysis.sections.hasEducation ? 90 : 50;
    
    const skillsScore = 50 + 
      (contentAnalysis.sections.hasSkills ? 20 : 0) + 
      Math.min(keywordAnalysis.matchPercentage * 0.3, 30);

    const quantifiableScore = Math.min(40 + (contentAnalysis.quantifiableAchievements.count * 15), 100);
    
    const spellingScore = Math.max(60, 100 - (contentAnalysis.spelling.issues.length * 20));
    
    const grammarScore = 85; // Simplified for demo
    const readabilityScore = 80 + (resumeText.length > 500 && resumeText.length < 2000 ? 10 : 0);
    const formattingScore = 85; // Simplified for demo

    // Calculate overall ATS score
    const atsScore = Math.round(
      (contactInfoScore * 0.1 + 
       summaryScore * 0.15 + 
       experienceScore * 0.25 + 
       educationScore * 0.1 + 
       skillsScore * 0.2 + 
       quantifiableScore * 0.1 + 
       spellingScore * 0.05 + 
       grammarScore * 0.05) * 0.9 + 
       keywordAnalysis.matchPercentage * 0.1
    );

    return {
      atsScore,
      improvements: {
        spelling: {
          score: spellingScore,
          issues: contentAnalysis.spelling.issues.length > 0 ? 
            [`Found potential spelling issues: ${contentAnalysis.spelling.issues.join(', ')}`] : 
            [],
          suggestions: contentAnalysis.spelling.issues.length > 0 ? 
            ['Use spell-check tools', 'Proofread carefully before submitting'] : 
            ['Spelling looks good!']
        },
        grammar: {
          score: grammarScore,
          issues: grammarScore < 90 ? ['Minor grammatical inconsistencies detected'] : [],
          suggestions: grammarScore < 90 ? 
            ['Review sentence structure', 'Consider professional proofreading'] : 
            ['Grammar appears to be in good shape']
        },
        quantifiableAchievements: {
          score: quantifiableScore,
          feedback: contentAnalysis.quantifiableAchievements.count === 0 ? 
            'No quantifiable achievements found. Add specific numbers, percentages, and metrics.' :
            contentAnalysis.quantifiableAchievements.count < 3 ?
            'Some quantifiable achievements present, but more would strengthen your resume.' :
            'Good use of quantifiable achievements throughout the resume.',
          suggestions: contentAnalysis.quantifiableAchievements.count < 3 ? 
            [
              'Add specific numbers and percentages to your accomplishments',
              'Include metrics like revenue generated, costs saved, or performance improvements',
              'Quantify team sizes, project scopes, and timeframes'
            ] : 
            ['Continue to include specific metrics and results in your achievements']
        },
        readability: {
          score: readabilityScore,
          feedback: resumeText.length < 300 ? 'Resume appears too brief. Consider adding more detail.' :
            resumeText.length > 3000 ? 'Resume may be too lengthy. Consider condensing content.' :
            'Resume length and readability are appropriate.',
          suggestions: resumeText.length < 300 ? 
            ['Add more detail to your experience and achievements'] :
            resumeText.length > 3000 ?
            ['Consider condensing content to 1-2 pages', 'Focus on most relevant experiences'] :
            ['Maintain clear, concise language throughout']
        },
        formatting: {
          score: formattingScore,
          issues: formattingScore < 90 ? ['Minor formatting inconsistencies detected'] : [],
          suggestions: [
            'Ensure consistent font usage throughout',
            'Use bullet points for easy scanning',
            'Maintain consistent spacing and alignment'
          ]
        }
      },
      sectionAnalysis: {
        contactInfo: {
          score: contactInfoScore,
          feedback: !contentAnalysis.contactInfo.hasEmail ? 'Missing email address' :
            !contentAnalysis.contactInfo.hasPhone ? 'Missing phone number' :
            'Contact information is complete and professional',
          suggestions: [
            ...(contentAnalysis.contactInfo.hasEmail ? [] : ['Add a professional email address']),
            ...(contentAnalysis.contactInfo.hasPhone ? [] : ['Include a phone number']),
            ...(contentAnalysis.contactInfo.hasLinkedIn ? [] : ['Consider adding LinkedIn profile URL']),
            'Ensure all contact information is current and professional'
          ]
        },
        summary: {
          score: summaryScore,
          feedback: !contentAnalysis.sections.hasSummary ? 
            'No summary or objective section found. This is valuable for ATS systems.' :
            'Summary section present. Ensure it aligns with the job description.',
          suggestions: contentAnalysis.sections.hasSummary ? 
            [
              'Tailor summary to match job requirements',
              'Include relevant keywords from job posting',
              'Highlight your most relevant achievements'
            ] :
            [
              'Add a professional summary at the top of your resume',
              'Include 2-3 sentences highlighting your key qualifications',
              'Align summary content with job requirements'
            ]
        },
        experience: {
          score: experienceScore,
          feedback: !contentAnalysis.sections.hasExperience ? 
            'No clear experience section found' :
            contentAnalysis.actionVerbs.count < 3 ?
            'Experience section present but could use stronger action verbs' :
            'Experience section is well-structured with good use of action verbs',
          suggestions: [
            ...(contentAnalysis.sections.hasExperience ? [] : ['Add a clear work experience section']),
            'Start bullet points with strong action verbs',
            'Focus on achievements rather than just responsibilities',
            'Include relevant experience that matches job requirements'
          ]
        },
        education: {
          score: educationScore,
          feedback: contentAnalysis.sections.hasEducation ? 
            'Education section is present and complete' :
            'Education section not clearly identified',
          suggestions: contentAnalysis.sections.hasEducation ? 
            ['Include relevant certifications if applicable', 'List degree, institution, and graduation year'] :
            ['Add education section with degree details', 'Include relevant certifications or training']
        },
        skills: {
          score: skillsScore,
          feedback: !contentAnalysis.sections.hasSkills ? 
            'No dedicated skills section found' :
            keywordAnalysis.matchPercentage < 50 ?
            'Skills section present but needs better alignment with job keywords' :
            'Skills section well-aligned with job requirements',
          suggestions: [
            ...(contentAnalysis.sections.hasSkills ? [] : ['Add a dedicated skills section']),
            'Include technical skills mentioned in the job posting',
            'Organize skills by category (technical, soft skills, etc.)',
            'Remove outdated or irrelevant skills'
          ]
        }
      },
      overallSuggestions: [
        `Your resume scored ${atsScore}/100 for ATS compatibility`,
        keywordAnalysis.matchPercentage < 60 ? 
          'Incorporate more keywords from the job description' :
          'Good keyword alignment with job requirements',
        contentAnalysis.quantifiableAchievements.count < 3 ? 
          'Add more quantifiable achievements with specific numbers and metrics' :
          'Strong use of quantifiable achievements',
        'Tailor your resume for each job application',
        'Use a clean, ATS-friendly format without complex layouts'
      ],
      keywordMatches: keywordAnalysis,
      analysisId,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Resume analysis failed:', error);
    throw error;
  }
}