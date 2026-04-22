import type { FormEvent } from 'react'
import type { TransactionFormState } from '../types'
import { TransactionForm } from './TransactionForm'

type Props = {
  show: boolean
  txForm: TransactionFormState
  categories: string[]
  onClose: () => void
  onSubmit: (event: FormEvent) => Promise<void>
  onDelete: () => void
  onTxFormChange: (updater: (prev: TransactionFormState) => TransactionFormState) => void
}

export function TransactionModal({ show, txForm, categories, onClose, onSubmit, onDelete, onTxFormChange }: Props) {
  if (!show) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <form
        className="revo-card w-full max-w-md !p-8 shadow-2xl"
        onSubmit={(event) => void onSubmit(event)}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-black tracking-tight text-revo-text">Редагувати</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-revo-gray transition-colors hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <TransactionForm form={txForm} categories={categories} onChange={onTxFormChange} autoFocus />

        <div className="mt-8 flex flex-col gap-3">
          <button type="submit" className="revo-btn-primary w-full !py-4 shadow-lg shadow-revo-blue/20">
            Оновити
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              className="revo-btn-secondary flex-1 !border !border-slate-200 !bg-transparent"
              onClick={onClose}
            >
              Скасувати
            </button>
            <button
              type="button"
              className="flex-1 rounded-full bg-revo-danger/10 text-sm font-bold text-revo-danger transition-colors hover:bg-revo-danger/20"
              onClick={onDelete}
            >
              Видалити
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
