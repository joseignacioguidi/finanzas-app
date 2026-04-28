import type {
  User,
  Category,
  Transaction,
  MonthlyStatRow,
  CategoryStatRow,
  TransactionInput,
  CategoryInput,
  APIError,
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

  if (!response.ok) {
    const error: APIError = await response.json()
    throw new Error(error.error ?? 'Error desconocido')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
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

// ── Transactions ──────────────────────────────────────────────────────────────

interface TransactionFilter {
  month?: string
  type?: string
  category?: string
}

export async function getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
  const params = new URLSearchParams()
  if (filter?.month) params.set('month', filter.month)
  if (filter?.type) params.set('type', filter.type)
  if (filter?.category) params.set('category', filter.category)
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
