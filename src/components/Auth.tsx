import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../utils';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      console.log('Iniciando autenticação...', { isSignUp, email });
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        console.log('Resposta SignUp:', { data, error });
        if (error) throw error;
        setMessage('Cadastro realizado! Verifique seu e-mail para confirmar.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log('Resposta SignIn:', { data, error });
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
            {isSignUp ? 'Crie sua conta' : 'Acesse sua conta'}
          </p>
        </div>

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
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                required
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-brand transition-colors font-bold text-white"
                placeholder="••••••••"
              />
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
      </motion.div>
    </div>
  );
}
