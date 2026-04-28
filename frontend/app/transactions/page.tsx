'use client'

import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import TransactionList from '@/components/transactions/TransactionList'

export default function TransactionsPage() {
  const headerRight = (
    <>
      <span
        className="text-[11px] text-[var(--color-text-muted)] px-2.5 py-1 rounded-[6px]"
        style={{ background: '#f7f7f2', border: '0.5px solid #e0e0d8' }}
      >
        {new Date().toLocaleString('es', { month: 'long', year: 'numeric' })
          .replace(/^\w/, c => c.toUpperCase())}
      </span>
      <Link
        href="/transactions/new"
        className="h-[30px] px-3.5 rounded-[7px] text-[11px] font-medium text-white flex items-center"
        style={{ background: '#1a1a2e' }}
      >
        + Nueva transacción
      </Link>
    </>
  )

  return (
    <AppShell title="Transacciones" headerRight={headerRight}>
      {/* Título mobile */}
      <h1
        className="md:hidden text-[18px] font-medium text-[var(--color-text-primary)] mb-4"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Movimientos
      </h1>
      <TransactionList />
    </AppShell>
  )
}
