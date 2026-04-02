type Props = {
  income: number
  expense: number
  balance: number
  formatMoney: (value: number) => string
}

export function BalanceCard({ income, expense, balance, formatMoney }: Props) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Загальний баланс</p>
      <p className="mt-2 text-2xl font-semibold">{formatMoney(balance)}</p>
      <p className="mt-1 text-sm text-emerald-700">Доходи: {formatMoney(income)}</p>
      <p className="text-sm text-rose-700">Витрати: {formatMoney(expense)}</p>
    </article>
  )
}
