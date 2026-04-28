'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/')
    }
  }, [token, loading, router])

  if (loading || !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg-base)]">
        <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-base)]">
      <Sidebar />
      <main className="flex-1 min-w-0 px-8 py-8">{children}</main>
    </div>
  )
}
