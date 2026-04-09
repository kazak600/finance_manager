import type { FormEvent } from 'react'
import type { TransactionFormState, TransactionType } from '../types'
import { CATEGORY_EMOJIS } from '../App'

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
        className="w-full max-w-md revo-card !p-8 shadow-2xl animate-in fade-in zoom-in duration-200" 
        onSubmit={(event) => void onSubmit(event)}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-black tracking-tight text-revo-text">
            {txForm.id ? 'Редагувати' : 'Нова операція'}
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-revo-gray hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Сума</label>
            <input
              className="revo-input !text-2xl font-black tracking-tighter"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={txForm.amount}
              onChange={(e) => onTxFormChange((prev) => ({ ...prev, amount: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Категорія</label>
              <select
                className="revo-input font-bold"
                value={txForm.category}
                onChange={(e) => onTxFormChange((prev) => ({ ...prev, category: e.target.value }))}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_EMOJIS[category] || '📦'} {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Тип</label>
              <select
                className="revo-input font-bold"
                value={txForm.type}
                onChange={(e) => onTxFormChange((prev) => ({ ...prev, type: e.target.value as TransactionType }))}
              >
                <option value="expense">Витрата</option>
                <option value="income">Дохід</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Дата</label>
            <input
              className="revo-input font-bold"
              type="date"
              value={txForm.date}
              onChange={(e) => onTxFormChange((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Опис</label>
            <input
              className="revo-input font-medium"
              placeholder="На що витратили?"
              value={txForm.description}
              onChange={(e) => onTxFormChange((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button type="submit" className="revo-btn-primary w-full !py-4 shadow-lg shadow-revo-blue/20">
            {txForm.id ? 'Оновити' : 'Створити'}
          </button>
          
          <div className="flex gap-3">
             <button 
              type="button" 
              className="revo-btn-secondary flex-1 !bg-transparent !border !border-slate-200" 
              onClick={onClose}
            >
              Скасувати
            </button>
            {txForm.id && (
              <button 
                type="button" 
                className="flex-1 rounded-full bg-revo-danger/10 text-revo-danger font-bold text-sm transition-colors hover:bg-revo-danger/20" 
                onClick={onDelete}
              >
                Видалити
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
