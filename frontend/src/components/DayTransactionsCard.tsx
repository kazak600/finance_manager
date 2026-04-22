import type { Transaction } from '../types'
import { CATEGORY_EMOJIS } from '../constants'

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
    <article className="revo-card lg:col-span-5 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-revo-text">Виписка</h2>
        <button 
          className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-revo-blue hover:bg-slate-200 transition-colors" 
          onClick={onCreateTransaction}
        >
          Додати
        </button>
      </div>
      
      <p className="mb-6 text-xs font-bold uppercase tracking-wider text-revo-gray">
        {formatDate(new Date(selectedDate))}
      </p>
      
      <div className="flex-1 overflow-y-auto pr-1">
        <ul className="space-y-6">
          {dayTransactions.map((tx) => {
            const emoji = CATEGORY_EMOJIS[tx.category] || '📦'
            return (
              <li key={tx.id}>
                <button 
                  className="group flex w-full items-center gap-4 text-left transition-all active:scale-[0.98]" 
                  onClick={() => onEditTransaction(tx)}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-50 text-2xl transition-colors group-hover:bg-slate-100">
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-revo-text truncate">{tx.category}</p>
                    <p className="text-sm font-medium text-revo-gray truncate">
                      {tx.description || 'Транзакція'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black tracking-tight ${
                      tx.type === 'income' ? 'text-revo-success' : 'text-revo-text'
                    }`}>
                      {tx.type === 'income' ? '+' : ''}
                      {formatMoney(tx.amount)}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
          
          {dayTransactions.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-3 text-4xl">🏝️</div>
              <p className="text-sm font-bold text-revo-gray">Транзакцій не знайдено</p>
            </div>
          )}
        </ul>
      </div>
    </article>
  )
}
