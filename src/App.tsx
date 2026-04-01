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
  Loader2,
  Check,
  Sun,
  Moon,
  Sparkles,
  Rocket,
  Brain,
  Repeat,
  Bell,
  Triangle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Toaster, toast } from 'sonner';
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
  isBefore,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction, Goal, Investment, CATEGORIES, TransactionType, PaymentMethod, BillReminder } from './types';
import { cn, formatCurrency, generateId } from './utils';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { LogOut } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const PAYMENT_METHODS: PaymentMethod[] = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix', 'Boleto'];
const CARD_COLORS = [
  { name: 'Roxo', value: '#C084FC' },
  { name: 'Azul', value: '#60A5FA' },
  { name: 'Verde', value: '#34D399' },
  { name: 'Rosa', value: '#F472B6' },
  { name: 'Laranja', value: '#FB923C' },
  { name: 'Cinza', value: '#94A3B8' },
  { name: 'Brand', value: '#CA94C9' },
];

const Logo = ({ size = 'md', showText = true, className, theme = 'dark' }: { size?: 'sm' | 'md' | 'lg', showText?: boolean, className?: string, theme?: 'light' | 'dark' }) => {
  const textSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-5xl md:text-6xl' : 'text-8xl';
  
  // Planet body dimensions
  const planetDim = size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-14 h-14' : 'w-20 h-20';
  
  // Ring dimensions (proportional to planet)
  const ringW = size === 'sm' ? 44 : size === 'md' ? 100 : 140;
  const ringH = size === 'sm' ? 12 : size === 'md' ? 28 : 40;

  return (
    <div className={cn("flex items-center", showText ? "gap-2 sm:gap-6" : "gap-0", className)}>
      <div className={cn("relative flex items-center justify-center", planetDim)}>
        
        {/* Layer 1: Back Rings (Behind Planet) */}
        <div className="absolute z-0 pointer-events-none flex items-center justify-center" style={{ width: ringW, height: ringH }}>
          <div 
            className={cn(
              "w-full h-full border rounded-[100%] rotate-[-25deg] skew-x-[65deg]",
              theme === 'dark' ? "border-purple-400/30" : "border-brand/40"
            )}
            style={{ clipPath: 'inset(0 0 50% 0)' }}
          />
        </div>

        {/* Layer 2: Planet Body */}
        <div className={cn(
          "absolute inset-0 rounded-full overflow-hidden z-10 border",
          theme === 'dark' 
            ? "bg-[#05000a] shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.9),0_0_30px_rgba(168,85,247,0.3)] border-purple-500/10" 
            : "bg-white shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.1),0_0_20px_rgba(202,148,201,0.2)] border-brand/20"
        )}>
          {/* Intense Crescent Glow */}
          <div className={cn(
            "absolute inset-0 opacity-80",
            theme === 'dark' ? "bg-[radial-gradient(circle_at_25%_35%,#d8b4fe,transparent_60%)]" : "bg-[radial-gradient(circle_at_25%_35%,#E2B8E1,transparent_60%)]"
          )} />
          <div className={cn(
            "absolute inset-0 opacity-40",
            theme === 'dark' ? "bg-[radial-gradient(circle_at_25%_35%,#a855f7,transparent_80%)]" : "bg-[radial-gradient(circle_at_25%_35%,#CA94C9,transparent_80%)]"
          )} />
          
          {/* Atmospheric Rim Light */}
          <div className={cn(
            "absolute inset-0 rounded-full border-t border-l blur-[0.5px]",
            theme === 'dark' ? "border-white/20" : "border-brand/40"
          )} />
        </div>

        {/* Layer 3: Front Rings (In front of Planet) */}
        <div className="absolute z-20 pointer-events-none flex items-center justify-center" style={{ width: ringW, height: ringH }}>
          <div 
            className={cn(
              "w-full h-full border-2 rounded-[100%] rotate-[-25deg] skew-x-[65deg]",
              theme === 'dark' ? "border-purple-300/50 shadow-[0_0_10px_rgba(192,132,252,0.4)]" : "border-brand/60 shadow-[0_0_10px_rgba(202,148,201,0.3)]"
            )}
            style={{ clipPath: 'inset(50% 0 0 0)' }}
          />
        </div>
        
        {/* Layer 4: Arrow */}
        <div className="relative z-30 flex items-center justify-center">
          <TrendingUp 
            size={size === 'sm' ? 10 : size === 'md' ? 24 : 36} 
            className={cn(
              "rotate-[-10deg]",
              theme === 'dark' ? "text-white/60 drop-shadow-[0_0_10px_rgba(192,132,252,0.4)]" : "text-brand drop-shadow-[0_0_5px_rgba(202,148,201,0.4)]"
            )}
            strokeWidth={2.5}
          />
        </div>

        {/* Sparkles */}
        <div className={cn(
          "absolute -top-2 -left-2 w-0.5 h-0.5 rounded-full animate-pulse",
          theme === 'dark' ? "bg-white shadow-[0_0_8px_white]" : "bg-brand shadow-[0_0_8px_rgba(202,148,201,0.8)]"
        )} />
        <div className={cn(
          "absolute top-1 -right-2 w-0.5 h-0.5 rounded-full animate-pulse delay-150",
          theme === 'dark' ? "bg-purple-200 shadow-[0_0_10px_rgba(192,132,252,1)]" : "bg-brand-light shadow-[0_0_10px_rgba(202,148,201,0.6)]"
        )} />
      </div>

      {showText && (
        <h1 className={cn(
          "font-medium tracking-tight drop-shadow-2xl font-jersey", 
          textSize,
          theme === 'dark' ? "text-white" : "text-zinc-900"
        )}>
          Finthery
        </h1>
      )}
    </div>
  );
};

