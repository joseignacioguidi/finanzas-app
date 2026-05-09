import type {
  User,
  Category,
  Transaction,
  MonthlyStatRow,
  CategoryStatRow,
  TransactionInput,
  CategoryInput,
  RecurringTransaction,
  RecurringTransactionInput,
  APIError,
  ReportSummary,
  ReportByCategoryRow,
  ReportMonthlyRow,
  TopTransactionsResult,
  SavingsResult,
  TrendResult,
  GoalResult,
  GoalInput,
  EmergencyFundResult,
  Budget,
  BudgetResult,
  BudgetInput,
  BudgetUpdateInput,
  SavingResult,
  SavingsResponse,
  SavingInput,
} from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
    throw new Error('Sesión expirada')
  }

  if (!response.ok) {
    const error: APIError = await response.json()
    throw new Error(error.error ?? 'Error desconocido')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export interface ExchangeRateResult {
  from: string
  to: string
  rate: number
  fetched_at: string
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function register(email: string, password: string): Promise<User> {
  return apiFetch<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  return apiFetch<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

// ── User ──────────────────────────────────────────────────────────────────────

export async function getMe(): Promise<User> {
  return apiFetch<User>('/api/user/me')
}

export async function updateBaseCurrency(currency: string): Promise<User> {
  return apiFetch<User>('/api/user/me', {
    method: 'PUT',
    body: JSON.stringify({ base_currency: currency }),
  })
}

// ── Exchange rates ────────────────────────────────────────────────────────────

export async function getExchangeRate(from: string, to: string): Promise<ExchangeRateResult> {
  return apiFetch<ExchangeRateResult>(`/api/exchange-rates?from=${from}&to=${to}`)
}

// ── Transactions ──────────────────────────────────────────────────────────────

interface TransactionFilter {
  month?: string
  year?: string
  type?: string
  category?: string
  status?: string
}

export async function getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
  const params = new URLSearchParams()
  if (filter?.month) params.set('month', filter.month)
  if (filter?.year) params.set('year', filter.year)
  if (filter?.type) params.set('type', filter.type)
  if (filter?.category) params.set('category', filter.category)
  if (filter?.status) params.set('status', filter.status)
  const qs = params.toString()
  const data = await apiFetch<Transaction[] | null>(`/api/transactions${qs ? `?${qs}` : ''}`)
  return data ?? []
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  return apiFetch<Transaction>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
  return apiFetch<Transaction>(`/api/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteTransaction(id: string): Promise<void> {
  return apiFetch<void>(`/api/transactions/${id}`, { method: 'DELETE' })
}

// ── Recurring transactions ────────────────────────────────────────────────────

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const data = await apiFetch<RecurringTransaction[] | null>('/api/recurring')
  return data ?? []
}

export async function createRecurringTransaction(input: RecurringTransactionInput): Promise<RecurringTransaction> {
  return apiFetch<RecurringTransaction>('/api/recurring', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function deactivateRecurringTransaction(id: string): Promise<void> {
  return apiFetch<void>(`/api/recurring/${id}`, { method: 'DELETE' })
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const data = await apiFetch<Category[] | null>('/api/categories')
  return data ?? []
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  return apiFetch<Category>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  return apiFetch<Category>(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/api/categories/${id}`, { method: 'DELETE' })
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getMonthlyStats(): Promise<MonthlyStatRow[]> {
  const data = await apiFetch<MonthlyStatRow[] | null>('/api/stats/monthly')
  return data ?? []
}

export async function getCategoryStats(): Promise<CategoryStatRow[]> {
  const data = await apiFetch<CategoryStatRow[] | null>('/api/stats/categories')
  return data ?? []
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function getReportSummary(from: string, to: string): Promise<ReportSummary> {
  return apiFetch<ReportSummary>(`/api/reports/summary?from=${from}&to=${to}`)
}

export async function getReportByCategory(from: string, to: string): Promise<ReportByCategoryRow[]> {
  const data = await apiFetch<ReportByCategoryRow[] | null>(`/api/reports/by-category?from=${from}&to=${to}`)
  return data ?? []
}

export async function getReportMonthly(year?: number): Promise<ReportMonthlyRow[]> {
  const qs = year ? `?year=${year}` : ''
  const data = await apiFetch<ReportMonthlyRow[] | null>(`/api/reports/monthly${qs}`)
  return data ?? []
}

export async function getTopTransactions(from: string, to: string, limit = 10): Promise<TopTransactionsResult> {
  return apiFetch<TopTransactionsResult>(`/api/reports/top-transactions?from=${from}&to=${to}&limit=${limit}`)
}

export async function importTransactions(file: File): Promise<{ imported: number; skipped: string[] }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
  const body = new FormData()
  body.append('file', file)
  const response = await fetch(`${API_URL}/api/transactions/import`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error ?? 'Error al importar')
  }
  return response.json()
}

export async function exportTransactions(
  from: string,
  to: string,
  type?: string,
  categories?: string[],
): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
  const params = new URLSearchParams({ from, to })
  if (type) params.set('type', type)
  if (categories && categories.length > 0) params.set('categories', categories.join(','))
  const response = await fetch(`${API_URL}/api/reports/export?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error('Error al exportar')
  return response.blob()
}

// ── Analysis ──────────────────────────────────────────────────────────────────

export async function getAnalysisSavings(months = 12): Promise<SavingsResult> {
  return apiFetch<SavingsResult>(`/api/analysis/savings?months=${months}`)
}

export async function getAnalysisTrends(months = 3): Promise<TrendResult[]> {
  const data = await apiFetch<TrendResult[] | null>(`/api/analysis/trends?months=${months}`)
  return data ?? []
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function getGoals(): Promise<GoalResult[]> {
  const data = await apiFetch<GoalResult[] | null>('/api/goals')
  return data ?? []
}

export async function createGoal(input: GoalInput): Promise<GoalResult> {
  return apiFetch<GoalResult>('/api/goals', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateGoal(id: string, input: GoalInput): Promise<GoalResult> {
  return apiFetch<GoalResult>(`/api/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteGoal(id: string): Promise<void> {
  return apiFetch<void>(`/api/goals/${id}`, { method: 'DELETE' })
}

export async function getEmergencyFund(): Promise<EmergencyFundResult> {
  return apiFetch<EmergencyFundResult>('/api/goals/emergency-fund')
}

// ── Budgets ───────────────────────────────────────────────────────────────────

export async function getBudgets(month: number, year: number): Promise<BudgetResult[]> {
  const data = await apiFetch<BudgetResult[] | null>(`/api/budgets?month=${month}&year=${year}`)
  return data ?? []
}

export async function createBudget(input: BudgetInput): Promise<Budget> {
  return apiFetch<Budget>('/api/budgets', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateBudget(id: string, input: BudgetUpdateInput): Promise<Budget> {
  return apiFetch<Budget>(`/api/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteBudget(id: string): Promise<void> {
  return apiFetch<void>(`/api/budgets/${id}`, { method: 'DELETE' })
}

// ── Savings ───────────────────────────────────────────────────────────────────

export async function getSavings(): Promise<SavingsResponse> {
  return apiFetch<SavingsResponse>('/api/savings')
}

export async function createSaving(input: SavingInput): Promise<SavingResult> {
  return apiFetch<SavingResult>('/api/savings', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateSaving(id: string, input: SavingInput): Promise<SavingResult> {
  return apiFetch<SavingResult>(`/api/savings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteSaving(id: string): Promise<void> {
  return apiFetch<void>(`/api/savings/${id}`, { method: 'DELETE' })
}
