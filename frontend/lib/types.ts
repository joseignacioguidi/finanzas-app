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

export interface APIError {
  error: string
}
