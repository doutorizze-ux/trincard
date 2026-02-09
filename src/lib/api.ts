const API_BASE = import.meta.env.VITE_API_URL || '';
const API_URL = `${API_BASE}/api`;

// Função auxiliar para chamadas API
async function request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro na requisição' }));
        throw new Error(`${error.error || `Erro ${response.status}`}${error.details ? `: ${error.details}` : ''}`);
    }

    return response.json();
}

// API Client
export const api = {
    partners: {
        list: () => request('/partners'),
        get: (id: string) => request(`/partners/${id}`),
        create: (data: any) => request('/partners', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) => request(`/partners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request(`/partners/${id}`, { method: 'DELETE' }),
    },
    plans: {
        list: () => request('/plans'),
        create: (data: any) => request('/plans', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) => request(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request(`/plans/${id}`, { method: 'DELETE' }),
    },
    users: {
        list: () => request('/users'),
        update: (id: string, data: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
        updatePassword: (password: string) => request('/auth/password', { method: 'PUT', body: JSON.stringify({ password }) }),
    },
    subscriptions: {
        list: () => request('/subscriptions'),
        me: () => request('/subscriptions/me'),
        activateFree: (planId: string) => request('/subscriptions/activate-free', {
            method: 'POST',
            body: JSON.stringify({ planId })
        }),
        cancel: (id: string) => request(`/subscriptions/${id}`, { method: 'DELETE' }),
        payments: () => request('/subscriptions/payments'),
    },
    checkout: {
        create: (data: any) => request('/checkout/create', { method: 'POST', body: JSON.stringify(data) }),
    },
    // Helper para formatar URLs de imagens/arquivos vindos do servidor
    getFileUrl: (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        // Se começar com /uploads, garantir que pega a BASE do servidor (sem o /api)
        return `${API_BASE}${path}`;
    }
};
