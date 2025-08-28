import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { ResumeUploader } from '@/components/ResumeUploader';
import { AnalysisResults } from '@/components/AnalysisResults';
import { AnalysisHistory } from '@/components/AnalysisHistory';
import type { ATSAnalysisInput, ATSAnalysisResult } from '../../server/src/schema';

function App() {
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleAnalyze = useCallback(async (input: ATSAnalysisInput) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await trpc.analyzeResume.mutate(input);
      setAnalysisResult(result);
      setActiveTab('results');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    setActiveTab('upload');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎯 ATS Score Checker
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Optimize your resume for Applicant Tracking Systems. Get detailed feedback, 
            scoring, and actionable suggestions to improve your job application success rate.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="upload" className="text-sm font-medium">
                📄 Upload & Analyze
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                className="text-sm font-medium"
                disabled={!analysisResult}
              >
                📊 Results
                {analysisResult && (
                  <Badge 
                    variant={analysisResult.atsScore >= 80 ? "default" : 
                            analysisResult.atsScore >= 60 ? "secondary" : "destructive"}
                    className="ml-2"
                  >
                    {analysisResult.atsScore}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="text-sm font-medium">
                📜 History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">
                    Upload Your Resume for ATS Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResumeUploader onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results">
              {analysisResult ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Analysis Results
                    </h2>
                    <Button onClick={handleNewAnalysis} variant="outline">
                      🔄 New Analysis
                    </Button>
                  </div>
                  <AnalysisResults result={analysisResult} />
                </div>
              ) : (
                <Card className="border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No Analysis Yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Upload your resume to see detailed ATS analysis results
                    </p>
                    <Button onClick={() => setActiveTab('upload')} variant="outline">
                      Start Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">
                    Analysis History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalysisHistory />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>💼 Improve your resume's compatibility with modern ATS systems</p>
        </div>
      </div>
    </div>
  );
}

export default App;