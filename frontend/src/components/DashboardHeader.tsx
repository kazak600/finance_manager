type Props = {
  email: string
  month: string
  onMonthChange: (month: string) => void
}

export function DashboardHeader({
  email,
  month,
  onMonthChange,
}: Props) {
  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-revo-text">Finance</h1>
        <p className="text-sm font-bold text-revo-gray">{email}</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="rounded-full bg-white px-4 py-2 text-sm font-black shadow-revo-sm focus:outline-none focus:ring-2 focus:ring-revo-blue"
        />
      </div>
    </header>
  )
}
