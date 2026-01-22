import React from 'react';
import { Shield, Zap, Trophy, CreditCard } from 'lucide-react';

interface DigitalCardProps {
    userName: string;
    planName: string;
    barcode: string;
    status: string;
    expiryDate: string;
    isPublic?: boolean;
}

export default function DigitalCard({
    userName,
    planName,
    barcode,
    status,
    expiryDate,
    isPublic = false
}: DigitalCardProps) {
    const isActive = status === 'active';

    return (
        <div className="relative w-full max-w-[500px] aspect-[1.6/1] rounded-[30px] overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-500 font-outfit">
            {/* Deep Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#4b0082] via-[#6a0dad] to-[#ff0000]"></div>

            {/* Subtle Pattern layer */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,#ffffff_1px,transparent_1px)] bg-[size:20px_20px]"></div>

            {/* Content Container */}
            <div className="relative h-full p-8 flex flex-col justify-between text-white">
                {/* Header Section */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <h3 className="text-[1.2rem] font-black uppercase tracking-widest leading-none mb-1">
                            CARTÃO AMIGOS DO <span className="text-[#BFFF00]">TACÃO</span>
                        </h3>
                        <p className="text-[0.7rem] font-bold italic opacity-80 uppercase tracking-tighter">
                            "JOGAMOS POR TODA UMA CIDADE"
                        </p>
                    </div>

                    {/* Crest / Logo */}
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center border-4 border-[#BFFF00] shadow-xl overflow-hidden">
                        <img
                            src="/logo-tac.png"
                            alt="TAC Logo"
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                                e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/pt/2/2e/Trindade_Atl%C3%A9tico_Clube.png';
                            }}
                        />
                    </div>
                </div>

                {/* Chip and Short ID */}
                <div className="flex items-center space-x-4 opacity-90">
                    <div className="w-10 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-inner overflow-hidden">
                        <div className="grid grid-cols-3 gap-0.5 w-full h-full p-1 border border-amber-800">
                            {[...Array(6)].map((_, i) => <div key={i} className="border border-amber-800/30"></div>)}
                        </div>
                    </div>
                    <span className="text-xl font-mono tracking-[0.3em] font-bold">
                        {barcode.slice(-3)}
                    </span>
                </div>

                {/* User Info Section */}
                <div className="flex flex-col">
                    <span className="text-[0.6rem] font-black uppercase tracking-widest opacity-60">Nome</span>
                    <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2 truncate">
                        {userName}
                    </h4>

                    <div className="flex space-x-8">
                        <div className="flex flex-col">
                            <span className="text-[0.6rem] font-black uppercase tracking-widest opacity-60">Válido Até</span>
                            <span className="text-sm font-bold uppercase tracking-widest text-[#BFFF00]">
                                {expiryDate}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[0.6rem] font-black uppercase tracking-widest opacity-60">Status</span>
                            <span className={`text-sm font-black uppercase tracking-widest ${isActive ? 'text-lime-400' : 'text-red-400'}`}>
                                {isActive ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Decorative elements - Ball and Trophy */}
                <div className="absolute bottom-4 right-4 flex items-end space-x-2 pointer-events-none grayscale-[0.2] opacity-80">
                    <div className="w-12 h-12 flex items-center justify-center transform hover:rotate-45 transition-transform duration-1000">
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-white stroke-black stroke-[2px]">
                            <circle cx="50" cy="50" r="45" fill="white" />
                            <path d="M50 5 L35 25 L15 25 L5 50 L15 75 L35 75 L50 95 L65 75 L85 75 L95 50 L85 25 L65 25 Z" fill="none" />
                            <path d="M35 25 L50 35 L65 25" fill="none" />
                            <path d="M15 25 L30 40 L15 50" fill="none" />
                            <path d="M15 75 L30 60 L15 50" fill="none" />
                            <path d="M35 75 L50 65 L65 75" fill="none" />
                            <path d="M85 75 L70 60 L85 50" fill="none" />
                            <path d="M85 25 L70 40 L85 50" fill="none" />
                        </svg>
                    </div>
                    <Trophy className="h-10 w-10 text-[#BFFF00] drop-shadow-lg" />
                </div>

                {/* TRINCARD watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[5rem] font-black italic text-white opacity-[0.03] rotate-[-20deg] pointer-events-none select-none">
                    TRINCARD
                </div>

                {!isPublic && (
                    <div className="absolute top-4 right-4">
                        <div className="flex items-center space-x-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded text-[0.6rem] font-black uppercase tracking-tighter border border-white/10">
                            <Zap className="h-3 w-3 text-[#BFFF00]" />
                            <span>TRINCARD</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
