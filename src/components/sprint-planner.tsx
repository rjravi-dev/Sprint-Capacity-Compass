"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  getDay,
  format,
  isValid,
} from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
  TableCaption
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";
import { useToast } from "@/hooks/use-toast";

type Resource = {
  id: string;
  name: string;
  holidays: number;
  leaves: number;
};

function DatePicker({
  date,
  setDate,
  placeholder,
  disabled,
}: {
  date?: Date;
  setDate: (date?: Date) => void;
  placeholder: string;
  disabled?: boolean;
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
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function SprintPlanner() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [publicHolidays, setPublicHolidays] = useState<number>(0);
  const [resources, setResources] = useState<Resource[]>([
    { id: crypto.randomUUID(), name: "Developer 1", holidays: 0, leaves: 2 },
    { id: crypto.randomUUID(), name: "Developer 2", holidays: 0, leaves: 0 },
    { id: crypto.randomUUID(), name: "QA Engineer", holidays: 1, leaves: 0 },
  ]);
  const [storyPointsPerDay, setStoryPointsPerDay] = useState<number>(8);

  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
        toast({
            variant: "destructive",
            title: "Invalid Date Range",
            description: "Sprint start date cannot be after the end date.",
        });
        setEndDate(undefined);
    }
  }, [startDate, endDate, toast]);

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
      { id: crypto.randomUUID(), name: `Resource ${prev.length + 1}`, holidays: 0, leaves: 0 },
    ]);
  }, []);

  const handleRemoveResource = useCallback((id: string) => {
    setResources((prev) => prev.filter((res) => res.id !== id));
  }, []);

  const handleUpdateResource = useCallback(
    (id: string, field: keyof Resource, value: string | number) => {
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
    return resources.reduce((total, resource) => {
      const effectiveWorkingDays = Math.max(0, baseWorkingDays - resource.holidays - resource.leaves);
      const contribution = effectiveWorkingDays * storyPointsPerDay;
      return total + contribution;
    }, 0);
  }, [resources, baseWorkingDays, storyPointsPerDay]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-3 space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">1. Sprint Details</CardTitle>
            <CardDescription>
              Enter your sprint timeline and general holidays.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start-date">Sprint Start Date</Label>
                <DatePicker
                  date={startDate}
                  setDate={setStartDate}
                  placeholder="Select start date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Sprint End Date</Label>
                <DatePicker
                  date={endDate}
                  setDate={setEndDate}
                  placeholder="Select end date"
                  disabled={!startDate}
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
                    Add team members and their time off. Story points are calculated at
                    <Input 
                        type="number" 
                        value={storyPointsPerDay} 
                        onChange={e => setStoryPointsPerDay(Number(e.target.value) || 0)} 
                        className="inline-block w-16 mx-1 h-8 text-center"
                    /> 
                    points per day.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Resource Name</TableHead>
                            <TableHead>Holidays</TableHead>
                            <TableHead>Planned Leave</TableHead>
                            <TableHead>Effective Days</TableHead>
                            <TableHead className="text-right">Story Points</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {resources.map((resource) => {
                        const effectiveWorkingDays = Math.max(0, baseWorkingDays - resource.holidays - resource.leaves);
                        const storyPointContribution = effectiveWorkingDays * storyPointsPerDay;
                        return (
                            <TableRow key={resource.id}>
                                <TableCell>
                                    <Input value={resource.name} onChange={e => handleUpdateResource(resource.id, 'name', e.target.value)} placeholder="Resource name" />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" min="0" value={resource.holidays} onChange={e => handleUpdateResource(resource.id, 'holidays', e.target.value)} />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" min="0" value={resource.leaves} onChange={e => handleUpdateResource(resource.id, 'leaves', e.target.value)} />
                                </TableCell>
                                <TableCell className="text-center">
                                    <p className="font-bold text-lg text-primary"><AnimatedNumber value={effectiveWorkingDays}/></p>
                                    <p className="text-xs text-muted-foreground font-code">({baseWorkingDays} - {resource.holidays} - {resource.leaves})</p>
                                </TableCell>
                                <TableCell className="text-right">
                                    <p className="font-bold text-lg text-primary"><AnimatedNumber value={storyPointContribution}/></p>
                                    <p className="text-xs text-muted-foreground font-code">({effectiveWorkingDays} * {storyPointsPerDay})</p>
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

      <div className="lg:col-span-1">
        <Card className="shadow-md sticky top-6">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">3. Sprint Summary</CardTitle>
             <CardDescription>
                The total capacity for this sprint.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Total Available Story Points</p>
            <p className="text-6xl font-bold text-primary tracking-tighter">
                <AnimatedNumber value={totalStoryPoints} />
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
