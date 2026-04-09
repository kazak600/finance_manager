import type { FormEvent } from 'react'

type Props = {
  authEmail: string
  authPassword: string
  error: string
  isBusy: boolean
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onSubmit: (event: FormEvent) => Promise<void>
}

export function AuthForm({
  authEmail,
  authPassword,
  error,
  isBusy,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-revo-bg px-6">
      <div className="w-full max-w-md revo-card !p-10 shadow-revo-md">
        <div className="mb-10 text-center">
          <img 
            src="/favicon.svg" 
            alt="Logo" 
            className="mx-auto mb-6 h-20 w-20 rounded-3xl shadow-xl shadow-revo-blue/20" 
          />
          <h1 className="text-3xl font-black tracking-tight text-revo-text">Finance</h1>
          <p className="mt-2 text-sm font-bold text-revo-gray">Твій капітал під контролем</p>
        </div>

        <form onSubmit={(event) => void onSubmit(event)} className="space-y-6">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Email</label>
            <input
              className="revo-input font-bold"
              type="email"
              placeholder="email@example.com"
              value={authEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Пароль</label>
            <input
              className="revo-input font-bold"
              type="password"
              placeholder="••••••••"
              value={authPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-revo-danger/10 p-4 text-center text-sm font-bold text-revo-danger">
              {error}
            </div>
          )}

          <button
            className="revo-btn-primary w-full !py-4 shadow-lg shadow-revo-blue/20 mt-4"
            type="submit"
            disabled={isBusy}
          >
            {isBusy ? 'Вхід...' : 'Увійти'}
          </button>
        </form>
        
        <p className="mt-10 text-center text-xs font-bold text-revo-gray">
          &copy; 2026 Finance Manager MVP
        </p>
      </div>
    </main>
  )
}
