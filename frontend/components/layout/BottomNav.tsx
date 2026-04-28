'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, User } from 'lucide-react'

const tabs = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, segment: 'dashboard' },
  { href: '/transactions', label: 'Movim.', icon: ArrowLeftRight, segment: 'transactions' },
  { href: '/profile', label: 'Perfil', icon: User, segment: 'profile' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const segment = pathname.split('/')[1] ?? ''

  return (
    <nav
      className="h-[54px] bg-white flex items-center justify-around px-4 shrink-0"
      style={{ borderTop: '0.5px solid #e0e0d8' }}
    >
      {tabs.map(({ href, label, icon: Icon, segment: seg }) => {
        const active = segment === seg
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 py-1 px-3"
          >
            <Icon
              size={20}
              strokeWidth={active ? 2 : 1.5}
              style={{ color: active ? '#1a1a2e' : '#aaa' }}
            />
            <span
              className="text-[10px]"
              style={{ color: active ? '#1a1a2e' : '#aaa', fontWeight: active ? 500 : 400 }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
