export type TransactionType = 'income' | 'expense'

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string
  type: TransactionType
  amount: number
  currency: string
  description: string
  date: string
  created_at: string
  updated_at: string
}

export interface MonthlyStatRow {
  month: string
  income: number
  expense: number
}

export interface CategoryStatRow {
  category_id: string
  category_name: string
  color: string
  total: number
}

export interface APIError {
  error: string
}

export interface TransactionInput {
  category_id: string
  type: TransactionType
  amount: number
  currency: string
  description?: string
  date: string
}

export interface CategoryInput {
  name: string
  color: string
  icon?: string
}
