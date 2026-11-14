export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  opening_balance: number;
  created_at?: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at?: string;
  categories?: Category;
  accounts?: Account;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  budget_month: number;
  budget_year: number;
  amount_limit: number;
  categories?: Category;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: 'active' | 'completed';
}
