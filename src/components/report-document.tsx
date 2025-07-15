
"use client";

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { type SprintAnalysisOutput } from '@/ai/schemas/sprint-analysis';
import { CircleCheck, AlertTriangle } from 'lucide-react';

type Resource = {
  id: string;
  name: string;
  leaves: number;
};

type SprintData = {
  startDate?: Date;
  endDate?: Date;
  publicHolidays: number;
  resources: Resource[];
  totalStoryPoints: number;
  storyPointsPerSprint: number;
};

type ReportDocumentProps = {
  sprintData: SprintData;
  analysisResult: SprintAnalysisOutput;
};

export const ReportDocument = forwardRef<HTMLDivElement, ReportDocumentProps>(({ sprintData, analysisResult }, ref) => {
  const { startDate, endDate, publicHolidays, resources, totalStoryPoints, storyPointsPerSprint } = sprintData;
  
  const totalWorkingDaysInSprint = 15 - publicHolidays;

  return (
    <div ref={ref} className="p-8 bg-background text-foreground w-[800px]">
      <div className="space-y-8">
        <header className="text-center">
            <h1 className="text-4xl font-bold text-primary">Sprint Analysis Report</h1>
            <p className="text-muted-foreground mt-2 text-lg">
                Generated on {format(new Date(), 'PPP')}
            </p>
        </header>

        <Card>
            <CardHeader>
                <CardTitle>Sprint Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div><strong>Start Date:</strong> {startDate ? format(startDate, 'PPP') : 'N/A'}</div>
                <div><strong>End Date:</strong> {endDate ? format(endDate, 'PPP') : 'N/A'}</div>
                <div><strong>Public Holidays:</strong> {publicHolidays}</div>
                <div><strong>Total Story Points:</strong> <span className="font-bold text-primary text-xl">{totalStoryPoints.toFixed(1)}</span></div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Resource Plan</CardTitle>
                <CardDescription>
                    Maximum story points per resource: {storyPointsPerSprint}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Resource Name</TableHead>
                            <TableHead>Planned Leave</TableHead>
                            <TableHead>Effective Days</TableHead>
                            <TableHead className="text-right">Story Points</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {resources.map((resource) => {
                        const effectiveWorkingDays = Math.max(0, totalWorkingDaysInSprint - resource.leaves);
                        const percentageOfSprintAvailable = totalWorkingDaysInSprint > 0 ? effectiveWorkingDays / totalWorkingDaysInSprint : 0;
                        const storyPointContribution = percentageOfSprintAvailable * storyPointsPerSprint;

                        return (
                            <TableRow key={resource.id}>
                                <TableCell>{resource.name}</TableCell>
                                <TableCell>{resource.leaves} day(s)</TableCell>
                                <TableCell>{effectiveWorkingDays} / {totalWorkingDaysInSprint}</TableCell>
                                <TableCell className="text-right">{storyPointContribution.toFixed(1)}</TableCell>
                            </TableRow>
                        );
                    })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="text-destructive" /> Potential Risks
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-card-foreground">
                    {analysisResult.risks.map((risk, index) => <li key={`risk-${index}`}>{risk}</li>)}
                </ul>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CircleCheck className="text-primary" /> Best Practices
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-card-foreground">
                    {analysisResult.bestPractices.map((practice, index) => <li key={`practice-${index}`}>{practice}</li>)}
                </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  );
});

ReportDocument.displayName = 'ReportDocument';
