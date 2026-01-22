import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DigitalCard from '../components/DigitalCard';
import { ShieldCheck, ShieldAlert, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';

export default function PublicCardPage() {
    const { barcode } = useParams<{ barcode: string }>();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCard() {
            if (!barcode) return;
            try {
                setLoading(true);
                // We'll need to add this to lib/api.ts or just fetch directly
                const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/public/card/${barcode}`);
                if (!response.ok) {
                    throw new Error('Certificado não encontrado ou expirado.');
                }
                const result = await response.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchCard();
    }, [barcode]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        }).toUpperCase();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#BFFF00] border-t-transparent"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
                <ShieldAlert className="h-20 w-20 text-red-500 mb-6" />
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">VERIFICAÇÃO FALHOU</h1>
                <p className="text-gray-500 font-bold mb-8 uppercase text-sm tracking-widest">{error || 'Cartão não encontrado'}</p>
                <Link to="/" className="text-[#BFFF00] font-black uppercase italic hover:underline">Voltar para Início</Link>
            </div>
        );
    }

    const isActive = data.status === 'active';

    return (
        <div className="min-h-screen bg-black py-12 px-4 flex flex-col items-center justify-center">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#BFFF00] opacity-5 blur-[120px] rounded-full"></div>

            <div className="relative z-10 w-full max-w-[600px] flex flex-col items-center">
                <div className="mb-12 text-center">
                    <Link to="/" className="inline-flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mb-8 uppercase font-black italic tracking-widest text-xs">
                        <ArrowLeft className="h-4 w-4" />
                        <span>TRINCARD</span>
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase mb-2">
                        CARTÃO <span className="text-[#BFFF00]">VERIFICADO</span>
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Sistema de autenticação oficial Liga TrinCard</p>
                </div>

                <DigitalCard
                    userName={data.user_name}
                    planName={data.plan_name}
                    barcode={data.barcode}
                    status={data.status}
                    expiryDate={formatDate(data.end_date)}
                    isPublic={true}
                />

                <div className="mt-12 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-3xl border ${isActive ? 'bg-lime-500/10 border-lime-500/20 text-lime-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        <div className="flex items-center space-x-4">
                            {isActive ? <ShieldCheck className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
                            <div>
                                <p className="text-[0.6rem] font-black uppercase tracking-widest opacity-60">Status de Validação</p>
                                <p className="text-lg font-black uppercase italic tracking-tighter">{isActive ? 'VALIDADO E ATIVO' : 'ASSINATURA INATIVA'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-zinc-900 border border-white/5 text-gray-400">
                        <div className="flex items-center space-x-4">
                            <Clock className="h-8 w-8" />
                            <div>
                                <p className="text-[0.6rem] font-black uppercase tracking-widest opacity-60">Expiração do Ciclo</p>
                                <p className="text-lg font-black uppercase italic tracking-tighter text-white">{formatDate(data.end_date)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 p-8 bg-white/5 rounded-[40px] border border-white/5 w-full">
                    <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-6 flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-[#BFFF00]" />
                        <span>BENEFÍCIOS GARANTIDOS</span>
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            'Descontos em Academias',
                            'Rede de Farmácias',
                            'Consultas de Saúde',
                            'Suplementação Elite'
                        ].map((item, i) => (
                            <li key={i} className="flex items-center space-x-2 text-xs font-bold text-gray-400">
                                <div className="w-1.5 h-1.5 bg-[#BFFF00] rounded-full"></div>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <footer className="mt-12 text-center text-[0.6rem] font-bold text-gray-600 uppercase tracking-widest">
                    © 2026 TRINCARD • TECNOLOGIA ESPORTIVA DE ELITE
                </footer>
            </div>
        </div>
    );
}
