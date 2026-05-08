'use client'

import { useState, useEffect } from 'react'
import * as LucideIcons from 'lucide-react'
import { Pencil, Trash2, Plus, Wallet } from 'lucide-react'
import { getCategories, deleteCategory, getBudgets, createBudget, updateBudget } from '@/lib/api'
import type { Category, BudgetResult } from '@/lib/types'
import { CATEGORY_TYPE_LABELS, CATEGORY_TYPE_COLORS } from '@/lib/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import CategoryForm from './CategoryForm'

function CategoryIcon({ name, color }: { name: string; color: string }) {
  const Icon = (LucideIcons as Record<string, any>)[name]
  if (!Icon) return <span className="w-3 h-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
  return <Icon size={15} style={{ color }} className="shrink-0" />
}

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Record<string, BudgetResult>>({})
  const [loading, setLoading] = useState(true)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [budgetCat, setBudgetCat] = useState<Category | null>(null)
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [budgetError, setBudgetError] = useState('')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  async function fetchCategories() {
    setLoading(true)
    try {
      setCategories(await getCategories())
    } catch {}
    finally { setLoading(false) }
  }

  async function fetchBudgets() {
    try {
      const rows = await getBudgets(currentMonth, currentYear)
      const map: Record<string, BudgetResult> = {}
      for (const b of rows) map[b.category_id] = b
      setBudgets(map)
    } catch {}
  }

  useEffect(() => {
    fetchCategories()
    fetchBudgets()
  }, [])

  async function handleDelete(id: string) {
    setDeleteError('')
    setDeletingId(id)
    try {
      await deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err: any) {
      setDeleteError(err.message ?? 'No se puede eliminar esta categoría')
    } finally {
      setDeletingId(null)
    }
  }

  function openBudgetModal(cat: Category) {
    setBudgetCat(cat)
    setBudgetError('')
    const existing = budgets[cat.id]
    setBudgetAmount(existing ? String(existing.amount) : '')
  }

  function closeBudgetModal() {
    setBudgetCat(null)
    setBudgetAmount('')
    setBudgetError('')
  }

  async function handleBudgetSave() {
    if (!budgetCat) return
    const amount = parseFloat(budgetAmount)
    if (!budgetAmount || isNaN(amount) || amount <= 0) {
      setBudgetError('Ingresá un monto válido mayor a 0')
      return
    }
    setBudgetLoading(true)
    setBudgetError('')
    try {
      const existing = budgets[budgetCat.id]
      if (existing) {
        await updateBudget(existing.id, { amount })
      } else {
        await createBudget({ category_id: budgetCat.id, amount, month: currentMonth, year: currentYear })
      }
      await fetchBudgets()
      closeBudgetModal()
    } catch (err: any) {
      setBudgetError(err.message ?? 'Error al guardar el presupuesto')
    } finally {
      setBudgetLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">{categories.length} categoría{categories.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} strokeWidth={2} />
          Nueva categoría
        </Button>
      </div>

      {deleteError && (
        <p className="text-sm text-[var(--color-expense)] bg-[var(--color-expense-bg)] border border-[var(--color-expense-border)] rounded-md px-3 py-2">
          {deleteError}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map(cat => {
          const budget = budgets[cat.id]
          return (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-strong)] transition-colors group"
            >
              <span
                className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <CategoryIcon name={cat.icon} color={cat.color} />
              </span>
              <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)] truncate">
                {cat.name}
              </span>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  color: CATEGORY_TYPE_COLORS[cat.type] ?? '#6b7280',
                  backgroundColor: `${CATEGORY_TYPE_COLORS[cat.type] ?? '#6b7280'}18`,
                }}
              >
                {CATEGORY_TYPE_LABELS[cat.type] ?? cat.type}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openBudgetModal(cat)}
                  title={budget ? 'Editar presupuesto' : 'Setear presupuesto'}
                  className="p-1.5 rounded-md transition-colors"
                  style={{
                    color: budget ? cat.color : 'var(--color-text-muted)',
                    background: budget ? `${cat.color}18` : 'transparent',
                  }}
                >
                  <Wallet size={13} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setEditCat(cat)}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-overlay)] transition-colors"
                >
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-expense)] hover:bg-[var(--color-expense-bg)] transition-colors"
                >
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva categoría">
        <CategoryForm
          onSuccess={() => { setShowCreate(false); fetchCategories() }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      <Modal open={!!editCat} onClose={() => setEditCat(null)} title="Editar categoría">
        {editCat && (
          <CategoryForm
            initial={editCat}
            onSuccess={() => { setEditCat(null); fetchCategories() }}
            onCancel={() => setEditCat(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!budgetCat}
        onClose={closeBudgetModal}
        title={budgets[budgetCat?.id ?? ''] ? 'Editar presupuesto' : 'Setear presupuesto'}
      >
        {budgetCat && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Presupuesto mensual para <span className="font-medium text-[var(--color-text-primary)]">{budgetCat.name}</span>{' '}
              ({new Date(currentYear, currentMonth - 1).toLocaleString('es', { month: 'long', year: 'numeric' })})
            </p>
            <Input
              label="Monto máximo"
              type="number"
              min={1}
              step="any"
              placeholder="Ej: 50000"
              value={budgetAmount}
              onChange={e => setBudgetAmount(e.target.value)}
              error={budgetError}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={closeBudgetModal} disabled={budgetLoading}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleBudgetSave} loading={budgetLoading}>
                Guardar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
