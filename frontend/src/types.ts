export type TransactionType = 'expense' | 'income'

export type User = {
  id: number
  email: string
}

export type Transaction = {
  id: string
  amount: number
  category: string
  description: string | null
  type: TransactionType
  dateTs: number
}

export type MonthlyStats = {
  month: string
  totals: {
    income: number
    expense: number
    balance: number
  }
  categories: Array<{ category: string; type: TransactionType; total: number }>
}

export type BalanceResponse = {
  totals: {
    income: number
    expense: number
    balance: number
  }
}

export type Template = {
  id: number
  name: string
  amount: number
  category: string
  description: string | null
  type: TransactionType
  isActive: boolean
}

export type TransactionFormState = {
  id: string | null
  amount: string
  category: string
  date: string
  description: string
  type: TransactionType
}

export type TemplateFormState = {
  id: number | null
  name: string
  amount: string
  category: string
  description: string
  type: TransactionType
  isActive: boolean
}
