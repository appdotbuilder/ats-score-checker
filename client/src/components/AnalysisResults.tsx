import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { ATSAnalysisResult } from '../../../server/src/schema';

interface AnalysisResultsProps {
  result: ATSAnalysisResult;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default' as const;
    if (score >= 60) return 'secondary' as const;
    return 'destructive' as const;
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="text-6xl">
              {result.atsScore >= 80 ? '🎉' : result.atsScore >= 60 ? '👍' : '⚠️'}
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">
                <span className={getScoreColor(result.atsScore)}>
                  {result.atsScore}
                </span>
                <span className="text-2xl text-gray-500">/100</span>
              </div>
              <Badge variant={getScoreBadgeVariant(result.atsScore)} className="text-sm">
                {result.atsScore >= 80 ? 'Excellent' : 
                 result.atsScore >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-800">
            ATS Compatibility Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Progress 
                value={result.atsScore} 
                className="h-3"
              />
              <style>{`
                .progress-indicator { 
                  background-color: ${result.atsScore >= 80 ? '#059669' : 
                                     result.atsScore >= 60 ? '#d97706' : '#dc2626'} !important; 
                }
              `}</style>
            </div>
            
            {result.atsScore < 60 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  <strong>Action Required:</strong> Your resume needs significant improvements to pass ATS filters effectively.
                </AlertDescription>
              </Alert>
            )}
            
