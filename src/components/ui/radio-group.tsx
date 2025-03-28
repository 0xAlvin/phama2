"use client"

import * as React from "react"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

type RadioGroupContextValue = {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({
  value: undefined,
  onValueChange: undefined,
})

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  RadioGroupProps
>(({ className, defaultValue, value, onValueChange, ...props }, ref) => {
  const [selectedValue, setSelectedValue] = React.useState<string | undefined>(defaultValue)
  
  const contextValue = {
    value: value !== undefined ? value : selectedValue,
    onValueChange: React.useCallback((newValue: string) => {
      setSelectedValue(newValue)
      onValueChange?.(newValue)
    }, [onValueChange])
  }
  
  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div ref={ref} className={cn("grid gap-2", className)} {...props} />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value: string
}

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  RadioGroupItemProps
>(({ className, value, id, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext)
  const checked = context.value === value
  const itemId = id || `radio-${value}`
  
  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <input
          ref={ref}
          type="radio"
          id={itemId}
          className="sr-only"
          value={value}
          checked={checked}
          onChange={(e) => {
            if (e.target.checked) {
              context.onValueChange?.(value)
            }
          }}
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 rounded-full border border-blue-600 flex items-center justify-center",
            checked ? "border-blue-600" : "border-gray-300",
            className
          )}
        >
          {checked && (
            <Circle className="h-2.5 w-2.5 fill-current text-blue-600" />
          )}
        </div>
      </div>
    </div>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
