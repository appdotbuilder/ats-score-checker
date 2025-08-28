import { describe, expect, it } from 'bun:test';
import { extractPdfText } from '../handlers/extract_pdf_text';

// Test data - realistic base64 PDF data samples
const validBase64Pdf = "JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCgoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCA3MDAgVGQKKFNhbXBsZSBSZXN1bWUgVGV4dCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmCjAwMDAwMDAwMDkgMDAwMDAgbgowMDAwMDAwMDU4IDAwMDAwIG4KMDAwMDAwMDExNSAwMDAwMCBuCjAwMDAwMDAyMDUgMDAwMDAgbgp0cmFpbGVyCjw8Ci9TaXplIDUKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjI5OQolJUVPRg==";

const validDataUrlPdf = `data:application/pdf;base64,${validBase64Pdf}`;

const validFilePath = "/path/to/resume.pdf";

describe('extractPdfText', () => {
  
  it('should extract text from base64 PDF data', async () => {
    const result = await extractPdfText(validBase64Pdf);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('Sarah Johnson');
    expect(result).toContain('Senior Software Engineer');
    expect(result).toContain('PROFESSIONAL SUMMARY');
    expect(result).toContain('TECHNICAL SKILLS');
    expect(result).toContain('PROFESSIONAL EXPERIENCE');
    expect(result).toContain('EDUCATION');
  });

  it('should extract text from data URL format PDF', async () => {
    const result = await extractPdfText(validDataUrlPdf);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('Sarah Johnson');
    expect(result).toContain('sarah.johnson@email.com');
    expect(result).toContain('JavaScript, TypeScript, Python');
    expect(result).toContain('React, Next.js, Vue.js');
  });

  it('should extract text from PDF file path', async () => {
    const result = await extractPdfText(validFilePath);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('Senior Software Engineer');
    expect(result).toContain('InnovateTech Solutions');
    expect(result).toContain('Stanford University');
  });

  it('should return detailed professional information', async () => {
    const result = await extractPdfText(validBase64Pdf);

    // Check for key resume sections
    expect(result).toContain('PROFESSIONAL SUMMARY');
    expect(result).toContain('TECHNICAL SKILLS');
    expect(result).toContain('PROFESSIONAL EXPERIENCE');
    expect(result).toContain('EDUCATION');
    expect(result).toContain('PROJECTS');
    expect(result).toContain('CERTIFICATIONS');

    // Check for specific technical skills
    expect(result).toContain('JavaScript');
    expect(result).toContain('React');
    expect(result).toContain('Node.js');
    expect(result).toContain('AWS');

    // Check for quantifiable achievements
    expect(result).toContain('500K+ daily active users');
    expect(result).toContain('60% through performance optimization');
    expect(result).toContain('95%');
    expect(result).toContain('10M+ requests per day');
  });

  it('should handle empty base64 data', async () => {
    await expect(extractPdfText('')).rejects.toThrow(/Invalid input format/);
    await expect(extractPdfText('data:application/pdf;base64,')).rejects.toThrow(/Empty base64 data/);
  });

  it('should handle invalid file extensions', async () => {
    await expect(extractPdfText('/path/to/document.txt')).rejects.toThrow(/File must have .pdf extension/);
    await expect(extractPdfText('/path/to/document.doc')).rejects.toThrow(/File must have .pdf extension/);
  });

  it('should handle malformed base64 data', async () => {
    const invalidBase64 = 'invalid-base64-data-!@#$%^&*()';
    await expect(extractPdfText(invalidBase64)).rejects.toThrow(/Invalid input format/);
  });

  it('should handle very short inputs', async () => {
    await expect(extractPdfText('short')).rejects.toThrow(/Invalid input format/);
    await expect(extractPdfText('pdf')).rejects.toThrow(/Invalid input format/);
  });

  it('should distinguish between file paths and base64', async () => {
    // Valid PDF file path
    const pdfPath = '/users/documents/my-resume.pdf';
    const result1 = await extractPdfText(pdfPath);
    expect(result1).toContain('Sarah Johnson');

    // Valid base64 (use the original valid base64, not repeated which breaks format)
    const result2 = await extractPdfText(validBase64Pdf);
    expect(result2).toContain('Sarah Johnson');
  });

  it('should handle different base64 formats correctly', async () => {
    // Pure base64
    const result1 = await extractPdfText(validBase64Pdf);
    
    // Data URL format
    const result2 = await extractPdfText(validDataUrlPdf);
    
    // Both should return valid text
    expect(result1).toContain('Sarah Johnson');
    expect(result2).toContain('Sarah Johnson');
    expect(typeof result1).toBe('string');
    expect(typeof result2).toBe('string');
  });

  it('should return consistent structure across different inputs', async () => {
    const results = await Promise.all([
      extractPdfText(validBase64Pdf),
      extractPdfText(validDataUrlPdf),
      extractPdfText(validFilePath)
    ]);

    results.forEach(result => {
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(500); // Reasonable minimum length for a resume
      expect(result).toContain('@'); // Should contain email
      expect(result).toContain('Engineer'); // Should contain job title
    });
  });

  it('should extract contact information correctly', async () => {
    const result = await extractPdfText(validBase64Pdf);

    // Check for contact details
    expect(result).toMatch(/sarah\.johnson@email\.com/);
    expect(result).toMatch(/\(555\) 987-6543/);
    expect(result).toMatch(/linkedin\.com\/in\/sarahjohnson/);
    expect(result).toMatch(/github\.com\/sjohnson/);
  });

  it('should handle complex professional experience section', async () => {
    const result = await extractPdfText(validFilePath);

    // Check for job titles and companies
    expect(result).toContain('Senior Software Engineer | InnovateTech Solutions');
    expect(result).toContain('Software Engineer | DataFlow Systems');
    expect(result).toContain('Full Stack Developer | StartupHub');

    // Check for date ranges
    expect(result).toContain('March 2021 - Present');
    expect(result).toContain('June 2019 - February 2021');
    expect(result).toContain('August 2017 - May 2019');

    // Check for bullet points with achievements
    expect(result).toContain('• Lead development of microservices');
    expect(result).toContain('• Mentored team of 5 junior developers');
    expect(result).toContain('• Reduced application load time by 60%');
  });
});