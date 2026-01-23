import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Zap,
  Shield,
  Gift,
  Users,
  Smartphone,
  MapPin,
  ArrowRight,
  RefreshCw,
  Download,
  AlertCircle,
  Crown,
  Trophy
} from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Plan, Subscription } from '../lib/supabase';
import { toast } from 'sonner';
import { SkeletonCard } from '../components/Skeleton';

export default function SubscriptionPage() {
  const { user, userProfile } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [searchParams] = useSearchParams();

  const fetchPlansOnly = async () => {
    try {
      setLoadingPlans(true);
      const data = await api.plans.list();
      const activePlans = data.filter((p: any) => p.is_active).sort((a: any, b: any) => a.price - b.price);
      setPlans(activePlans || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchSubscriptionOnly = async () => {
    if (!user) return; // userProfile might be null initially? Use user from context

    try {
      const subscriptionData = await api.subscriptions.me();

      if (subscriptionData) {
        // Map backend response to frontend expected format if needed
        // Backend returns joined fields, frontend expects 'plans' object nested?
        // My query: json_build_object('name', p.name...) AS plans
        setCurrentSubscription(subscriptionData);
      } else {
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('Error in fetchSubscriptionOnly:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchPlansOnly(), fetchSubscriptionOnly()]);
    setLoading(false);
  };

  const handlePlanSelection = useCallback((planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(planId);
      setShowPaymentModal(true);
    }
  }, [plans]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [user]); // Run when auth user is available

  // Handle payment status messages
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast.success('Pagamento realizado com sucesso!');
      setTimeout(() => fetchData(), 2000);
    } else if (status === 'failure') {
      toast.error('Pagamento falhou ou foi cancelado.');
    } else if (status === 'pending') {
      toast.info('Pagamento em processamento.');
    }
  }, [searchParams]);

  // Handle auto-plan selection from URL
  useEffect(() => {
    const planFromUrl = searchParams.get('plan');

    if (planFromUrl && plans.length > 0 && !selectedPlan && !showPaymentModal && !currentSubscription) {
      const planToSelect = plans.find(p => p.id === planFromUrl);
      if (planToSelect) {
        handlePlanSelection(planFromUrl);
      }
    }
  }, [plans, searchParams, selectedPlan, showPaymentModal, currentSubscription, handlePlanSelection]);

  const handleSubscription = async (formData: any) => {
    const currentUser = userProfile || user;
    const userId = currentUser?.id;
    const userEmail = currentUser?.email;

    if (!selectedPlan || !userId || !userEmail) {
      toast.error('Erro: Usuário não identificado. Tente fazer login novamente.');
      return;
    }

    try {
      setProcessingPayment(true);

      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) throw new Error('Plano não encontrado');

      if (Number(plan.price) <= 0) {
        await api.subscriptions.activateFree(plan.id);
        toast.success('Plano gratuito ativado com sucesso!');
        setProcessingPayment(false);
        setShowPaymentModal(false);
        fetchData();
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planId: plan.id,
          title: ` - Plano ${plan.name}`,
          price: plan.price,
          userEmail: userEmail,
          name: userProfile?.full_name || 'Cliente ',
          cpfCnpj: userProfile?.cpf || '',
          frontendUrl: window.location.origin
        }
      });

      if (error) {
        let errorMessage = error.message || 'Falha ao iniciar pagamento';
        if (error.context && error.context.json) {
          const body = await error.context.json();
          errorMessage = body.message || JSON.stringify(body);
        }
        throw new Error(errorMessage);
      }

      if (data && data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('Erro ao obter link de pagamento');
      }

    } catch (error: any) {
      console.error('Erro ao processar assinatura:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
      setProcessingPayment(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan || !userProfile) {
      toast.error('Erro: dados incompletos');
      return;
    }
    await handleSubscription({});
    fetchData();
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    const confirmed = window.confirm(
      'Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos benefícios.'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', currentSubscription.id);

      if (error) {
        toast.error('Erro ao cancelar assinatura');
      } else {
        toast.success('Assinatura cancelada com sucesso');
        setCurrentSubscription(null);
      }
    } catch (error) {
      toast.error('Erro inesperado');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPlanIcon = (planName?: string) => {
    if (!planName) return <Star className="h-6 w-6" />;

    switch (planName.toLowerCase()) {
      case 'básico':
        return <Star className="h-6 w-6" />;
      case 'premium':
        return <Zap className="h-6 w-6" />;
      case 'vip':
        return <Crown className="h-6 w-6" />;
      default:
        return <Trophy className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF3131] border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">CARREGANDO PLANOS DE ELITE...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#050505] py-12 lg:py-20 relative overflow-hidden font-outfit">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF3131] opacity-5 blur-[120px] rounded-full -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600 opacity-5 blur-[120px] rounded-full -ml-32 -mb-32"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-5xl lg:text-7xl font-black text-white italic tracking-tighter uppercase leading-none mb-6">
              SUA <span className="text-[#FF3131]">PERFORMANCE</span>
            </h1>
            <p className="text-xl text-gray-500 font-bold max-w-2xl leading-relaxed">
              Gerencie seus planos e impulsione seus resultados com a rede mais seleta de benefícios esportivos.
            </p>
          </div>

          {/* Current Subscription */}
          {currentSubscription && (
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-[#FF3131]/20 rounded-[40px] p-8 lg:p-12 mb-16 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <div className="flex items-center space-x-2 bg-[#FF3131] text-black px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg animate-pulse">
                  <CheckCircle className="h-4 w-4" />
                  <span>CONTA ATIVA</span>
                </div>
              </div>

              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-10">ASSINATURA VIGENTE</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="flex items-start space-x-5">
                  <div className="w-16 h-16 bg-[#FF3131] rounded-2xl flex items-center justify-center text-black transform -rotate-6">
                    {getPlanIcon(currentSubscription.plans?.name || '')}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">PLANO ATUAL</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{currentSubscription.plans?.name}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-5">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#FF3131]">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">RENOVA EM</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{formatDate(currentSubscription.start_date)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-5">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500">
                    <CreditCard className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">INVESTIMENTO</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{formatCurrency(currentSubscription.plans?.price || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-12 border-t border-white/5 pt-10">
                <button className="flex items-center space-x-3 bg-white text-black px-8 py-4 rounded-2xl font-black italic uppercase tracking-widest text-sm hover:bg-[#FF3131] transition-all transform active:scale-95 shadow-xl">
                  <RefreshCw className="h-5 w-5" />
                  <span>RENOVAR AGORA</span>
                </button>
                <button className="flex items-center space-x-3 bg-zinc-800 text-white px-8 py-4 rounded-2xl font-black italic uppercase tracking-widest text-sm hover:bg-zinc-700 transition-all transform active:scale-95">
                  <Download className="h-5 w-5" />
                  <span>FATURAS</span>
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="flex items-center space-x-3 border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-8 py-4 rounded-2xl font-black italic uppercase tracking-widest text-sm transition-all transform active:scale-95 ml-auto"
                >
                  <XCircle className="h-5 w-5" />
                  <span>CANCELAR</span>
                </button>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          {!currentSubscription && (
            <div className="mb-20">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">EVOLUA SEU STATUS</h2>
                <div className="w-24 h-1 bg-[#FF3131] mx-auto rounded-full"></div>
              </div>

              {loadingPlans ? (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF3131] border-t-transparent mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {plans.map((plan) => {
                    const featuresList = plan.features?.features || [];
                    const planName = plan.name || '';
                    const isPopular = plan.features?.exclusive_benefits || planName.toLowerCase().includes('premium');
                    const planPrice = Number(plan.price) || 0;

                    return (
                      <div
                        key={plan.id}
                        className={`group bg-zinc-900 rounded-[48px] border-2 transition-all duration-500 overflow-hidden flex flex-col ${isPopular
                          ? 'border-[#FF3131] shadow-[0_20px_60px_rgba(191,255,0,0.15)] scale-[1.05] z-10'
                          : 'border-white/5 hover:border-white/20'
                          }`}
                      >
                        {isPopular && (
                          <div className="bg-[#FF3131] text-black text-center py-2 font-black uppercase tracking-[0.3em] text-[10px] italic">
                            🏆 A ESCOLHA DOS ATLETAS 🏆
                          </div>
                        )}

                        <div className="p-10 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-8">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isPopular ? 'bg-[#FF3131] text-black shadow-lg shadow-[#FF3131]/20' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                              {getPlanIcon(planName)}
                            </div>
                          </div>

                          <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">{planName}</h3>
                          <p className="text-gray-500 font-bold mb-8 text-sm uppercase tracking-widest">{plan.description}</p>

                          <div className="mb-10">
                            <div className="flex items-baseline space-x-1">
                              <span className={`text-5xl font-black italic tracking-tighter transition-colors ${isPopular ? 'text-[#FF3131]' : 'text-white'}`}>
                                {formatCurrency(planPrice).split(',')[0]}
                              </span>
                              {formatCurrency(planPrice).includes(',') && (
                                <span className="text-xl font-black text-gray-600">
                                  ,{formatCurrency(planPrice).split(',')[1]}
                                </span>
                              )}
                              <span className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">/ CICLO</span>
                            </div>
                          </div>

                          <div className="space-y-4 mb-10 flex-1">
                            {featuresList.map((feature: any, idx: number) => (
                              <div key={idx} className="flex items-center space-x-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isPopular ? 'bg-[#FF3131]' : 'bg-white/10'}`}>
                                  <CheckCircle className={`h-3 w-3 ${isPopular ? 'text-black' : 'text-gray-400'}`} />
                                </div>
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-tight">{typeof feature === 'string' ? feature : String(feature)}</span>
                              </div>
                            ))}
                            {featuresList.length === 0 && (
                              <p className="text-gray-600 text-sm italic">Sem detalhes adicionais</p>
                            )}
                          </div>

                          <button
                            onClick={() => handlePlanSelection(plan.id)}
                            className={`w-full py-5 rounded-3xl font-black italic uppercase tracking-widest text-sm transition-all transform active:scale-95 shadow-xl ${isPopular
                              ? 'bg-[#FF3131] text-black hover:bg-white shadow-[#FF3131]/10'
                              : 'bg-white/5 text-white hover:bg-white hover:text-black border border-white/10'
                              }`}
                          >
                            SELECIONAR PLANO
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Payment Modal Styling handled inside existing logic but let's ensure its theme matches if we were editing it directly. Since it's inline, we'll need to update its JSX. */}

          {/* Benefits Section - Sporty Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Check Total', desc: 'Dados protegidos pela liga de elite.', color: 'text-green-500' },
              { icon: Users, title: 'Rede Global', desc: 'Centenas de hubs de performance.', color: 'text-blue-500' },
              { icon: Smartphone, title: 'Digital First', desc: 'Tudo no app, sem burocracia.', color: 'text-purple-500' },
              { icon: Trophy, title: 'Status Elite', desc: 'Vantagens exclusivas de atleta.', color: 'text-[#FF3131]' }
            ].map((benefit, i) => (
              <div key={i} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[32px] hover:border-white/20 transition-all group">
                <div className={`w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${benefit.color}`}>
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="font-black text-white italic uppercase tracking-tight mb-2">{benefit.title}</h3>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Modal Refactored for Sporty Theme */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-white/10 rounded-[48px] max-w-lg w-full p-10 lg:p-12 shadow-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-[#FF3131] to-blue-600"></div>

              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">CHECKOUT <span className="text-[#FF3131]">ELITE</span></h3>
                <button onClick={() => setShowPaymentModal(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white transition-all">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-10 bg-black/40 border border-white/5 rounded-3xl p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">PLANO ESCOLHIDO</p>
                    <span className="text-xl font-black text-white italic uppercase tracking-tight">
                      {plans.find(p => p.id === selectedPlan)?.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">TOTAL</p>
                    <span className="text-xl font-black text-[#FF3131] italic uppercase tracking-tight">
                      {formatCurrency(plans.find(p => p.id === selectedPlan)?.price || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center py-8">
                <div className="w-20 h-20 bg-[#FF3131]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-10 w-10 text-[#FF3131]" />
                </div>
                {Number(plans.find(p => p.id === selectedPlan)?.price || 0) > 0 ? (
                  <>
                    <h4 className="text-lg font-black text-white uppercase tracking-widest mb-4 italic">CRIPTOGRAFIA DE GRAU MILITAR</h4>
                    <p className="text-gray-500 font-bold mb-8 text-sm">
                      Você será redirecionado para o hub de pagamento seguro. Escolha sua arma:
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-10">
                      <div className="flex flex-col items-center p-4 bg-black rounded-2xl border border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#FF3131] mb-2 font-black italic">PX</div>
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">PIX FAST</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-black rounded-2xl border border-white/5">
                        <CreditCard className="w-8 h-8 text-blue-500 mb-2" />
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">CREDIT</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-black rounded-2xl border border-white/5">
                        <Smartphone className="w-8 h-8 text-purple-500 mb-2" />
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">E-WALLET</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="text-lg font-black text-white uppercase tracking-widest mb-4 italic">PLANO 100% GRATUITO</h4>
                    <p className="text-gray-500 font-bold mb-8 text-sm">
                      Ative agora para começar a explorar os benefícios sem custo inicial.
                    </p>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={handlePayment}
                  disabled={processingPayment}
                  className="w-full bg-[#FF3131] text-black py-5 rounded-2xl font-black italic uppercase tracking-widest text-base hover:bg-white transition-all transform active:scale-95 shadow-2xl shadow-[#FF3131]/20 flex items-center justify-center space-x-3"
                >
                  {processingPayment ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent"></div>
                  ) : (
                    <>
                      <span>ACESSAR PLATAFORMA</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full bg-transparent text-gray-500 py-4 font-black italic uppercase tracking-widest text-xs hover:text-white transition-colors"
                >
                  CANCELAR OPERAÇÃO
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
