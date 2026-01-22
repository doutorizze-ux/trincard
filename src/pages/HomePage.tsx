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
  Activity
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
      icon: CreditCard,
      title: 'CARTÃO DIGITAL',
      description: 'Acesse seus benefícios em farmácias e lojas direto do celular.',
      color: 'bg-lime-400'
    },
    {
      icon: Activity,
      title: 'SAÚDE & PERFORMANCE',
      description: 'Descontos em hospitais, laboratórios e consultas especializadas.',
      color: 'bg-blue-500'
    },
    {
      icon: Shield,
      title: 'PROTEÇÃO TOTAL',
      description: 'Segurança de nível elite para cuidar da sua saúde e performance.',
      color: 'bg-emerald-500'
    },
    {
      icon: Users,
      title: 'ELITE NETWORK',
      description: 'Conecte-se aos melhores centros médicos e esportivos do país.',
      color: 'bg-amber-400'
    }
  ];



  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-[#050505] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent z-10"></div>
          <img
            src="/sporty_hero_background_1766009959647.png"
            alt="Sport Performance"
            className="w-full h-full object-cover opacity-50 transform scale-110 motion-safe:animate-[pulse_10s_infinite_alternate]"
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 mb-8 animate-bounce">
                <Zap className="h-4 w-4 text-[#BFFF00]" />
                <span className="text-[#BFFF00] text-xs font-black uppercase tracking-widest">Performance Máxima Ativada</span>
              </div>
              <h1 className="text-5xl lg:text-8xl font-black text-white italic tracking-tighter leading-none mb-6">
                DOMINE CADA <br />
                <span className="text-[#BFFF00] drop-shadow-[0_0_20px_rgba(191,255,0,0.5)]">MOVIMENTO</span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-400 font-bold mb-10 max-w-xl leading-relaxed">
                O único cartão que une esporte, saúde e economia. Descontos reais em farmácias, hospitais, lojas e academias de elite.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/cadastro"
                  className="bg-[#BFFF00] text-black px-10 py-5 rounded-full text-xl font-black italic uppercase tracking-wider hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(191,255,0,0.3)] flex items-center justify-center space-x-3"
                >
                  <span>COMEÇAR AGORA</span>
                  <ArrowRight className="h-6 w-6" />
                </Link>
                <Link
                  to="/parceiros"
                  className="bg-white/5 backdrop-blur-md border-2 border-white/20 text-white px-10 py-5 rounded-full text-xl font-black italic uppercase tracking-wider hover:bg-white hover:text-black transition-all flex items-center justify-center space-x-3"
                >
                  <Users className="h-6 w-6" />
                  <span>VER REDE</span>
                </Link>
              </div>

              {/* Stats Mini */}
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 pt-12 border-t border-white/10">
                <div>
                  <div className="text-3xl font-black text-white italic">500+</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Unidades</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#BFFF00] italic">10K+</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Atletas</div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-3xl font-black text-white italic">4.9/5</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Rating</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 hidden lg:flex justify-end perspective-1000">
              <div className="relative group cursor-pointer transform hover:rotate-y-12 transition-transform duration-700">
                {/* Visual Card Representation */}
                <div className="w-[450px] h-[280px] bg-gradient-to-br from-zinc-800 to-black rounded-[30px] p-8 relative overflow-hidden border border-white/10 shadow-2xl">
                  {/* Decorative card stripes */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#BFFF00] opacity-5 blur-[80px] rounded-full"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <h3 className="text-white font-black italic text-4xl tracking-tighter leading-none">TRIN<span className="text-[#BFFF00]">CARD</span></h3>
                      <p className="text-[#BFFF00] text-[10px] font-black uppercase tracking-[0.3em] mt-1">Elite Member</p>
                    </div>
                    <div className="w-16 h-12 bg-[#BFFF00] rounded-lg flex items-center justify-center">
                      <Zap className="text-black h-8 w-8" />
                    </div>
                  </div>

                  <div className="mt-16 relative z-10">
                    <div className="text-white font-mono text-2xl tracking-[0.25em] mb-4">
                      4532 1092 8472 0019
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Atleta</span>
                        <span className="text-white font-bold italic tracking-wider">MARCOS OLIVEIRA</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Expira</span>
                        <span className="text-white font-bold italic tracking-wider">12/28</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-[#BFFF00]/10 blur-[50px] -z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Skewed Section */}
      <section className="relative py-32 bg-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-[#050505] transform -skew-y-2 origin-top-left -mt-16"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-sm font-black text-[#BFFF00] bg-black inline-block px-4 py-1 skew-x-[-12deg] mb-6 tracking-[0.2em] uppercase">Vantagens Elite</h2>
            <h3 className="text-4xl lg:text-6xl font-black text-black italic tracking-tighter uppercase leading-none">
              Construído para quem <br />não aceita o <span className="text-blue-600">comum</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 bg-zinc-50 rounded-3xl border border-zinc-200 hover:border-black transition-all hover:shadow-2xl hover:-translate-y-2">
                <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform shadow-lg`}>
                  <feature.icon className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-black italic tracking-tighter mb-4 text-black">{feature.title}</h3>
                <p className="text-zinc-500 font-bold leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section - Dark Sporty */}
      <section className="py-32 bg-[#050505] relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
            <div className="text-left max-w-2xl">
              <h2 className="text-5xl lg:text-7xl font-black text-white italic tracking-tighter uppercase leading-none mb-6">
                ESCOLHA SEU <span className="text-[#BFFF00]">NÍVEL</span>
              </h2>
              <p className="text-xl text-gray-500 font-bold leading-relaxed">
                Cada plano é um degrau na sua evolução. Selecione o que melhor se adapta à sua rotina de performance.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-16 h-16 border-4 border-[#BFFF00] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div key={plan.id} className="relative group perspective-1000">
                  <div className={`h-full bg-zinc-900 rounded-[40px] p-10 border border-white/5 transition-all duration-500 ${plan.features?.exclusive_benefits ? 'ring-4 ring-[#BFFF00] scale-105 z-10' : 'hover:border-white/20'}`}>
                    {plan.features?.exclusive_benefits && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#BFFF00] text-black px-6 py-1.5 rounded-full font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(191,255,0,0.5)]">
                        Mais Popular
                      </div>
                    )}

                    <div className="mb-10">
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">{plan.name}</h3>
                      <p className="text-gray-500 font-bold text-sm min-h-[40px]">{plan.description}</p>
                    </div>

                    <div className="mb-10 flex items-baseline gap-1">
                      <span className="text-gray-400 font-bold text-lg">R$</span>
                      <span className="text-6xl font-black text-white italic tracking-tighter">{Number(plan.price).toFixed(0)}</span>
                      <span className="text-gray-500 font-bold text-lg">/mês</span>
                    </div>

                    <div className="space-y-4 mb-12">
                      {(plan.features?.features || []).map((benefit: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 group/item">
                          <div className="mt-1 p-0.5 rounded-full bg-[#BFFF00]/10 text-[#BFFF00]">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <span className="text-gray-400 group-hover/item:text-white transition-colors text-sm font-bold">{benefit}</span>
                        </div>
                      ))}
                      {(!plan.features?.features || plan.features.features.length === 0) && (
                        <p className="text-gray-600 text-sm">Sem benefícios listados.</p>
                      )}
                    </div>

                    <Link
                      to="/cadastro"
                      className={`w-full py-5 rounded-2xl font-black italic uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${plan.features?.exclusive_benefits
                        ? 'bg-[#BFFF00] text-black hover:bg-white shadow-[0_0_20px_rgba(191,255,0,0.2)]'
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

      {/* CTA Performance */}
      <section className="py-40 relative bg-blue-600 overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <Trophy className="h-20 w-20 text-white mx-auto mb-10 motion-safe:animate-bounce" />
          <h2 className="text-5xl lg:text-8xl font-black text-white italic tracking-tighter uppercase leading-none mb-10">
            VOCÊ ESTÁ <br />PRONTO?
          </h2>
          <p className="text-2xl text-white/80 font-bold mb-12 leading-relaxed">
            Pare de apenas treinar. Comece a performar com o suporte que você merece. Junte-se à elite agora.
          </p>
          <Link
            to="/cadastro"
            className="group bg-white text-black px-16 py-7 rounded-full text-2xl font-black italic uppercase tracking-wider hover:bg-[#BFFF00] transition-all transform hover:scale-105 active:scale-95 shadow-3xl inline-flex items-center space-x-4"
          >
            <span>ENTRAR PARA O TIME</span>
            <ArrowRight className="h-8 w-8 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
