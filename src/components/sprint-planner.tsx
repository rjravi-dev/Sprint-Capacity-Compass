
"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  getDay,
  format,
  isValid,
  addDays,
} from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, PlusCircle, Trash2, Bot, CircleCheck, AlertTriangle, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";
import { analyzeSprint } from "@/ai/flows/sprint-risk-flow";
import { type SprintAnalysisInput, type SprintAnalysisOutput } from "@/ai/schemas/sprint-analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportDocument } from "./report-document";


type Resource = {
  id: string;
  name: string;
  leaves: number;
};

function DatePicker({
  date,
  setDate,
  placeholder,
  disabled,
  disabledDays,
}: {
  date?: Date;
  setDate: (date?: Date) => void;
  placeholder: string;
  disabled?: boolean;
  disabledDays?: (date: Date) => boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={disabledDays}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function SprintPlanner() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [publicHolidays, setPublicHolidays] = useState<number>(0);
  const [resources, setResources] = useState<Resource[]>([
    { id: crypto.randomUUID(), name: "Developer 1", leaves: 2 },
    { id: crypto.randomUUID(), name: "Developer 2", leaves: 0 },
    { id: crypto.randomUUID(), name: "QA Engineer", leaves: 1 },
  ]);
  const [storyPointsPerSprint] = useState<number>(8);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SprintAnalysisOutput | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startDate) {
      const newEndDate = addDays(startDate, 20);
      setEndDate(newEndDate);
    } else {
      setEndDate(undefined);
    }
  }, [startDate]);

  const { totalCalendarDays, totalWeekendDays, baseWorkingDays } = useMemo(() => {
    if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
      return { totalCalendarDays: 0, totalWeekendDays: 0, baseWorkingDays: 0 };
    }

    const calendarDays = differenceInCalendarDays(endDate, startDate) + 1;
    if (calendarDays <= 0) return { totalCalendarDays: 0, totalWeekendDays: 0, baseWorkingDays: 0 };
    
    const daysInInterval = eachDayOfInterval({ start: startDate, end: endDate });
    const weekendDays = daysInInterval.filter(
      (day) => getDay(day) === 0 || getDay(day) === 6
    ).length;

    const workingDays = Math.max(0, calendarDays - weekendDays - publicHolidays);

    return {
      totalCalendarDays: calendarDays,
      totalWeekendDays: weekendDays,
      baseWorkingDays: workingDays,
    };
  }, [startDate, endDate, publicHolidays]);

  const handleAddResource = useCallback(() => {
    setResources((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: `Resource ${prev.length + 1}`, leaves: 0 },
    ]);
  }, []);

  const handleRemoveResource = useCallback((id: string) => {
    setResources((prev) => prev.filter((res) => res.id !== id));
  }, []);

  const handleUpdateResource = useCallback(
    (id: string, field: keyof Omit<Resource, 'id'>, value: string | number) => {
      setResources((prev) =>
        prev.map((res) => {
          if (res.id === id) {
            const parsedValue = typeof value === 'string' ? value : Math.max(0, Number(value) || 0);
            return { ...res, [field]: parsedValue };
          }
          return res;
        })
      );
    },
    []
  );

  const totalStoryPoints = useMemo(() => {
    const totalWorkingDaysInSprint = Math.max(0, 15 - publicHolidays); // 3 weeks * 5 weekdays/week = 15
    if (totalWorkingDaysInSprint <= 0) return 0;

    return resources.reduce((total, resource) => {
      const availableDays = Math.max(0, totalWorkingDaysInSprint - resource.leaves);
      const percentageOfSprintAvailable = availableDays / totalWorkingDaysInSprint;
      const contribution = percentageOfSprintAvailable * storyPointsPerSprint;
      return total + contribution;
    }, 0);
  }, [resources, publicHolidays, storyPointsPerSprint]);

  const downloadPdf = async () => {
    const reportElement = reportRef.current;
    if (!reportElement) return;

    const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`sprint-analysis-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) return;

    setIsGenerating(true);
    setAnalysisResult(null);
    setIsReportOpen(true);
    
    const input: SprintAnalysisInput = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        publicHolidays,
        resources: resources.map(({ name, leaves }) => ({ name, leaves })),
        totalStoryPoints: parseFloat(totalStoryPoints.toFixed(1)),
    };

    try {
        const result = await analyzeSprint(input);
        setAnalysisResult(result);
    } catch (error) {
        console.error("Failed to generate report:", error);
        // You can add a toast notification here to inform the user.
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="lg:col-span-2">
            <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary">1. Sprint Details</CardTitle>
                <CardDescription>
                Select a sprint start date (must be a Wednesday). The sprint will be 3 weeks long.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="start-date">Sprint Start Date</Label>
                    <DatePicker
                    date={startDate}
                    setDate={setStartDate}
                    placeholder="Select a Wednesday"
                    disabledDays={(date) => getDay(date) !== 3}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end-date">Sprint End Date</Label>
                    <Input
                    id="end-date"
                    value={endDate ? format(endDate, "PPP") : "Automatically calculated"}
                    readOnly
                    className="bg-muted/50"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="public-holidays">General Public Holidays</Label>
                    <Input
                    id="public-holidays"
                    type="number"
                    min="0"
                    value={publicHolidays}
                    onChange={(e) => setPublicHolidays(Number(e.target.value) || 0)}
                    placeholder="e.g., 1"
                    />
                </div>
                </div>
            </CardContent>
            {startDate && endDate && (
                <CardFooter className="bg-muted/50 p-4 rounded-b-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Calendar Days</p>
                        <p className="text-2xl font-bold text-primary"><AnimatedNumber value={totalCalendarDays} /></p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Weekend Days</p>
                        <p className="text-2xl font-bold text-primary"><AnimatedNumber value={totalWeekendDays} /></p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Public Holidays</p>
                        <p className="text-2xl font-bold text-primary"><AnimatedNumber value={publicHolidays} /></p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Base Working Days</p>
                        <p className="text-2xl font-bold text-primary"><AnimatedNumber value={baseWorkingDays} /></p>
                    </div>
                </CardFooter>
            )}
            </Card>
        </div>

        <div className="lg:col-span-2">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary">2. Resource Details</CardTitle>
                    <CardDescription>
                        Add team members and their planned time off. Each resource can deliver a maximum of {storyPointsPerSprint} story points per sprint.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Resource Name</TableHead>
                                <TableHead>Planned Leave</TableHead>
                                <TableHead>Effective Days</TableHead>
                                <TableHead className="text-right">Story Points</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {resources.map((resource) => {
                            const totalWorkingDaysInSprint = Math.max(0, 15 - publicHolidays);
                            const effectiveWorkingDays = Math.max(0, totalWorkingDaysInSprint - resource.leaves);
                            const percentageOfSprintAvailable = totalWorkingDaysInSprint > 0 ? effectiveWorkingDays / totalWorkingDaysInSprint : 0;
                            const storyPointContribution = percentageOfSprintAvailable * storyPointsPerSprint;

                            return (
                                <TableRow key={resource.id}>
                                    <TableCell>
                                        <Input value={resource.name} onChange={e => handleUpdateResource(resource.id, 'name', e.target.value)} placeholder="Resource name" />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" min="0" value={resource.leaves} onChange={e => handleUpdateResource(resource.id, 'leaves', e.target.value)} />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <p className="font-bold text-lg text-primary"><AnimatedNumber value={effectiveWorkingDays}/></p>
                                        <p className="text-xs text-muted-foreground font-code">({totalWorkingDaysInSprint} - {resource.leaves})</p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <p className="font-bold text-lg text-primary"><AnimatedNumber value={storyPointContribution}/></p>
                                        <p className="text-xs text-muted-foreground font-code">({(percentageOfSprintAvailable * 100).toFixed(0)}% of {storyPointsPerSprint})</p>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveResource(resource.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleAddResource} variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Resource
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>

      <Card className="shadow-md sticky top-6">
        <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">3. Sprint Summary</CardTitle>
            <CardDescription>
            The total capacity for this sprint, and AI-powered insights.
            </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Total Available Story Points</p>
            <p className="text-6xl font-bold text-primary tracking-tighter">
                <AnimatedNumber value={totalStoryPoints} />
            </p>
        </CardContent>
        <CardFooter className="justify-center">
            <Button onClick={handleGenerateReport} disabled={!startDate || isGenerating}>
                <Bot className="mr-2 h-4 w-4" />
                {isGenerating ? "Analyzing..." : "Generate AI Report"}
            </Button>
        </CardFooter>
      </Card>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Bot /> AI Sprint Analysis Report
            </DialogTitle>
            <DialogDescription>
              Here are the AI-generated insights based on your sprint plan.
            </DialogDescription>
          </DialogHeader>
          {isGenerating && (
            <div className="space-y-6 pt-4">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
          )}
          {analysisResult && (
            <div className="space-y-6 pt-4 text-sm">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-destructive/90">
                        <AlertTriangle /> Potential Risks
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-card-foreground">
                        {analysisResult.risks.map((risk, index) => <li key={index}>{risk}</li>)}
                    </ul>
                </div>
                 <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-primary/90">
                        <CircleCheck /> Best Practices
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-card-foreground">
                        {analysisResult.bestPractices.map((practice, index) => <li key={index}>{practice}</li>)}
                    </ul>
                </div>
                 <div className="flex justify-end pt-4">
                    <Button onClick={downloadPdf}>
                        <FileDown className="mr-2" /> Download PDF
                    </Button>
                 </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {analysisResult && (
        <div className="absolute -z-50 -left-[9999px] top-0">
            <ReportDocument 
                ref={reportRef}
                sprintData={{startDate, endDate, publicHolidays, resources, totalStoryPoints, storyPointsPerSprint}}
                analysisResult={analysisResult} 
            />
        </div>
      )}
    </div>
  );
}
