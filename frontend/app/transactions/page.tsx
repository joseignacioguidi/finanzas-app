'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import TransactionList from '@/components/transactions/TransactionList'
import ImportModal from '@/components/transactions/ImportModal'
import MonthPicker from '@/components/ui/MonthPicker'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export default function TransactionsPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())
  const [importOpen, setImportOpen] = useState(false)
  const [listKey, setListKey] = useState(0)

  const headerRight = (
    <>
      <MonthPicker month={selectedMonth} onChange={setSelectedMonth} />
      <button
        onClick={() => setImportOpen(true)}
        className="h-[30px] px-3 rounded-[7px] text-[11px] font-medium flex items-center gap-1.5 transition-colors hover:bg-[#f0f0ea]"
        style={{ border: '0.5px solid #d0d0cc', color: '#555' }}
      >
        <Upload size={12} />
        Importar
      </button>
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
      <TransactionList key={listKey} month={selectedMonth} />
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => setListKey(k => k + 1)}
      />
    </AppShell>
  )
}
