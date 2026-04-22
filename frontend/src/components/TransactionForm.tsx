import type { TransactionFormState, TransactionType } from '../types'
import { CATEGORY_EMOJIS } from '../constants'

type Props = {
  form: TransactionFormState
  categories: string[]
  onChange: (updater: (prev: TransactionFormState) => TransactionFormState) => void
  autoFocus?: boolean
}

export function TransactionForm({ form, categories, onChange, autoFocus = false }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Сума</label>
        <input
          className="revo-input !text-2xl font-black tracking-tighter"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => onChange((prev) => ({ ...prev, amount: e.target.value }))}
          required
          autoFocus={autoFocus}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Тип</label>
          <select
            className="revo-input font-bold"
            value={form.type}
            onChange={(e) => {
              const newType = e.target.value as TransactionType
              onChange((prev) => ({
                ...prev,
                type: newType,
                category: newType === 'income' ? 'Дохід' : prev.category,
              }))
            }}
          >
            <option value="expense">Витрата</option>
            <option value="income">Дохід</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Категорія</label>
          <select
            className="revo-input font-bold"
            value={form.category}
            onChange={(e) => onChange((prev) => ({ ...prev, category: e.target.value }))}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_EMOJIS[category] ?? '📦'} {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Дата</label>
        <input
          className="revo-input font-bold"
          type="date"
          value={form.date}
          onChange={(e) => onChange((prev) => ({ ...prev, date: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Опис</label>
        <input
          className="revo-input font-medium"
          placeholder="На що витратили?"
          value={form.description}
          onChange={(e) => onChange((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>
    </div>
  )
}
