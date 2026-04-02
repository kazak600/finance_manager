type Props = {
  email: string
  month: string
  isDarkMode: boolean
  canInstallPwa: boolean
  onMonthChange: (month: string) => void
  onCreateTransaction: () => void
  onExportCsv: () => void
  onToggleDarkMode: () => void
  onInstallPwa: () => void
  onLogout: () => void
}

export function DashboardHeader({
  email,
  month,
  isDarkMode,
  canInstallPwa,
  onMonthChange,
  onCreateTransaction,
  onExportCsv,
  onToggleDarkMode,
  onInstallPwa,
  onLogout,
}: Props) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div>
        <h1 className="text-2xl font-semibold">Finance Manager</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{email}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <button className="rounded bg-slate-200 px-3 py-2 text-sm dark:bg-slate-700" onClick={onCreateTransaction}>
          + Transaction
        </button>
        <button className="rounded bg-emerald-600 px-3 py-2 text-sm text-white" onClick={onExportCsv}>
          Export CSV
        </button>
        {canInstallPwa && (
          <button className="rounded bg-indigo-600 px-3 py-2 text-sm text-white" onClick={onInstallPwa}>
            Install App
          </button>
        )}
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900" onClick={onToggleDarkMode}>
          {isDarkMode ? 'Light' : 'Dark'}
        </button>
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
