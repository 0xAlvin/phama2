"use client"

import * as React from "react"

export function ToastProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
