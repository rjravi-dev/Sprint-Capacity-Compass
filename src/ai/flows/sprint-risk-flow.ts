'use server';
/**
 * @fileOverview An AI agent for analyzing sprint plans.
 *
 * - analyzeSprint - A function that handles the sprint analysis process.
 */

import { ai } from '@/ai/genkit';
import { SprintAnalysisInputSchema, SprintAnalysisOutputSchema, type SprintAnalysisInput, type SprintAnalysisOutput } from '@/ai/schemas/sprint-analysis';

export async function analyzeSprint(input: SprintAnalysisInput): Promise<SprintAnalysisOutput> {
  return sprintAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sprintAnalysisPrompt',
  input: { schema: SprintAnalysisInputSchema },
  output: { schema: SprintAnalysisOutputSchema },
  prompt: `You are an expert Agile project manager. Analyze the following sprint plan and identify potential risks and recommend best practices.

Sprint Details:
- Start Date: {{startDate}}
- End Date: {{endDate}}
- Public Holidays: {{publicHolidays}}
- Total Committable Story Points: {{totalStoryPoints}}

Team Composition and Availability:
{{#each resources}}
- {{name}} has {{leaves}} day(s) of leave.
{{/each}}

Based on this information, provide a concise list of potential risks. Consider factors like:
- High number of leave days for one or more resources creating a single point of failure.
- Overall team capacity reduction due to holidays and leave.
- The impact of a short sprint or many non-working days.

Then, provide a list of actionable best practices to mitigate these risks and ensure a successful sprint.
`,
});

const sprintAnalysisFlow = ai.defineFlow(
  {
    name: 'sprintAnalysisFlow',
    inputSchema: SprintAnalysisInputSchema,
    outputSchema: SprintAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
