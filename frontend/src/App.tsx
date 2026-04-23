import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AddTransactionTab } from './components/AddTransactionTab'
import { AnalyticsTab } from './components/AnalyticsTab'
import { AuthForm } from './components/AuthForm'
import { BalanceCard } from './components/BalanceCard'
import { BottomNav } from './components/BottomNav'
import type { Tab } from './components/BottomNav'
import { CalendarGrid } from './components/CalendarGrid'
import { DashboardHeader } from './components/DashboardHeader'
import { DayTransactionsCard } from './components/DayTransactionsCard'
import { TemplatesSection } from './components/TemplatesSection'
import { TransactionModal } from './components/TransactionModal'
import { CATEGORIES } from './constants'
import type { BalanceResponse, MonthlyStats, Template, TemplateFormState, Transaction, TransactionFormState, User } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

const moneyFmt = new Intl.NumberFormat('lv-LV', { style: 'currency', currency: 'EUR' })
const dateFmt = new Intl.DateTimeFormat('lv-LV')
const AUTH_TOKEN_KEY = 'fm_access_token'

const todayIso = () => new Date().toISOString().slice(0, 10)
const monthIso = () => new Date().toISOString().slice(0, 7)
const toIsoDate = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10)
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
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(options?.headers ?? {}),
  })
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers,
    ...options,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof body.error === 'string' ? body.error : 'Request failed'
    throw new Error(message)
  }
  return body as T
}

const EMPTY_ADD_FORM: TransactionFormState = {
  id: null,
  amount: '',
  category: CATEGORIES[0],
  date: todayIso(),
  description: '',
  type: 'expense',
}

