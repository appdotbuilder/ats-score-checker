import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas and handlers
import { 
  atsAnalysisInputSchema,
  atsAnalysisResultSchema,
} from './schema';
import { analyzeResume } from './handlers/analyze_resume';
import { saveAnalysis } from './handlers/save_analysis';
import { getAnalysis, getAllAnalyses } from './handlers/get_analysis';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Main ATS analysis endpoint
  analyzeResume: publicProcedure
    .input(atsAnalysisInputSchema)
    .mutation(async ({ input }) => {
      const analysisResult = await analyzeResume(input);
      
      // Save analysis to database for future reference
      await saveAnalysis({
        analysisId: analysisResult.analysisId,
        jobDescription: input.jobDescription,
        keywords: input.keywords || null,
        resumeFileName: null, // Could extract filename from resumeFile input
        atsScore: analysisResult.atsScore,
        analysisResult: analysisResult as any, // Store full analysis as JSON
      });
      
      return analysisResult;
    }),

  // Get a specific analysis by ID
  getAnalysis: publicProcedure
    .input(z.object({ analysisId: z.string() }))
    .query(({ input }) => getAnalysis(input.analysisId)),

  // Get all analyses (with optional limit)
  getAllAnalyses: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => getAllAnalyses(input.limit)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`ATS Score Checker API server listening at port: ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  POST /trpc/analyzeResume - Analyze resume against job description`);
  console.log(`  GET /trpc/getAnalysis - Get analysis by ID`);
  console.log(`  GET /trpc/getAllAnalyses - Get all analyses`);
  console.log(`  GET /trpc/healthcheck - Health check`);
}

start();