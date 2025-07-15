/**
 * @fileOverview Schemas and types for sprint analysis.
 */
import { z } from 'zod';

const ResourceSchema = z.object({
  name: z.string(),
  leaves: z.number(),
});

export const SprintAnalysisInputSchema = z.object({
  startDate: z.string().describe('The start date of the sprint.'),
  endDate: z.string().describe('The end date of the sprint.'),
  publicHolidays: z.number().describe('Number of public holidays during the sprint.'),
  resources: z.array(ResourceSchema).describe('List of resources and their planned leave days.'),
  totalStoryPoints: z.number().describe('Total story points the team can commit to.'),
});
export type SprintAnalysisInput = z.infer<typeof SprintAnalysisInputSchema>;

export const SprintAnalysisOutputSchema = z.object({
  risks: z.array(z.string()).describe('A list of potential risks for the sprint based on the provided data. Be specific and actionable.'),
  bestPractices: z.array(z.string()).describe('A list of recommended best practices for a successful sprint. These should be generally applicable but tailored to the team composition if possible.'),
});
export type SprintAnalysisOutput = z.infer<typeof SprintAnalysisOutputSchema>;
