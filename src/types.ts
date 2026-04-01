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
  isRecurring?: boolean;
  frequency?: 'monthly' | 'weekly' | 'yearly';
  user_id?: string;
}

export interface BillReminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // ISO string
  isPaid: boolean;
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
  { name: 'Alimentação', icon: '🍔', color: '#C084FC' }, // Lilás
  { name: 'Transporte', icon: '🚗', color: '#818CF8' }, // Azul Indigo
  { name: 'Lazer', icon: '🎮', color: '#F472B6' },      // Rosa Pastel
  { name: 'Saúde', icon: '🏥', color: '#FB7185' },      // Rose Pastel
  { name: 'Educação', icon: '📚', color: '#A78BFA' },   // Violeta
  { name: 'Moradia', icon: '🏠', color: '#38BDF8' },    // Azul Claro
  { name: 'Outros', icon: '📦', color: '#94A3B8' },     // Slate Pastel
  { name: 'Salário', icon: '💰', color: '#34D399' },    // Verde Pastel
  { name: 'Investimentos', icon: '📈', color: '#6366F1' }, // Indigo Vibrante
];
