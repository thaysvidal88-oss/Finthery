import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '../utils';

interface AuthProps {
  onPasswordResetComplete?: () => void;
  isInitialResetMode?: boolean;
}

const Logo = ({ size = 'md', showText = true, className }: { size?: 'sm' | 'md' | 'lg', showText?: boolean, className?: string }) => {
  const textSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-5xl md:text-6xl' : 'text-8xl';
  
  // Planet body dimensions
  const planetDim = size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-14 h-14' : 'w-20 h-20';
  
  // Ring dimensions (proportional to planet)
  const ringW = size === 'sm' ? 44 : size === 'md' ? 100 : 140;
  const ringH = size === 'sm' ? 12 : size === 'md' ? 28 : 40;

  return (
    <div className={cn("flex items-center gap-6", className)}>
      <div className={cn("relative flex items-center justify-center", planetDim)}>
        
        {/* Layer 1: Back Rings (Behind Planet) */}
        <div className="absolute z-0 pointer-events-none flex items-center justify-center" style={{ width: ringW, height: ringH }}>
          <div 
            className="w-full h-full border border-purple-400/30 rounded-[100%] rotate-[-25deg] skew-x-[65deg]"
            style={{ clipPath: 'inset(0 0 50% 0)' }}
          />
        </div>

        {/* Layer 2: Planet Body */}
        <div className="absolute inset-0 rounded-full bg-[#05000a] shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.9),0_0_30px_rgba(168,85,247,0.3)] border border-purple-500/10 overflow-hidden z-10">
          {/* Intense Crescent Glow */}
          <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_25%_35%,#d8b4fe,transparent_60%)]" />
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_25%_35%,#a855f7,transparent_80%)]" />
          
          {/* Atmospheric Rim Light */}
          <div className="absolute inset-0 rounded-full border-t border-l border-white/20 blur-[0.5px]" />
        </div>

        {/* Layer 3: Front Rings (In front of Planet) */}
        <div className="absolute z-20 pointer-events-none flex items-center justify-center" style={{ width: ringW, height: ringH }}>
          <div 
            className="w-full h-full border-2 border-purple-300/50 rounded-[100%] rotate-[-25deg] skew-x-[65deg] shadow-[0_0_10px_rgba(192,132,252,0.4)]"
            style={{ clipPath: 'inset(50% 0 0 0)' }}
          />
        </div>
        
        {/* Layer 4: Arrow - Smaller and more opaque/muted */}
        <div className="relative z-30 flex items-center justify-center">
          <TrendingUp 
            size={size === 'sm' ? 10 : size === 'md' ? 24 : 36} 
            className="text-white/60 drop-shadow-[0_0_10px_rgba(192,132,252,0.4)] rotate-[-10deg]" 
            strokeWidth={2.5}
          />
        </div>

        {/* Sparkles */}
        <div className="absolute -top-4 -left-4 w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
        <div className="absolute top-2 -right-6 w-1 h-1 bg-purple-200 rounded-full animate-pulse delay-150 shadow-[0_0_10px_rgba(192,132,252,1)]" />
      </div>

      {showText && (
        <h1 className={cn("font-medium tracking-tight text-white drop-shadow-2xl font-jersey", textSize)}>
          Finthery
        </h1>
      )}
    </div>
  );
};

export function Auth({ onPasswordResetComplete, isInitialResetMode }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(isInitialResetMode || false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Listen for password recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      // Sign out to force user to login with new password
      await supabase.auth.signOut();
      
      // Clear URL hash to prevent re-triggering recovery mode
      window.history.replaceState(null, '', window.location.pathname);
      
      setMessage('Senha atualizada com sucesso! Por favor, entre com sua nova senha.');
      setIsResettingPassword(false);
      setIsSignUp(false);
      if (onPasswordResetComplete) {
        onPasswordResetComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('access_requests')
        .insert([{ email: email.toLowerCase(), status: 'pending' }]);
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Você já solicitou acesso. Por favor, aguarde a aprovação do administrador.');
        }
        throw error;
      }
      
      setMessage('Solicitação enviada com sucesso! O administrador será notificado.');
      setShowRequestAccess(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar acesso.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail primeiro.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Verificar se o e-mail está na whitelist (allowed_users)
      const { data: allowed, error: allowedError } = await supabase
        .from('allowed_users')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (allowedError || !allowed) {
        setShowRequestAccess(true);
        throw new Error('Este e-mail não está autorizado. Clique no botão abaixo para solicitar acesso.');
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });
        if (error) throw error;
        setMessage('Cadastro realizado! Verifique seu e-mail para confirmar.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Erro na autenticação:', err);
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b1a] via-[#0f050f] to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Galaxy Sparkles Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
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
              animationDuration: `${3 + Math.random() * 4}s`,
              boxShadow: Math.random() > 0.8 ? '0 0 10px 1px rgba(192, 132, 252, 0.3)' : 'none'
            }}
          />
        ))}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <Logo size="md" className="mb-4" />
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black bg-white/5 px-4 py-1 rounded-full border border-white/10">
            {isResettingPassword ? 'Definir Nova Senha' : isSignUp ? 'Crie sua conta' : 'Acesse sua conta'}
          </p>
        </div>

        {isResettingPassword ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 ml-1">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-brand transition-colors font-bold text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-brand-dark hover:bg-brand disabled:opacity-50 py-4 rounded-xl font-black transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Atualizar Senha</>}
            </button>

            <button 
              type="button"
              onClick={() => {
                setIsResettingPassword(false);
                if (onPasswordResetComplete) onPasswordResetComplete();
              }}
              className="w-full text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 ml-1">Nome Completo</label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  required
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold text-white"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                required
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold text-white"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-1 ml-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Senha</label>
              {!isSignUp && (
                <button 
                  type="button"
                  onClick={handleResetPassword}
                  className="text-[10px] font-bold text-brand hover:text-brand-dark uppercase tracking-widest transition-colors"
                >
                  Esqueci minha senha
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                required
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-brand transition-colors font-bold text-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
              <AlertCircle size={16} />
              {message}
            </div>
          )}

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-brand-dark hover:bg-brand disabled:opacity-50 py-4 rounded-xl font-black transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isSignUp ? (
              <><UserPlus size={20} /> Cadastrar</>
            ) : (
              <><LogIn size={20} /> Entrar</>
            )}
          </button>

          {showRequestAccess && (
            <button 
              type="button"
              onClick={handleRequestAccess}
              disabled={loading}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Solicitar Acesso ao Administrador'}
            </button>
          )}
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="text-zinc-500 hover:text-white text-xs font-bold transition-colors uppercase tracking-widest"
          >
            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
          </button>
        </div>
      </>
    )}
  </motion.div>
</div>
);
}
