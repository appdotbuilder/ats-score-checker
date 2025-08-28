import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';
import type { AnalysisRecord } from '../../../server/src/schema';

export function AnalysisHistory() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(10);

  const loadAnalyses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await trpc.getAllAnalyses.query({ limit });
      setAnalyses(result);
    } catch (err) {
      console.error('Failed to load analyses:', err);
      setError('Failed to load analysis history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const loadAnalysis = useCallback(async (analysisId: string) => {
    try {
      const analysis = await trpc.getAnalysis.query({ analysisId });
      setSelectedAnalysis(analysis);
    } catch (err) {
      console.error('Failed to load analysis:', err);
      setError('Failed to load analysis details.');
    }
  }, []);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  const filteredAnalyses = analyses.filter((analysis) =>
    analysis.jobDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.analysisId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (analysis.keywords && analysis.keywords.some(keyword => 
      keyword.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default' as const;
    if (score >= 60) return 'secondary' as const;
    return 'destructive' as const;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (selectedAnalysis) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Analysis Details</h3>
          <Button 
            variant="outline" 
            onClick={() => setSelectedAnalysis(null)}
          >
            ← Back to History
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <CardTitle className="text-xl">
                  Analysis #{selectedAnalysis.analysisId}
                </CardTitle>
                <Badge variant={getScoreBadgeVariant(selectedAnalysis.atsScore)}>
                  Score: {selectedAnalysis.atsScore}/100
                </Badge>
              </div>
              <div className="text-sm text-gray-500 text-right">
                <div>{selectedAnalysis.createdAt.toLocaleDateString()}</div>
                <div>{selectedAnalysis.createdAt.toLocaleTimeString()}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Job Description</h4>
              <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-700">
                  {selectedAnalysis.jobDescription}
                </p>
              </div>
            </div>
            
            {selectedAnalysis.keywords && selectedAnalysis.keywords.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Keywords Used</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAnalysis.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedAnalysis.resumeFileName && (
              <div>
                <h4 className="font-semibold mb-2">Resume File</h4>
                <Badge variant="secondary">
                  📄 {selectedAnalysis.resumeFileName}
                </Badge>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Analysis Summary</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Overall ATS Score:</span>
                    <div className="text-2xl font-bold mt-1">
                      <span className={
                        selectedAnalysis.atsScore >= 80 ? 'text-green-600' :
                        selectedAnalysis.atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }>
                        {selectedAnalysis.atsScore}/100
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <div className="mt-1">
                      <Badge variant={getScoreBadgeVariant(selectedAnalysis.atsScore)}>
                        {selectedAnalysis.atsScore >= 80 ? 'Excellent' :
                         selectedAnalysis.atsScore >= 60 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                💡 To view the complete analysis with detailed suggestions and section breakdowns, 
                run a new analysis or save the full analysis results when they're generated.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Previous Analyses ({filteredAnalyses.length})
        </h3>
        <Button variant="outline" onClick={loadAnalyses} size="sm">
          🔄 Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by job description, analysis ID, or keywords..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setSearchTerm(e.target.value)
            }
          />
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value={10}>Last 10</option>
          <option value={25}>Last 25</option>
          <option value={50}>Last 50</option>
        </select>
      </div>

      {filteredAnalyses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No matching analyses' : 'No previous analyses'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Your analysis history will appear here after you run your first resume check'
              }
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnalyses.map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-800">
                        Analysis #{analysis.analysisId.slice(-8)}
                      </h4>
                      <Badge variant={getScoreBadgeVariant(analysis.atsScore)}>
                        {analysis.atsScore}/100
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {analysis.jobDescription.substring(0, 150)}...
                    </p>
                    
                    {analysis.keywords && analysis.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {analysis.keywords.slice(0, 3).map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {analysis.keywords.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{analysis.keywords.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className="text-sm text-gray-500">
                      {analysis.createdAt.toLocaleDateString()}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadAnalysis(analysis.analysisId)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mt-3 pt-3 border-t">
                  <div>
                    ID: <code>{analysis.analysisId}</code>
                  </div>
                  {analysis.resumeFileName && (
                    <div>
                      📄 {analysis.resumeFileName}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {filteredAnalyses.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Showing {filteredAnalyses.length} of {analyses.length} analyses
          </p>
          {analyses.length >= limit && (
            <Button 
              variant="outline" 
              onClick={() => setLimit(prev => prev + 10)}
              className="mt-2"
              size="sm"
            >
              Load More
            </Button>
          )}
        </div>
      )}
    </div>
  );
}