"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import "@/styles/components.css"

import { createPortal } from "react-dom"

// Simple dummy context for components that expect it
export const ToastContext = React.createContext<{
  toasts: any[];
  addToast: () => string;
  removeToast: () => void;
  updateToast: () => void;
}>({
  toasts: [],
  addToast: () => "",
  removeToast: () => {},
  updateToast: () => {},
})

// Empty interface for backward compatibility
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

// Simplified provider that does nothing
export const ToastProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return <>{children}</>
}

// Simplified hook that does nothing
export const useToast = () => {
  return {
    toast: () => {},
    dismiss: () => {},
    update: () => {},
  }
}

// Keep component definitions but make them simple
export const ToastViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} {...props} />
})
ToastViewport.displayName = "ToastViewport"

export const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "destructive"
    visible?: boolean
    onClose?: () => void
  }
>(({ children, ...props }, ref) => {
  return <div ref={ref} {...props}>{children}</div>
})
Toast.displayName = "Toast"

export const ToastTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
))
ToastTitle.displayName = "ToastTitle"

export const ToastDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
))
ToastDescription.displayName = "ToastDescription"

export const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => (
  <button ref={ref} {...props}>{children}</button>
))
ToastAction.displayName = "ToastAction"
