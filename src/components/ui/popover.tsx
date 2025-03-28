"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const PopoverContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>({
  open: false,
  onOpenChange: () => {},
})

const Popover: React.FC<PopoverProps> = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setUncontrolledOpen(open)
      onOpenChange?.(open)
    },
    [onOpenChange]
  )

  return (
    <PopoverContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </PopoverContext.Provider>
  )
}

const usePopoverContext = () => {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error("Popover components must be used within a Popover")
  }
  return context
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  const { onOpenChange, open } = usePopoverContext()
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      ref,
      onClick: (e: React.MouseEvent) => {
        onOpenChange(!open)
        children.props.onClick?.(e)
      },
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpenChange(!open)}
      {...props}
    >
      {children}
    </button>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "center" | "start" | "end"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
    const { open, onOpenChange } = usePopoverContext()
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const contentRef = useRef<HTMLDivElement | null>(null)
    
    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          onOpenChange(false)
        }
      }

      if (open) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [open, onOpenChange])

    if (!open) {
      return null
    }

    return (
      <div
        ref={contentRef}
        className={cn(
          "z-50 w-72 rounded-md border border-gray-200 bg-white p-4 shadow-md",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
