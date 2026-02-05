import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Auto reload on chunk load errors (build drift)
        const errorMessage = error.toString().toLowerCase();
        if (errorMessage.includes('failed to fetch dynamically imported module') ||
            errorMessage.includes('chunkloaderror')) {
            console.warn('Chunk load error detected! Reloading page to fetch latest version...');
            window.location.reload();
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-zinc-900 border border-red-500/20 rounded-3xl p-8">
                        <h2 className="text-2xl font-black text-red-500 italic uppercase mb-4">Erro de Renderização</h2>
                        <p className="text-gray-400 mb-6">Ocorreu um erro inesperado ao carregar esta página.</p>
                        <div className="bg-black p-4 rounded-xl border border-white/5 overflow-auto max-h-48 mb-6">
                            <code className="text-xs text-red-400 font-mono">
                                {this.state.error?.toString()}
                            </code>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-[#FF3131] text-black py-4 rounded-xl font-black italic uppercase tracking-widest hover:bg-white transition-all"
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