const SuccessToast = ({ message, theme = 'dark' }: { message: string, theme?: 'light' | 'dark' }) => (
  <div className={cn(
    "flex items-center gap-3 border p-3 rounded-2xl shadow-2xl",
    theme === 'dark' ? "bg-zinc-900 border-brand/30" : "bg-white border-brand/20"
  )}>
    <div className="bg-brand/10 p-2 rounded-xl">
      <Logo size="sm" showText={false} theme={theme} />
    </div>
    <div className="flex flex-col">
      <span className={cn("font-bold text-sm", theme === 'dark' ? "text-white" : "text-zinc-900")}>{message}</span>
      <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Sucesso</span>
    </div>
  </div>
);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(() => 
    window.location.hash.includes('type=recovery')
  );
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [billReminders, setBillReminders] = useState<BillReminder[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showIndependenceModal, setShowIndependenceModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');

  const [dbError, setDbError] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('finthery_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const [confirmAction, setConfirmAction] = useState<{ id: string, type: 'approve' | 'reject' | 'delete', email?: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('finthery_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isAdmin = session?.user.email === 'thays.desktop@gmail.com';

  useEffect(() => {
    if (isAdmin && showAdminPanel) {
      fetchAccessRequests();
    }
  }, [isAdmin, showAdminPanel]);

  const fetchAccessRequests = async () => {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAccessRequests(data);
    }
  };

  const handleApproveRequest = async (request: any) => {
    setIsSubmitting(true);
    setDbError(null);
    try {
      // 1. Adicionar à whitelist
      const { error: whitelistError } = await supabase
        .from('allowed_users')
        .insert([{ email: request.email.toLowerCase() }]);
      
      if (whitelistError && whitelistError.code !== '23505') throw whitelistError;

      // 2. Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('access_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);
      
      if (updateError) throw updateError;

      setAccessRequests(accessRequests.map(r => r.id === request.id ? { ...r, status: 'approved' } : r));
      setIsSuccess(true);
      toast.custom(() => <SuccessToast message="Solicitação aprovada!" theme={theme} />);
      
      setTimeout(() => {
        setIsSuccess(false);
        setConfirmAction(null);
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      setDbError(error.message || 'Erro ao aprovar solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectRequest = async (id: string) => {
    setIsSubmitting(true);
    setDbError(null);
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;

      setAccessRequests(accessRequests.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
      setIsSuccess(true);
      toast.custom(() => <SuccessToast message="Solicitação rejeitada!" theme={theme} />);
      
      setTimeout(() => {
        setIsSuccess(false);
        setConfirmAction(null);
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao rejeitar:', error);
      setDbError(error.message || 'Erro ao rejeitar solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    setIsSubmitting(true);
    setDbError(null);
    try {
      const { error } = await supabase
        .from('access_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      setAccessRequests(accessRequests.filter(r => r.id !== id));
      setIsSuccess(true);
      toast.custom(() => <SuccessToast message="Solicitação excluída!" theme={theme} />);
      
      setTimeout(() => {
        setIsSuccess(false);
        setConfirmAction(null);
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      setDbError(error.message || 'Erro ao excluir solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAiInsights = async () => {
    if (!session) return;
    setIsAiLoading(true);
    setAiInsight(null);
    setShowAiModal(true);

    try {
      if (!navigator.onLine) {
        setAiInsight("Parece que você está sem conexão com a rede estelar. Verifique seu Wi-Fi ou dados móveis para consultar o Oráculo.");
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setAiInsight("O Oráculo está em silêncio profundo (chave de acesso não encontrada). Verifique as configurações do sistema.");
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise meu histórico financeiro e dê dicas personalizadas com um tema galáctico/cósmico.
        
        Transações: ${JSON.stringify(currentMonthTransactions.map(t => ({ desc: t.description, amount: t.amount, type: t.type, cat: t.category })))}
        Metas: ${JSON.stringify(goals.map(g => ({ title: g.title, target: g.targetAmount, current: g.currentAmount })))}
        Investimentos: ${JSON.stringify(investments.map(i => ({ desc: i.description, amount: i.amount })))}
        
        Dê um insight curto e motivador, como um "Oráculo Cósmico". Use emojis espaciais.`,
      });

      const response = await model;
      setAiInsight(response.text || "As estrelas estão nubladas hoje. Tente novamente mais tarde.");
    } catch (error) {
      console.error("Erro ao consultar o Oráculo:", error);
      if (!navigator.onLine) {
        setAiInsight("Conexão perdida com o vácuo. Verifique sua internet.");
      } else {
        setAiInsight("Houve uma interferência nas comunicações intergalácticas. Verifique sua conexão com o vácuo.");
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const calculateFinancialIndependence = () => {
    const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
    const monthlyContribution = investments.filter(i => i.type === 'monthly').reduce((sum, i) => sum + i.amount, 0);
    const monthlyExpenses = transactions.filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: startOfMonth(currentDate), end: endOfMonth(currentDate) })).reduce((sum, t) => sum + t.amount, 0);
    
    // Simple 4% rule calculation
    const targetAmount = monthlyExpenses * 12 * 25;
    const remaining = Math.max(0, targetAmount - totalInvested);
    const years = monthlyContribution > 0 ? remaining / (monthlyContribution * 12) : Infinity;

    return { targetAmount, remaining, years };
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync data with Supabase
  useEffect(() => {
    if (!session || !supabase) return;

    const fetchData = async () => {
      try {
        const [
          { data: transactionsData, error: tError },
          { data: goalsData, error: gError },
          { data: investmentsData, error: iError },
          { data: remindersData, error: rError },
          { data: profileData, error: pError }
        ] = await Promise.all([
          supabase.from('transactions').select('*').order('date', { ascending: false }),
          supabase.from('goals').select('*'),
          supabase.from('investments').select('*'),
          supabase.from('bill_reminders').select('*'),
          supabase.from('profiles').select('full_name').eq('id', session.user.id).single()
        ]);

        if (tError || gError || iError || (rError && rError.code !== '42P01')) {
          console.error('Error fetching data:', { tError, gError, iError, rError });
          setDbError('Erro ao carregar dados do banco de dados.');
        }

        if (transactionsData) {
          const mappedTransactions: Transaction[] = transactionsData.map((t: any) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            date: t.date,
            category: t.category,
            type: t.type,
            paymentMethod: t.payment_method,
            cardName: t.card_name,
            cardColor: t.card_color,
            installments: t.installments,
            isRecurring: t.is_recurring,
            frequency: t.frequency,
            user_id: t.user_id
          }));
          setTransactions(mappedTransactions);
        }
        if (goalsData) {
          const mappedGoals: Goal[] = goalsData.map((g: any) => ({
            id: g.id,
            title: g.title,
            targetAmount: g.targetAmount || g.target_amount,
            currentAmount: g.currentAmount || g.current_amount,
            deadline: g.deadline,
            type: g.type,
            color: g.color,
            user_id: g.user_id
          }));
          setGoals(mappedGoals);
        }
        if (investmentsData) {
          const mappedInvestments: Investment[] = investmentsData.map((i: any) => ({
            id: i.id,
            description: i.description,
            amount: i.amount,
            targetAmount: i.targetAmount || i.target_amount,
            date: i.date,
            type: i.type,
            color: i.color,
            user_id: i.user_id
          }));
          setInvestments(mappedInvestments);
        }
        if (remindersData) {
          const mappedReminders: BillReminder[] = remindersData.map((r: any) => ({
            id: r.id,
            title: r.title,
            amount: r.amount,
            dueDate: r.due_date,
            isPaid: r.is_paid,
            user_id: r.user_id
          }));
          setBillReminders(mappedReminders);
        }
        
        if (profileData) {
          setUserName(profileData.full_name || session.user.user_metadata?.full_name || '');
          setIsEditingName(!profileData.full_name && !session.user.user_metadata?.full_name);
        } else if (pError && pError.code !== 'PGRST116') {
          console.error('Error fetching profile:', pError);
          const metadataName = session.user.user_metadata?.full_name || '';
          setUserName(metadataName);
          setIsEditingName(!metadataName);
        } else if (!profileData) {
          const metadataName = session.user.user_metadata?.full_name || '';
          setUserName(metadataName);
          setIsEditingName(!metadataName);
        }
      } catch (err) {
        console.error('Unexpected error fetching data:', err);
      }
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

  const handleSaveName = async () => {
    if (!userName || !session) return;
    setIsSubmitting(true);
    try {
      // 1. Atualizar metadados do usuário (mais confiável)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: userName }
      });
      if (metadataError) throw metadataError;

      // 2. Tentar atualizar a tabela profiles (opcional, mas bom para consistência)
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({ id: session.user.id, full_name: userName, updated_at: new Date().toISOString() });
        
        if (error) {
          console.warn('Erro ao salvar na tabela profiles, mas metadados foram atualizados:', error);
        }
      } catch (e) {
        console.warn('Exceção ao salvar na tabela profiles:', e);
      }
      
      setIsSuccess(true);
      toast.custom(() => <SuccessToast message="Perfil atualizado!" theme={theme} />);
      
      setTimeout(() => {
        setIsSuccess(false);
        setIsEditingName(false);
      }, 1500);
    } catch (error: any) {
      console.error('Error saving name:', error);
      setDbError('Erro ao salvar nome no perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    const refDate = startOfMonth(currentDate);
    const refYear = currentDate.getFullYear();
    
    switch (debtView) {
      case 'future':
        return transactions
          .filter(t => t.type === 'expense' && !isBefore(parseISO(t.date), refDate))
          .reduce((sum, t) => sum + t.amount, 0);
      case 'annual':
        return transactions
          .filter(t => t.type === 'expense' && parseISO(t.date).getFullYear() === refYear)
          .reduce((sum, t) => sum + t.amount, 0);
      case 'installments':
        return transactions
          .filter(t => t.type === 'expense' && t.installments && !isBefore(parseISO(t.date), refDate))
          .reduce((sum, t) => sum + t.amount, 0);
      case 'all':
      default:
        return transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
    }
  }, [transactions, debtView, currentDate]);

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
    setIsSubmitting(true);
    setDbError(null);
    
    const baseAmount = parseFloat(amount);
    const numInstallments = parseInt(installments);
    const parentId = generateId();
    const newTransactions: Transaction[] = [];

    try {
      if (editingTransactionId) {
        const updatedTransaction = {
          description,
          amount: baseAmount,
          date: parseISO(date).toISOString(),
          category,
          type: modalType,
          payment_method: paymentMethod,
          card_name: (paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') ? cardName : undefined,
          card_color: (paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') ? cardColor : undefined,
          is_recurring: isRecurring,
          frequency: isRecurring ? frequency : undefined,
        };

        if (session) {
          const { error } = await supabase.from('transactions').update(updatedTransaction).eq('id', editingTransactionId);
          if (error) throw error;
        }

        const localUpdated = {
          description,
          amount: baseAmount,
          date: parseISO(date).toISOString(),
          category,
          type: modalType,
          paymentMethod,
          cardName: (paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') ? cardName : undefined,
          cardColor: (paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') ? cardColor : undefined,
          isRecurring,
          frequency: isRecurring ? frequency : undefined,
        };

        const updatedTransactions = transactions.map(t => {
          if (t.id === editingTransactionId) {
            return { ...t, ...localUpdated };
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
            isRecurring,
            frequency: isRecurring ? frequency : undefined,
            user_id: session?.user.id
          });
        }

        if (session) {
          const dbTransactions = newTransactions.map(t => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            date: t.date,
            category: t.category,
            type: t.type,
            payment_method: t.paymentMethod,
            card_name: t.cardName,
            card_color: t.cardColor,
            installments: t.installments,
            is_recurring: t.isRecurring,
            frequency: t.frequency,
            user_id: t.user_id
          }));
          const { error } = await supabase.from('transactions').insert(dbTransactions);
          if (error) throw error;
        }

        setTransactions([...transactions, ...newTransactions]);
      }

      setIsSuccess(true);
      toast.custom(() => <SuccessToast message={editingTransactionId ? "Transação atualizada!" : "Transação salva com sucesso!"} theme={theme} />);
      
      setTimeout(() => {
        setIsSuccess(false);
        setShowAddModal(false);
        setEditingTransactionId(null);
        resetForm();
      }, 1500);
    } catch (error: any) {
      console.error('Error in handleAddTransaction:', error);
      setDbError(error.message || 'Erro ao processar transação.');
    } finally {
      setIsSubmitting(false);
    }
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

  const deleteCard = async (cardName: string) => {
    if (!supabase || !session) return;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ card_name: null, card_color: null, payment_method: 'Dinheiro' })
        .eq('card_name', cardName)
        .eq('user_id', session.user.id);

      if (error) throw error;

      setTransactions(transactions.map(t => {
        if (t.cardName === cardName) {
          return { ...t, cardName: undefined, cardColor: undefined, paymentMethod: 'Dinheiro' };
        }
        return t;
      }));
      toast.success(`Cartão ${cardName} excluído com sucesso!`);
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      toast.error('Erro ao excluir cartão no banco de dados.');
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalAmount) return;
    setIsSubmitting(true);
    setDbError(null);

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

    try {
      if (session) {
        const { error } = await supabase.from('goals').insert({
          id: newGoal.id,
          title: newGoal.title,
          targetAmount: newGoal.targetAmount,
          currentAmount: newGoal.currentAmount,
          deadline: newGoal.deadline,
          type: newGoal.type,
          color: newGoal.color,
          user_id: newGoal.user_id
        });
        if (error) throw error;
      }

      setGoals([...goals, newGoal]);
      
      setIsSuccess(true);
      toast.custom(() => <SuccessToast message="Meta criada com sucesso!" theme={theme} />);

      setTimeout(() => {
        setIsSuccess(false);
        setShowGoalModal(false);
        setGoalTitle('');
        setGoalAmount('');
        setGoalCurrentAmount('');
        setGoalDeadline('');
        setGoalColor('#CA94C9');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving goal:', error);
      setDbError(error.message || 'Erro ao salvar meta.');
    } finally {
      setIsSubmitting(false);
    }
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
    setIsSubmitting(true);
    setDbError(null);

    try {
      if (editingInvestmentId) {
        const dbInvestment = {
          description: investmentDescription,
          amount: parseFloat(investmentAmount),
          targetAmount: investmentTargetAmount ? parseFloat(investmentTargetAmount) : undefined,
          date: investmentDate,
          type: investmentType,
          color: investmentColor
        };

        if (session) {
          const { error } = await supabase.from('investments').update(dbInvestment).eq('id', editingInvestmentId);
          if (error) throw error;
        }

        const localInvestment = {
          description: investmentDescription,
          amount: parseFloat(investmentAmount),
          targetAmount: investmentTargetAmount ? parseFloat(investmentTargetAmount) : undefined,
          date: investmentDate,
          type: investmentType,
          color: investmentColor
        };

        setInvestments(investments.map(i => i.id === editingInvestmentId ? {
          ...i,
          ...localInvestment
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
          const dbInvestment = {
            id: newInvestment.id,
            description: newInvestment.description,
            amount: newInvestment.amount,
            targetAmount: newInvestment.targetAmount,
            date: newInvestment.date,
            type: newInvestment.type,
            color: newInvestment.color,
            user_id: newInvestment.user_id
          };
          const { error } = await supabase.from('investments').insert(dbInvestment);
          if (error) throw error;
        }

        setInvestments([...investments, newInvestment]);
      }

      setIsSuccess(true);
      toast.custom(() => <SuccessToast message={editingInvestmentId ? "Investimento atualizado!" : "Investimento salvo com sucesso!"} theme={theme} />);

      setTimeout(() => {
        setIsSuccess(false);
        setShowInvestmentModal(false);
        setInvestmentDescription('');
        setInvestmentAmount('');
        setInvestmentTargetAmount('');
        setInvestmentDate(format(new Date(), 'yyyy-MM-dd'));
        setInvestmentColor('#CA94C9');
        setEditingInvestmentId(null);
      }, 1500);
    } catch (error: any) {
      console.error('Error in handleInvestmentSubmit:', error);
      setDbError(error.message || 'Erro ao processar investimento.');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b1a] via-[#0f050f] to-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(80)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-white opacity-10 animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${1 + Math.random() * 2}px`,
                height: `${1 + Math.random() * 2}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
        <Loader2 className="animate-spin text-brand relative z-10" size={48} />
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b1a] via-[#0f050f] to-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(80)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-white opacity-10 animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${1 + Math.random() * 2}px`,
                height: `${1 + Math.random() * 2}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
        <div className="max-w-md w-full bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center relative z-10">
          <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Configuração Necessária</h2>
          <p className="text-zinc-400 mb-6">
            As variáveis de ambiente do Supabase não foram encontradas. 
            Por favor, configure <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> nos Segredos do projeto.
          </p>
          <div className="bg-black/40 p-4 rounded-xl text-left text-xs font-mono text-zinc-300 overflow-x-auto border border-white/5">
            VITE_SUPABASE_URL=sua-url<br />
            VITE_SUPABASE_ANON_KEY=sua-chave
          </div>
        </div>
      </div>
    );
  }

  if (!session || isResettingPassword) {
    return (
      <Auth 
        isInitialResetMode={isResettingPassword}
        onPasswordResetComplete={() => setIsResettingPassword(false)} 
        theme={theme}
      />
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-sans relative overflow-x-hidden scrollbar-custom transition-colors duration-500",
      theme === 'dark' 
        ? "bg-gradient-to-br from-[#1a0b1a] via-[#0f050f] to-black text-white" 
        : "bg-[#f4f4f5] text-zinc-900"
    )}>
      <Toaster position="top-center" richColors theme={theme} />
      {/* Galaxy Sparkles Background - Only in Dark Mode or subtle in Light */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {theme === 'light' && (
          <>
            {/* Wave Texture Effect */}
            <div 
              className="absolute inset-0 opacity-[0.08]" 
              style={{ 
                backgroundImage: `
                  radial-gradient(circle at 20% 30%, #CA94C9 0%, transparent 40%),
                  radial-gradient(circle at 80% 70%, #d8b4fe 0%, transparent 40%),
                  radial-gradient(circle at 50% 50%, #e4e4e7 0%, transparent 60%)
                `,
                filter: 'blur(60px)'
              }} 
            />
            <div 
              className="absolute inset-0 opacity-[0.04]" 
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.526 0-16.213 1.24-25.725 4.842-3.46 1.304-6.36 2.403-8.775 3.158h5.684zm4.732 0c-.099-.044-.199-.088-.299-.133l-1.55-.705C14.754 15.197 9.26 14 0 14c-4.426 0-7.71.271-10.474.667h5.39c2.2-.156 4.725-.267 7.418-.267 8.134 0 13.607 1.037 22.165 4.913l1.417.623h0c.1.045.2.09.3.134h4.732zm-15.916 0c.074-.015.15-.03.225-.044l.77-.146C16.485 18.819 21.63 18 30 18c7.038 0 11.578.531 18.314 1.901.115.023.23.047.345.07l.885.182c.032.007.064.014.096.021h4.756l-.506-.172c-1.104-.374-2.47-.864-4.397-1.532C40.957 14.955 36.757 14 30 14c-7.614 0-12.679.851-21.047 2.48-.569.11-1.139.224-1.707.345l-.109.023c-.31.065-.622.13-.932.197h4.756z' fill='%23CA94C9' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
              }} 
            />
          </>
        )}
        {[...Array(150)].map((_, i) => (
          <div 
            key={i}
            className={cn(
              "absolute rounded-full animate-pulse transition-opacity duration-1000",
              theme === 'dark' ? "bg-white opacity-10" : "bg-brand/60 opacity-80"
            )}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${theme === 'light' ? 2 + Math.random() * 2 : 1 + Math.random() * 2}px`,
              height: `${theme === 'light' ? 2 + Math.random() * 2 : 1 + Math.random() * 2}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              boxShadow: theme === 'dark' 
                ? (Math.random() > 0.9 ? '0 0 10px 1px rgba(192, 132, 252, 0.4)' : 'none')
                : (Math.random() > 0.9 ? '0 0 12px 2px rgba(202, 148, 201, 0.8)' : 'none')
            }}
          />
        ))}
        {theme === 'dark' && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
          </>
        )}
      </div>

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
      <div className={cn(
        "relative overflow-hidden pt-12 pb-20 border-b z-10 transition-colors duration-500",
        theme === 'dark' ? "border-zinc-800/50" : "border-zinc-200"
      )}>
        <header className="w-full max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-8 relative z-20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Logo size="md" theme={theme} />
            <div className={cn(
              "h-px w-12 md:h-12 md:w-px hidden md:block transition-colors duration-500",
              theme === 'dark' ? "bg-white/10" : "bg-zinc-200"
            )} />
            <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className={cn(
                    "flex items-center gap-2 backdrop-blur-md p-1 rounded-xl border transition-all duration-500",
                    theme === 'dark' ? "bg-black/40 border-white/10" : "bg-white border-zinc-200 shadow-sm"
                  )}>
                    <input 
                      type="text" 
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && userName && handleSaveName()}
                      autoFocus
                      placeholder="Seu nome"
                      className={cn(
                        "bg-transparent px-3 py-1 text-[16px] font-bold focus:outline-none w-40",
                        theme === 'dark' ? "text-white" : "text-zinc-900"
                      )}
                    />
                    <button 
                      onClick={handleSaveName} 
                      disabled={isSubmitting}
                      className="bg-brand text-white p-1.5 rounded-lg hover:scale-110 transition-transform disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (isSuccess ? <Check size={16} className="text-emerald-400" /> : <Save size={16} />)}
                    </button>
                  </div>
                ) : (
                  <div className={cn(
                    "flex items-center gap-2 group/name backdrop-blur-sm px-4 py-1.5 rounded-full border transition-all duration-500",
                    theme === 'dark' ? "bg-black/20 border-white/5" : "bg-white border-zinc-200 shadow-sm"
                  )}>
                    <h2 className={cn(
                      "text-[12px] font-bold uppercase tracking-widest transition-colors duration-500",
                      theme === 'dark' ? "text-zinc-400" : "text-zinc-500"
                    )}>
                      Bem-vindo, <span className={cn("font-black", theme === 'dark' ? "text-white" : "text-zinc-900")}>{userName || 'Usuário'}</span>
                    </h2>
                    <button onClick={() => setIsEditingName(true)} className="text-zinc-500 hover:text-brand transition-colors opacity-0 group-hover/name:opacity-100">
                      <Pencil size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className={cn(
                  "p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
                  theme === 'dark' ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm"
                )}
                title={theme === 'dark' ? "Mudar para modo claro" : "Mudar para modo escuro"}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              {isAdmin && (
              <button 
                onClick={() => setShowAdminPanel(true)}
                className="bg-brand/10 hover:bg-brand/20 text-brand p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
              >
                <User size={16} /> Admin
              </button>
            )}
            <button 
              onClick={() => supabase.auth.signOut()}
              className={cn(
                "p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold",
                theme === 'dark' ? "bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 shadow-sm"
              )}
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
            </div>
            <div className={cn(
              "flex items-center gap-4 backdrop-blur-xl p-2.5 rounded-2xl border shadow-2xl w-full max-w-[320px] md:w-auto justify-between md:justify-center transition-all duration-500",
              theme === 'dark' ? "bg-black/40 border-white/10" : "bg-white border-zinc-200"
            )}>
            <button 
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className={cn(
                "p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95",
                theme === 'dark' ? "hover:bg-white/5 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
              )}
            >
              <ChevronLeft size={24} />
            </button>
              <div className="flex flex-col items-center gap-0 min-w-[140px] md:min-w-[160px] justify-center">
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand font-black mb-0.5">Período Atual</span>
              <div className={cn(
                "flex items-center gap-2 font-bold text-lg transition-colors duration-500",
                theme === 'dark' ? "text-white" : "text-zinc-900"
              )}>
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </div>
            </div>
            <button 
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className={cn(
                "p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95",
                theme === 'dark' ? "hover:bg-white/5 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
              )}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </header>
    </div>

      <main className="w-full max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-8 relative z-20">
        {/* Left Column: Summary & Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cards Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={cn(
              "backdrop-blur-md border p-5 rounded-2xl relative overflow-hidden group shadow-lg flex flex-col justify-center transition-all duration-500",
              theme === 'dark' ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200"
            )}>
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <TrendingUp size={48} />
              </div>
              <p className="text-zinc-400 text-[9px] mb-0.5 uppercase tracking-widest font-bold">Ganhos</p>
              <h3 className="text-xl font-black text-emerald-400">{formatCurrency(totals.income)}</h3>
            </div>
            
            <div className={cn(
              "backdrop-blur-md border p-5 rounded-2xl relative overflow-hidden group shadow-lg flex flex-col justify-center transition-all duration-500",
              theme === 'dark' ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200"
            )}>
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

            <div className={cn(
              "backdrop-blur-md border p-5 rounded-2xl relative overflow-hidden group shadow-lg flex flex-col justify-center transition-all duration-500",
              theme === 'dark' ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200"
            )}>
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

            <div className={cn(
              "backdrop-blur-md border p-5 rounded-2xl relative overflow-hidden group shadow-lg flex flex-col justify-center transition-all duration-500",
              theme === 'dark' ? "bg-zinc-900/60 border-brand/30" : "bg-white border-brand/20"
            )}>
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <AlertCircle size={48} className="text-brand" />
              </div>
              <div className="flex justify-between items-start mb-0.5 relative z-10">
                <p className="text-zinc-400 text-[9px] uppercase tracking-widest font-bold">Dívida</p>
                <select 
                  value={debtView} 
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setDebtView(e.target.value as typeof debtView)}
                  className={cn(
                    "text-[10px] text-brand font-bold uppercase border rounded-md px-1.5 py-0.5 focus:ring-1 focus:ring-brand cursor-pointer relative z-20 transition-colors",
                    theme === 'dark' ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700" : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200"
                  )}
                >
                  <option value="future" className={theme === 'dark' ? "bg-zinc-900" : "bg-white"}>Futura</option>
                  <option value="annual" className={theme === 'dark' ? "bg-zinc-900" : "bg-white"}>Anual</option>
                  <option value="installments" className={theme === 'dark' ? "bg-zinc-900" : "bg-white"}>Parcelada</option>
                  <option value="all" className={theme === 'dark' ? "bg-zinc-900" : "bg-white"}>Total</option>
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

            <div className={cn(
              "backdrop-blur-md border p-5 rounded-2xl relative overflow-hidden group shadow-lg cursor-pointer transition-all flex flex-col justify-center",
              theme === 'dark' ? "bg-zinc-900/60 border-brand/30 hover:border-brand/60" : "bg-brand/5 border-brand/20 hover:border-brand/40"
            )} onClick={() => setShowInvestmentModal(true)}>
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
                  className={cn(
                    "text-[10px] text-brand font-bold uppercase border rounded-md px-1.5 py-0.5 focus:ring-1 focus:ring-brand cursor-pointer relative z-20 transition-colors",
                    theme === 'dark' ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700" : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200"
                  )}
                >
                  <option value="monthly" className={theme === 'dark' ? "bg-zinc-900" : "bg-white"}>Mensal</option>
                  <option value="total" className={theme === 'dark' ? "bg-zinc-900" : "bg-white"}>Total</option>
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
                  <div 
                    key={idx} 
                    className={cn(
                      "min-w-[280px] h-44 rounded-3xl p-6 flex flex-col justify-between shadow-2xl shadow-brand/10 relative overflow-hidden backdrop-blur-xl border",
                      theme === 'dark' ? "border-white/10" : "border-zinc-200/50",
                      !card.color.startsWith('#') && "bg-gradient-to-br " + card.color
                    )}
                    style={card.color.startsWith('#') ? {
                      background: `linear-gradient(135deg, ${card.color}99 0%, ${card.color}1a 100%)`
                    } : {}}
                  >
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex justify-between items-start">
                      <div className={cn(
                        "p-2 rounded-xl backdrop-blur-md",
                        theme === 'dark' ? "bg-white/10" : "bg-zinc-900/10"
                      )}>
                        <CreditCard size={24} className={theme === 'dark' ? "text-white" : "text-zinc-900"} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCard(card.name);
                          }}
                          className={cn(
                            "transition-colors p-2 rounded-xl backdrop-blur-md",
                            theme === 'dark' ? "text-white/60 hover:text-white bg-white/10" : "text-zinc-900/60 hover:text-zinc-900 bg-zinc-900/10"
                          )}
                        >
                          <Trash2 size={18} />
                        </button>
                        <span className={cn(
                          "font-black italic text-xl",
                          theme === 'dark' ? "text-white/50" : "text-zinc-900/30"
                        )}>VISA</span>
                      </div>
                    </div>
                    <div>
                      <p className={cn(
                        "text-xs uppercase tracking-widest mb-1",
                        theme === 'dark' ? "text-white/60" : "text-zinc-900/60"
                      )}>{card.name}</p>
                      <p className={cn(
                        "text-2xl font-black",
                        theme === 'dark' ? "text-white" : "text-zinc-900"
                      )}>{formatCurrency(card.total)}</p>
                      <p className={cn(
                        "text-[10px] mt-1 uppercase tracking-tighter",
                        theme === 'dark' ? "text-white/40" : "text-zinc-900/40"
                      )}>Gasto no mês atual</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={cn(
              "border p-6 rounded-3xl shadow-xl transition-all duration-500",
              theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
            )}>
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PieChartIcon size={20} className="text-brand" /> Categorias
              </h4>
              <div className="h-[250px] w-full">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {categoryData.map((entry, index) => (
                          <linearGradient id={`colorGradient-${index}`} key={`colorGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={0.6}/>
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.1}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#colorGradient-${index})`}
                            stroke={entry.color}
                            strokeWidth={2}
                            className="drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#18181b' : '#fff', 
                          border: theme === 'dark' ? '1px solid #27272a' : '1px solid #e4e4e7', 
                          borderRadius: '12px',
                          color: theme === 'dark' ? '#fff' : '#18181b'
                        }}
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#18181b' }}
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
                <div className={cn(
                  "mt-4 space-y-2 border-t pt-4 transition-colors duration-500",
                  theme === 'dark' ? "border-zinc-800" : "border-zinc-100"
                )}>
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

            <div className={cn(
              "border p-6 rounded-3xl shadow-xl transition-all duration-500",
              theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
            )}>
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChartIcon size={20} className="text-brand" /> Balanço
              </h4>
              <div className={cn(
                "h-[250px] w-full rounded-2xl transition-colors duration-500",
                theme === 'dark' ? "bg-zinc-900" : "bg-zinc-50"
              )}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Balanço', ganhos: totals.income, gastos: totals.expense }]}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34D399" stopOpacity={0.6}/>
                        <stop offset="100%" stopColor="#34D399" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FB7185" stopOpacity={0.6}/>
                        <stop offset="100%" stopColor="#FB7185" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke={theme === 'dark' ? "#52525b" : "#a1a1aa"} />
                    <YAxis stroke={theme === 'dark' ? "#52525b" : "#a1a1aa"} hide />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#18181b' : '#fff', 
                        border: theme === 'dark' ? '1px solid #27272a' : '1px solid #e4e4e7', 
                        borderRadius: '12px',
                        color: theme === 'dark' ? '#fff' : '#18181b'
                      }}
                      itemStyle={{ color: theme === 'dark' ? '#fff' : '#18181b' }}
                      cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar 
                      dataKey="ganhos" 
                      fill="url(#incomeGradient)" 
                      stroke="#34D399"
                      strokeWidth={2}
                      radius={[8, 8, 0, 0]} 
                      className="drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                    />
                    <Bar 
                      dataKey="gastos" 
                      fill="url(#expenseGradient)" 
                      stroke="#FB7185"
                      strokeWidth={2}
                      radius={[8, 8, 0, 0]} 
                      className="drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className={cn(
            "border rounded-3xl overflow-hidden shadow-xl transition-all duration-500",
            theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <div className={cn(
              "p-6 border-b flex justify-between items-center transition-colors duration-500",
              theme === 'dark' ? "border-zinc-800" : "border-zinc-100"
            )}>
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
            <div className={cn(
              "divide-y max-h-[400px] overflow-y-auto scrollbar-custom",
              theme === 'dark' ? "divide-zinc-800" : "divide-zinc-100"
            )}>
              {currentMonthTransactions.length > 0 ? (
                [...currentMonthTransactions].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(t => (
                  <div 
                    key={t.id} 
                    className={cn(
                      "p-4 flex items-center justify-between transition-colors group",
                      theme === 'dark' ? "hover:bg-zinc-800/30" : "hover:bg-zinc-50"
                    )}
                  >
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
          <div className={cn(
            "border p-6 rounded-3xl shadow-xl transition-all duration-500",
            theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
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
                  <div 
                    key={goal.id} 
                    className={cn(
                      "space-y-3 group p-3 rounded-2xl border transition-all duration-500",
                      theme === 'dark' ? "bg-zinc-800/20 border-zinc-800/50" : "bg-zinc-50 border-zinc-200"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={cn("font-bold text-sm transition-colors duration-500", theme === 'dark' ? "text-white" : "text-zinc-900")}>{goal.title}</p>
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
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          theme === 'dark' ? "text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10" : "text-zinc-400 hover:text-rose-500 hover:bg-rose-50"
                        )}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-brand">{formatCurrency(goal.currentAmount)}</span>
                        <span className="text-zinc-500">alvo: {formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <div className={cn(
                        "h-2 rounded-full overflow-hidden transition-colors duration-500",
                        theme === 'dark' ? "bg-zinc-800" : "bg-zinc-100"
                      )}>
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
                        className={cn(
                          "flex-1 border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-brand transition-all duration-500",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-200 text-zinc-900"
                        )}
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
          <div className={cn(
            "border p-6 rounded-3xl shadow-xl transition-all duration-500",
            theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
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
                  <div 
                    key={inv.id} 
                    className={cn(
                      "group p-4 rounded-2xl border transition-all duration-500",
                      theme === 'dark' ? "bg-zinc-800/20 border-zinc-800/50 hover:border-brand/30" : "bg-zinc-50 border-zinc-200 hover:border-brand/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={cn("font-bold text-sm transition-colors duration-500", theme === 'dark' ? "text-white" : "text-zinc-900")}>{inv.description}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                          {inv.type === 'monthly' ? 'Mensal' : 'Fixo'} • {format(parseISO(inv.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => editInvestment(inv)}
                          className={cn(
                            "p-1.5 rounded-lg transition-all",
                            theme === 'dark' ? "text-zinc-600 hover:text-brand hover:bg-brand/10" : "text-zinc-400 hover:text-brand hover:bg-zinc-100"
                          )}
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => deleteInvestment(inv.id)}
                          className={cn(
                            "p-1.5 rounded-lg transition-all",
                            theme === 'dark' ? "text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10" : "text-zinc-400 hover:text-rose-500 hover:bg-rose-50"
                          )}
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
                        <div className={cn(
                          "h-1.5 w-full rounded-full overflow-hidden transition-colors duration-500",
                          theme === 'dark' ? "bg-zinc-800" : "bg-zinc-100"
                        )}>
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
                            className={cn(
                              "flex-1 border rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-brand transition-all duration-500",
                              theme === 'dark' ? "bg-zinc-900/50 border-zinc-700/50 text-white" : "bg-white border-zinc-200 text-zinc-900"
                            )}
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
          <div className="bg-brand/10 border border-brand/20 p-6 rounded-3xl shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h5 className="font-bold text-brand flex items-center gap-2 uppercase tracking-widest text-xs">
                💡 Dica do Mês
              </h5>
              <button 
                onClick={fetchAiInsights}
                className="flex items-center gap-2 bg-brand text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_15px_rgba(202,148,201,0.5)]"
              >
                <Brain size={14} /> Oráculo Cósmico
              </button>
            </div>
            <p className={cn(
              "text-sm leading-relaxed italic transition-colors duration-500",
              theme === 'dark' ? "text-zinc-300" : "text-zinc-700"
            )}>
              {[
                "O controle financeiro não é sobre quanto você ganha, mas sobre como você gerencia o que tem.",
                "Pague-se primeiro: reserve uma parte do seu salário para investimentos antes de pagar as contas.",
                "Pequenos gastos diários podem se tornar grandes rombos no orçamento mensal. Monitore o cafézinho!",
                "Ter uma reserva de emergência é o primeiro passo para a liberdade financeira e paz de espírito.",
                "Evite compras por impulso. Espere 24 horas antes de decidir se realmente precisa daquele item.",
                "Diversificar seus investimentos é a melhor forma de proteger seu patrimônio a longo prazo.",
                "O cartão de crédito é uma ferramenta, não uma extensão do seu salário. Use com sabedoria.",
                "Defina metas claras para o seu dinheiro. Quem não sabe para onde vai, qualquer caminho serve.",
                "Educação financeira é o melhor investimento que você pode fazer por si mesmo.",
                "A inflação corrói seu poder de compra. Não deixe seu dinheiro parado na conta corrente.",
                "Reveja suas assinaturas mensais. Muitas vezes pagamos por serviços que nem utilizamos.",
                "O segredo da riqueza não é ganhar muito, mas gastar menos do que se ganha e investir a diferença."
              ][currentDate.getMonth()]}
            </p>
          </div>

          {/* Cosmic Tools */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setShowIndependenceModal(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all duration-500 group",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800 hover:border-brand/50" : "bg-white border-zinc-200 hover:border-brand/50"
              )}
            >
              <div className="bg-brand/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <Rocket className="text-brand" size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-center">Independência Financeira</span>
            </button>
            <button 
              onClick={() => setShowCalendarModal(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all duration-500 group",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800 hover:border-brand/50" : "bg-white border-zinc-200 hover:border-brand/50"
              )}
            >
              <div className="bg-brand/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <Calendar className="text-brand" size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-center">Calendário Galáctico</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="pb-12 pt-12 flex items-center justify-center gap-3 opacity-30 hover:opacity-100 transition-opacity">
        <Logo size="sm" showText={false} />
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">
          BY THAYS VIDAL
        </p>
      </footer>

      {/* Investment Modal */}
      {/* Investment Modal */}
      {showInvestmentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={cn(
            "border w-full max-w-md rounded-3xl p-8 shadow-2xl transition-all duration-500",
            theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <h3 className={cn("text-2xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter transition-colors duration-500", theme === 'dark' ? "text-white" : "text-zinc-900")}>
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
                  className={cn(
                    "w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all duration-500 font-bold",
                    theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                  )}
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
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all duration-500 font-bold",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )}
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
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all duration-500 font-bold",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )}
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
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all duration-500 font-bold",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )}
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
                          investmentColor === c ? (theme === 'dark' ? "border-white scale-110" : "border-zinc-900 scale-110") : "border-transparent opacity-50"
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
                      investmentType === 'monthly' 
                        ? "bg-brand text-white" 
                        : (theme === 'dark' ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500")
                    )}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestmentType('fixed')}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold transition-all",
                      investmentType === 'fixed' 
                        ? "bg-brand text-white" 
                        : (theme === 'dark' ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500")
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
                  className={cn(
                    "flex-1 font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-xs",
                    theme === 'dark' ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                  )}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (isSuccess ? <Check size={16} className="text-emerald-400" /> : (editingInvestmentId ? 'Salvar' : 'Adicionar'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={cn(
            "border w-full max-w-md rounded-3xl p-8 shadow-2xl transition-all duration-500",
            theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <h3 className={cn("text-2xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter transition-colors duration-500", theme === 'dark' ? "text-white" : "text-zinc-900")}>
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
                  className={cn(
                    "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                    theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                  )}
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
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )}
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
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Categoria</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )}
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
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )}
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
                      className={cn(
                        "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                        theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                      )}
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
                          className={cn(
                            "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                            theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                          )}
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
                                "w-8 h-8 rounded-full border-2 transition-all",
                                !color.value.startsWith('#') && "bg-gradient-to-br " + color.value,
                                cardColor === color.value 
                                  ? (theme === 'dark' ? "border-white scale-110" : "border-zinc-900 scale-110") 
                                  : "border-transparent opacity-60 hover:opacity-100"
                              )}
                              style={color.value.startsWith('#') ? { backgroundColor: color.value } : {}}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {modalType === 'expense' && (
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-500",
                    theme === 'dark' ? "bg-zinc-800/20 border-zinc-800/50" : "bg-zinc-50 border-zinc-200"
                  )}>
                    <Repeat className="text-brand" size={20} />
                    <div className="flex-1">
                      <p className="text-xs font-bold">Transação Recorrente?</p>
                      <p className="text-[10px] text-zinc-500">Marcar como despesa fixa</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        isRecurring ? "bg-brand" : "bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        isRecurring ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>

                  {isRecurring && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Frequência</label>
                      <select 
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as any)}
                        className={cn(
                          "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                          theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                        )}
                      >
                        <option value="monthly">Mensal</option>
                        <option value="weekly">Semanal</option>
                        <option value="yearly">Anual</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all uppercase tracking-widest text-xs",
                    theme === 'dark' ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                  )}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-dark hover:bg-brand disabled:opacity-50 py-3 rounded-xl font-black transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (isSuccess ? <Check size={16} className="text-emerald-400" /> : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Insights Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "border w-full max-w-lg rounded-3xl p-8 shadow-2xl relative overflow-hidden",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}
            >
              {/* Galaxy Background Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#a855f7_0%,transparent_70%)] blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                    <Brain className="text-brand animate-pulse" size={32} /> Oráculo Cósmico
                  </h3>
                  <button onClick={() => setShowAiModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                    <Plus className="rotate-45" size={24} />
                  </button>
                </div>

                <div className={cn(
                  "min-h-[200px] flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed",
                  theme === 'dark' ? "bg-zinc-800/30 border-zinc-700" : "bg-zinc-50 border-zinc-200"
                )}>
                  {isAiLoading ? (
                    <div className="space-y-4">
                      <Loader2 className="animate-spin text-brand mx-auto" size={48} />
                      <p className="text-zinc-500 italic animate-pulse">Consultando as estrelas...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Sparkles className="text-brand mx-auto" size={32} />
                      <p className={cn(
                        "text-lg leading-relaxed font-medium italic",
                        theme === 'dark' ? "text-zinc-200" : "text-zinc-800"
                      )}>
                        "{aiInsight}"
                      </p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setShowAiModal(false)}
                  className="w-full mt-6 bg-brand hover:bg-brand-dark text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-brand/20"
                >
                  Entendido, Mestre
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Financial Independence Modal */}
      <AnimatePresence>
        {showIndependenceModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={cn(
                "border w-full max-w-md rounded-3xl p-8 shadow-2xl transition-all duration-500",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                  <Rocket className="text-brand" size={32} /> Rumo às Estrelas
                </h3>
                <button onClick={() => setShowIndependenceModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              {(() => {
                const { targetAmount, remaining, years } = calculateFinancialIndependence();
                return (
                  <div className="space-y-6">
                    <div className={cn(
                      "p-6 rounded-2xl text-center border",
                      theme === 'dark' ? "bg-zinc-800/30 border-zinc-700" : "bg-zinc-50 border-zinc-200"
                    )}>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2 font-bold">Alvo de Independência</p>
                      <p className="text-3xl font-black text-brand">{formatCurrency(targetAmount)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className={cn(
                        "p-4 rounded-2xl border",
                        theme === 'dark' ? "bg-zinc-800/30 border-zinc-700" : "bg-zinc-50 border-zinc-200"
                      )}>
                        <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Falta percorrer</p>
                        <p className="text-sm font-black text-rose-400">{formatCurrency(remaining)}</p>
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl border",
                        theme === 'dark' ? "bg-zinc-800/30 border-zinc-700" : "bg-zinc-50 border-zinc-200"
                      )}>
                        <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Tempo estimado</p>
                        <p className="text-sm font-black text-emerald-400">
                          {years === Infinity ? 'Infinito' : `${years.toFixed(1)} anos`}
                        </p>
                      </div>
                    </div>

                    <div className="bg-brand/5 p-4 rounded-2xl border border-brand/10">
                      <p className="text-xs italic text-zinc-500 text-center">
                        "A liberdade financeira é o combustível que permite sua nave alcançar galáxias distantes."
                      </p>
                    </div>

                    <button 
                      onClick={() => setShowIndependenceModal(false)}
                      className="w-full bg-brand hover:bg-brand-dark text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
                    >
                      Continuar Jornada
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Galactic Calendar Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "border w-full max-w-4xl rounded-3xl p-4 sm:p-8 shadow-2xl transition-all duration-500 overflow-y-auto max-h-[90vh] relative",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}
            >
              {/* Galactic Background Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden rounded-3xl">
                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_50%_50%,#CA94C9_0%,transparent_70%)]" />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 relative z-10">
                <h3 className="text-xl sm:text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                  <Calendar className="text-brand" size={24} /> Calendário Galáctico
                </h3>
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1 sm:gap-2 bg-zinc-800/50 p-1 rounded-xl border border-zinc-700">
                    <button 
                      onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                      className="p-1.5 sm:p-2 hover:bg-zinc-700 rounded-lg transition-all text-zinc-400 hover:text-white"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest px-1 sm:px-2 min-w-[100px] sm:min-w-[120px] text-center">
                      {format(calendarDate, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <button 
                      onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                      className="p-1.5 sm:p-2 hover:bg-zinc-700 rounded-lg transition-all text-zinc-400 hover:text-white"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <button onClick={() => setShowCalendarModal(false)} className="text-zinc-500 hover:text-white transition-colors p-1">
                    <Plus className="rotate-45" size={24} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Calendar Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center py-1 sm:py-2">
                        {day}
                      </div>
                    ))}
                    {(() => {
                      const monthStart = startOfMonth(calendarDate);
                      const monthEnd = endOfMonth(monthStart);
                      const startDate = startOfWeek(monthStart);
                      const endDate = endOfWeek(monthEnd);
                      const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                      return calendarDays.map((day, idx) => {
                        const dayReminders = billReminders.filter(r => isSameDay(parseISO(r.dueDate), day));
                        const dayTransactions = transactions.filter(t => isSameDay(parseISO(t.date), day));
                        const hasIncome = dayTransactions.some(t => t.type === 'income');
                        const hasExpense = dayTransactions.some(t => t.type === 'expense');
                        
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());

                        return (
                          <div 
                            key={idx}
                            className={cn(
                              "aspect-square rounded-lg sm:rounded-xl border p-0.5 sm:p-1 flex flex-col items-center justify-between transition-all relative group",
                              !isCurrentMonth ? "opacity-20 border-transparent" : (theme === 'dark' ? "bg-zinc-800/20 border-zinc-800/50" : "bg-zinc-50 border-zinc-200"),
                              isToday && "ring-1 sm:ring-2 ring-brand ring-offset-1 sm:ring-offset-2 ring-offset-zinc-900"
                            )}
                          >
                            {/* Galactic Cell Background Glow (Clipped separately to allow tooltip overflow) */}
                            {isCurrentMonth && (hasIncome || hasExpense) && (
                              <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                                <div className={cn(
                                  "absolute inset-0 opacity-[0.12] blur-xl",
                                  hasIncome && hasExpense ? "bg-gradient-to-br from-emerald-500 to-rose-500" :
                                  hasIncome ? "bg-emerald-500" : "bg-rose-500"
                                )} />
                              </div>
                            )}

                            <div className="w-full flex justify-between items-start relative z-10">
                              <span className={cn(
                                "text-[8px] sm:text-[10px] font-bold",
                                isToday ? "text-brand" : (theme === 'dark' ? "text-zinc-400" : "text-zinc-600")
                              )}>
                                {format(day, 'd')}
                              </span>
                              <div className="flex gap-0.5">
                                {hasIncome && (
                                  <Triangle 
                                    size={8} 
                                    className="text-emerald-400 fill-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse sm:w-[10px] sm:h-[10px]" 
                                    title="Ganho" 
                                  />
                                )}
                                {hasExpense && (
                                  <Triangle 
                                    size={8} 
                                    className="text-rose-400 fill-rose-400 rotate-180 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)] animate-pulse sm:w-[10px] sm:h-[10px]" 
                                    title="Gasto" 
                                  />
                                )}
                              </div>
                            </div>
                            
                            {dayReminders.length > 0 && (
                              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                                <Logo size="sm" showText={false} theme={theme} className="scale-[0.45] sm:scale-75 origin-center" />
                                <div className="flex gap-0.5">
                                  {dayReminders.slice(0, 3).map((r, i) => (
                                    <div 
                                      key={i} 
                                      className={cn(
                                        "w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full",
                                        r.isPaid ? "bg-emerald-500" : "bg-rose-500"
                                      )} 
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Hover Tooltip for Reminders & Transactions */}
                            {(dayReminders.length > 0 || dayTransactions.length > 0) && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-zinc-900 border border-zinc-800 rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 shadow-xl">
                                {dayReminders.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-[7px] uppercase font-black text-zinc-500 mb-1">Lembretes</p>
                                    {dayReminders.map(r => (
                                      <div key={r.id} className="text-[8px] font-bold flex justify-between gap-1 border-b border-zinc-800 last:border-0 py-1">
                                        <span className="truncate">{r.title}</span>
                                        <span className={r.isPaid ? "text-emerald-500" : "text-rose-500"}>{formatCurrency(r.amount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {dayTransactions.length > 0 && (
                                  <div>
                                    <p className="text-[7px] uppercase font-black text-zinc-500 mb-1">Transações</p>
                                    {dayTransactions.map(t => (
                                      <div key={t.id} className="text-[8px] font-bold flex justify-between gap-1 border-b border-zinc-800 last:border-0 py-1">
                                        <span className="truncate">{t.description}</span>
                                        <span className={t.type === 'income' ? "text-emerald-500" : "text-rose-500"}>
                                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Sidebar: Form & List */}
                <div className="space-y-8">
                  {/* Add Reminder Form */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Novo Lembrete</h4>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Título da conta"
                        id="reminder-title"
                        className={cn(
                          "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all text-sm font-bold",
                          theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                        )}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="number" 
                          placeholder="Valor"
                          id="reminder-amount"
                          className={cn(
                            "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all text-sm font-bold",
                            theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                          )}
                        />
                        <input 
                          type="date" 
                          id="reminder-date"
                          className={cn(
                            "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all text-sm font-bold",
                            theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                          )}
                        />
                      </div>
                      <button 
                        onClick={async () => {
                          const title = (document.getElementById('reminder-title') as HTMLInputElement).value;
                          const amount = parseFloat((document.getElementById('reminder-amount') as HTMLInputElement).value);
                          const date = (document.getElementById('reminder-date') as HTMLInputElement).value;
                          
                          if (!title || isNaN(amount) || !date) {
                            toast.error("Preencha todos os campos!");
                            return;
                          }

                          const newReminder: BillReminder = {
                            id: generateId(),
                            title,
                            amount,
                            dueDate: parseISO(date).toISOString(),
                            isPaid: false,
                            user_id: session?.user.id
                          };

                          if (session) {
                            const { error } = await supabase.from('bill_reminders').insert({
                              id: newReminder.id,
                              title: newReminder.title,
                              amount: newReminder.amount,
                              due_date: newReminder.dueDate,
                              is_paid: newReminder.isPaid,
                              user_id: newReminder.user_id
                            });
                            if (error) {
                              console.error('Error saving reminder:', error);
                              toast.error("Erro ao salvar no banco de dados.");
                              return;
                            }
                          }
                          setBillReminders([...billReminders, newReminder]);
                          
                          (document.getElementById('reminder-title') as HTMLInputElement).value = '';
                          (document.getElementById('reminder-amount') as HTMLInputElement).value = '';
                          (document.getElementById('reminder-date') as HTMLInputElement).value = '';
                          toast.success("Lembrete agendado com sucesso!");
                        }}
                        className="w-full bg-brand hover:bg-brand-dark text-white font-black py-3 rounded-xl transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-brand/20"
                      >
                        Agendar Lembrete
                      </button>
                    </div>
                  </div>

                  {/* Reminders List for Selected Month */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Contas do Mês</h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-custom">
                      {billReminders.filter(r => isSameMonth(parseISO(r.dueDate), calendarDate)).length > 0 ? 
                        [...billReminders]
                          .filter(r => isSameMonth(parseISO(r.dueDate), calendarDate))
                          .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
                          .map(reminder => (
                        <div 
                          key={reminder.id}
                          className={cn(
                            "p-4 rounded-2xl border flex justify-between items-center group transition-all",
                            theme === 'dark' ? "bg-zinc-800/20 border-zinc-800/50 hover:border-brand/30" : "bg-zinc-50 border-zinc-200 hover:border-brand/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              reminder.isPaid ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            )}>
                              <Bell size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold">{reminder.title}</p>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                                {format(parseISO(reminder.dueDate), 'dd/MM')} • {formatCurrency(reminder.amount)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={async () => {
                                const updated = { ...reminder, isPaid: !reminder.isPaid };
                                if (session) {
                                  const { error } = await supabase.from('bill_reminders').update({ is_paid: updated.isPaid }).eq('id', reminder.id);
                                  if (error) {
                                    console.error('Error updating reminder:', error);
                                    toast.error("Erro ao atualizar no banco.");
                                    return;
                                  }
                                }
                                setBillReminders(billReminders.map(r => r.id === reminder.id ? updated : r));
                              }}
                              className={cn(
                                "p-2 rounded-lg transition-all",
                                reminder.isPaid ? "text-emerald-500 bg-emerald-500/10" : "text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                              )}
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (session) {
                                  await supabase.from('bill_reminders').delete().eq('id', reminder.id);
                                }
                                setBillReminders(billReminders.filter(r => r.id !== reminder.id));
                              }}
                              className="text-zinc-600 hover:text-rose-500 p-2 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-zinc-500 italic text-xs">
                          Nenhuma conta para este mês
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={cn(
            "border w-full max-w-md rounded-3xl p-8 shadow-2xl transition-all duration-500",
            theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <h3 className={cn("text-2xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter transition-colors duration-500", theme === 'dark' ? "text-white" : "text-zinc-900")}>
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
                  className={cn(
                    "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                    theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                  )}
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
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )}
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
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )}
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
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )}
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
                          goalColor === c 
                            ? (theme === 'dark' ? "border-white scale-110" : "border-zinc-900 scale-110") 
                            : "border-transparent opacity-50"
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
                  className={cn(
                    "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-all duration-500 font-bold",
                    theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all uppercase tracking-widest text-xs",
                    theme === 'dark' ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                  )}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-dark hover:bg-brand disabled:opacity-50 py-3 rounded-xl font-black transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (isSuccess ? <Check size={16} className="text-emerald-400" /> : 'Criar Meta')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={cn(
            "border w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[80vh] overflow-y-auto relative transition-all duration-500",
            theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <div className="flex justify-between items-center mb-8">
              <h3 className={cn("text-2xl font-black flex items-center gap-2 uppercase tracking-tighter transition-colors duration-500", theme === 'dark' ? "text-white" : "text-zinc-900")}>
                <User className="text-brand" /> Painel Admin
              </h3>
              <button 
                onClick={() => setShowAdminPanel(false)}
                className={cn(
                  "transition-colors",
                  theme === 'dark' ? "text-zinc-500 hover:text-white" : "text-zinc-400 hover:text-zinc-900"
                )}
              >
                Fechar
              </button>
            </div>

            <div className="space-y-4">
              {accessRequests.length === 0 ? (
                <p className="text-center text-zinc-500 py-12 font-bold uppercase tracking-widest text-xs">
                  Nenhuma solicitação pendente
                </p>
              ) : (
                accessRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className={cn(
                      "border p-4 rounded-2xl flex items-center justify-between gap-4 transition-all duration-500",
                      theme === 'dark' ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200"
                    )}
                  >
                    <div>
                      <p className={cn("font-bold transition-colors duration-500", theme === 'dark' ? "text-white" : "text-zinc-900")}>{req.email}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        Solicitado em: {format(parseISO(req.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                      <span className={cn(
                        "inline-block mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                        req.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                        req.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                        "bg-rose-500/10 text-rose-500"
                      )}>
                        {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      {req.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => setConfirmAction({ id: req.id, type: 'reject', email: req.email })}
                            disabled={isSubmitting}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              theme === 'dark' ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white" : "bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white"
                            )}
                            title="Rejeitar"
                          >
                            <Minus size={18} />
                          </button>
                          <button 
                            onClick={() => setConfirmAction({ id: req.id, type: 'approve', email: req.email })}
                            disabled={isSubmitting}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              theme === 'dark' ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white" : "bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                            )}
                            title="Aprovar"
                          >
                            <Plus size={18} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => setConfirmAction({ id: req.id, type: 'delete', email: req.email })}
                        disabled={isSubmitting}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          theme === 'dark' ? "bg-zinc-700/50 text-zinc-400 hover:bg-rose-500 hover:text-white" : "bg-zinc-200 text-zinc-500 hover:bg-rose-500 hover:text-white"
                        )}
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Confirmation Dialog */}
            <AnimatePresence>
              {confirmAction && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-8 z-[60] rounded-3xl"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="text-center space-y-6 max-w-sm"
                  >
                    <div className={cn(
                      "w-16 h-16 mx-auto rounded-full flex items-center justify-center",
                      confirmAction.type === 'approve' ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                    )}>
                      {confirmAction.type === 'approve' ? <Plus size={32} /> : confirmAction.type === 'reject' ? <Minus size={32} /> : <Trash2 size={32} />}
                    </div>
                    
                    <div>
                      <h4 className={cn("text-xl font-black uppercase tracking-tighter transition-colors duration-500", theme === 'dark' ? "text-white" : "text-white")}>
                        {confirmAction.type === 'approve' ? 'Confirmar Aprovação' : confirmAction.type === 'reject' ? 'Confirmar Rejeição' : 'Confirmar Exclusão'}
                      </h4>
                      <p className="text-zinc-400 text-sm mt-2">
                        Deseja realmente {confirmAction.type === 'approve' ? 'aprovar' : confirmAction.type === 'reject' ? 'rejeitar' : 'excluir'} o acesso para:
                        <br />
                        <span className="text-white font-bold">{confirmAction.email}</span>?
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setConfirmAction(null)}
                        className={cn(
                          "flex-1 py-3 rounded-xl font-bold transition-all uppercase tracking-widest text-xs",
                          theme === 'dark' ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-zinc-700 hover:bg-zinc-600 text-white"
                        )}
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => {
                          if (confirmAction.type === 'approve') handleApproveRequest(confirmAction);
                          else if (confirmAction.type === 'reject') handleRejectRequest(confirmAction.id);
                          else if (confirmAction.type === 'delete') handleDeleteRequest(confirmAction.id);
                        }}
                        disabled={isSubmitting}
                        className={cn(
                          "flex-1 py-3 rounded-xl font-black transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2",
                          confirmAction.type === 'approve' ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                        )}
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (isSuccess ? <Check size={16} className="text-emerald-400" /> : 'Confirmar')}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
