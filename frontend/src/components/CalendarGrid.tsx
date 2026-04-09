type DaySummary = { income: number; expense: number }

type Props = {
  calendarDays: string[]
  calendarMap: Map<string, DaySummary>
  selectedDate: string
  onPickDay: (date: string) => void
}

export function CalendarGrid({ calendarDays, calendarMap, selectedDate, onPickDay }: Props) {
  return (
    <article className="revo-card lg:col-span-2">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-revo-text">Календар</h2>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-revo-gray">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-revo-success"></div> Доходи
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-revo-danger"></div> Витрати
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-7">
        {calendarDays.map((date) => {
          const day = parseInt(date.slice(-2), 10)
          const dayData = calendarMap.get(date) ?? { income: 0, expense: 0 }
          const selected = date === selectedDate
          const hasActivity = dayData.income > 0 || dayData.expense > 0

          return (
            <button
              key={date}
              className={`group flex flex-col items-center justify-center rounded-2xl py-3 px-2 transition-all active:scale-95 ${
                selected 
                  ? 'bg-revo-blue text-white shadow-md shadow-revo-blue/20' 
                  : 'bg-slate-50 text-revo-text hover:bg-slate-100'
              }`}
              onClick={() => onPickDay(date)}
            >
              <span className={`text-lg font-black tracking-tighter ${selected ? 'text-white' : 'text-revo-text'}`}>
                {day}
              </span>
              
              <div className="mt-1 flex gap-0.5">
                {dayData.income > 0 && (
                  <div className={`h-1 w-1 rounded-full ${selected ? 'bg-white' : 'bg-revo-success'}`} />
                )}
                {dayData.expense > 0 && (
                  <div className={`h-1 w-1 rounded-full ${selected ? 'bg-white' : 'bg-revo-danger'}`} />
                )}
                {!hasActivity && (
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
