import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ATSAnalysisInput } from '../../../server/src/schema';

interface ResumeUploaderProps {
  onAnalyze: (input: ATSAnalysisInput) => Promise<void>;
  isLoading?: boolean;
}

export function ResumeUploader({ onAnalyze, isLoading = false }: ResumeUploaderProps) {
  const [formData, setFormData] = useState<{
    jobDescription: string;
    keywords: string[];
    resumeFile: string | null;
    resumeFileName: string | null;
  }>({
    jobDescription: '',
    keywords: [],
    resumeFile: null,
    resumeFileName: null,
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadError(null);
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file only.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB.');
      return;
    }

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:application/pdf;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setFormData((prev) => ({
        ...prev,
        resumeFile: base64,
        resumeFileName: file.name,
      }));
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError('Failed to process the file. Please try again.');
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const addKeyword = useCallback(() => {
    const trimmedKeyword = keywordInput.trim();
    if (trimmedKeyword && !formData.keywords.includes(trimmedKeyword)) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, trimmedKeyword],
      }));
      setKeywordInput('');
    }
  }, [keywordInput, formData.keywords]);

  const removeKeyword = useCallback((keywordToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keywordToRemove),
    }));
  }, []);

  const handleKeywordKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  }, [addKeyword]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.jobDescription.trim()) {
      setUploadError('Job description is required.');
      return;
    }
    
    if (!formData.resumeFile) {
      setUploadError('Please upload your resume PDF.');
      return;
    }

    const analysisInput: ATSAnalysisInput = {
      jobDescription: formData.jobDescription.trim(),
      keywords: formData.keywords.length > 0 ? formData.keywords : undefined,
      resumeFile: formData.resumeFile,
    };

    await onAnalyze(analysisInput);
  }, [formData, onAnalyze]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Job Description */}
      <div className="space-y-2">
        <Label htmlFor="jobDescription" className="text-sm font-medium">
          Job Description *
        </Label>
        <Textarea
          id="jobDescription"
          placeholder="Paste the complete job description here..."
          value={formData.jobDescription}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev) => ({ ...prev, jobDescription: e.target.value }))
          }
          className="min-h-32 resize-none"
          required
        />
        <p className="text-xs text-gray-500">
          Include the full job posting for better analysis accuracy
        </p>
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <Label htmlFor="keywords" className="text-sm font-medium">
          Additional Keywords (Optional)
        </Label>
        <div className="flex gap-2">
          <Input
            id="keywords"
            placeholder="Enter relevant keywords..."
            value={keywordInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setKeywordInput(e.target.value)
            }
            onKeyPress={handleKeywordKeyPress}
          />
          <Button type="button" onClick={addKeyword} variant="outline" size="sm">
            Add
          </Button>
        </div>
        
        {formData.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="cursor-pointer">
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="ml-2 hover:text-red-600"
                  aria-label={`Remove ${keyword}`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500">
          Add specific skills, tools, or terms you want to check for
        </p>
      </div>

      {/* Resume Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Resume Upload *
        </Label>
        
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${formData.resumeFile ? 'border-green-400 bg-green-50' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />
          
          {formData.resumeFile ? (
            <div className="space-y-2">
              <div className="text-4xl">✅</div>
              <p className="text-green-700 font-medium">
                {formData.resumeFileName}
              </p>
              <p className="text-sm text-green-600">
                Click or drag to replace
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl text-gray-400">📄</div>
              <p className="text-gray-600 font-medium">
                Drop your resume here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                PDF files only, max 10MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {uploadError}
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <Button
            type="submit"
            disabled={isLoading || !formData.jobDescription.trim() || !formData.resumeFile}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Analyzing Resume...
              </>
            ) : (
              <>
                🎯 Analyze My Resume
              </>
            )}
          </Button>
          <p className="text-center text-xs text-gray-600 mt-2">
            Analysis typically takes 10-30 seconds
          </p>
        </CardContent>
      </Card>
    </form>
  );
}