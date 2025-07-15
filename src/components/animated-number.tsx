"use client";

import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  return (
    <span key={value} className={cn("inline-block animate-in fade-in-50 slide-in-from-bottom-3 duration-500", className)}>
      {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
    </span>
  );
}
