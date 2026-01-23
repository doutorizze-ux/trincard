import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  LogOut,
  Settings,
  CreditCard,
  Users,
  Menu,
  X,
  Home,
  UserPlus,
  Trophy,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function Layout({ children, showHeader = true, showFooter = true }: LayoutProps) {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigation = [
    { name: 'Início', href: '/', icon: Home, public: true },
    { name: 'Parceiros', href: '/parceiros', icon: Users, public: true },
  ];

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: CreditCard },
    { name: 'Perfil', href: '/perfil', icon: User },
    { name: 'Assinatura', href: '/assinatura', icon: Settings },
  ];

  const adminNavigation = [
    { name: 'Administração', href: '/admin', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && (
        <header className="bg-[#050505] border-b border-white/5 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-[#FF3131] rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(191,255,0,0.3)]">
                  <Trophy className="text-black h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white italic tracking-tighter leading-none">TRINCARD</span>
                  <span className="text-[10px] text-[#FF3131] font-bold tracking-[0.2em] uppercase">Sport & Health Benefits</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive(item.href)
                      ? 'text-black bg-[#FF3131]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}

                {user && (
                  <>
                    <div className="w-px h-6 bg-white/10 mx-2"></div>
                    {userNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive(item.href)
                          ? 'text-black bg-[#FF3131]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    ))}

                    {userProfile?.is_admin &&
                      adminNavigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive(item.href)
                            ? 'text-black bg-[#FF3131]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                  </>
                )}
              </nav>

              {/* User Menu */}
              <div className="hidden md:flex items-center space-x-4">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-400">Logado como</span>
                      <span className="text-sm font-bold text-white">
                        {userProfile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/5"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      to="/login"
                      className="text-sm font-bold text-white hover:text-[#FF3131] transition-colors px-4"
                    >
                      Entrar
                    </Link>
                    <Link
                      to="/cadastro"
                      className="flex items-center space-x-2 bg-[#FF3131] text-black px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-wider hover:bg-[#a6dd00] transition-colors shadow-[0_0_20px_rgba(191,255,0,0.2)] active:scale-95"
                    >
                      <span>Cadastrar</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-white/5 text-white hover:bg-[#FF3131] hover:text-black transition-all border border-white/10"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden py-6 border-t border-white/5 animate-in slide-in-from-top duration-300">
                <div className="space-y-3">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${isActive(item.href)
                        ? 'text-black bg-[#FF3131]'
                        : 'text-gray-300 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}

                  {user ? (
                    <>
                      {userNavigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${isActive(item.href)
                            ? 'text-black bg-[#FF3131]'
                            : 'text-gray-300 bg-white/5 hover:bg-white/10'
                            }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      ))}

                      {userProfile?.is_admin &&
                        adminNavigation.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${isActive(item.href)
                              ? 'text-black bg-[#FF3131]'
                              : 'text-gray-300 bg-white/5 hover:bg-white/10'
                              }`}
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </Link>
                        ))}

                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold text-red-500 bg-red-500/10 transition-all w-full text-left"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sair</span>
                      </button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center px-4 py-3 rounded-xl text-base font-bold text-white bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        Entrar
                      </Link>
                      <Link
                        to="/cadastro"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center space-x-2 bg-[#FF3131] text-black px-4 py-3 rounded-xl text-base font-black uppercase tracking-wider"
                      >
                        <span>CADASTRAR</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-white">
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="bg-[#050505] text-white overflow-hidden relative">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF3131] opacity-[0.03] blur-[100px] rounded-full -mr-48 -mt-48"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24">
              <div className="col-span-1 md:col-span-2">
                <Link to="/" className="flex items-center space-x-3 mb-8 group">
                  <div className="w-12 h-12 bg-[#FF3131] rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(191,255,0,0.4)]">
                    <Trophy className="text-black h-7 w-7" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-white italic tracking-tighter leading-none">TRINCARD</span>
                    <span className="text-xs text-[#FF3131] font-bold tracking-[0.3em] uppercase">Sport & Health Benefits</span>
                  </div>
                </Link>
                <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
                  A maior plataforma de benefícios do Brasil. Conectando você à saúde e ao alto desempenho através de redes exclusivas em farmácias, hospitais e academias.
                </p>
                <div className="flex space-x-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#FF3131] hover:text-black transition-all cursor-pointer">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#FF3131] hover:text-black transition-all cursor-pointer">
                    <Star className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[#FF3131] text-sm font-black uppercase tracking-[0.2em] mb-8 italic">Links Rápidos</h3>
                <ul className="space-y-4">
                  <li><Link to="/" className="text-gray-400 hover:text-white transition-colors font-bold flex items-center group"><ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-all -ml-6 group-hover:ml-0" />Início</Link></li>
                  <li><Link to="/parceiros" className="text-gray-400 hover:text-white transition-colors font-bold flex items-center group"><ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-all -ml-6 group-hover:ml-0" />Parceiros</Link></li>
                  <li><Link to="/cadastro" className="text-gray-400 hover:text-white transition-colors font-bold flex items-center group"><ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-all -ml-6 group-hover:ml-0" />Seja um Membro</Link></li>
                  <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors font-bold flex items-center group"><ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-all -ml-6 group-hover:ml-0" />Área do Cliente</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-[#FF3131] text-sm font-black uppercase tracking-[0.2em] mb-8 italic">Contato</h3>
                <ul className="space-y-4">
                  <li className="flex items-center space-x-3 group">
                    <div className="p-2 rounded-lg bg-white/5 text-[#FF3131] group-hover:bg-[#FF3131] group-hover:text-black transition-all">
                      <Zap className="h-4 w-4" />
                    </div>
                    <span className="text-gray-400 font-bold group-hover:text-white transition-all">contato@trincard.com</span>
                  </li>
                  <li className="text-gray-400 font-bold hover:text-white transition-colors cursor-pointer">(11) 9999-9999</li>
                  <li className="text-gray-500 text-sm mt-8 border-t border-white/5 pt-8">
                    © 2024 TRINCARD.<br />Peak Performance Everywhere.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}

export default Layout;
