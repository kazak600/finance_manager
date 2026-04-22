type Props = {
  email: string
  month: string
  showMonthPicker: boolean
  onMonthChange: (month: string) => void
}

export function DashboardHeader({ email, month, showMonthPicker, onMonthChange }: Props) {
  return (
    <header className="mb-10 flex items-start justify-between">
      <div className="flex flex-col gap-3">
        <img
          src="/favicon.svg"
          alt="Logo"
          className="h-12 w-12 rounded-2xl shadow-lg shadow-revo-blue/20"
        />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-revo-blue">Finance</p>
          <p className="text-xs font-bold text-revo-gray">{email}</p>
        </div>
      </div>

      {showMonthPicker && (
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="rounded-full bg-white px-4 py-2 text-sm font-black shadow-revo-sm focus:outline-none focus:ring-2 focus:ring-revo-blue"
        />
      )}
    </header>
  )
}
