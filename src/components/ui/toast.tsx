"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import "@/styles/components.css" // Change to absolute import

// Create a portal for toasts
import { createPortal } from "react-dom"

// Change to export const so it's visible to importing modules
export const ToastContext = React.createContext<{
  toasts: Toast[];
  addToast: (toast: ToastProps) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<ToastProps>) => void;
}>({
  toasts: [],
  addToast: () => "",
  removeToast: () => {},
  updateToast: () => {},
})

interface Toast extends ToastProps {
  id: string
  timer: number | null
  visible: boolean
}

export interface ToastProps {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
  duration?: number
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  className?: string
}

export const ToastProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback(
    (toast: ToastProps) => {
      const id = Math.random().toString(36).slice(2, 11)
      const duration = toast.duration || 5000

      setToasts((prevToasts) => [
        ...prevToasts,
        {
          ...toast,
          id,
          timer: duration ? window.setTimeout(() => {
            removeToast(id)
          }, duration) : null,
          visible: true,
        },
      ])

      return id
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((prevToasts) => {
      const updatedToasts = prevToasts.map((toast) => 
        toast.id === id ? { ...toast, visible: false } : toast
      )
      return updatedToasts
    })
    
    // After animation completes, remove the toast
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, 300)
  }, [])

  const updateToast = React.useCallback(
    (id: string, toast: Partial<ToastProps>) => {
      setToasts((prevToasts) =>
        prevToasts.map((t) => (t.id === id ? { ...t, ...toast } : t))
      )
    },
    []
  )

  // Clear timeouts when component unmounts
  React.useEffect(() => {
    return () => {
      toasts.forEach((toast) => {
        if (toast.timer) window.clearTimeout(toast.timer)
      })
    }
  }, [toasts])

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, updateToast }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  
  return {
    toast: (props: ToastProps) => {
      return context.addToast(props)
    },
    dismiss: (id: string) => {
      context.removeToast(id)
    },
    update: (id: string, props: Partial<ToastProps>) => {
      context.updateToast(id, props)
    },
  }
}

export const ToastViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("toast-container", className)}
      {...props}
    />
  )
})
ToastViewport.displayName = "ToastViewport"

export const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "destructive"
    visible?: boolean
    onClose?: () => void
  }
>(({ className, variant = "default", visible = true, onClose, children, ...props }, ref) => {
  const animationClass = visible ? "toast-animate-in" : "toast-animate-out"
  
  return (
    <div
      ref={ref}
      className={cn(
        "toast",
        variant === "destructive" && "toast-destructive",
        animationClass,
        className
      )}
      data-state={visible ? "open" : "closed"}
      {...props}
    >
      {children}
      {onClose && (
        <button 
          className="toast-close" 
          onClick={onClose}
          aria-label="Close"
        >
          <X className="toast-close-icon" />
        </button>
      )}
    </div>
  )
})
Toast.displayName = "Toast"

export const ToastTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("toast-title", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

export const ToastDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("toast-description", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

export const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn("toast-action", className)}
    {...props}
  />
))
ToastAction.displayName = "ToastAction"

// Add the same styles from components.css - already done
// The styles for toast are already defined in components.css
