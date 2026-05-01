'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { importTransactions } from '@/lib/api'

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

export default function ImportModal({ open, onClose, onImported }: ImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: string[] } | null>(null)
  const [error, setError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setResult(null)
    setError('')
  }

  async function handleImport() {
    if (!file) {
      setError('Seleccioná un archivo CSV')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await importTransactions(file)
      setResult(res)
      if (res.imported > 0) onImported()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al importar')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setFile(null)
    setResult(null)
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Importar transacciones">
      <div className="flex flex-col gap-4">

        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          Subí un CSV con el formato de exportación.
          Las columnas requeridas son: <span className="font-medium text-[var(--color-text-primary)]">ID, Fecha, Descripción, Categoría, Tipo, Monto, Moneda, Estado</span>.
        </p>

        {/* Selector de archivo */}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-20 rounded-[10px] flex flex-col items-center justify-center gap-1.5 transition-colors"
          style={{
            border: '1.5px dashed #d0d0cc',
            background: file ? '#f7f7f2' : '#fafaf8',
          }}
        >
          <Upload size={18} color="#888" />
          {file ? (
            <span className="text-[11px] font-medium text-[var(--color-text-primary)]">{file.name}</span>
          ) : (
            <span className="text-[11px] text-[var(--color-text-muted)]">Seleccionar archivo CSV</span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Resultado */}
        {result && (
          <div
            className="rounded-[8px] p-3 flex flex-col gap-2"
            style={{ background: '#f7f7f2', border: '0.5px solid #e0e0d8' }}
          >
            <div className="text-[12px] font-medium text-[var(--color-text-primary)]">
              {result.imported} {result.imported === 1 ? 'transacción importada' : 'transacciones importadas'}
            </div>
            {result.skipped.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-[var(--color-text-muted)]">
                  {result.skipped.length} {result.skipped.length === 1 ? 'fila omitida' : 'filas omitidas'}:
                </div>
                <div
                  className="rounded-[6px] overflow-y-auto max-h-[80px] p-2"
                  style={{ background: '#fff', border: '0.5px solid #e0e0d8' }}
                >
                  {result.skipped.map((msg, i) => (
                    <div key={i} className="text-[10px] text-[#dc2626]">{msg}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-[11px] text-[#dc2626]">{error}</div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleClose}
            className="flex-1 h-9 rounded-[8px] text-[12px] transition-colors hover:bg-[#f0f0ea]"
            style={{ border: '0.5px solid #d0d0cc', color: '#555' }}
          >
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={loading || !file}
              className="flex-1 h-9 rounded-[8px] text-[12px] font-medium text-white flex items-center justify-center gap-1.5 transition-opacity"
              style={{ background: '#1a1a2e', opacity: loading || !file ? 0.5 : 1 }}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload size={13} />
                  Importar
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </Modal>
  )
}
