import type { FormEvent } from 'react'
import type { TransactionFormState, TransactionType } from '../types'

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
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <form className="w-full max-w-md rounded-xl bg-white p-5" onSubmit={(event) => void onSubmit(event)}>
        <h3 className="mb-3 text-lg font-semibold">{txForm.id ? 'Редагувати' : 'Нова транзакція'}</h3>
        <div className="space-y-2">
          <input
            className="w-full rounded border border-slate-300 px-3 py-2"
            type="number"
            step="0.01"
            placeholder="Сума"
            value={txForm.amount}
            onChange={(e) => onTxFormChange((prev) => ({ ...prev, amount: e.target.value }))}
            required
          />
          <select
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={txForm.category}
            onChange={(e) => onTxFormChange((prev) => ({ ...prev, category: e.target.value }))}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2"
            type="date"
            value={txForm.date}
            onChange={(e) => onTxFormChange((prev) => ({ ...prev, date: e.target.value }))}
            required
          />
          <input
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Опис"
            value={txForm.description}
            onChange={(e) => onTxFormChange((prev) => ({ ...prev, description: e.target.value }))}
          />
          <select
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={txForm.type}
            onChange={(e) => onTxFormChange((prev) => ({ ...prev, type: e.target.value as TransactionType }))}
          >
            <option value="expense">Витрата</option>
            <option value="income">Дохід</option>
          </select>
        </div>
        <div className="mt-4 flex justify-between gap-2">
          <button type="button" className="rounded bg-slate-200 px-3 py-2" onClick={onClose}>
            Cancel
          </button>
          {txForm.id && (
            <button type="button" className="rounded bg-rose-600 px-3 py-2 text-white" onClick={onDelete}>
              Delete
            </button>
          )}
          <button type="submit" className="rounded bg-emerald-600 px-3 py-2 text-white">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
