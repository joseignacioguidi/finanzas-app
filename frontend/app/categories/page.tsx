'use client'

import AppShell from '@/components/layout/AppShell'
import CategoryList from '@/components/categories/CategoryList'

export default function CategoriesPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Categorías
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Organizá tus transacciones con categorías personalizadas
          </p>
        </div>
        <CategoryList />
      </div>
    </AppShell>
  )
}
