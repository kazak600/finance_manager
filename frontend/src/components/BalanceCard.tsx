type Props = {
  income: number
  expense: number
  balance: number
  formatMoney: (value: number) => string
}

export function BalanceCard({ income, expense, balance, formatMoney }: Props) {
  return (
    <div className="revo-card flex flex-col justify-between overflow-hidden !p-8 shadow-revo-md">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-revo-gray">Мій баланс</p>
        <h2 className="mt-1 text-5xl font-black tracking-tighter text-revo-text">
          {formatMoney(balance)}
        </h2>
      </div>

      <div className="mt-8 flex gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase text-revo-success">Доходи</p>
          <p className="text-lg font-bold text-revo-text">{formatMoney(income)}</p>
        </div>
        <div className="h-10 w-px bg-slate-100"></div>
        <div>
          <p className="text-[10px] font-bold uppercase text-revo-danger">Витрати</p>
          <p className="text-lg font-bold text-revo-text">{formatMoney(expense)}</p>
        </div>
      </div>
    </div>
  )
}
