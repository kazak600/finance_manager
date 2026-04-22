import { useEffect, useState } from 'react'
import type { MonthlyStats, Transaction, TransactionType } from '../types'
import { CATEGORY_EMOJIS } from '../constants'

type DrillDown = { category: string; type: TransactionType } | null

type Props = {
  stats: MonthlyStats | null
  month: string
  transactions: Transaction[]
  formatMoney: (value: number) => string
  formatDate: (value: Date) => string
}

export function AnalyticsTab({ stats, month, transactions, formatMoney, formatDate }: Props) {
  const [drillDown, setDrillDown] = useState<DrillDown>(null)

  useEffect(() => {
    setDrillDown(null)
  }, [month])

  const categories = stats?.categories ?? []
  const maxTotal = Math.max(...categories.map((c) => c.total), 1)

  if (drillDown) {
    const filtered = transactions.filter(
      (tx) => tx.category === drillDown.category && tx.type === drillDown.type,
    )
    const total = filtered.reduce((sum, tx) => sum + tx.amount, 0)
    const emoji = CATEGORY_EMOJIS[drillDown.category] ?? '📦'

    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <button
          onClick={() => setDrillDown(null)}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-revo-blue"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Назад
        </button>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-3xl shadow-revo-sm">
            {emoji}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-revo-text">{drillDown.category}</h1>
            <p className="text-sm font-bold text-revo-gray">
              {drillDown.type === 'income' ? 'Доходи' : 'Витрати'} • {formatMoney(total)}
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {filtered.length === 0 ? (
            <li className="py-12 text-center text-sm font-bold text-revo-gray">Немає транзакцій</li>
          ) : (
            filtered.map((tx) => (
              <li key={tx.id} className="revo-card flex items-center justify-between !p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-revo-text">
                    {tx.description || tx.category}
                  </p>
                  <p className="text-xs font-medium text-revo-gray">
                    {formatDate(new Date(tx.dateTs * 1000))}
                  </p>
                </div>
                <p className={`ml-4 shrink-0 text-base font-black ${tx.type === 'income' ? 'text-revo-success' : 'text-revo-text'}`}>
                  {tx.type === 'income' ? '+' : ''}{formatMoney(tx.amount)}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-2xl font-black tracking-tight text-revo-text">
        Аналітика {stats?.month ?? month}
      </h1>

      {categories.length === 0 ? (
        <div className="py-16 text-center text-sm font-bold text-revo-gray">
          Немає даних за цей місяць
        </div>
      ) : (
        <ul className="space-y-3">
          {categories.map((item) => {
            const emoji = CATEGORY_EMOJIS[item.category] ?? '📦'
            const percentage = (item.total / maxTotal) * 100

            return (
              <li key={`${item.type}-${item.category}`}>
                <button
                  className="revo-card flex w-full items-center gap-4 !p-4 text-left transition-all hover:shadow-revo-md active:scale-[0.98]"
                  onClick={() => setDrillDown({ category: item.category, type: item.type })}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-xl">
                    {emoji}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="truncate text-revo-text">{item.category}</span>
                      <span className={item.type === 'income' ? 'text-revo-success' : 'text-revo-text'}>
                        {formatMoney(item.total)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.type === 'income' ? 'bg-revo-success' : 'bg-revo-blue'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 text-slate-300">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
