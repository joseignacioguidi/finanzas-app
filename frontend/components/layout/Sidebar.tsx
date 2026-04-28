'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Tag, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transacciones', icon: ArrowLeftRight },
  { href: '/categories', label: 'Categorías', icon: Tag },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    router.push('/')
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen sticky top-0 border-r border-[var(--color-border)] bg-[var(--color-bg-surface)]">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <span className="text-base font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          finanzas
          <span className="text-[var(--color-brand)]">.</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[var(--color-brand-bg)] text-[var(--color-brand)] border-l-2 border-[var(--color-brand)] pl-[10px]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-primary)]',
              ].join(' ')}
            >
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-[var(--color-border)]">
        <div className="px-3 mb-2">
          <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-expense)] transition-all duration-150"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
