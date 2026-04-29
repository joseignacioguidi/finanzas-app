'use client'

import { useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import TransactionList from '@/components/transactions/TransactionList'
import MonthPicker from '@/components/ui/MonthPicker'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export default function TransactionsPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())

  const headerRight = (
    <>
      <MonthPicker month={selectedMonth} onChange={setSelectedMonth} />
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
      <TransactionList month={selectedMonth} />
    </AppShell>
  )
}
