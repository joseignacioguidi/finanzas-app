'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getCategories, createTransaction, createRecurringTransaction, getMe, getExchangeRate } from '@/lib/api'
import type { Category, TransactionInput } from '@/lib/types'
import AppShell from '@/components/layout/AppShell'
import CategoryForm from '@/components/categories/CategoryForm'

const CURRENCIES = ['ARS', 'USD', 'EUR'] as const
type Currency = typeof CURRENCIES[number]

const CATEGORIES_DEFAULT = [
  { id: '__comida', name: 'Comida', color: '#f87171' },
  { id: '__transporte', name: 'Transporte', color: '#fb923c' },
  { id: '__servicios', name: 'Servicios', color: '#60a5fa' },
  { id: '__salud', name: 'Salud', color: '#34d399' },
  { id: '__ocio', name: 'Ocio', color: '#a78bfa' },
  { id: '__otro', name: 'Otro', color: '#94a3b8' },
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function fmtDateLabel(d: string) {
  if (!d) return '—'
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtAmount(n: number) {
  return new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><div className="w-6 h-6 border-2 border-[#e0e0d8] border-t-[#1a1a2e] rounded-full animate-spin" /></div>}>
      <NewTransactionContent />
    </Suspense>
  )
}

function NewTransactionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') === 'income' ? 'income' : 'expense'

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [baseCurrency, setBaseCurrency] = useState<string>('ARS')
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [loadingRate, setLoadingRate] = useState(false)

  const [form, setForm] = useState<TransactionInput>({
    category_id: '',
    type: initialType,
    amount: 0,
    currency: 'ARS',
    description: '',
    date: todayStr(),
  })
  const [amountInput, setAmountInput] = useState('')

  useEffect(() => {
    getMe()
      .then(me => {
        setBaseCurrency(me.base_currency)
        setForm(prev => ({ ...prev, currency: me.base_currency }))
      })
      .catch(() => {})
  }, [])

  const loadCategories = useCallback((selectLast = false) => {
    getCategories()
      .then(cats => {
        const list = cats.length > 0 ? cats : CATEGORIES_DEFAULT as any
        setCategories(list)
        if (selectLast && cats.length > 0) {
          set('category_id', cats[cats.length - 1].id)
        }
      })
      .catch(() => setCategories(CATEGORIES_DEFAULT as any))
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])

  // Carga el tipo de cambio cuando la moneda es distinta a la base
  useEffect(() => {
    if (form.currency === baseCurrency) {
      setExchangeRate(null)
      return
    }
    let cancelled = false
    setLoadingRate(true)
    getExchangeRate(form.currency, baseCurrency)
      .then(result => {
        if (!cancelled) setExchangeRate(result.rate)
      })
      .catch(() => {
        if (!cancelled) setExchangeRate(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingRate(false)
      })
    return () => { cancelled = true }
  }, [form.currency, baseCurrency])

  function set<K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = useCallback(async () => {
    setError('')
    if (!form.category_id) { setError('Seleccioná una categoría'); return }
    if (!form.amount || form.amount <= 0) { setError('El monto debe ser mayor a 0'); return }

    setLoading(true)
    try {
      if (isRecurring) {
        await createRecurringTransaction(form)
      } else {
        await createTransaction(form)
      }
      router.push('/transactions')
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }, [form, router, isRecurring])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleSubmit])

  const selectedCat = categories.find(c => c.id === form.category_id)
  const isIncome = form.type === 'income'
  const isForeignCurrency = form.currency !== baseCurrency
  const baseAmount = isForeignCurrency && exchangeRate ? form.amount * exchangeRate : null

  const headerRight = (
    <Link
      href="/transactions"
      className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
    >
      ← Volver a transacciones
    </Link>
  )

  return (
    <AppShell title="Nueva transacción" headerRight={headerRight}>
      {/* Título mobile */}
      <div className="md:hidden flex items-center gap-2.5 mb-4">
        <Link
          href="/transactions"
          className="w-7 h-7 flex items-center justify-center rounded-[6px]"
          style={{ border: '0.5px solid #d0d0cc' }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M5 1L2 4L5 7" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </Link>
        <h1 className="text-[18px] font-medium text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Nueva transacción
        </h1>
      </div>

      {/* Layout: 1 columna mobile / 2 columnas desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">

        {/* ── FORMULARIO ── */}
        <div
          className="bg-white rounded-[10px] p-5 flex flex-col gap-4"
          style={{ border: '0.5px solid #e8e8e0' }}
        >
          {/* Toggle tipo */}
          <div
            className="flex rounded-[9px] p-0.5"
            style={{ background: '#f7f7f2' }}
          >
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className="flex-1 text-[11px] text-center py-1.5 rounded-[7px] transition-all duration-100"
                style={
                  form.type === t
                    ? { background: '#fff', border: '0.5px solid #e0e0d8', fontWeight: 500, color: '#1a1a1a' }
                    : { color: '#aaa' }
                }
              >
                {t === 'expense' ? 'Gasto' : 'Ingreso'}
              </button>
            ))}
          </div>

          {/* Monto + Moneda */}
          <div
            className="text-center py-4"
            style={{ borderBottom: '0.5px solid #e8e8e0' }}
          >
            <div className="text-[8px] text-[var(--color-text-muted)] mb-1 uppercase tracking-[0.05em]">Monto</div>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-[18px] text-[var(--color-text-muted)]">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountInput}
                onChange={e => {
                  setAmountInput(e.target.value)
                  set('amount', parseFloat(e.target.value) || 0)
                }}
                placeholder="0"
                className="text-[28px] md:text-[32px] font-medium text-[var(--color-text-primary)] bg-transparent outline-none w-40 text-center"
                style={{ appearance: 'textfield' }}
              />
            </div>

            {/* Selector de moneda */}
            <div className="flex justify-center gap-1.5">
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('currency', c)}
                  className="text-[10px] px-2.5 py-1 rounded-[8px] font-medium transition-all duration-100"
                  style={
                    form.currency === c
                      ? { background: '#1a1a2e', color: '#fff', border: '0.5px solid #1a1a2e' }
                      : { background: '#f7f7f2', color: '#888', border: '0.5px solid #d0d0cc' }
                  }
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Tipo de cambio / base_amount estimado */}
            {isForeignCurrency && (
              <div className="mt-2 text-[10px] text-[var(--color-text-muted)]">
                {loadingRate ? (
                  'Cargando tipo de cambio...'
                ) : exchangeRate ? (
                  <>
                    1 {form.currency} = {fmtAmount(exchangeRate)} {baseCurrency}
                    {form.amount > 0 && (
                      <span className="ml-2 font-medium text-[var(--color-text-primary)]">
                        ≈ ${fmtAmount(form.amount * exchangeRate)} {baseCurrency}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-amber-600">No se pudo obtener el tipo de cambio</span>
                )}
              </div>
            )}
          </div>

          {/* Categoría pills */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)] mb-2">
              Categoría
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => set('category_id', cat.id)}
                  className="text-[10px] px-2.5 py-1 rounded-[10px] transition-colors"
                  style={
                    form.category_id === cat.id
                      ? { background: '#1a1a2e', color: '#fff', border: '0.5px solid #1a1a2e' }
                      : { background: '#fff', color: '#888', border: '0.5px solid #d0d0cc' }
                  }
                >
                  {cat.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="text-[10px] px-2.5 py-1 rounded-[10px] transition-colors"
                style={{ background: '#fff', color: '#888', border: '0.5px dashed #d0d0cc' }}
                title="Crear nueva categoría"
              >
                + Nueva
              </button>
            </div>

            {/* Modal inline: nueva categoría */}
            {showNewCategory && (
              <div className="mt-3 rounded-[10px] p-4" style={{ background: '#f7f7f2', border: '0.5px solid #e0e0d8' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-[var(--color-text-primary)]">Nueva categoría</span>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="text-[18px] leading-none text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    style={{ lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
                <CategoryForm
                  onSuccess={() => {
                    setShowNewCategory(false)
                    loadCategories(true)
                  }}
                  onCancel={() => setShowNewCategory(false)}
                />
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)] mb-1.5">
              Descripción
            </div>
            <input
              type="text"
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Ej: Almuerzo en el trabajo"
              maxLength={255}
              className="w-full h-9 px-3 text-[12px] rounded-[8px] outline-none placeholder:text-[#aaa] text-[var(--color-text-primary)]"
              style={{ background: '#f7f7f2', border: '0.5px solid #e0e0d8' }}
            />
          </div>

          {/* Fecha */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)] mb-1.5">
              Fecha
            </div>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className="w-full h-9 px-3 text-[12px] rounded-[8px] outline-none text-[var(--color-text-primary)]"
              style={{ background: '#f7f7f2', border: '0.5px solid #e0e0d8' }}
            />
          </div>

          {/* Recurrente */}
          <button
            type="button"
            onClick={() => setIsRecurring(prev => !prev)}
            className="flex items-center gap-3 w-full text-left rounded-[8px] px-3 py-2.5 transition-all duration-100"
            style={
              isRecurring
                ? { background: '#f7f7f2', border: '0.5px solid #c0c0b8' }
                : { background: 'transparent', border: '0.5px solid #e0e0d8' }
            }
          >
            <div
              className="relative shrink-0 rounded-full transition-colors duration-150"
              style={{
                width: 32, height: 16,
                background: isRecurring ? '#1a1a2e' : '#d0d0cc',
              }}
            >
              <div
                className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-150"
                style={{ transform: isRecurring ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </div>
            <div>
              <div className="text-[11px] font-medium" style={{ color: '#1a1a1a' }}>Gasto/ingreso fijo</div>
              <div className="text-[10px]" style={{ color: '#aaa' }}>Se repetirá cada mes en el mismo día</div>
            </div>
          </button>

          {/* Error */}
          {error && (
            <p className="text-[12px] text-[var(--color-expense)] bg-[var(--color-expense-bg)] border border-[var(--color-expense-border)] rounded-[8px] px-3 py-2">
              {error}
            </p>
          )}

          {/* CTA mobile */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="md:hidden w-full h-[34px] rounded-[10px] text-[12px] font-medium text-white transition-opacity disabled:opacity-50"
            style={{ background: '#1a1a2e' }}
          >
            {loading ? 'Guardando...' : 'Guardar transacción'}
          </button>
        </div>

        {/* ── PREVIEW (desktop) ── */}
        <div
          className="hidden md:flex bg-white rounded-[10px] p-5 flex-col"
          style={{ border: '0.5px solid #e8e8e0' }}
        >
          <div className="text-[12px] font-medium text-[var(--color-text-primary)] mb-3.5">
            Vista previa
          </div>

          {/* Card preview */}
          <div className="rounded-[9px] p-4 mb-3.5" style={{ background: '#f7f7f2' }}>
            {[
              {
                key: 'Tipo',
                value: (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-[8px]"
                    style={
                      isIncome
                        ? { background: '#f0fdf4', color: '#166534' }
                        : { background: '#fef2f2', color: '#991b1b' }
                    }
                  >
                    {isIncome ? 'Ingreso' : 'Gasto'}
                  </span>
                ),
              },
              {
                key: 'Monto',
                value: (
                  <div className="text-right">
                    <span
                      className="text-[12px] font-medium"
                      style={{ color: isIncome ? '#16a34a' : '#dc2626' }}
                    >
                      {isIncome ? '+' : '−'}${form.amount > 0 ? new Intl.NumberFormat('es').format(form.amount) : '0'} {form.currency}
                    </span>
                    {baseAmount !== null && (
                      <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                        ≈ ${fmtAmount(baseAmount)} {baseCurrency}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'Categoría',
                value: (
                  <span className="text-[12px] font-medium text-[var(--color-text-primary)]">
                    {selectedCat?.name ?? <span style={{ color: '#aaa' }}>Sin categoría</span>}
                  </span>
                ),
              },
              {
                key: 'Descripción',
                value: (
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: form.description ? 'var(--color-text-primary)' : '#aaa' }}
                  >
                    {form.description || 'Sin descripción'}
                  </span>
                ),
              },
              {
                key: 'Fecha',
                value: (
                  <span className="text-[12px] font-medium text-[var(--color-text-primary)]">
                    {fmtDateLabel(form.date)}
                  </span>
                ),
              },
              {
                key: 'Recurrente',
                value: (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-[8px]"
                    style={
                      isRecurring
                        ? { background: '#eef2ff', color: '#3730a3' }
                        : { background: '#f7f7f2', color: '#aaa' }
                    }
                  >
                    {isRecurring ? 'Mensual' : 'Una vez'}
                  </span>
                ),
              },
            ].map(row => (
              <div key={row.key} className="flex justify-between items-start mb-2 last:mb-0">
                <span className="text-[11px] text-[var(--color-text-muted)] pt-0.5">{row.key}</span>
                {row.value}
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed mb-auto">
            La vista previa se actualiza en tiempo real mientras completás el formulario.
          </p>

          {error && (
            <p className="text-[11px] text-[var(--color-expense)] bg-[var(--color-expense-bg)] border border-[var(--color-expense-border)] rounded-[8px] px-3 py-2 mt-3">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-10 rounded-[9px] text-[12px] font-medium text-white mt-4 transition-opacity disabled:opacity-50"
            style={{ background: '#1a1a2e' }}
          >
            {loading ? 'Guardando...' : 'Guardar transacción'}
          </button>
          <p className="text-[10px] text-[var(--color-text-muted)] text-center mt-2">
            o presioná <kbd className="font-mono bg-[#f0f0ea] px-1 py-0.5 rounded text-[9px]">Ctrl+Enter</kbd> para guardar
          </p>
        </div>
      </div>
    </AppShell>
  )
}
