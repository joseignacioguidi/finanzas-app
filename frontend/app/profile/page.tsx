'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getTransactions, getMe, updateBaseCurrency } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import AppShell from '@/components/layout/AppShell'
import type { User } from '@/lib/types'

const CURRENCY_LABELS: Record<string, string> = {
  ARS: 'Peso argentino (ARS)',
  USD: 'Dólar estadounidense (USD)',
  EUR: 'Euro (EUR)',
}

function monthsSince(dateStr: string): number {
  if (!dateStr) return 0
  const start = new Date(dateStr)
  const now = new Date()
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
}

export default function ProfilePage() {
  const { user: authUser, login, logout } = useAuth()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(authUser)
  const [txCount, setTxCount] = useState<number | null>(null)
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [savingCurrency, setSavingCurrency] = useState(false)
  const [currencyError, setCurrencyError] = useState('')

  useEffect(() => {
    getMe().then(me => {
      setUser(me)
      const token = localStorage.getItem('token')
      if (token) login(token, me)
    }).catch(() => {})
    getTransactions({})
      .then(txs => setTxCount(txs.length))
      .catch(() => setTxCount(0))
  }, [])

  async function handleCurrencyChange(currency: string) {
    setSavingCurrency(true)
    setCurrencyError('')
    try {
      const updated = await updateBaseCurrency(currency)
      setUser(updated)
      const token = localStorage.getItem('token')
      if (token) login(token, updated)
    } catch (err: any) {
      setCurrencyError(err.message ?? 'Error al guardar')
    } finally {
      setSavingCurrency(false)
    }
  }

  function handleLogout() {
    logout()
    router.push('/')
  }

  const email = user?.email ?? authUser?.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()
  const displayName = email.split('@')[0] ?? ''
  const since = user?.created_at ? new Date(user.created_at).toLocaleDateString('es', { month: 'long', year: 'numeric' }) : '—'
  const months = user?.created_at ? monthsSince(user.created_at) : 0
  const baseCurrency = user?.base_currency ?? 'ARS'

  const headerRight = (
    <button
      className="h-[30px] px-3 rounded-[7px] text-[11px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-overlay)]"
      style={{ background: '#f7f7f2', border: '0.5px solid #d0d0cc' }}
    >
      Editar perfil
    </button>
  )

  return (
    <AppShell title="Mi perfil" headerRight={headerRight}>
      {/* Título mobile */}
      <h1
        className="md:hidden text-[18px] font-medium text-[var(--color-text-primary)] mb-4"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Mi perfil
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 max-w-4xl">

        {/* ── TARJETA DE PERFIL ── */}
        <div
          className="bg-white rounded-[10px] p-5 flex flex-col items-center gap-2"
          style={{ border: '0.5px solid #e8e8e0' }}
        >
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-medium text-white"
            style={{ background: '#1a1a2e' }}
          >
            {initials}
          </div>
          <div className="text-[15px] font-medium text-[var(--color-text-primary)]">{displayName}</div>
          <div className="text-[11px] text-[var(--color-text-muted)]">{email}</div>

          {/* Separador */}
          <div className="w-full h-px my-1" style={{ background: '#e8e8e0' }} />

          {/* Stats */}
          <div className="flex gap-2 w-full">
            <div className="flex-1 rounded-[7px] p-2.5 text-center" style={{ background: '#f7f7f2' }}>
              <div className="text-[18px] font-medium text-[var(--color-text-primary)]">
                {txCount ?? '—'}
              </div>
              <div className="text-[9px] text-[var(--color-text-muted)] mt-0.5">Transacciones</div>
            </div>
            <div className="flex-1 rounded-[7px] p-2.5 text-center" style={{ background: '#f7f7f2' }}>
              <div className="text-[18px] font-medium text-[var(--color-text-primary)]">
                {months}
              </div>
              <div className="text-[9px] text-[var(--color-text-muted)] mt-0.5">Meses activo</div>
            </div>
          </div>

          <div className="w-full h-px my-1" style={{ background: '#e8e8e0' }} />

          <div className="text-[10px] text-[var(--color-text-muted)]">
            Miembro desde {since}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full h-8 rounded-[8px] text-[11px] font-medium mt-2 transition-colors hover:bg-red-50"
            style={{ border: '0.5px solid #dc2626', color: '#dc2626' }}
          >
            Cerrar sesión
          </button>
        </div>

        {/* ── PANELES DE CONFIGURACIÓN ── */}
        <div className="flex flex-col gap-3">

          {/* Preferencias */}
          <div
            className="bg-white rounded-[10px] p-4"
            style={{ border: '0.5px solid #e8e8e0' }}
          >
            <div className="text-[12px] font-medium text-[var(--color-text-primary)] mb-2.5">
              Preferencias
            </div>

            {/* Moneda base */}
            <div
              className="flex items-start gap-3 py-2.5"
              style={{ borderBottom: '0.5px solid #e8e8e0' }}
            >
              <div
                className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: '#f7f7f2' }}
              >
                <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: '#0284c7' }} />
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-[var(--color-text-primary)] mb-1.5">Moneda base</div>
                <div className="flex gap-1.5 flex-wrap">
                  {(['ARS', 'USD', 'EUR'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      disabled={savingCurrency}
                      onClick={() => handleCurrencyChange(c)}
                      className="text-[10px] px-2.5 py-1 rounded-[8px] transition-all disabled:opacity-50"
                      style={
                        baseCurrency === c
                          ? { background: '#1a1a2e', color: '#fff', border: '0.5px solid #1a1a2e' }
                          : { background: '#f7f7f2', color: '#666', border: '0.5px solid #d0d0cc' }
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
                  {CURRENCY_LABELS[baseCurrency] ?? baseCurrency} · reportes y estadísticas
                </div>
                {currencyError && (
                  <div className="text-[10px] text-red-600 mt-1">{currencyError}</div>
                )}
              </div>
            </div>

            <SettingsRow iconColor="#9333ea" label="Notificaciones">
              <Toggle on={notifications} onToggle={() => setNotifications(v => !v)} />
            </SettingsRow>

            <SettingsRow iconColor="#ca8a04" label="Tema oscuro">
              <Toggle on={darkMode} onToggle={() => setDarkMode(v => !v)} />
            </SettingsRow>

            <SettingsRow iconColor="#16a34a" label="Inicio del mes" value="Día 1" last>
              <span className="text-[11px] text-[var(--color-text-muted)]">›</span>
            </SettingsRow>
          </div>

          {/* Cuenta y seguridad */}
          <div
            className="bg-white rounded-[10px] p-4"
            style={{ border: '0.5px solid #e8e8e0' }}
          >
            <div className="text-[12px] font-medium text-[var(--color-text-primary)] mb-2.5">
              Cuenta y seguridad
            </div>

            <SettingsRow iconColor="#475569" label="Cambiar contraseña">
              <span className="text-[11px] text-[var(--color-text-muted)]">›</span>
            </SettingsRow>

            <SettingsRow iconColor="#475569" label="Exportar mis datos" value="CSV / JSON">
              <span className="text-[11px] text-[var(--color-text-muted)]">›</span>
            </SettingsRow>

            <SettingsRow iconColor="#dc2626" label="Eliminar cuenta" labelColor="#dc2626" last>
              <span className="text-[11px]" style={{ color: '#dc2626' }}>›</span>
            </SettingsRow>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

/* ── Sub-componentes ── */

function SettingsRow({
  iconColor,
  label,
  labelColor,
  value,
  last = false,
  children,
}: {
  iconColor: string
  label: string
  labelColor?: string
  value?: string
  last?: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      className="flex items-center gap-3 py-2"
      style={!last ? { borderBottom: '0.5px solid #e8e8e0' } : {}}
    >
      <div
        className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0"
        style={{ background: '#f7f7f2' }}
      >
        <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: iconColor }} />
      </div>
      <div className="flex-1 text-[12px]" style={{ color: labelColor ?? 'var(--color-text-primary)' }}>
        {label}
      </div>
      {value && (
        <div className="text-[11px] text-[var(--color-text-muted)] mr-1">{value}</div>
      )}
      {children}
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative shrink-0 transition-colors duration-150"
      style={{
        width: 30,
        height: 16,
        borderRadius: 8,
        background: on ? '#16a34a' : '#d0d0cc',
      }}
    >
      <span
        className="absolute top-[3px] w-2.5 h-2.5 rounded-full bg-white transition-all duration-150"
        style={{ left: on ? 'calc(100% - 13px)' : 3 }}
      />
    </button>
  )
}
