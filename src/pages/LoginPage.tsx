import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSafeTimeout } from '../hooks/useSafeTimeout';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowLeft, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { setSafeTimeout } = useSafeTimeout();

  const from = location.state?.from?.pathname || '/dashboard';

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error('Erro ao fazer login. Tente novamente.');
        }
      } else {
        toast.success('Login realizado com sucesso!');

        // Aguardar um momento para o userProfile ser carregado e verificar se é admin
        setSafeTimeout(async () => {
          try {
            // Buscar o perfil atualizado diretamente do banco
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              const { data: profile } = await supabase
                .from('users')
                .select('is_admin')
                .eq('id', user.id)
                .single();

              console.log('🔍 Perfil após login:', profile);
              console.log('👑 Is Admin:', profile?.is_admin);

              // Verificar se o usuário é admin e redirecionar adequadamente
              if (profile?.is_admin) {
                console.log('🚀 Redirecionando para /admin');
                navigate('/admin', { replace: true });
              } else {
                console.log('🚀 Redirecionando para', from);
                navigate(from, { replace: true });
              }
            } else {
              navigate(from, { replace: true });
            }
          } catch (profileError) {
            console.error('❌ Erro ao buscar perfil após login:', profileError);
            navigate(from, { replace: true });
          }
        }, 500);
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-outfit">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF3131] opacity-5 blur-[120px] rounded-full -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600 opacity-5 blur-[120px] rounded-full -ml-32 -mb-32"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 text-gray-500 hover:text-[#FF3131] transition-colors mb-8 group font-bold uppercase tracking-widest text-xs">
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao início</span>
          </Link>

          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-[#FF3131] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(191,255,0,0.3)] transform -rotate-12">
              <Trophy className="text-black h-10 w-10" />
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none mb-3">
            BEM-VINDO<br /><span className="text-[#FF3131]">DE VOLTA</span>
          </h2>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            Acesse sua área de performance
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 lg:p-10 shadow-3xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3131] mb-3 ml-1">
                Seu Email Atleta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-12 pr-6 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent transition-all font-bold placeholder:text-gray-800 ${errors.email ? 'border-red-500/50 bg-red-500/5' : ''
                    }`}
                  placeholder="seu@perfil.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3131] mb-3 ml-1">
                Sua Senha Mestre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-600" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-12 pr-12 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent transition-all font-bold placeholder:text-gray-800 ${errors.password ? 'border-red-500/50 bg-red-500/5' : ''
                    }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-600 hover:text-[#FF3131]" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-600 hover:text-[#FF3131]" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.password}</p>
              )}
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 bg-black border-white/10 text-[#FF3131] focus:ring-[#FF3131] rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Lembrar
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-bold text-[#FF3131] hover:text-white transition-colors uppercase tracking-widest">
                  Perdeu a senha?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-3 py-5 px-6 rounded-2xl text-base font-black italic uppercase tracking-[0.1em] text-black bg-[#FF3131] hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF3131] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-xl shadow-[#FF3131]/10"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>ENTRAR AGORA</span>
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-8 text-center border-t border-white/5 pt-8">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              Novo por aqui?{' '}
              <Link
                to="/cadastro"
                className="text-[#FF3131] hover:text-white transition-colors ml-1"
              >
                CRIE SUA CONTA
              </Link>
            </p>
          </div>
        </div>

        {/* Brand Mantra */}
        <div className="text-center">
          <p className="text-[10px] font-black text-gray-800 uppercase tracking-[0.5em]">
            PEAK PERFORMANCE • EVERYWHERE
          </p>
        </div>
      </div>
    </div>
  );
}
