import type { Transaction } from '../types'

type Props = {
  selectedDate: string
  dayTransactions: Transaction[]
  onCreateTransaction: () => void
  onEditTransaction: (tx: Transaction) => void
  formatMoney: (value: number) => string
  formatDate: (value: Date) => string
}

export function DayTransactionsCard({
  selectedDate,
  dayTransactions,
  onCreateTransaction,
  onEditTransaction,
  formatMoney,
  formatDate,
}: Props) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Транзакції за день</h2>
        <button className="rounded bg-slate-900 px-2 py-1 text-xs text-white" onClick={onCreateTransaction}>
          + Add
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(new Date(selectedDate))}</p>
      <ul className="space-y-2">
        {dayTransactions.map((tx) => (
          <li key={tx.id}>
            <button className="w-full rounded border border-slate-200 p-2 text-left dark:border-slate-700 dark:bg-slate-700/30" onClick={() => onEditTransaction(tx)}>
              <p className="text-sm font-medium">{tx.category}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{tx.description || 'Без опису'}</p>
              <p className={`text-sm ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {tx.type === 'income' ? '+' : '-'}
                {formatMoney(tx.amount)}
              </p>
            </button>
          </li>
        ))}
        {dayTransactions.length === 0 && <li className="text-sm text-slate-500 dark:text-slate-400">Немає транзакцій</li>}
      </ul>
    </article>
  )
}
