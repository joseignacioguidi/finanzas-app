'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

interface AppShellProps {
  children: ReactNode
  title?: ReactNode
  headerRight?: ReactNode
}

export default function AppShell({ children, title, headerRight }: AppShellProps) {
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
      {/* Sidebar — solo desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar — solo desktop */}
        {(title || headerRight) && (
          <header
            className="hidden md:flex h-[50px] bg-white items-center justify-between px-6 shrink-0"
            style={{ borderBottom: '0.5px solid #e8e8e0' }}
          >
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">
              {title}
            </span>
            {headerRight && (
              <div className="flex items-center gap-2.5">{headerRight}</div>
            )}
          </header>
        )}

        {/* Contenido */}
        <main className="flex-1 min-w-0 px-4 py-4 md:px-6 md:py-5 overflow-x-hidden">
          {children}
        </main>

        {/* Bottom nav — solo mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
