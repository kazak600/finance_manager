type DaySummary = { income: number; expense: number }

type Props = {
  calendarDays: string[]
  calendarMap: Map<string, DaySummary>
  selectedDate: string
  onPickDay: (date: string) => void
  formatMoney: (value: number) => string
}

export function CalendarGrid({ calendarDays, calendarMap, selectedDate, onPickDay, formatMoney }: Props) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-4 text-lg font-semibold">Календар</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
        {calendarDays.map((date) => {
          const day = date.slice(-2)
          const dayData = calendarMap.get(date) ?? { income: 0, expense: 0 }
          const selected = date === selectedDate
          return (
            <button
              key={date}
              className={`rounded border p-2 text-left ${selected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}
              onClick={() => onPickDay(date)}
            >
              <p className="text-sm font-semibold">{day}</p>
              <p className="text-xs text-emerald-700">+{formatMoney(dayData.income)}</p>
              <p className="text-xs text-rose-700">-{formatMoney(dayData.expense)}</p>
            </button>
          )
        })}
      </div>
    </article>
  )
}
