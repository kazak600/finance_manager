import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AuthForm } from './components/AuthForm'
import { BalanceCard } from './components/BalanceCard'
import { CalendarGrid } from './components/CalendarGrid'
import { DashboardHeader } from './components/DashboardHeader'
import { DayTransactionsCard } from './components/DayTransactionsCard'
import { MonthlyStatsCard } from './components/MonthlyStatsCard'
import { TemplatesSection } from './components/TemplatesSection'
import { TransactionModal } from './components/TransactionModal'
import type { BalanceResponse, MonthlyStats, Template, TemplateFormState, Transaction, TransactionFormState, User } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'
const CATEGORIES = ['Їжа', 'Транспорт', 'Житло', 'Розваги', "Здоров'я", 'Подарунки', 'Дохід', 'Інше']
const moneyFmt = new Intl.NumberFormat('lv-LV', { style: 'currency', currency: 'EUR' })
const dateFmt = new Intl.DateTimeFormat('lv-LV')

const todayIso = () => new Date().toISOString().slice(0, 10)
const monthIso = () => new Date().toISOString().slice(0, 7)
const toIsoDate = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10)
const toMonthKey = (ts: number) => toIsoDate(ts).slice(0, 7)
const monthRangeIso = (monthKey: string): { from: string; to: string } => {
  const [yearText, monthText] = monthKey.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText) - 1
  const firstDay = new Date(Date.UTC(year, monthIndex, 1))
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0))
  return {
    from: firstDay.toISOString().slice(0, 10),
    to: lastDay.toISOString().slice(0, 10),
  }
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof body.error === 'string' ? body.error : 'Request failed'
    throw new Error(message)
  }
  return body as T
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [month, setMonth] = useState(monthIso())
  const [selectedDate, setSelectedDate] = useState(todayIso())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dayTransactions, setDayTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')

  const [showTxModal, setShowTxModal] = useState(false)
  const [txForm, setTxForm] = useState<TransactionFormState>({
    id: null,
    amount: '',
    category: CATEGORIES[0],
    date: todayIso(),
    description: '',
    type: 'expense',
  })

  const [templateForm, setTemplateForm] = useState<TemplateFormState>({
    id: null,
    name: '',
    amount: '',
    category: CATEGORIES[0],
    description: '',
    type: 'expense',
    dayOfMonth: '1',
    isActive: true,
  })

  const calendarMap = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()
    for (const tx of transactions) {
      const date = toIsoDate(tx.dateTs)
      const current = map.get(date) ?? { income: 0, expense: 0 }
      if (tx.type === 'income') {
        current.income += tx.amount
      } else {
        current.expense += tx.amount
      }
      map.set(date, current)
    }
    return map
  }, [transactions])

  const calendarDays = useMemo(() => {
    const [yearText, monthText] = month.split('-')
    const year = Number(yearText)
    const monthIndex = Number(monthText) - 1
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
    return Array.from({ length: daysInMonth }, (_, idx) => {
      const day = String(idx + 1).padStart(2, '0')
      return `${month}-${day}`
    })
  }, [month])

  const loadDashboard = async (targetMonth: string, targetDate: string) => {
    const [txRes, dayRes, statsRes, balanceRes, templatesRes] = await Promise.all([
      apiRequest<{ transactions: Transaction[] }>(`/transactions?month=${targetMonth}`),
      apiRequest<{ transactions: Transaction[] }>(`/transactions/day?date=${targetDate}`),
      apiRequest<MonthlyStats>(`/stats/month?month=${targetMonth}`),
      apiRequest<BalanceResponse>('/stats/balance'),
      apiRequest<{ templates: Template[] }>('/templates'),
    ])
    setTransactions(txRes.transactions)
    setDayTransactions(dayRes.transactions)
    setStats(statsRes)
    setBalance(balanceRes)
    setTemplates(templatesRes.templates)
  }

  const bootstrap = async () => {
    setIsBusy(true)
    setError('')
    try {
      const me = await apiRequest<{ user: User }>('/auth/me')
      setUser(me.user)
      await loadDashboard(month, selectedDate)
    } catch {
      setUser(null)
    } finally {
      setIsBusy(false)
    }
  }

  useEffect(() => {
    void bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshData = async (nextMonth = month, nextDate = selectedDate) => {
    if (!user) return
    setIsBusy(true)
    setError('')
    try {
      await loadDashboard(nextMonth, nextDate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setIsBusy(false)
    }
  }

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault()
    setIsBusy(true)
    setError('')
    try {
      const res = await apiRequest<{ user: User }>(`/auth/${authMode}`, {
        method: 'POST',
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      })
      setUser(res.user)
      await loadDashboard(month, selectedDate)
      setAuthEmail('')
      setAuthPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed')
    } finally {
      setIsBusy(false)
    }
  }

  const logout = async () => {
    setIsBusy(true)
    setError('')
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
      setUser(null)
      setTransactions([])
      setDayTransactions([])
      setStats(null)
      setBalance(null)
      setTemplates([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    } finally {
      setIsBusy(false)
    }
  }

  const openCreateTx = (date = selectedDate) => {
    setTxForm({
      id: null,
      amount: '',
      category: CATEGORIES[0],
      date,
      description: '',
      type: 'expense',
    })
    setShowTxModal(true)
  }

  const openEditTx = (tx: Transaction) => {
    setTxForm({
      id: tx.id,
      amount: String(tx.amount),
      category: tx.category,
      date: toIsoDate(tx.dateTs),
      description: tx.description ?? '',
      type: tx.type,
    })
    setShowTxModal(true)
  }

  const submitTransaction = async (event: FormEvent) => {
    event.preventDefault()
    setIsBusy(true)
    setError('')
    try {
      const payload = {
        amount: Number(txForm.amount),
        category: txForm.category,
        date: txForm.date,
        description: txForm.description || null,
        type: txForm.type,
      }
      if (txForm.id) {
        await apiRequest(`/transactions/${txForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await apiRequest('/transactions', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      setShowTxModal(false)
      const nextMonth = txForm.date.slice(0, 7)
      setMonth(nextMonth)
      setSelectedDate(txForm.date)
      await refreshData(nextMonth, txForm.date)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction')
    } finally {
      setIsBusy(false)
    }
  }

  const deleteTransaction = async () => {
    if (!txForm.id) return
    if (!window.confirm('Видалити транзакцію?')) return
    setIsBusy(true)
    setError('')
    try {
      await apiRequest(`/transactions/${txForm.id}`, { method: 'DELETE' })
      setShowTxModal(false)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction')
    } finally {
      setIsBusy(false)
    }
  }

  const submitTemplate = async (event: FormEvent) => {
    event.preventDefault()
    setIsBusy(true)
    setError('')
    try {
      const payload = {
        name: templateForm.name,
        amount: Number(templateForm.amount),
        category: templateForm.category,
        description: templateForm.description || null,
        type: templateForm.type,
        dayOfMonth: Number(templateForm.dayOfMonth),
        isActive: templateForm.isActive,
      }
      if (templateForm.id) {
        await apiRequest(`/templates/${templateForm.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiRequest('/templates', { method: 'POST', body: JSON.stringify(payload) })
      }
      setTemplateForm({
        id: null,
        name: '',
        amount: '',
        category: CATEGORIES[0],
        description: '',
        type: 'expense',
        dayOfMonth: '1',
        isActive: true,
      })
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setIsBusy(false)
    }
  }

  const editTemplate = (template: Template) => {
    setTemplateForm({
      id: template.id,
      name: template.name,
      amount: String(template.amount),
      category: template.category,
      description: template.description ?? '',
      type: template.type,
      dayOfMonth: String(template.dayOfMonth),
      isActive: template.isActive,
    })
  }

  const deleteTemplate = async (templateId: number) => {
    if (!window.confirm('Видалити шаблон?')) return
    setIsBusy(true)
    setError('')
    try {
      await apiRequest(`/templates/${templateId}`, { method: 'DELETE' })
      if (templateForm.id === templateId) {
        setTemplateForm({
          id: null,
          name: '',
          amount: '',
          category: CATEGORIES[0],
          description: '',
          type: 'expense',
          dayOfMonth: '1',
          isActive: true,
        })
      }
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    } finally {
      setIsBusy(false)
    }
  }

  const createFromTemplate = async (templateId: number) => {
    setIsBusy(true)
    setError('')
    try {
      await apiRequest(`/templates/${templateId}/create-transaction`, {
        method: 'POST',
        body: JSON.stringify({ date: selectedDate }),
      })
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction from template')
    } finally {
      setIsBusy(false)
    }
  }

  const changeMonth = async (nextMonth: string) => {
    const nextDate = `${nextMonth}-01`
    setMonth(nextMonth)
    setSelectedDate(nextDate)
    await refreshData(nextMonth, nextDate)
  }

  const pickDay = async (date: string) => {
    setSelectedDate(date)
    await refreshData(month, date)
  }

  const exportCsv = async () => {
    setIsBusy(true)
    setError('')
    try {
      const range = monthRangeIso(month)
      const response = await fetch(`${API_BASE}/export/csv?from=${range.from}&to=${range.to}`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message = typeof body.error === 'string' ? body.error : 'Failed to export CSV'
        throw new Error(message)
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      const fileNameMatch = contentDisposition?.match(/filename="([^"]+)"/)
      const fileName = fileNameMatch?.[1] ?? `transactions-${range.from}-to-${range.to}.csv`
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV')
    } finally {
      setIsBusy(false)
    }
  }

  if (!user) {
    return (
      <AuthForm
        authMode={authMode}
        authEmail={authEmail}
        authPassword={authPassword}
        error={error}
        isBusy={isBusy}
        onAuthModeChange={setAuthMode}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onSubmit={submitAuth}
      />
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 md:px-6">
      <DashboardHeader
        email={user.email}
        month={month}
        onMonthChange={(nextMonth) => void changeMonth(nextMonth)}
        onCreateTransaction={() => openCreateTx()}
        onExportCsv={() => void exportCsv()}
        onLogout={() => void logout()}
      />

      {error && <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <BalanceCard
          income={balance?.totals.income ?? 0}
          expense={balance?.totals.expense ?? 0}
          balance={balance?.totals.balance ?? 0}
          formatMoney={(value) => moneyFmt.format(value)}
        />
        <MonthlyStatsCard stats={stats} fallbackMonth={month} formatMoney={(value) => moneyFmt.format(value)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <CalendarGrid
          calendarDays={calendarDays}
          calendarMap={calendarMap}
          selectedDate={selectedDate}
          onPickDay={(date) => void pickDay(date)}
          formatMoney={(value) => moneyFmt.format(value)}
        />
        <DayTransactionsCard
          selectedDate={selectedDate}
          dayTransactions={dayTransactions}
          onCreateTransaction={() => openCreateTx(selectedDate)}
          onEditTransaction={openEditTx}
          formatMoney={(value) => moneyFmt.format(value)}
          formatDate={(value) => dateFmt.format(value)}
        />
      </section>

      <TemplatesSection
        templateForm={templateForm}
        templates={templates}
        categories={CATEGORIES}
        onTemplateFormChange={setTemplateForm}
        onSubmit={submitTemplate}
        onCreateFromTemplate={(templateId) => void createFromTemplate(templateId)}
        onEditTemplate={editTemplate}
        onDeleteTemplate={(templateId) => void deleteTemplate(templateId)}
        formatMoney={(value) => moneyFmt.format(value)}
      />

      <TransactionModal
        show={showTxModal}
        txForm={txForm}
        categories={CATEGORIES}
        onClose={() => setShowTxModal(false)}
        onSubmit={submitTransaction}
        onDelete={() => void deleteTransaction()}
        onTxFormChange={setTxForm}
      />

      {isBusy && <p className="mt-4 text-sm text-slate-500">Оновлення даних...</p>}
      <p className="mt-4 text-xs text-slate-400">Поточний місяць: {toMonthKey(Date.now() / 1000)}</p>
    </main>
  )
}

export default App
