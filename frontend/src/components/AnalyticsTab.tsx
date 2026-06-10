import { useEffect, useState } from 'react'
import type { MonthlyStats, Transaction } from '../types'
import { TransactionType } from '../types'
import { CATEGORY_EMOJIS } from '../constants'

type DrillDown = { category: string; type: TransactionType } | null

type Props = {
  stats: MonthlyStats | null
  month: string
  transactions: Transaction[]
  period: 'month' | 'year'
  onPeriodChange: (period: 'month' | 'year') => void
  formatMoney: (value: number) => string
  formatDate: (value: Date) => string
}

export function AnalyticsTab({
  stats,
  month,
  transactions,
  period,
  onPeriodChange,
  formatMoney,
  formatDate,
}: Props) {
  const [drillDown, setDrillDown] = useState<DrillDown>(null)

  useEffect(() => {
    setDrillDown(null)
  }, [month, period])

  const categories = (stats?.categories ?? []).filter((c) => c.type === TransactionType.Expense)
  const totalExpenses = categories.reduce((sum, c) => sum + c.total, 0)

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
              Витрати • {formatMoney(total)}
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
                <p className="ml-4 shrink-0 text-base font-black text-revo-text">
                  {formatMoney(tx.amount)}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    )
  }

  const title = period === 'month' 
    ? `Аналітика за ${stats?.month ?? month}`
    : `Аналітика за ${new Date().getFullYear()} рік`

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-8 flex flex-col gap-6">
        <h1 className="text-2xl font-black tracking-tight text-revo-text">
          {title}
        </h1>

        <div className="flex rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => onPeriodChange('month')}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${
              period === 'month' ? 'bg-white text-revo-blue shadow-sm' : 'text-revo-gray hover:text-revo-text'
            }`}
          >
            Місяць
          </button>
          <button
            onClick={() => onPeriodChange('year')}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${
              period === 'year' ? 'bg-white text-revo-blue shadow-sm' : 'text-revo-gray hover:text-revo-text'
            }`}
          >
            Рік
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="py-16 text-center text-sm font-bold text-revo-gray">
          Немає витрат за цей період
        </div>
      ) : (
        <ul className="space-y-3">
          {categories.map((item) => {
            const emoji = CATEGORY_EMOJIS[item.category] ?? '📦'
            const percentage = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0

            return (
              <li key={`${item.type}-${item.category}`}>
                <div
                  className={`revo-card flex w-full items-center gap-4 !p-4 text-left transition-all ${
                    period === 'month' ? 'cursor-pointer hover:shadow-revo-md active:scale-[0.98]' : 'cursor-default'
                  }`}
                  onClick={() => period === 'month' && setDrillDown({ category: item.category, type: item.type })}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-xl">
                    {emoji}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="truncate text-revo-text">
                        {item.category} <span className="ml-1 font-black text-revo-blue/40">{percentage.toFixed(0)}%</span>
                      </span>
                      <span className="text-revo-text">
                        {formatMoney(item.total)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-revo-blue"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  {period === 'month' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 text-slate-300">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  )
}
