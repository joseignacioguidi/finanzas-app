'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register as apiRegister, login as apiLogin } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function RegisterPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setSubmitting(true)
    try {
      const user = await apiRegister(email, password)
      const { token } = await apiLogin(email, password)
      login(token, user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Error al registrarse')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[var(--color-brand)] opacity-[0.04] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            finanzas
            <span style={{ color: 'var(--color-brand)' }}>.</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Creá tu cuenta gratis
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-8">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">
            Crear cuenta
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
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repetí la contraseña"
              autoComplete="new-password"
              required
            />

            {error && (
              <p className="text-sm text-[var(--color-expense)] bg-[var(--color-expense-bg)] border border-[var(--color-expense-border)] rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={submitting} className="w-full mt-1">
              Crear cuenta
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--color-text-muted)]">
            ¿Ya tenés cuenta?{' '}
            <Link href="/" className="text-[var(--color-brand)] hover:underline font-medium">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
