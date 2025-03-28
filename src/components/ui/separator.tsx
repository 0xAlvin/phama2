"use client"

import * as React from "react";
import { cn } from "@/lib/utils";
import '@/styles/components.css';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          orientation === "horizontal" ? "separator" : "separator-vertical",
          className
        )}
        role={decorative ? "none" : "separator"}
        aria-orientation={decorative ? undefined : orientation}
        {...props}
      />
    )
  }
)

Separator.displayName = "Separator"

export { Separator }
