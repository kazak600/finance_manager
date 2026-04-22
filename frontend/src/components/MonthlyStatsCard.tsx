import type { MonthlyStats } from '../types'
import { CATEGORY_EMOJIS } from '../constants'

type Props = {
  stats: MonthlyStats | null
  fallbackMonth: string
  formatMoney: (value: number) => string
}

export function MonthlyStatsCard({ stats, fallbackMonth, formatMoney }: Props) {
  const categories = stats?.categories ?? []
  const maxTotal = Math.max(...categories.map(c => c.total), 1)

  return (
    <article className="revo-card md:col-span-2 shadow-revo-md">
      <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-revo-gray">
        Аналітика за {stats?.month ?? fallbackMonth}
      </p>
      
      {categories.length === 0 ? (
        <p className="py-8 text-center text-revo-gray">Немає даних за цей місяць</p>
      ) : (
        <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {categories.map((item) => {
            const emoji = CATEGORY_EMOJIS[item.category] || '📦'
            const percentage = (item.total / maxTotal) * 100
            
            return (
              <li key={`${item.type}-${item.category}`} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                  {emoji}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="truncate">{item.category}</span>
                    <span>{formatMoney(item.total)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.type === 'income' ? 'bg-revo-success' : 'bg-revo-blue'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
