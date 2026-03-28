'use client'

import { RendererSessionProvider } from '@renderer/auth/client'
import { ToastProvider } from "@/contexts/ToastContext"
import { QueryProvider } from "@/components/providers/QueryProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RendererSessionProvider>
      <QueryProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </QueryProvider>
    </RendererSessionProvider>
  )
}
