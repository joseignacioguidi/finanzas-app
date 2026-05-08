'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login as apiLogin, getMe } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const { login, token, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && token) router.replace('/dashboard')
  }, [token, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { token: newToken } = await apiLogin(email, password)
      localStorage.setItem('token', newToken)
      const me = await getMe()
      login(newToken, me)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Credenciales incorrectas')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4">
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white text-lg font-bold mx-auto mb-3"
            style={{ background: '#1a1a2e' }}
          >
            F
          </div>
          <h1
            className="text-2xl font-bold text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Finanzas
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            Tu control de gastos personales
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-8">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">
            Iniciá sesión
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
              autoFocus
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            {error && (
              <p className="text-sm text-[var(--color-expense)] bg-[var(--color-expense-bg)] border border-[var(--color-expense-border)] rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={submitting} className="w-full mt-1">
              Ingresar
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--color-text-muted)]">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="font-medium hover:underline" style={{ color: 'var(--color-brand)' }}>
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
