import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils';

interface AuthProps {
  onPasswordResetComplete?: () => void;
  isInitialResetMode?: boolean;
}

export function Auth({ onPasswordResetComplete, isInitialResetMode }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(isInitialResetMode || false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [email, setEmail] = useState('');
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2 font-jersey">
            Finthery
          </h1>
          <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">
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
