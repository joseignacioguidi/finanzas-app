'use client'

import { useState, useEffect } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { getCategories, deleteCategory } from '@/lib/api'
import type { Category } from '@/lib/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import CategoryForm from './CategoryForm'

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function fetchCategories() {
    setLoading(true)
    try {
      setCategories(await getCategories())
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCategories() }, [])

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
        {categories.map(cat => (
          <div
            key={cat.id}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-strong)] transition-colors group"
          >
            <span
              className="w-3 h-3 shrink-0 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)] truncate">
              {cat.name}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        ))}
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
    </div>
  )
}
