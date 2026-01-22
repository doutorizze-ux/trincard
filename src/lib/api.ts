const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
        throw new Error(error.error || `Erro ${response.status}`);
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
    // Adicionar outros resources aqui (users, plans, etc)
};
