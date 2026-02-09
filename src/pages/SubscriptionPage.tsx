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
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checkoutStep, setCheckoutStep] = useState<'options' | 'pix' | 'credit_card'>('options');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [cardData, setCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState<any[]>([]);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

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

  const fetchPayments = async () => {
    if (!user) return;
    try {
      setLoadingInvoices(true);
      const data = await api.subscriptions.payments();
      setPayments(data || []);
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleRenewNow = () => {
    // Scroll suave até a seção de planos
    const plansSection = document.getElementById('plans-selection');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Se a seção não estiver visível (porque tem assinatura), podemos forçar a exibição
      // Mas para manter simples, vamos apenas avisar ou mostrar os planos se o user quiser trocar
      toast.info('Para mudar de plano, escolha uma das opções abaixo.');
    }
  };

  const handleInvoices = () => {
    fetchPayments();
    setShowInvoicesModal(true);
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [user]); // Run when auth user is available

  // Polling para verificar se o pagamento foi confirmado
  useEffect(() => {
    let interval: any;
    if (showPaymentModal && checkoutStep === 'pix') {
      interval = setInterval(async () => {
        try {
          const subscriptionData = await api.subscriptions.me();
          if (subscriptionData && subscriptionData.status === 'active') {
            setCurrentSubscription(subscriptionData);
            setShowPaymentModal(false);
            setCheckoutStep('options');
            setPaymentData(null);
            toast.success('PAGAMENTO CONFIRMADO! Bem-vindo à elite.');
          }
        } catch (e) {
          console.error('Erro no polling de pagamento:', e);
        }
      }, 4000); // Verifica a cada 4 segundos
    }
    return () => clearInterval(interval);
  }, [showPaymentModal, checkoutStep]);

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

  const handleSubscription = async (formData: any = {}) => {
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

      const data = await api.checkout.create({
        planId: plan.id,
        userId: userProfile?.id,
        title: `Trincard - Plano ${plan.name}`,
        price: plan.price,
        userEmail: userProfile?.email || '',
        name: userProfile?.full_name || 'Cliente Trincard',
        cpfCnpj: userProfile?.cpf || '',
        billingType: paymentMethod === 'pix' ? 'PIX' : 'CREDIT_CARD',
        cardData: paymentMethod === 'credit_card' ? cardData : undefined,
        frontendUrl: window.location.origin
      });

      if (data && data.pix) {
        setPaymentData(data);
        setCheckoutStep('pix');
        toast.success('Pix gerado com sucesso!');
      } else if (data && paymentMethod === 'credit_card') {
        toast.success('Assinatura processada! Seu plano será ativado em instantes.');
        setShowPaymentModal(false);
        setCheckoutStep('options');
        fetchData();
      } else if (data && data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('Erro ao obter dados de pagamento');
      }

    } catch (error: any) {
      console.error('Erro ao processar assinatura:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
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
      await api.subscriptions.cancel(currentSubscription.id);
      toast.success('Assinatura cancelada com sucesso');
      setCurrentSubscription(null);
    } catch (error: any) {
      toast.error(`Erro ao cancelar: ${error.message}`);
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
                    <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{formatDate(currentSubscription.due_date)}</p>
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
                <button
                  onClick={handleRenewNow}
                  className="flex items-center space-x-3 bg-white text-black px-8 py-4 rounded-2xl font-black italic uppercase tracking-widest text-sm hover:bg-[#FF3131] transition-all transform active:scale-95 shadow-xl"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>RENOVAR AGORA</span>
                </button>
                <button
                  onClick={handleInvoices}
                  className="flex items-center space-x-3 bg-zinc-800 text-white px-8 py-4 rounded-2xl font-black italic uppercase tracking-widest text-sm hover:bg-zinc-700 transition-all transform active:scale-95"
                >
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
          {(true) && ( // Sempre mostra os planos se quiser renovar ou trocar
            <div id="plans-selection" className="mb-20">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">EVOLUA SEU STATUS</h2>
                <div className="w-24 h-1 bg-[#FF3131] mx-auto rounded-full mb-10"></div>

                {/* Billing Cycle Toggle */}
                <div className="flex items-center justify-center space-x-6">
                  <span className={`text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-600'}`}>Mensal</span>
                  <button
                    onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                    className="w-16 h-8 bg-zinc-800 rounded-full relative p-1 transition-all border border-white/5"
                  >
                    <div className={`w-6 h-6 bg-[#FF3131] rounded-full transition-all duration-300 transform ${billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'}`}></div>
                  </button>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-600'}`}>Anual</span>
                    <span className="bg-[#BFFF00] text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic">Economize 20%</span>
                  </div>
                </div>
              </div>

              {loadingPlans ? (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF3131] border-t-transparent mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {plans
                    .filter(p => {
                      const name = p.name.toLowerCase();
                      if (billingCycle === 'yearly') return name.includes('anual');
                      return !name.includes('anual') && !name.includes('semestral') && !name.includes('trimestral');
                    })
                    .map((plan) => {
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
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-white/10 rounded-[48px] max-w-lg w-full p-10 lg:p-12 shadow-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-[#FF3131] to-blue-600"></div>

              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                  {checkoutStep === 'pix' ? 'PAGAMENTO PIX' : 'CHECKOUT ELITE'}
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setCheckoutStep('options');
                    setPaymentData(null);
                  }}
                  className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white transition-all"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {checkoutStep === 'options' && (
                <>
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
                          {formatCurrency(Number(plans.find(p => p.id === selectedPlan)?.price || 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-[#FF3131]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Shield className="h-10 w-10 text-[#FF3131]" />
                    </div>
                    <h4 className="text-lg font-black text-white uppercase tracking-widest mb-4 italic">PROTEÇÃO DE ATLETA</h4>
                    <p className="text-gray-500 font-bold text-sm">Escolha sua forma de ativação imediata:</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mb-10">
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${paymentMethod === 'pix' ? 'border-[#FF3131] bg-[#FF3131]/5' : 'border-white/5 bg-black hover:border-white/10'}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#FF3131] font-black italic">PX</div>
                        <div className="text-left">
                          <p className="text-sm font-black text-white uppercase">PIX INSTANTÂNEO</p>
                          <p className="text-[10px] font-bold text-gray-600 uppercase">Liberação na hora</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'pix' ? 'border-[#FF3131]' : 'border-gray-800'}`}>
                        {paymentMethod === 'pix' && <div className="w-3 h-3 bg-[#FF3131] rounded-full"></div>}
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${paymentMethod === 'credit_card' ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-black hover:border-white/10'}`}
                    >
                      <div className="flex items-center space-x-4">
                        <CreditCard className="w-10 h-10 text-blue-500" />
                        <div className="text-left">
                          <p className="text-sm font-black text-white uppercase">CARTÃO DE CRÉDITO</p>
                          <p className="text-[10px] font-bold text-gray-600 uppercase">Até 12x s/ juros</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'credit_card' ? 'border-blue-500' : 'border-gray-800'}`}>
                        {paymentMethod === 'credit_card' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                      </div>
                    </button>
                  </div>

                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-4 mb-10 animate-in slide-in-from-top-4 duration-300">
                      <div>
                        <input
                          type="text"
                          placeholder="NOME IGUAL NO CARTÃO"
                          value={cardData.holderName}
                          onChange={(e) => setCardData({ ...cardData, holderName: e.target.value.toUpperCase() })}
                          className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-black text-white placeholder:text-gray-700 focus:border-blue-500 outline-none transition-all uppercase tracking-widest"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="NÚMERO DO CARTÃO"
                          value={cardData.number}
                          onChange={(e) => setCardData({ ...cardData, number: e.target.value.replace(/\D/g, '') })}
                          className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-black text-white placeholder:text-gray-700 focus:border-blue-500 outline-none transition-all"
                          maxLength={16}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="MÊS (MM)"
                          value={cardData.expiryMonth}
                          onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value.replace(/\D/g, '') })}
                          className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-black text-white placeholder:text-gray-700 focus:border-blue-500 outline-none transition-all"
                          maxLength={2}
                        />
                        <input
                          type="text"
                          placeholder="ANO (AAAA)"
                          value={cardData.expiryYear}
                          onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value.replace(/\D/g, '') })}
                          className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-black text-white placeholder:text-gray-700 focus:border-blue-500 outline-none transition-all"
                          maxLength={4}
                        />
                        <input
                          type="text"
                          placeholder="CVV"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                          className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-black text-white placeholder:text-gray-700 focus:border-blue-500 outline-none transition-all"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleSubscription()}
                    disabled={processingPayment}
                    className="w-full bg-[#FF3131] text-black py-6 rounded-2xl font-black italic uppercase tracking-widest text-base hover:bg-white transition-all transform active:scale-95 shadow-2xl shadow-[#FF3131]/20 flex items-center justify-center space-x-3"
                  >
                    {processingPayment ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent"></div>
                    ) : (
                      <>
                        <span>CONFIRMAR E GERAR</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </>
              )}

              {checkoutStep === 'pix' && paymentData?.pix && (
                <div className="text-center">
                  <div className="bg-white p-6 rounded-[40px] inline-block mb-8 shadow-2xl">
                    <img
                      src={`data:image/png;base64,${paymentData.pix.qrCode}`}
                      alt="QR Code Pix"
                      className="w-48 h-48"
                    />
                  </div>

                  <div className="mb-8">
                    <h4 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">QR CODE GERADO</h4>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Aponte a câmera do seu banco e pague agora</p>
                  </div>

                  <div className="bg-black border border-white/5 rounded-3xl p-6 mb-10">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">PIX COPIA E COLA</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 overflow-hidden">
                        <p className="text-white font-mono text-[10px] truncate">{paymentData.pix.copyAndPaste}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(paymentData.pix.copyAndPaste);
                          toast.success('Código PIX copiado!');
                        }}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                      >
                        <RefreshCw className="h-4 w-4 text-[#FF3131]" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#BFFF00]/10 border border-[#BFFF00]/20 rounded-2xl p-4 mb-10 flex items-center space-x-3">
                    <div className="animate-pulse">
                      <RefreshCw className="h-5 w-5 text-[#BFFF00]" />
                    </div>
                    <p className="text-[10px] font-black text-[#BFFF00] uppercase tracking-widest text-left leading-tight">
                      Aguardando confirmação de pagamento...<br />Seu plano será ativado automaticamente.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setCheckoutStep('options');
                      setPaymentData(null);
                      fetchData();
                    }}
                    className="w-full bg-white/5 text-white py-5 rounded-2xl font-black italic uppercase tracking-widest text-sm hover:bg-white/10 transition-all"
                  >
                    PAGUEI, VOLTAR AO PAINEL
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Invoices/Faturas */}
        {showInvoicesModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-white/10 rounded-[48px] max-w-2xl w-full p-10 lg:p-12 shadow-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-[#FF3131] to-blue-600"></div>

              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">MINHAS FATURAS</h3>
                <button
                  onClick={() => setShowInvoicesModal(false)}
                  className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white transition-all"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {loadingInvoices ? (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF3131] border-t-transparent mx-auto"></div>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-20 opacity-40">
                  <Download className="h-16 w-16 mx-auto mb-6 text-gray-600" />
                  <p className="font-black italic uppercase tracking-widest text-sm">Nenhuma fatura encontrada ainda</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  {payments.map((p: any) => (
                    <div key={p.id} className="bg-black/40 border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-white/10 transition-all">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#FF3131]">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">{new Date(p.paid_at || p.created_at).toLocaleDateString('pt-BR')}</p>
                          <h4 className="font-black text-white italic uppercase tracking-tight">{p.plan_name}</h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-white italic tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}</p>
                        <span className="text-[10px] font-black text-[#BFFF00] uppercase tracking-widest">{p.payment_method === 'pix' ? 'PIX' : 'CARTÃO'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowInvoicesModal(false)}
                className="w-full mt-10 bg-white/5 text-white py-5 rounded-2xl font-black italic uppercase tracking-widest text-sm hover:bg-white/10 transition-all"
              >
                VOLTAR
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
