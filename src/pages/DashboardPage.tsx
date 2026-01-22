import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  CreditCard,
  QrCode,
  Gift,
  Calendar,
  TrendingUp,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  ExternalLink,
  Zap,
  Activity,
  ArrowRight,
  Trophy,
  Crown
} from 'lucide-react';
import { api } from '../lib/api';
import JsBarcode from 'jsbarcode';
import QRCodeGenerator from '../components/QRCodeGenerator';
import DigitalCard from '../components/DigitalCard';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any | null>(null);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [recentUsage, setRecentUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setLastFetch(Date.now());

      // Fetch subscription from our API
      const subscriptionData = await api.subscriptions.me();

      if (subscriptionData) {
        setSubscription(subscriptionData);
        if (subscriptionData.barcode) {
          generateBarcode(subscriptionData.barcode);
        }
      } else {
        setSubscription(null);
      }

      // For now, benefits and usage from API are empty as we haven't implemented those endpoints yet
      setBenefits([]);
      setRecentUsage([]);

    } catch (error) {
      console.error('Error fetching user data:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const shouldRefetch = useCallback(() => {
    const now = Date.now()
    return now - lastFetch > 60000 // Cache por 1 minuto
  }, [lastFetch])

  useEffect(() => {
    if (user && shouldRefetch()) {
      fetchUserData();
    }
  }, [user, shouldRefetch, fetchUserData]);

  const generateBarcode = (barcodeValue: string) => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, barcodeValue, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        background: '#ffffff',
        lineColor: '#000000',
        margin: 10
      });
      setBarcodeDataUrl(canvas.toDataURL());
    } catch (error) {
      console.error('Error generating barcode:', error);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
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

  const handleCopyLink = async () => {
    if (!subscription?.barcode) return;
    const link = `${window.location.origin}/cartao/${subscription.barcode}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      toast.success('Link de verificação copiado!');
    } catch (err) {
      console.error('Falha ao copiar:', err);
      toast.error('Erro ao copiar link');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    }).toUpperCase();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#BFFF00] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-[#BFFF00] font-black italic uppercase tracking-widest animate-pulse">Carregando Dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#050505] py-12 relative overflow-hidden font-outfit">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#BFFF00] opacity-5 blur-[120px] rounded-full -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600 opacity-5 blur-[120px] rounded-full -ml-32 -mb-32"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center space-x-3 mb-4">
              <span className="bg-[#BFFF00] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest italic animate-pulse">
                Sessão Ativa
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
              BEM-VINDO, <span className="text-[#BFFF00]">{userProfile?.full_name?.split(' ')[0] || 'ATLETA'}</span>!
            </h1>
            <p className="text-gray-500 font-bold mt-4 max-w-2xl uppercase tracking-wide text-sm">
              Sua central de performance e benefícios exclusivos da Liga TrinCard.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Digital Card Hub */}
            <div className="lg:col-span-8">
              {subscription ? (
                <div className="space-y-6">
                  <div className="relative group">
                    <DigitalCard
                      userName={userProfile?.full_name || 'ATLETA'}
                      planName={subscription.plans?.name || 'PLANO'}
                      barcode={subscription.barcode}
                      status={subscription.status}
                      expiryDate={formatDate(subscription.end_date)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:border-[#BFFF00]/50 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group"
                    >
                      <ExternalLink className="h-4 w-4 text-[#BFFF00] group-hover:scale-110 transition-transform" />
                      <span>COPIAR LINK P/ ESTABELECIMENTO</span>
                    </button>

                    <Link
                      to="/perfil"
                      className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:border-blue-500/50 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group"
                    >
                      <Star className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span>EDITAR DADOS</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-dashed border-white/10 rounded-[40px] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <CreditCard className="h-10 w-10 text-gray-600" />
                  </div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">NENHUMA ASSINATURA ATIVA</h3>
                  <p className="text-gray-500 font-bold mb-8 max-w-xs uppercase text-xs tracking-widest">
                    Você ainda não desbloqueou o acesso aos benefícios de elite. Escolha seu nível agora.
                  </p>
                  <button
                    onClick={() => navigate('/assinatura')}
                    className="bg-[#BFFF00] text-black px-8 py-4 rounded-2xl font-black italic uppercase tracking-widest text-sm hover:bg-white transition-all transform active:scale-95 shadow-xl shadow-[#BFFF00]/10"
                  >
                    CONTRATAR PLANO
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-6 hover:border-[#BFFF00]/20 transition-all">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Economia Total</h3>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-white italic tracking-tighter">R$ 450</span>
                  <span className="text-gray-600 font-black italic">,00</span>
                </div>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">Neste ciclo de faturamento</p>
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-6 hover:border-blue-500/20 transition-all">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Gift className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Vantagens Usadas</h3>
                </div>
                <div className="text-3xl font-black text-white italic tracking-tighter">
                  {recentUsage.length}
                </div>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">Últimos 30 dias de atividade</p>
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-6 hover:border-amber-500/20 transition-all">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-amber-500" />
                  </div>
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Nível de Status</h3>
                </div>
                <div className="text-3xl font-black text-white italic tracking-tighter">
                  ELITE
                </div>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">Trincard Global Rank</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Health & Performance Partners */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-[#BFFF00]" />
                  <span>Benefícios Sugeridos</span>
                </h3>
                <button
                  onClick={() => navigate('/parceiros')}
                  className="text-xs font-black text-[#BFFF00] uppercase tracking-widest hover:text-white transition-colors"
                >
                  Ver Tudo
                </button>
              </div>
              <div className="p-8">
                {benefits.length > 0 ? (
                  <div className="space-y-4">
                    {benefits.slice(0, 4).map((benefit: any) => (
                      <div key={benefit.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/20 transition-all group">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-[#BFFF00]">
                            <Star className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-white italic uppercase tracking-tight text-sm">{benefit.title}</h4>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest line-clamp-1">{benefit.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[#BFFF00] font-black italic text-lg">{benefit.discount_percentage}%</span>
                          <span className="block text-[8px] text-gray-600 font-black uppercase tracking-widest">OFF</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">Aguardando disponibilidade da rede...</p>
                  </div>
                )}
              </div>
            </div>

            {/* QR Scanner & Code Hub */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden">
              <div className="p-8 border-b border-white/5">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center space-x-3">
                  <QrCode className="h-5 w-5 text-blue-500" />
                  <span>Acesso Identificado</span>
                </h3>
              </div>
              <div className="p-8 flex flex-col items-center justify-center h-full min-h-[300px]">
                <QRCodeGenerator
                  userProfile={userProfile}
                  subscription={subscription}
                />
                <p className="text-center text-gray-600 font-bold uppercase tracking-widest text-[10px] mt-8 max-w-xs">
                  Escaneie este código para validar seu acesso em estabelecimentos parceiros.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Dock */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => navigate('/parceiros')}
              className="bg-zinc-900 p-6 rounded-[32px] border border-white/5 hover:border-blue-500/30 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-black transition-all">
                <MapPin className="h-6 w-6 text-blue-500 group-hover:text-inherit" />
              </div>
              <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-1">PROCURAR HUB</h3>
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest leading-relaxed">Localize farmácias e academias próximas</p>
            </button>

            <button
              onClick={() => navigate('/assinatura')}
              className="bg-zinc-900 p-6 rounded-[32px] border border-white/5 hover:border-[#BFFF00]/30 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-[#BFFF00]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#BFFF00] group-hover:text-black transition-all">
                <Star className="h-6 w-6 text-[#BFFF00] group-hover:text-inherit" />
              </div>
              <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-1">MÉTRICAS DE ELITE</h3>
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest leading-relaxed">Gerencie seu plano e upgrades</p>
            </button>

            <button className="bg-zinc-900 p-6 rounded-[32px] border border-white/5 hover:border-white/20 transition-all group text-left">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-black transition-all">
                <Clock className="h-6 w-6 text-gray-400 group-hover:text-inherit" />
              </div>
              <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-1">HISTÓRICO</h3>
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest leading-relaxed">Veja seu histórico de performance</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}