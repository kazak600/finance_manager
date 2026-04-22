const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

type DaySummary = { income: number; expense: number }

type Props = {
  calendarDays: string[]
  calendarMap: Map<string, DaySummary>
  selectedDate: string
  onPickDay: (date: string) => void
}

export function CalendarGrid({ calendarDays, calendarMap, selectedDate, onPickDay }: Props) {
  const todayIso = new Date().toISOString().slice(0, 10)

  // Monday-first offset: Mon=0 … Sun=6
  const firstDayOfWeek = calendarDays.length > 0
    ? (new Date(`${calendarDays[0]}T00:00:00`).getDay() + 6) % 7
    : 0

  const emptyLeadingCells = Array.from({ length: firstDayOfWeek })

  return (
    <article className="revo-card lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-revo-text">Календар</h2>
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-revo-gray">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-revo-success"></div> Доходи
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-revo-danger"></div> Витрати
          </div>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="py-1 text-center text-[10px] font-black uppercase tracking-wider text-revo-gray">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-1">
        {emptyLeadingCells.map((_, idx) => (
          <div key={`empty-${idx}`} />
        ))}

        {calendarDays.map((date) => {
          const day = parseInt(date.slice(-2), 10)
          const dayData = calendarMap.get(date) ?? { income: 0, expense: 0 }
          const isSelected = date === selectedDate
          const isToday = date === todayIso

          return (
            <button
              key={date}
              className={`group flex flex-col items-center justify-center rounded-xl py-2 transition-all active:scale-95 ${
                isSelected
                  ? 'bg-revo-blue text-white shadow-md shadow-revo-blue/20 ring-2 ring-slate-900'
                  : isToday
                  ? 'bg-slate-50 ring-2 ring-slate-900 text-revo-text'
                  : 'bg-slate-50 text-revo-text hover:bg-slate-100'
              }`}
              onClick={() => onPickDay(date)}
            >
              <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-revo-text'}`}>
                {day}
              </span>

              <div className="mt-0.5 flex gap-0.5">
                {dayData.income > 0 && (
                  <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-revo-success'}`} />
                )}
                {dayData.expense > 0 && (
                  <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-revo-danger'}`} />
                )}
                {dayData.income === 0 && dayData.expense === 0 && (
                  <div className="h-1 w-1 rounded-full bg-transparent" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </article>
  )
}
