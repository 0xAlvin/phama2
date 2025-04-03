"use client";

// This file is now a simplified stub that does nothing,
// keeping the same API to avoid breaking imports

import * as React from "react";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useToast = () => {
  return {
    toasts: [],
    toast: () => "",
    dismiss: () => {},
    dismissAll: () => {},
  };
};

export interface UseToastType {
  toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => void;
}
