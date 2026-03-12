export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Pix' | 'Boleto';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO string
  category: string;
  type: TransactionType;
  paymentMethod?: PaymentMethod;
  cardName?: string;
  cardColor?: string;
  installments?: {
    current: number;
    total: number;
    parentId: string;
  };
  user_id?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO string
  type: 'monthly' | 'fixed';
  color?: string;
  user_id?: string;
}

export interface Investment {
  id: string;
  description: string;
  amount: number;
  targetAmount?: number;
  date: string; // ISO string
  type: 'monthly' | 'fixed';
  color?: string;
  user_id?: string;
}

export interface Category {
  name: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { name: 'Alimentação', icon: '🍔', color: '#CA94C9' },
  { name: 'Transporte', icon: '🚗', color: '#A56D9F' },
  { name: 'Lazer', icon: '🎮', color: '#E2B8E1' },
  { name: 'Saúde', icon: '🏥', color: '#CA94C9' },
  { name: 'Educação', icon: '📚', color: '#A56D9F' },
  { name: 'Moradia', icon: '🏠', color: '#E2B8E1' },
  { name: 'Outros', icon: '📦', color: '#CA94C9' },
  { name: 'Salário', icon: '💰', color: '#22C55E' },
  { name: 'Investimentos', icon: '📈', color: '#3B82F6' },
];
