export type TransactionType = 'income' | 'expense'
export type CategoryType = 'income' | 'expense' | 'savings' | 'investment'

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  savings: 'Ahorro',
  investment: 'Inversión',
}

export const CATEGORY_TYPE_COLORS: Record<CategoryType, string> = {
  income: '#16a34a',
  expense: '#dc2626',
  savings: '#2563eb',
  investment: '#7c3aed',
}

export interface User {
  id: string
  email: string
  base_currency: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  type: CategoryType
  type_changed_at?: string
  created_at: string
  updated_at: string
}

export type TransactionStatus = 'confirmed' | 'pending'

export interface Transaction {
  id: string
  user_id: string
  category_id: string
  type: TransactionType
  amount: number
  currency: string
  exchange_rate: number
  base_amount: number
  description: string
  date: string
  status: TransactionStatus
  recurring_id: string | null
  created_at: string
  updated_at: string
}

export interface RecurringTransaction {
  id: string
  user_id: string
  category_id: string
  type: TransactionType
  amount: number
  currency: string
  description: string
  day_of_month: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface RecurringTransactionInput {
  category_id: string
  type: TransactionType
  amount: number
  currency: string
  description?: string
  date: string
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
  type: CategoryType
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface ReportSummary {
  total_income: number
  total_expense: number
  balance: number
  savings_rate: number
}

export interface ReportByCategoryRow {
  category_id: string
  category_name: string
  color: string
  icon: string
  total: number
  percentage: number
}

export interface ReportMonthlyRow {
  month: string
  income: number
  expense: number
}

export interface TopTransactionRow {
  id: string
  amount: number
  base_amount: number
  currency: string
  description: string
  date: string
  category_id: string
  category_name: string
  category_color: string
  category_icon: string
  category_type: string
}

export interface TopTransactionsResult {
  income: TopTransactionRow[]
  expense: TopTransactionRow[]
}

export interface SavingsMonthResult {
  month: string
  income: number
  expense: number
  savings_amount: number
  savings_rate: number
}

export interface Projection {
  min: number
  max: number
}

export interface SavingsResult {
  months: SavingsMonthResult[]
  projection_6m: Projection
  projection_12m: Projection
}

export interface TrendResult {
  category_id: string
  category_name: string
  avg_current: number
  avg_previous: number
  change_percent: number
  change_amount: number
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export type GoalStatus = 'on_track' | 'slightly_behind' | 'off_track'

export interface FinancialGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  target_date: string
  created_at: string
  updated_at: string
}

export interface GoalResult extends FinancialGoal {
  monthly_required: number
  current_savings_rate: number
  status: GoalStatus
  adjustment_needed: number
}

export interface GoalInput {
  name: string
  target_amount: number
  target_date: string
}

export interface EmergencyFundResult {
  avg_monthly_expense: number
  recommended_3m: number
  recommended_6m: number
}

// ── Budgets ───────────────────────────────────────────────────────────────────

export type BudgetStatus = 'ok' | 'warning' | 'exceeded'

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: number
  year: number
  created_at: string
  updated_at: string
}

export interface BudgetResult extends Budget {
  category_name: string
  category_color: string
  category_icon: string
  spent: number
  percentage: number
  status: BudgetStatus
}

export interface BudgetInput {
  category_id: string
  amount: number
  month: number
  year: number
}

export interface BudgetUpdateInput {
  amount: number
}

// ── Savings ───────────────────────────────────────────────────────────────────

export type SavingType = 'cash' | 'bank' | 'virtual_wallet'

export interface SavingResult {
  id: string
  name: string
  type: SavingType
  amount: number
  currency: string
  exchange_rate: number
  base_amount: number
  description: string
  created_at: string
  updated_at: string
}

export interface SavingsResponse {
  savings: SavingResult[]
  total_base_amount: number
  base_currency: string
}

export interface SavingInput {
  name: string
  type: SavingType
  amount: number
  currency: string
  description?: string
}
