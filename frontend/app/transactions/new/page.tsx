'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import TransactionForm from '@/components/transactions/TransactionForm'
import Button from '@/components/ui/Button'

export default function NewTransactionPage() {
  const router = useRouter()

  return (
    <AppShell>
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={16} strokeWidth={1.5} />
          </Button>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Nueva transacción
          </h1>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
          <TransactionForm
            onSuccess={() => router.push('/transactions')}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </AppShell>
  )
}
