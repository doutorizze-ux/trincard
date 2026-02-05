import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  CreditCard,
  Zap,
  Shield,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  Trophy,
  Target,
  Activity,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';

export default function HomePage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await api.plans.list();
      setPlans(data.filter((p: any) => p.is_active));
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Smartphone,
      title: 'CARTÃO DIGITAL',
      description: 'Tenha seu Trincard sempre à mão diretamente no seu celular.',
      color: 'bg-red-500'
    },
    {
      icon: Activity,
      title: 'SAÚDE & BEM-ESTAR',
      description: 'Descontos exclusivos em consultas, exames e farmácias parceiras.',
      color: 'bg-blue-600'
    },
    {
      icon: Shield,
      title: 'SEGURANÇA ELITE',
      description: 'Proteção e benefícios garantidos para você e sua família.',
      color: 'bg-emerald-500'
    },
    {
      icon: Sparkles,
      title: 'REDE EXCLUSIVA',
      description: 'Acesso a parceiros premium em diversos segmentos do mercado.',
      color: 'bg-amber-400'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center bg-[#050505] overflow-hidden">
        {/* Modern Background with Depth */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/40 to-[#050505] z-10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#FF313133_0%,_transparent_70%)] opacity-30"></div>

          {/* Subtle moving grid for tech feel */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]"></div>

          {/* Official Card Image as Background Element (Mobile Optimized) */}
          <div className="absolute right-[-10%] top-[45%] w-[120%] h-[120%] lg:w-[100%] lg:h-[100%] lg:right-[-20%] lg:top-[10%] opacity-20 blur-[100px] bg-[#FF3131]"></div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 mb-8 animate-pulse">
                <Sparkles className="h-4 w-4 text-[#FF3131]" />
                <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Lançamento Oficial</span>
              </div>

              <h1 className="text-5xl lg:text-8xl font-black text-white italic tracking-tighter leading-[0.9] mb-8 uppercase">
                O FUTURO DOS <br />
                <span className="text-[#FF3131] drop-shadow-[0_0_15px_rgba(255,49,49,0.3)]">BENEFÍCIOS</span>
              </h1>

              <p className="text-lg lg:text-2xl text-gray-400 font-medium mb-12 max-w-xl leading-relaxed mx-auto lg:mx-0">
                Mais que um cartão, sua conexão exclusiva com saúde, economia e status. Descontos reais onde você mais precisa.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/cadastro"
                  className="bg-[#FF3131] text-black px-10 py-5 rounded-2xl text-xl font-black italic uppercase tracking-wider hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,49,49,0.4)] flex items-center justify-center space-x-3"
                >
                  <span>ADQUIRIR AGORA</span>
                  <ArrowRight className="h-6 w-6" />
                </Link>
                <Link
                  to="/parceiros"
                  className="bg-white/5 backdrop-blur-md border border-white/10 text-white px-10 py-5 rounded-2xl text-xl font-black italic uppercase tracking-wider hover:bg-white/10 transition-all flex items-center justify-center space-x-3"
                >
                  <span>PARCEIROS</span>
                </Link>
              </div>

              {/* Stats Mini */}
              <div className="mt-16 grid grid-cols-2 sm:grid-cols-3 gap-8 pt-12 border-t border-white/5">
                <div>
                  <div className="text-4xl font-black text-white italic">24/7</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Suporte</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-[#FF3131] italic">500+</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Unidades</div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-4xl font-black text-white italic">PRO</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Status</div>
                </div>
              </div>
            </div>

            <div className="relative order-1 lg:order-2 flex justify-center perspective-1000">
              <div className="relative group cursor-pointer animate-float">
                {/* Official Trincard Image */}
                <div className="relative w-full max-w-[500px] overflow-hidden rounded-[30px] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] transform transition-transform duration-700 group-hover:rotate-y-12">
                  <img
                    src="/trincard-official.jpg"
                    alt="Cartão Oficial Trincard"
                    className="w-full h-auto object-cover"
                  />
                  {/* Subtle glass overlay for premium feel */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
                </div>

                {/* Visual Glow behind card */}
                <div className="absolute -inset-4 bg-[#FF313122] blur-[40px] -z-10 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-32 bg-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-[#050505] transform -skew-y-2 origin-top-left -mt-16"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-sm font-black text-[#FF3131] bg-black inline-block px-4 py-1 skew-x-[-12deg] mb-6 tracking-[0.2em] uppercase">Vantagens Exclusivas</h2>
            <h3 className="text-4xl lg:text-7xl font-black text-black italic tracking-tighter uppercase leading-none">
              EXPERIÊNCIA <span className="text-blue-600">PREMIUM</span> <br />EM CADA DETALHE
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-10 bg-zinc-50 rounded-[40px] border border-zinc-200 hover:border-black transition-all hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2">
                <div className={`${feature.color} w-20 h-20 rounded-3xl flex items-center justify-center mb-8 transform group-hover:rotate-6 transition-transform shadow-lg`}>
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter mb-4 text-black uppercase">{feature.title}</h3>
                <p className="text-zinc-500 font-bold leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-32 bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
            <div className="text-left max-w-2xl">
              <h2 className="text-5xl lg:text-8xl font-black text-white italic tracking-tighter uppercase leading-none mb-6">
                PLANO DE <span className="text-[#FF3131]">STATUS</span>
              </h2>
              <p className="text-xl text-gray-500 font-medium leading-relaxed">
                Escolha o nível de acesso que melhor se adapta à sua rotina. Benefícios reais para uma vida premium.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-16 h-16 border-4 border-[#FF3131] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div key={plan.id} className="relative group perspective-1000">
                  <div className={`h-full bg-zinc-900 rounded-[50px] p-12 border transition-all duration-500 ${plan.features?.exclusive_benefits ? 'border-[#FF3131] ring-1 ring-[#FF3131] scale-105 z-10' : 'border-white/5 hover:border-white/20'}`}>
                    {plan.features?.exclusive_benefits && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#FF3131] text-black px-6 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(255,49,49,0.5)]">
                        RECOMENDADO
                      </div>
                    )}

                    <div className="mb-10">
                      <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">{plan.name}</h3>
                      <p className="text-gray-500 font-bold text-sm min-h-[40px] uppercase tracking-wide">{plan.description}</p>
                    </div>

                    <div className="mb-10 flex items-baseline gap-1">
                      <span className="text-gray-400 font-bold text-lg">R$</span>
                      <span className="text-7xl font-black text-white italic tracking-tighter">
                        {Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-gray-500 font-bold text-lg">/mês</span>
                    </div>

                    <div className="space-y-4 mb-12">
                      {(plan.features?.features || []).map((benefit: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 group/item">
                          <div className="mt-1 p-0.5 rounded-full bg-[#FF3131]/10 text-[#FF3131]">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <span className="text-gray-400 group-hover/item:text-white transition-colors text-sm font-bold uppercase tracking-tight">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      to="/cadastro"
                      className={`w-full py-6 rounded-2xl font-black italic uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${plan.features?.exclusive_benefits
                        ? 'bg-[#FF3131] text-black hover:bg-white shadow-[0_0_20px_rgba(255,49,49,0.2)]'
                        : 'bg-white/5 text-white hover:bg-white hover:text-black border border-white/10'
                        }`}
                    >
                      <span>ATIVAR AGORA</span>
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-40 relative bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 blur-[100px] bg-[#FF3131] rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <Trophy className="h-24 w-24 text-[#FF3131] mx-auto mb-10 animate-glow-pulse rounded-full p-2" />
          <h2 className="text-5xl lg:text-8xl font-black text-white italic tracking-tighter uppercase leading-[0.9] mb-12">
            VOCÊ ESTÁ <br />PRONTO?
          </h2>
          <p className="text-2xl text-gray-400 font-medium mb-16 leading-relaxed">
            Não perca mais tempo. Junte-se aos milhares de clientes que já estão economizando e desfrutando de benefícios exclusivos.
          </p>
          <Link
            to="/cadastro"
            className="group bg-[#FF3131] text-black px-16 py-8 rounded-[30px] text-2xl font-black italic uppercase tracking-wider hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl inline-flex items-center space-x-4"
          >
            <span>ENTRAR PARA O CLUBE</span>
            <ArrowRight className="h-8 w-8 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