const EMPTY_EDIT_FORM: TransactionFormState = {
  id: null,
  amount: '',
  category: CATEGORIES[0],
  date: todayIso(),
  description: '',
  type: 'expense',
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [month, setMonth] = useState(monthIso())
  const [selectedDate, setSelectedDate] = useState(todayIso())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dayTransactions, setDayTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')

  // Separate state for add tab and edit modal
  const [addDraft, setAddDraft] = useState<TransactionFormState>(EMPTY_ADD_FORM)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<TransactionFormState>(EMPTY_EDIT_FORM)

  const [templateForm, setTemplateForm] = useState<TemplateFormState>({
    id: null,
    name: '',
    amount: '',
    category: CATEGORIES[0],
    description: '',
    type: 'expense',
    isActive: true,
  })

  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')

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
      localStorage.removeItem(AUTH_TOKEN_KEY)
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
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!user && !token) return
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
      const res = await apiRequest<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      })
      if (res.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, res.token)
      }
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
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      setUser(null)
      setTransactions([])
      setDayTransactions([])
      setStats(null)
      setBalance(null)
      setTemplates([])
      setIsBusy(false)
    }
  }

  const openAddTab = (date = selectedDate) => {
    setAddDraft({ ...EMPTY_ADD_FORM, date })
    setError('')
    setActiveTab('add')
  }

  const openEditTx = (tx: Transaction) => {
    setEditForm({
      id: tx.id,
      amount: String(tx.amount),
      category: tx.category,
      date: toIsoDate(tx.dateTs),
      description: tx.description ?? '',
      type: tx.type,
    })
    setShowEditModal(true)
  }

  const submitAdd = async (event: FormEvent) => {
    event.preventDefault()
    setIsBusy(true)
    setError('')
    try {
      await apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(addDraft.amount),
          category: addDraft.category,
          date: addDraft.date,
          description: addDraft.description || null,
          type: addDraft.type,
        }),
      })
      const nextMonth = addDraft.date.slice(0, 7)
      setMonth(nextMonth)
      setSelectedDate(addDraft.date)
      setAddDraft(EMPTY_ADD_FORM)
      await refreshData(nextMonth, addDraft.date)
      setActiveTab('home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction')
    } finally {
      setIsBusy(false)
    }
  }

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editForm.id) return
    setIsBusy(true)
    setError('')
    try {
      await apiRequest(`/transactions/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          amount: Number(editForm.amount),
          category: editForm.category,
          date: editForm.date,
          description: editForm.description || null,
          type: editForm.type,
        }),
      })
      setShowEditModal(false)
      const nextMonth = editForm.date.slice(0, 7)
      setMonth(nextMonth)
      setSelectedDate(editForm.date)
      await refreshData(nextMonth, editForm.date)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction')
    } finally {
      setIsBusy(false)
    }
  }

  const deleteTransaction = async () => {
    if (!editForm.id) return
    if (!window.confirm('Видалити транзакцію?')) return
    setIsBusy(true)
    setError('')
    try {
      await apiRequest(`/transactions/${editForm.id}`, { method: 'DELETE' })
      setShowEditModal(false)
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
        isActive: templateForm.isActive,
      }
      if (templateForm.id) {
        await apiRequest(`/templates/${templateForm.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiRequest('/templates', { method: 'POST', body: JSON.stringify(payload) })
      }
      setTemplateForm({ id: null, name: '', amount: '', category: CATEGORIES[0], description: '', type: 'expense', isActive: true })
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
        setTemplateForm({ id: null, name: '', amount: '', category: CATEGORIES[0], description: '', type: 'expense', isActive: true })
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
      await apiRequest(`/templates/${templateId}/create-transaction`, { method: 'POST' })
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
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const response = await fetch(`${API_BASE}/export/csv?from=${range.from}&to=${range.to}`, {
        method: 'GET',
        credentials: 'include',
        headers,
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(typeof body.error === 'string' ? body.error : 'Failed to export CSV')
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
        authEmail={authEmail}
        authPassword={authPassword}
        error={error}
        isBusy={isBusy}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onSubmit={submitAuth}
      />
    )
  }

  const showMonthPicker = activeTab === 'home' || activeTab === 'analytics'

  return (
    <div className="min-h-screen bg-revo-bg pb-20">
      <div className="mx-auto max-w-5xl px-4 pt-8 md:px-6">
        <DashboardHeader
          email={user.email}
          month={month}
          showMonthPicker={showMonthPicker}
          onMonthChange={(nextMonth) => void changeMonth(nextMonth)}
        />

        {error && (
          <p className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-revo-danger">{error}</p>
        )}
      </div>

      {activeTab === 'home' && (
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <section className="mb-8">
            <BalanceCard
              income={balance?.totals.income ?? 0}
              expense={balance?.totals.expense ?? 0}
              balance={balance?.totals.balance ?? 0}
              formatMoney={(value) => moneyFmt.format(value)}
            />
          </section>

          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <CalendarGrid
                calendarDays={calendarDays}
                calendarMap={calendarMap}
                selectedDate={selectedDate}
                onPickDay={(date) => void pickDay(date)}
              />
            </div>
            <div className="lg:col-span-5">
              <DayTransactionsCard
                selectedDate={selectedDate}
                dayTransactions={dayTransactions}
                onCreateTransaction={() => openAddTab(selectedDate)}
                onEditTransaction={openEditTx}
                formatMoney={(value) => moneyFmt.format(value)}
                formatDate={(value) => dateFmt.format(value)}
              />
            </div>
          </div>

          <section className="mt-16 flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 pb-4 pt-10">
            <button
              onClick={() => void exportCsv()}
              className="revo-btn-secondary !px-5 !py-2 !text-xs"
            >
              Експорт CSV
            </button>
            <button
              onClick={() => void logout()}
              className="rounded-full bg-slate-900 px-6 py-2 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-black"
            >
              Вийти
            </button>
          </section>
        </div>
      )}

      {activeTab === 'add' && (
        <AddTransactionTab
          form={addDraft}
          categories={CATEGORIES}
          isBusy={isBusy}
          error={error}
          onFormChange={setAddDraft}
          onSubmit={submitAdd}
        />
      )}

      {activeTab === 'templates' && (
        <div className="mx-auto max-w-5xl px-4 md:px-6">
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
        </div>
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab
          stats={stats}
          month={month}
          transactions={transactions}
          formatMoney={(value) => moneyFmt.format(value)}
          formatDate={(value) => dateFmt.format(value)}
        />
      )}

      <TransactionModal
        show={showEditModal}
        txForm={editForm}
        categories={CATEGORIES}
        onClose={() => setShowEditModal(false)}
        onSubmit={submitEdit}
        onDelete={() => void deleteTransaction()}
        onTxFormChange={setEditForm}
      />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {isBusy && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-6 py-2 text-sm font-medium text-white shadow-lg">
          Оновлення...
        </div>
      )}
    </div>
  )
}

export default App
