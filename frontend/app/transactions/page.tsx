'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import TransactionList from '@/components/transactions/TransactionList'
import Button from '@/components/ui/Button'

export default function TransactionsPage() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Transacciones
          </h1>
          <Link href="/transactions/new">
            <Button size="sm">
              <Plus size={14} strokeWidth={2} />
              Nueva
            </Button>
          </Link>
        </div>
        <TransactionList />
      </div>
    </AppShell>
  )
}
