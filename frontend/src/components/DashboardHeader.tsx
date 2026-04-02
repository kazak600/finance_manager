type Props = {
  email: string
  month: string
  onMonthChange: (month: string) => void
  onCreateTransaction: () => void
  onLogout: () => void
}

export function DashboardHeader({ email, month, onMonthChange, onCreateTransaction, onLogout }: Props) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <h1 className="text-2xl font-semibold">Finance Manager</h1>
        <p className="text-sm text-slate-600">{email}</p>
      </div>
      <div className="flex gap-2">
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1"
        />
        <button className="rounded bg-slate-200 px-3 py-2 text-sm" onClick={onCreateTransaction}>
          + Transaction
        </button>
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
