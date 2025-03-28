"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastViewport,
  ToastContext, // Now correctly imported as an export
} from "@/components/ui/toast"

export function Toaster() {
  const [isMounted, setIsMounted] = React.useState(false)
  const context = React.useContext(ToastContext)

  if (!context) {
    throw new Error("Toaster must be used within a ToastProvider")
  }

  const { toasts, removeToast } = context
  
  // Only render in browser, not during SSR
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }
  
  // Only attempt to create portal if we're client-side and mounted
  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <ToastViewport>
      {toasts.map(({ id, title, description, action, visible, variant, onClose }) => (
        <Toast 
          key={id}
          variant={variant}
          visible={visible}
          onClose={() => {
            onClose?.()
            removeToast(id)
          }}
        >
          <div className="toast-content">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action && <ToastAction>{action}</ToastAction>}
        </Toast>
      ))}
    </ToastViewport>,
    document.body
  )
}
