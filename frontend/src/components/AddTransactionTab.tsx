import type { FormEvent } from 'react'
import type { TransactionFormState } from '../types'
import { TransactionForm } from './TransactionForm'

type Props = {
  form: TransactionFormState
  categories: string[]
  isBusy: boolean
  error: string
  onFormChange: (updater: (prev: TransactionFormState) => TransactionFormState) => void
  onSubmit: (event: FormEvent) => Promise<void>
}

export function AddTransactionTab({ form, categories, isBusy, error, onFormChange, onSubmit }: Props) {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-2xl font-black tracking-tight text-revo-text">Нова операція</h1>

      <form className="revo-card !p-6 shadow-revo-md" onSubmit={(e) => void onSubmit(e)}>
        <TransactionForm form={form} categories={categories} onChange={onFormChange} autoFocus />

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-revo-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={isBusy}
          className="revo-btn-primary mt-6 w-full !py-4 text-base shadow-lg shadow-revo-blue/20"
        >
          {isBusy ? 'Збереження...' : 'Зберегти'}
        </button>
      </form>
    </div>
  )
}
