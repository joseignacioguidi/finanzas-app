'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, CalendarDays, Tag, BarChart2, Target, User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth'

const sections = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, activeSegment: 'dashboard' },
      { href: '/transactions', label: 'Transacciones', icon: ArrowLeftRight, activeSegment: 'transactions' },
      { href: '/calendar', label: 'Calendario', icon: CalendarDays, activeSegment: 'calendar' },
      { href: '/categories', label: 'Categorías', icon: Tag, activeSegment: 'categories' },
      { href: '/budgets', label: 'Presupuestos', icon: Target, activeSegment: 'budgets' },
      { href: '/reports', label: 'Reportes', icon: BarChart2, activeSegment: 'reports' },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { href: '/profile', label: 'Perfil', icon: User, activeSegment: 'profile' },
      { href: '/profile', label: 'Configuración', icon: Settings, activeSegment: '__none__' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    router.push('/')
  }

  const segment = pathname.split('/')[1] ?? ''
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U'
  const displayName = user?.email?.split('@')[0] ?? ''

  return (
    <aside
      className="w-[200px] shrink-0 flex flex-col h-screen sticky top-0"
      style={{ background: '#1a1a2e' }}
    >
      {/* Logo */}
      <div
        className="px-[18px] pt-5 pb-[18px]"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)', marginBottom: 14 }}
      >
        <div className="text-[15px] font-medium text-white">Finanzas</div>
        <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Gestión personal
        </div>
      </div>

      {/* Nav sections */}
      {sections.map(section => (
        <div key={section.label} className="px-2.5 mb-[18px]">
          <div
            className="text-[9px] uppercase tracking-[0.08em] px-2 mb-[5px]"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {section.label}
          </div>
          {section.items.map(({ href, label, icon: Icon, activeSegment }) => {
            const active = activeSegment !== '__none__' && segment === activeSegment
            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                className="flex items-center gap-2.5 px-2 py-2 rounded-[7px] mb-px transition-colors duration-100"
                style={{ background: active ? 'rgba(255,255,255,0.1)' : 'transparent' }}
              >
                <div
                  className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0"
                  style={{ background: active ? 'rgba(255,255,255,0.15)' : 'transparent' }}
                >
                  <Icon
                    size={12}
                    style={{ color: active ? '#fff' : 'rgba(255,255,255,0.45)' }}
                  />
                </div>
                <span
                  className="text-[12px]"
                  style={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      ))}

      {/* User footer */}
      <div
        className="mt-auto px-[18px] py-[14px] flex items-center gap-2.5"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white font-medium shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {displayName}
          </div>
          <div className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {user?.email ?? ''}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-1 rounded transition-opacity hover:opacity-70 shrink-0"
          title="Cerrar sesión"
        >
          <LogOut size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
        </button>
      </div>
    </aside>
  )
}
