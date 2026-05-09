'use client'

import { useState, useEffect, useCallback } from 'react'
import { Banknote, Building2, Wallet, PiggyBank, Plus, Pencil, Trash2 } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { getSavings, createSaving, updateSaving, deleteSaving, getExchangeRate } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { SavingResult, SavingType, SavingsResponse, SavingInput } from '@/lib/types'

const TYPE_LABELS: Record<SavingType, string> = {
  cash: 'Efectivo',
  bank: 'Cuenta bancaria',
  virtual_wallet: 'Billetera virtual',
}

function TypeIcon({ type }: { type: SavingType }) {
  const props = { size: 18, style: { color: 'var(--color-text-muted)' } }
  if (type === 'cash') return <Banknote {...props} />
  if (type === 'bank') return <Building2 {...props} />
  return <Wallet {...props} />
}

function formatAmount(n: number, currency: string) {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`
}

function formatRate(rate: number, from: string, to: string) {
  return `1 ${from} = $${rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}`
}

const CURRENCIES = ['ARS', 'USD', 'EUR']
const EMPTY_FORM: SavingInput = { name: '', type: 'cash', amount: 0, currency: 'ARS', description: '' }

interface SavingFormProps {
  open: boolean
  onClose: () => void
  onSave: (input: SavingInput) => Promise<void>
  initial?: SavingResult | null
  baseCurrency: string
  title: string
}

function SavingForm({ open, onClose, onSave, initial, baseCurrency, title }: SavingFormProps) {
  const [form, setForm] = useState<SavingInput>(EMPTY_FORM)
  const [rateLabel, setRateLabel] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              type: initial.type,
              amount: initial.amount,
              currency: initial.currency,
              description: initial.description ?? '',
            }
          : EMPTY_FORM,
      )
      setError(null)
      setRateLabel(null)
    }
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    if (form.currency === baseCurrency) {
      setRateLabel(null)
      return
    }
    getExchangeRate(form.currency, baseCurrency)
      .then(r => setRateLabel(formatRate(r.rate, form.currency, baseCurrency)))
      .catch(() => setRateLabel(null))
  }, [form.currency, baseCurrency, open])

  const baseEquivalent =
    form.currency !== baseCurrency && rateLabel && form.amount > 0
      ? (() => {
          const rate = parseFloat(rateLabel.split('= $')[1])
          if (isNaN(rate)) return null
          return formatAmount(form.amount * rate, baseCurrency)
        })()
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Ej: Caja de ahorro Galicia"
          required
        />

        <Select
          label="Tipo"
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value as SavingType }))}
        >
          <option value="cash">Efectivo</option>
          <option value="bank">Cuenta bancaria</option>
          <option value="virtual_wallet">Billetera virtual</option>
        </Select>

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Monto"
              type="number"
              min="0"
              step="any"
              value={form.amount || ''}
              onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              required
            />
          </div>
          <div className="w-28">
            <Select
              label="Moneda"
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
            >
              {CURRENCIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>

        {rateLabel && (
          <div
            className="text-xs rounded-md px-3 py-2"
            style={{ background: 'var(--color-bg-overlay)', color: 'var(--color-text-muted)' }}
          >
            <span>{rateLabel}</span>
            {baseEquivalent && (
              <span className="ml-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                ≈ {baseEquivalent}
              </span>
            )}
          </div>
        )}

        <Input
          label="Descripción (opcional)"
          value={form.description ?? ''}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Notas adicionales"
        />

        {error && (
          <p className="text-xs" style={{ color: 'var(--color-expense)' }}>{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={saving} className="flex-1">
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function SavingsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<SavingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SavingResult | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getSavings()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(input: SavingInput) {
    if (editing) {
      await updateSaving(editing.id, input)
    } else {
      await createSaving(input)
    }
    load()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await deleteSaving(id)
      load()
    } finally {
      setDeleting(null)
    }
  }

  const baseCurrency = user?.base_currency ?? data?.base_currency ?? 'ARS'
  const savings = data?.savings ?? []
  const total = data?.total_base_amount ?? 0

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-xl font-bold text-[var(--color-text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ahorros
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              Saldo actual en todas tus cuentas
            </p>
          </div>
          <Button onClick={() => { setEditing(null); setModalOpen(true) }} size="sm">
            <Plus size={14} />
            Agregar ahorro
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin" />
          </div>
        ) : savings.length === 0 ? (
          /* Estado vacío */
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--color-bg-overlay)' }}
            >
              <PiggyBank size={26} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                Todavía no registraste ningún ahorro
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Agregá tus cuentas de ahorro para ver el total consolidado
              </p>
            </div>
            <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true) }}>
              <Plus size={14} />
              Agregar el primero
            </Button>
          </div>
        ) : (
          <>
            {/* Card de resumen */}
            <div
              className="rounded-xl border border-[var(--color-border)] px-6 py-5 flex items-center justify-between gap-4"
              style={{ background: 'var(--color-bg-surface)' }}
            >
              <div>
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                  Total consolidado
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  {formatAmount(total, baseCurrency)}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-brand-glow)' }}
              >
                <PiggyBank size={22} style={{ color: 'var(--color-brand)' }} />
              </div>
            </div>

            {/* Lista de ahorros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savings.map(sv => (
                <div
                  key={sv.id}
                  className="flex flex-col gap-3 px-4 py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ background: 'var(--color-bg-overlay)' }}
                    >
                      <TypeIcon type={sv.type} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {sv.name}
                        </span>
                        <Badge variant="neutral">{TYPE_LABELS[sv.type]}</Badge>
                      </div>
                      <p className="text-sm font-semibold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                        {formatAmount(sv.amount, sv.currency)}
                      </p>
                      {sv.currency !== baseCurrency && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          = {formatAmount(sv.base_amount, baseCurrency)}
                        </p>
                      )}
                      {sv.description && (
                        <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
                          {sv.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => { setEditing(sv); setModalOpen(true) }}
                        className="p-1.5 rounded-md transition-colors hover:bg-[var(--color-bg-overlay)]"
                        title="Editar"
                      >
                        <Pencil size={14} style={{ color: 'var(--color-text-muted)' }} />
                      </button>
                      <button
                        onClick={() => handleDelete(sv.id)}
                        disabled={deleting === sv.id}
                        className="p-1.5 rounded-md transition-colors hover:bg-[var(--color-expense-bg)]"
                        title="Eliminar"
                      >
                        <Trash2 size={14} style={{ color: 'var(--color-expense)' }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <SavingForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
        baseCurrency={baseCurrency}
        title={editing ? 'Editar ahorro' : 'Agregar ahorro'}
      />
    </AppShell>
  )
}
