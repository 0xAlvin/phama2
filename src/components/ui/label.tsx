"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import "@/styles/components.css" // Change to absolute import

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn("label", className)}
      {...props}
    />
  )
})

Label.displayName = "Label"

export { Label }
