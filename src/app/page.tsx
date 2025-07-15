import { SprintPlanner } from "@/components/sprint-planner";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline tracking-tight">
            Sprint Capacity Compass
          </h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
            Plan your sprint resources by calculating effective working days and total story points.
          </p>
        </header>
        <main>
          <SprintPlanner />
        </main>
      </div>
    </div>
  );
}
