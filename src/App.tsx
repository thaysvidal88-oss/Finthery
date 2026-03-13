import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Trash2,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  AlertCircle,
  CreditCard,
  User,
  Edit2,
  Save,
  Pencil,
  Loader2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  parseISO,
  isAfter,
  startOfDay,
  isBefore
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction, Goal, Investment, CATEGORIES, TransactionType, PaymentMethod } from './types';
import { cn, formatCurrency, generateId } from './utils';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { LogOut } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const PAYMENT_METHODS: PaymentMethod[] = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix', 'Boleto'];
const CARD_COLORS = [
  { name: 'Roxo', value: 'from-purple-600 to-purple-900' },
  { name: 'Azul', value: 'from-blue-600 to-blue-900' },
  { name: 'Verde', value: 'from-emerald-600 to-emerald-900' },
  { name: 'Rosa', value: 'from-rose-600 to-rose-900' },
  { name: 'Laranja', value: 'from-orange-600 to-orange-900' },
  { name: 'Brand', value: 'from-brand-dark to-brand' },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(() => localStorage.getItem('finthery_user_name') || localStorage.getItem('financas_user_name') || '');
  const [isEditingName, setIsEditingName] = useState(!userName);
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finthery_transactions') || localStorage.getItem('financas_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('finthery_goals') || localStorage.getItem('financas_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem('finthery_investments');
    return saved ? JSON.parse(saved) : [];
  });

  const [dbError, setDbError] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('expense');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [debtView, setDebtView] = useState<'future' | 'annual' | 'installments' | 'all'>(() => {
    const saved = localStorage.getItem('financas_debt_view');
    const validViews = ['future', 'annual', 'installments', 'all'];
    return validViews.includes(saved as string) ? (saved as any) : 'future';
  });

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [installments, setInstallments] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [cardName, setCardName] = useState('');
  const [cardColor, setCardColor] = useState(CARD_COLORS[0].value);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync data with Supabase
  useEffect(() => {
    if (!session || !supabase) return;

    const fetchData = async () => {
      const [
        { data: transactionsData },
        { data: goalsData },
        { data: investmentsData }
      ] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('goals').select('*'),
        supabase.from('investments').select('*')
      ]);

      if (transactionsData) setTransactions(transactionsData);
      if (goalsData) setGoals(goalsData);
      if (investmentsData) setInvestments(investmentsData);
    };

    fetchData();
  }, [session]);

  // Goal Form State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalType, setGoalType] = useState<'monthly' | 'fixed'>('monthly');
  const [goalColor, setGoalColor] = useState('#CA94C9');

  // Investment Form State
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [investmentDescription, setInvestmentDescription] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentTargetAmount, setInvestmentTargetAmount] = useState('');
  const [investmentDate, setInvestmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [investmentType, setInvestmentType] = useState<'monthly' | 'fixed'>('monthly');
  const [investmentColor, setInvestmentColor] = useState('#CA94C9');
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [investmentView, setInvestmentView] = useState<'monthly' | 'total'>('monthly');

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    localStorage.setItem('financas_debt_view', debtView);
  }, [debtView]);

  useEffect(() => {
    localStorage.setItem('finthery_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finthery_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('finthery_investments', JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem('finthery_user_name', userName);
  }, [userName]);

  const currentMonthTransactions = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start, end });
    });
  }, [transactions, currentDate]);

  const totals = useMemo(() => {
    return currentMonthTransactions.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [currentMonthTransactions]);

  const investmentTotals = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    const monthly = investments.filter(i => {
      const iDate = parseISO(i.date);
      return isWithinInterval(iDate, { start, end });
    }).reduce((sum, i) => sum + i.amount, 0);

    const total = investments.reduce((sum, i) => sum + i.amount, 0);

    return { monthly, total };
  }, [investments, currentDate]);

  const debtTotal = useMemo(() => {
    const today = startOfDay(new Date());
    const currentYear = today.getFullYear();
    
    switch (debtView) {
      case 'future':
        return transactions
          .filter(t => t.type === 'expense' && !isBefore(parseISO(t.date), today))
          .reduce((sum, t) => sum + t.amount, 0);
      case 'annual':
        return transactions
          .filter(t => t.type === 'expense' && parseISO(t.date).getFullYear() === currentYear)
          .reduce((sum, t) => sum + t.amount, 0);
      case 'installments':
        return transactions
          .filter(t => t.type === 'expense' && t.installments && !isBefore(parseISO(t.date), today))
          .reduce((sum, t) => sum + t.amount, 0);
      case 'all':
      default:
        return transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
    }
  }, [transactions, debtView]);

  const cardTotals = useMemo(() => {
    const totals: Record<string, { total: number, color: string }> = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense' && t.cardName)
      .forEach(t => {
        const name = t.cardName!;
        if (!totals[name]) {
          totals[name] = { total: 0, color: t.cardColor || CARD_COLORS[0].value };
        }
        totals[name].total += t.amount;
      });
    return Object.entries(totals).map(([name, data]) => ({ name, total: data.total, color: data.color }));
  }, [currentMonthTransactions]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
      });
    
    return Object.entries(data).map(([name, value]) => ({
      name,
      value,
      color: CATEGORIES.find(c => c.name === name)?.color || '#8884d8'
    })).sort((a, b) => b.value - a.value);
  }, [currentMonthTransactions]);

  const mostSpentCategory = categoryData[0];
  const leastSpentCategory = categoryData[categoryData.length - 1];

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const baseAmount = parseFloat(amount);
    const numInstallments = parseInt(installments);
    const parentId = generateId();
    const newTransactions: Transaction[] = [];

    if (editingTransactionId) {
      const updatedTransaction = {
        description,
        amount: baseAmount,
        date: parseISO(date).toISOString(),
        category,
        type: modalType,
        paymentMethod,
        cardName: (paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') ? cardName : undefined,
        cardColor: (paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') ? cardColor : undefined,
      };

      if (session) {
        const { error } = await supabase.from('transactions').update(updatedTransaction).eq('id', editingTransactionId);
        if (error) {
          console.error('Error updating transaction:', error);
          setDbError('Erro ao atualizar transação no banco de dados.');
          return;
        }
      }

      const updatedTransactions = transactions.map(t => {
        if (t.id === editingTransactionId) {
          return { ...t, ...updatedTransaction };
        }
        return t;
      });
      setTransactions(updatedTransactions);
    } else {
      for (let i = 0; i < numInstallments; i++) {
        const tDate = addMonths(parseISO(date), i);
        newTransactions.push({
          id: generateId(),
          description: numInstallments > 1 ? `${description} (${i + 1}/${numInstallments})` : description,
          amount: baseAmount / numInstallments,
          date: tDate.toISOString(),
          category,
          type: modalType,
          paymentMethod,
          cardName: (paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') ? cardName : undefined,
          cardColor: (paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') ? cardColor : undefined,
          installments: numInstallments > 1 ? {
            current: i + 1,
            total: numInstallments,
            parentId
          } : undefined,
          user_id: session?.user.id
        });
      }

      if (session) {
        const { error } = await supabase.from('transactions').insert(newTransactions);
        if (error) {
          console.error('Error saving transactions:', error);
          setDbError('Erro ao salvar transação no banco de dados. Verifique se as tabelas foram criadas.');
          return;
        }
      }

      setTransactions([...transactions, ...newTransactions]);
    }

    setShowAddModal(false);
    setEditingTransactionId(null);
    resetForm();
  };

  const editTransaction = (t: Transaction) => {
    setEditingTransactionId(t.id);
    setDescription(t.description);
    setAmount(t.amount.toString());
    setCategory(t.category);
    setDate(format(parseISO(t.date), 'yyyy-MM-dd'));
    setInstallments('1'); // Editing single installment for now
    setPaymentMethod(t.paymentMethod || 'Pix');
    setCardName(t.cardName || '');
    setCardColor(t.cardColor || CARD_COLORS[0].value);
    setModalType(t.type);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory(CATEGORIES[0].name);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setInstallments('1');
    setPaymentMethod('Pix');
    setCardName('');
  };

  const deleteTransaction = async (id: string) => {
    if (session) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.error('Error deleting transaction:', error);
        return;
      }
    }
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const deleteCard = (cardName: string) => {
    setTransactions(transactions.map(t => {
      if (t.cardName === cardName) {
        return { ...t, cardName: undefined, cardColor: undefined, paymentMethod: 'Dinheiro' };
      }
      return t;
    }));
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalAmount) return;

    const newGoal: Goal = {
      id: generateId(),
      title: goalTitle,
      targetAmount: parseFloat(goalAmount),
      currentAmount: parseFloat(goalCurrentAmount) || 0,
      deadline: goalDeadline || undefined,
      type: goalType,
      color: goalColor,
      user_id: session?.user.id
    };

    if (session) {
      const { error } = await supabase.from('goals').insert(newGoal);
      if (error) {
        console.error('Error saving goal:', error);
        setDbError('Erro ao salvar meta no banco de dados.');
        return;
      }
    }

    setGoals([...goals, newGoal]);
    setShowGoalModal(false);
    setGoalTitle('');
    setGoalAmount('');
    setGoalCurrentAmount('');
    setGoalDeadline('');
    setGoalColor('#CA94C9');
  };

  const updateGoalAmount = async (id: string, amount: number) => {
    if (session) {
      const { error } = await supabase.from('goals').update({ currentAmount: amount }).eq('id', id);
      if (error) {
        console.error('Error updating goal:', error);
        return;
      }
    }
    setGoals(goals.map(g => g.id === id ? { ...g, currentAmount: amount } : g));
  };

  const deleteGoal = async (id: string) => {
    if (session) {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) {
        console.error('Error deleting goal:', error);
        return;
      }
    }
    setGoals(goals.filter(g => g.id !== id));
  };

  const updateInvestmentAmount = async (id: string, amount: number) => {
    if (session) {
      const { error } = await supabase.from('investments').update({ amount }).eq('id', id);
      if (error) {
        console.error('Error updating investment:', error);
        return;
      }
    }
    setInvestments(investments.map(i => i.id === id ? { ...i, amount } : i));
  };

  const handleInvestmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentDescription || !investmentAmount) return;

    if (editingInvestmentId) {
      const updatedInvestment = {
        description: investmentDescription,
        amount: parseFloat(investmentAmount),
        targetAmount: investmentTargetAmount ? parseFloat(investmentTargetAmount) : undefined,
        date: investmentDate,
        type: investmentType,
        color: investmentColor
      };

      if (session) {
        const { error } = await supabase.from('investments').update(updatedInvestment).eq('id', editingInvestmentId);
        if (error) {
          console.error('Error updating investment:', error);
          setDbError('Erro ao atualizar investimento no banco de dados.');
          return;
        }
      }

      setInvestments(investments.map(i => i.id === editingInvestmentId ? {
        ...i,
        ...updatedInvestment
      } : i));
    } else {
      const newInvestment: Investment = {
        id: generateId(),
        description: investmentDescription,
        amount: parseFloat(investmentAmount),
        targetAmount: investmentTargetAmount ? parseFloat(investmentTargetAmount) : undefined,
        date: investmentDate,
        type: investmentType,
        color: investmentColor,
        user_id: session?.user.id
      };

      if (session) {
        const { error } = await supabase.from('investments').insert(newInvestment);
        if (error) {
          console.error('Error saving investment:', error);
          setDbError('Erro ao salvar investimento no banco de dados.');
          return;
        }
      }

      setInvestments([...investments, newInvestment]);
    }

    setShowInvestmentModal(false);
    setInvestmentDescription('');
    setInvestmentAmount('');
    setInvestmentTargetAmount('');
    setInvestmentDate(format(new Date(), 'yyyy-MM-dd'));
    setInvestmentColor('#CA94C9');
    setEditingInvestmentId(null);
  };

  const deleteInvestment = async (id: string) => {
    if (session) {
      const { error } = await supabase.from('investments').delete().eq('id', id);
      if (error) {
        console.error('Error deleting investment:', error);
        return;
      }
    }
    setInvestments(investments.filter(i => i.id !== id));
  };

  const editInvestment = (i: Investment) => {
    setEditingInvestmentId(i.id);
    setInvestmentDescription(i.description);
    setInvestmentAmount(i.amount.toString());
    setInvestmentTargetAmount(i.targetAmount?.toString() || '');
    setInvestmentDate(i.date);
    setInvestmentType(i.type);
    setInvestmentColor(i.color || '#CA94C9');
    setShowInvestmentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={48} />
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center">
          <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Configuração Necessária</h2>
          <p className="text-zinc-400 mb-6">
            As variáveis de ambiente do Supabase não foram encontradas. 
            Por favor, configure <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> nos Segredos do projeto.
          </p>
          <div className="bg-zinc-800 p-4 rounded-xl text-left text-xs font-mono text-zinc-300 overflow-x-auto">
            VITE_SUPABASE_URL=sua-url<br />
            VITE_SUPABASE_ANON_KEY=sua-chave
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans relative overflow-x-hidden scrollbar-custom">
      {dbError && (
        <div className="fixed bottom-4 right-4 z-[100] bg-rose-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <AlertCircle size={20} />
          <div className="flex flex-col">
            <span className="font-bold text-sm">Erro no Banco de Dados</span>
            <span className="text-xs opacity-90">{dbError}</span>
          </div>
          <button onClick={() => setDbError(null)} className="ml-2 hover:bg-white/20 p-1 rounded-lg">
            <Plus className="rotate-45" size={16} />
          </button>
        </div>
      )}
      {/* Header with Gradient */}
      {/* Header Section with Galaxy Effect */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a0b1a] via-[#0f050f] to-black pt-12 pb-20 px-4 md:px-8 border-b border-zinc-800/50 z-10">
        {/* Galaxy Sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-white opacity-20 animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 3}px`,
                height: `${Math.random() * 3}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 4}s`,
                boxShadow: Math.random() > 0.8 ? '0 0 10px 2px rgba(219, 39, 119, 0.4)' : 'none'
              }}
            />
          ))}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-900/20 rounded-full blur-[100px]" />
        </div>

        <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-20">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-xl">
              <User size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      onBlur={() => userName && setIsEditingName(false)}
                      onKeyDown={e => e.key === 'Enter' && userName && setIsEditingName(false)}
                      autoFocus
                      placeholder="Seu nome"
                      className="bg-zinc-900/50 backdrop-blur-sm border border-brand/50 rounded-lg px-3 py-1 text-[16px] font-bold focus:outline-none text-white"
                    />
                    <button onClick={() => userName && setIsEditingName(false)} className="text-brand hover:scale-110 transition-transform">
                      <Save size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <h2 className="text-white text-[16px] font-bold uppercase tracking-tight">Bem-vindo, <span className="text-brand font-black">{userName}</span></h2>
                    <button onClick={() => setIsEditingName(true)} className="text-zinc-400 hover:text-brand transition-colors opacity-0 group-hover/name:opacity-100">
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </div>
              <h1 className="text-6xl font-light tracking-tighter text-white drop-shadow-2xl font-jersey">
                Finthery
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => supabase.auth.signOut()}
              className="bg-zinc-800/50 hover:bg-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
            >
              <LogOut size={16} /> Sair
            </button>
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="bg-brand/20 hover:bg-brand/30 border border-brand/30 text-brand px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus size={18} /> Instalar Aplicativo
              </button>
            )}
            <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10 shadow-2xl">
            <button 
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2.5 hover:bg-white/5 rounded-xl transition-all hover:scale-105 active:scale-95 text-zinc-400 hover:text-white"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center gap-0 min-w-[160px] justify-center">
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand font-black mb-0.5">Período Atual</span>
              <div className="flex items-center gap-2 font-bold text-white text-lg">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </div>
            </div>
            <button 
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2.5 hover:bg-white/5 rounded-xl transition-all hover:scale-105 active:scale-95 text-zinc-400 hover:text-white"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </header>
    </div>

      <main className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-8 relative z-20">
        {/* Left Column: Summary & Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cards Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group shadow-lg flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <TrendingUp size={48} />
              </div>
              <p className="text-zinc-400 text-[9px] mb-0.5 uppercase tracking-widest font-bold">Ganhos</p>
              <h3 className="text-xl font-black text-emerald-400">{formatCurrency(totals.income)}</h3>
            </div>
            
            <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group shadow-lg flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <TrendingDown size={48} />
              </div>
              <div className="flex justify-between items-start mb-0.5">
                <p className="text-zinc-400 text-[9px] uppercase tracking-widest font-bold">Gastos</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setTransactions(transactions.filter(t => 
                      !(t.type === 'expense' && 
                        isWithinInterval(parseISO(t.date), { 
                          start: startOfMonth(currentDate), 
                          end: endOfMonth(currentDate) 
                        }))
                    ));
                  }}
                  className="text-zinc-600 hover:text-rose-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                  title="Limpar gastos do mês"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="text-xl font-black text-rose-400">{formatCurrency(totals.expense)}</h3>
            </div>

            <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group shadow-lg flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <Wallet size={48} className={cn(totals.income - totals.expense >= 0 ? "text-emerald-500" : "text-rose-500")} />
              </div>
              <p className="text-zinc-400 text-[9px] mb-0.5 uppercase tracking-widest font-bold">Saldo</p>
              <h3 className={cn(
                "text-xl font-black",
                totals.income - totals.expense >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {formatCurrency(totals.income - totals.expense)}
              </h3>
              <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-tighter">
                {totals.income - totals.expense >= 0 ? 'Mês no azul' : 'Mês no vermelho'}
              </p>
            </div>

            <div className="bg-zinc-900/60 backdrop-blur-md border border-brand/30 p-5 rounded-2xl relative overflow-hidden group shadow-lg flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <AlertCircle size={48} className="text-brand" />
              </div>
              <div className="flex justify-between items-start mb-0.5 relative z-10">
                <p className="text-zinc-400 text-[9px] uppercase tracking-widest font-bold">Dívida</p>
                <select 
                  value={debtView} 
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setDebtView(e.target.value as typeof debtView)}
                  className="bg-zinc-800 text-[10px] text-brand font-bold uppercase border border-zinc-700 rounded-md px-1.5 py-0.5 focus:ring-1 focus:ring-brand cursor-pointer relative z-20 hover:bg-zinc-700 transition-colors"
                >
                  <option value="future" className="bg-zinc-900">Futura</option>
                  <option value="annual" className="bg-zinc-900">Anual</option>
                  <option value="installments" className="bg-zinc-900">Parcelada</option>
                  <option value="all" className="bg-zinc-900">Total</option>
                </select>
              </div>
              <h3 className="text-xl font-black text-brand">{formatCurrency(debtTotal)}</h3>
              <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-tighter">
                {debtView === 'future' && 'A vencer'}
                {debtView === 'annual' && 'No ano'}
                {debtView === 'installments' && 'Parcelas'}
                {debtView === 'all' && 'Total'}
              </p>
            </div>

            <div className="bg-zinc-900/60 backdrop-blur-md border border-brand/30 p-5 rounded-2xl relative overflow-hidden group shadow-lg cursor-pointer hover:border-brand/60 transition-all flex flex-col justify-center" onClick={() => setShowInvestmentModal(true)}>
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <TrendingUp size={48} className="text-brand" />
              </div>
              <div className="flex justify-between items-start mb-0.5 relative z-10">
                <p className="text-zinc-400 text-[9px] uppercase tracking-widest font-bold">Investimentos</p>
                <select 
                  value={investmentView} 
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    setInvestmentView(e.target.value as any);
                  }}
                  className="bg-zinc-800 text-[10px] text-brand font-bold uppercase border border-zinc-700 rounded-md px-1.5 py-0.5 focus:ring-1 focus:ring-brand cursor-pointer relative z-20 hover:bg-zinc-700 transition-colors"
                >
                  <option value="monthly" className="bg-zinc-900">Mensal</option>
                  <option value="total" className="bg-zinc-900">Total</option>
                </select>
              </div>
              <h3 className="text-xl font-black text-brand">
                {formatCurrency(investmentView === 'monthly' ? investmentTotals.monthly : investmentTotals.total)}
              </h3>
              <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-tighter">
                {investmentView === 'monthly' ? 'Neste mês' : 'Total investido'}
              </p>
            </div>
          </div>

          {/* Card Visualization Section */}
          {cardTotals.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2 px-2">
                <CreditCard size={20} className="text-brand" /> Meus Cartões
              </h4>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-custom">
                {cardTotals.map((card, idx) => (
                  <div key={idx} className={cn(
                    "min-w-[280px] h-44 rounded-2xl p-6 flex flex-col justify-between shadow-2xl shadow-brand/10 relative overflow-hidden bg-gradient-to-br",
                    card.color
                  )}>
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex justify-between items-start">
                      <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                        <CreditCard size={24} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCard(card.name);
                          }}
                          className="text-white/60 hover:text-white transition-colors p-2 bg-white/10 rounded-lg backdrop-blur-md"
                        >
                          <Trash2 size={18} />
                        </button>
                        <span className="font-black text-white/50 italic text-xl">VISA</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-widest mb-1">{card.name}</p>
                      <p className="text-2xl font-black">{formatCurrency(card.total)}</p>
                      <p className="text-[10px] text-white/40 mt-1 uppercase tracking-tighter">Gasto no mês atual</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PieChartIcon size={20} className="text-brand" /> Categorias
              </h4>
              <div className="h-[250px] w-full">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500 italic text-center px-4">
                    Nenhum gasto registrado este mês
                  </div>
                )}
              </div>
              {categoryData.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest">
                    <span className="text-zinc-500">Maior Gasto:</span>
                    <span className="font-black text-rose-400">{mostSpentCategory.name} ({formatCurrency(mostSpentCategory.value)})</span>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest">
                    <span className="text-zinc-500">Menor Gasto:</span>
                    <span className="font-black text-emerald-400">{leastSpentCategory.name} ({formatCurrency(leastSpentCategory.value)})</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChartIcon size={20} className="text-brand" /> Balanço
              </h4>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Balanço', ganhos: totals.income, gastos: totals.expense }]}>
                    <XAxis dataKey="name" stroke="#52525b" />
                    <YAxis stroke="#52525b" hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="ganhos" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Wallet size={20} className="text-brand" /> Transações
              </h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setModalType('income'); setShowAddModal(true); }}
                  className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 p-2 rounded-xl transition-all"
                >
                  <Plus size={20} />
                </button>
                <button 
                  onClick={() => { setModalType('expense'); setShowAddModal(true); }}
                  className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 p-2 rounded-xl transition-all"
                >
                  <Minus size={20} />
                </button>
              </div>
            </div>
            <div className="divide-y divide-zinc-800 max-h-[400px] overflow-y-auto scrollbar-custom">
              {currentMonthTransactions.length > 0 ? (
                [...currentMonthTransactions].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(t => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
                        t.type === 'income' ? "bg-emerald-500/10" : "bg-rose-500/10"
                      )}>
                        {CATEGORIES.find(c => c.name === t.category)?.icon || '📦'}
                      </div>
                      <div>
                        <p className="font-bold">{t.description}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                          {format(parseISO(t.date), 'dd/MM/yyyy')} • {t.category}
                          {t.paymentMethod && ` • ${t.paymentMethod}`}
                          {t.cardName && ` (${t.cardName})`}
                          {t.installments && ` • Parcela ${t.installments.current}/${t.installments.total}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-black mr-2",
                        t.type === 'income' ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                      </span>
                    <div className="flex items-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          editTransaction(t);
                        }}
                        className="text-zinc-600 hover:text-brand p-2 hover:bg-brand/10 rounded-lg transition-all"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTransaction(t.id);
                        }}
                        className="text-zinc-600 hover:text-rose-500 p-2 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-zinc-500 italic">
                  Nenhuma transação encontrada
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Investments & Quick Actions */}
        <div className="space-y-8">
          {/* Goals Section */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Target size={20} className="text-brand" /> Minhas Metas
              </h4>
              <button 
                onClick={() => setShowGoalModal(true)}
                className="bg-brand/10 text-brand hover:bg-brand/20 p-1 rounded-lg transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              {goals.length > 0 ? goals.map(goal => {
                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                return (
                  <div key={goal.id} className="space-y-3 group bg-zinc-800/20 p-3 rounded-2xl border border-zinc-800/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm">{goal.title}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                          {goal.type === 'monthly' ? 'Mensal' : 'Fixo'}
                          {goal.deadline && ` • Até ${format(parseISO(goal.deadline), 'dd/MM/yy')}`}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGoal(goal.id);
                        }}
                        className="text-zinc-600 hover:text-rose-500 p-2 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-brand">{formatCurrency(goal.currentAmount)}</span>
                        <span className="text-zinc-500">alvo: {formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-brand-dark to-brand transition-all duration-500" 
                          style={{ width: `${progress}%`, backgroundColor: goal.color || '#CA94C9' }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        placeholder="Valor guardado"
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-brand"
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) updateGoalAmount(goal.id, val);
                        }}
                        defaultValue={goal.currentAmount || ''}
                      />
                      <span className="text-[10px] font-black text-brand">{progress.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center text-zinc-500 text-sm italic py-4">
                  Defina sua primeira meta! 🎯
                </div>
              )}
            </div>
          </div>

          {/* Investments Section */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp size={20} className="text-brand" /> Investimentos
              </h4>
              <button 
                onClick={() => {
                  setEditingInvestmentId(null);
                  setInvestmentDescription('');
                  setInvestmentAmount('');
                  setInvestmentTargetAmount('');
                  setInvestmentDate(format(new Date(), 'yyyy-MM-dd'));
                  setInvestmentColor('#CA94C9');
                  setShowInvestmentModal(true);
                }}
                className="bg-brand/10 text-brand hover:bg-brand/20 p-1 rounded-lg transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {investments.length > 0 ? investments.map(inv => {
                const hasGoal = inv.targetAmount && inv.targetAmount > 0;
                const progress = hasGoal ? Math.min((inv.amount / inv.targetAmount!) * 100, 100) : 0;
                
                return (
                  <div key={inv.id} className="group bg-zinc-800/20 p-4 rounded-2xl border border-zinc-800/50 hover:border-brand/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-sm">{inv.description}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                          {inv.type === 'monthly' ? 'Mensal' : 'Fixo'} • {format(parseISO(inv.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => editInvestment(inv)}
                          className="text-zinc-600 hover:text-brand p-1.5 hover:bg-brand/10 rounded-lg transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => deleteInvestment(inv.id)}
                          className="text-zinc-600 hover:text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <p className="text-brand font-black text-sm">{formatCurrency(inv.amount)}</p>
                      {hasGoal && (
                        <p className="text-[10px] text-zinc-500 font-bold">
                          Meta: {formatCurrency(inv.targetAmount!)}
                        </p>
                      )}
                    </div>

                    {hasGoal && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                          <span className="text-zinc-500">Progresso</span>
                          <span className="text-brand">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: inv.color || '#CA94C9' }}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <input 
                            type="number" 
                            placeholder="Valor atual"
                            className="flex-1 bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-brand"
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) updateInvestmentAmount(inv.id, val);
                            }}
                            defaultValue={inv.amount || ''}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="text-center text-zinc-500 text-sm italic py-4">
                  Comece a investir hoje! 📈
                </div>
              )}
            </div>
          </div>

          {/* Quick Tips / Info */}
          <div className="bg-brand/10 border border-brand/20 p-6 rounded-3xl shadow-lg">
            <h5 className="font-bold text-brand mb-2 flex items-center gap-2 uppercase tracking-widest text-xs">
              💡 Dica do Mês
            </h5>
            <p className="text-sm text-zinc-300 leading-relaxed italic">
              "O controle financeiro não é sobre quanto você ganha, mas sobre como você gerencia o que tem."
            </p>
          </div>
        </div>
      </main>

      {/* Investment Modal */}
      {showInvestmentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
              <TrendingUp className="text-brand" />
              {editingInvestmentId ? 'Editar Investimento' : 'Novo Investimento'}
            </h3>
            
            <form onSubmit={handleInvestmentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Descrição</label>
                <input 
                  required
                  type="text" 
                  value={investmentDescription}
                  onChange={e => setInvestmentDescription(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                  placeholder="Ex: Tesouro Direto, Ações..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Valor Atual</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={investmentAmount}
                    onChange={e => setInvestmentAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Meta (Opcional)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={investmentTargetAmount}
                    onChange={e => setInvestmentTargetAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Data</label>
                  <input 
                    required
                    type="date" 
                    value={investmentDate}
                    onChange={e => setInvestmentDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Cor da Barra</label>
                  <div className="flex items-center gap-2 h-[46px]">
                    {['#CA94C9', '#A56D9F', '#E2B8E1', '#22C55E', '#3B82F6', '#F59E0B'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setInvestmentColor(c)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all",
                          investmentColor === c ? "border-white scale-110" : "border-transparent opacity-50"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInvestmentType('monthly')}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold transition-all",
                      investmentType === 'monthly' ? "bg-brand text-white" : "bg-zinc-800 text-zinc-400"
                    )}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestmentType('fixed')}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold transition-all",
                      investmentType === 'fixed' ? "bg-brand text-white" : "bg-zinc-800 text-zinc-400"
                    )}
                  >
                    Fixo
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowInvestmentModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand/20"
                >
                  {editingInvestmentId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
              {modalType === 'income' ? <TrendingUp className="text-emerald-500" /> : <TrendingDown className="text-rose-500" />}
              Novo {modalType === 'income' ? 'Ganho' : 'Gasto'}
            </h3>
            
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Descrição</label>
                <input 
                  required
                  type="text" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                  placeholder="Ex: Aluguel, Supermercado..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Valor Total</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Parcelas</label>
                  <input 
                    type="number" 
                    min="1"
                    value={installments}
                    onChange={e => setInstallments(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Categoria</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Data Inicial</label>
                  <input 
                    required
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                  />
                </div>
              </div>

              {modalType === 'expense' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pagamento</label>
                    <select 
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  {(paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Nome do Cartão</label>
                        <input 
                          required
                          type="text" 
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                          placeholder="Ex: Nubank, Inter..."
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Cor do Cartão</label>
                        <div className="flex gap-2 flex-wrap">
                          {CARD_COLORS.map(color => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setCardColor(color.value)}
                              className={cn(
                                "w-8 h-8 rounded-full bg-gradient-to-br border-2 transition-all",
                                color.value,
                                cardColor === color.value ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold transition-colors uppercase tracking-widest text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-brand-dark hover:bg-brand py-3 rounded-xl font-black transition-colors uppercase tracking-widest text-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
              <Target className="text-brand" /> Nova Meta
            </h3>
            
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Título da Meta</label>
                <input 
                  required
                  type="text" 
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                  placeholder="Ex: Viagem, Reserva de Emergência..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Valor Alvo</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={goalAmount}
                    onChange={e => setGoalAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Já Guardado</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={goalCurrentAmount}
                    onChange={e => setGoalCurrentAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Tipo</label>
                  <select 
                    value={goalType}
                    onChange={e => setGoalType(e.target.value as 'monthly' | 'fixed')}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="fixed">Prazo Fixo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Cor</label>
                  <div className="flex items-center gap-2 h-[50px]">
                    {['#CA94C9', '#A56D9F', '#E2B8E1', '#22C55E', '#3B82F6', '#F59E0B'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setGoalColor(c)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all",
                          goalColor === c ? "border-white scale-110" : "border-transparent opacity-50"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Prazo (Opcional)</label>
                <input 
                  type="date" 
                  value={goalDeadline}
                  onChange={e => setGoalDeadline(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold transition-colors uppercase tracking-widest text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-brand-dark hover:bg-brand py-3 rounded-xl font-black transition-colors uppercase tracking-widest text-xs"
                >
                  Criar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
