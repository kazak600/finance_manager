import type { FormEvent } from 'react'

type Props = {
  authMode: 'login' | 'register'
  authEmail: string
  authPassword: string
  error: string
  isBusy: boolean
  onAuthModeChange: (mode: 'login' | 'register') => void
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onSubmit: (event: FormEvent) => Promise<void>
}

export function AuthForm({
  authMode,
  authEmail,
  authPassword,
  error,
  isBusy,
  onAuthModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: Props) {
  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-16">
      <form onSubmit={(event) => void onSubmit(event)} className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Finance Manager</h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">Увійдіть або зареєструйтесь, щоб керувати фінансами.</p>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => onAuthModeChange('login')}
            className={`rounded px-3 py-2 text-sm transition-colors ${
              authMode === 'login' 
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            Увійти
          </button>
          <button
            type="button"
            onClick={() => onAuthModeChange('register')}
            className={`rounded px-3 py-2 text-sm transition-colors ${
              authMode === 'register' 
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            Реєстрація
          </button>
        </div>
        <div className="space-y-3">
          <input
            className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            type="email"
            placeholder="email@example.com"
            value={authEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            required
          />
          <input
            className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            type="password"
            placeholder="password"
            value={authPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          className="mt-5 w-full rounded bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={isBusy}
        >
          {isBusy ? 'Loading...' : authMode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>
    </main>
  )
}