            {result.atsScore >= 60 && result.atsScore < 80 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  <strong>Good Progress:</strong> Your resume is on the right track but has room for improvement.
                </AlertDescription>
              </Alert>
            )}
            
            {result.atsScore >= 80 && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  <strong>Excellent:</strong> Your resume is well-optimized for ATS systems!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Keyword Analysis */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Keyword Analysis
            <Badge variant="outline">
              {result.keywordMatches.matchPercentage}% Match
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                ✅ Matched Keywords ({result.keywordMatches.matched.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.keywordMatches.matched.length > 0 ? (
                  result.keywordMatches.matched.map((keyword) => (
                    <Badge key={keyword} variant="default" className="bg-green-100 text-green-800">
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No keywords matched</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                ❌ Missing Keywords ({result.keywordMatches.missing.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.keywordMatches.missing.length > 0 ? (
                  result.keywordMatches.missing.map((keyword) => (
                    <Badge key={keyword} variant="destructive" className="bg-red-100 text-red-800">
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">All keywords found!</p>
                )}
              </div>
            </div>
          </div>
          
          <Progress value={result.keywordMatches.matchPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <Tabs defaultValue="improvements" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="improvements">🛠️ Improvements</TabsTrigger>
              <TabsTrigger value="sections">📋 Sections</TabsTrigger>
              <TabsTrigger value="suggestions">💡 Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="improvements" className="p-6 space-y-6">
              <h3 className="text-lg font-semibold mb-4">Improvement Areas</h3>
              
              {/* Spelling */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium flex items-center gap-2">
                    📝 Spelling & Language
                  </h4>
                  <Badge variant={getScoreBadgeVariant(result.improvements.spelling.score)}>
                    {result.improvements.spelling.score}/100
                  </Badge>
                </div>
                <Progress value={result.improvements.spelling.score} className="h-2" />
                {result.improvements.spelling.issues.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <h5 className="font-medium text-red-800 mb-2">Issues Found:</h5>
                    <ul className="text-sm text-red-700 space-y-1">
                      {result.improvements.spelling.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Suggestions:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {result.improvements.spelling.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <Separator />

              {/* Grammar */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium flex items-center gap-2">
                    ✏️ Grammar & Structure
                  </h4>
                  <Badge variant={getScoreBadgeVariant(result.improvements.grammar.score)}>
                    {result.improvements.grammar.score}/100
                  </Badge>
                </div>
                <Progress value={result.improvements.grammar.score} className="h-2" />
                {result.improvements.grammar.issues.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <h5 className="font-medium text-red-800 mb-2">Issues Found:</h5>
                    <ul className="text-sm text-red-700 space-y-1">
                      {result.improvements.grammar.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Suggestions:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {result.improvements.grammar.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <Separator />

              {/* Quantifiable Achievements */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium flex items-center gap-2">
                    📊 Quantifiable Achievements
                  </h4>
                  <Badge variant={getScoreBadgeVariant(result.improvements.quantifiableAchievements.score)}>
                    {result.improvements.quantifiableAchievements.score}/100
                  </Badge>
                </div>
                <Progress value={result.improvements.quantifiableAchievements.score} className="h-2" />
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    {result.improvements.quantifiableAchievements.feedback}
                  </p>
                  <div className="bg-blue-50 p-2 rounded">
                    <h5 className="font-medium text-blue-800 mb-1">Suggestions:</h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      {result.improvements.quantifiableAchievements.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Readability */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium flex items-center gap-2">
                    👁️ Readability
                  </h4>
                  <Badge variant={getScoreBadgeVariant(result.improvements.readability.score)}>
                    {result.improvements.readability.score}/100
                  </Badge>
                </div>
                <Progress value={result.improvements.readability.score} className="h-2" />
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    {result.improvements.readability.feedback}
                  </p>
                  <div className="bg-blue-50 p-2 rounded">
                    <h5 className="font-medium text-blue-800 mb-1">Suggestions:</h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      {result.improvements.readability.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Formatting */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium flex items-center gap-2">
                    🎨 Formatting
                  </h4>
                  <Badge variant={getScoreBadgeVariant(result.improvements.formatting.score)}>
                    {result.improvements.formatting.score}/100
                  </Badge>
                </div>
                <Progress value={result.improvements.formatting.score} className="h-2" />
                {result.improvements.formatting.issues.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <h5 className="font-medium text-red-800 mb-2">Issues Found:</h5>
                    <ul className="text-sm text-red-700 space-y-1">
                      {result.improvements.formatting.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Suggestions:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {result.improvements.formatting.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sections" className="p-6 space-y-6">
              <h3 className="text-lg font-semibold mb-4">Section Analysis</h3>
              
              <div className="grid gap-6">
                {Object.entries(result.sectionAnalysis).map(([sectionName, analysis]) => (
                  <div key={sectionName} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium capitalize flex items-center gap-2">
                        {sectionName === 'contactInfo' && '📞'} 
                        {sectionName === 'summary' && '📄'} 
                        {sectionName === 'experience' && '💼'} 
                        {sectionName === 'education' && '🎓'} 
                        {sectionName === 'skills' && '🔧'} 
                        {sectionName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      <Badge variant={getScoreBadgeVariant(analysis.score)}>
                        {analysis.score}/100
                      </Badge>
                    </div>
                    <Progress value={analysis.score} className="h-2 mb-3" />
                    <p className="text-sm text-gray-700 mb-2">{analysis.feedback}</p>
                    <div className="bg-blue-50 p-3 rounded">
                      <h5 className="font-medium text-blue-800 mb-2">Suggestions:</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="p-6">
              <h3 className="text-lg font-semibold mb-4">Overall Action Items</h3>
              <div className="space-y-4">
                {result.overallSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-blue-800 flex-1">{suggestion}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">📈 Next Steps</h4>
                <ul className="text-sm text-green-700 space-y-2">
                  <li>• Implement the high-priority suggestions first</li>
                  <li>• Focus on areas with the lowest scores</li>
                  <li>• Add missing keywords naturally throughout your resume</li>
                  <li>• Test your revised resume with another analysis</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Analysis Metadata */}
      <Card className="border-0 shadow-lg bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Analysis ID: <code className="bg-white px-2 py-1 rounded">{result.analysisId}</code>
            </div>
            <div>
              Generated: {result.createdAt.toLocaleDateString()} at {result.createdAt.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}