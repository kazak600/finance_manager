import type { MonthlyStats } from '../types'

type Props = {
  stats: MonthlyStats | null
  fallbackMonth: string
  formatMoney: (value: number) => string
}

export function MonthlyStatsCard({ stats, fallbackMonth, formatMoney }: Props) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2 dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-2 text-xs uppercase text-slate-500 dark:text-slate-400">Місячна статистика ({stats?.month ?? fallbackMonth})</p>
      <div className="mb-3 flex gap-4 text-sm">
        <span>Доходи: {formatMoney(stats?.totals.income ?? 0)}</span>
        <span>Витрати: {formatMoney(stats?.totals.expense ?? 0)}</span>
        <span>Баланс: {formatMoney(stats?.totals.balance ?? 0)}</span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {(stats?.categories ?? []).map((item) => (
          <li key={`${item.type}-${item.category}`} className="rounded bg-slate-50 px-3 py-2 text-sm dark:bg-slate-700/60">
            <span className="font-medium">{item.category}</span> ({item.type}) - {formatMoney(item.total)}
          </li>
        ))}
      </ul>
    </article>
  )
}
