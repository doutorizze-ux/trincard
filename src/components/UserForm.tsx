import React, { useState } from 'react';
import { User, Mail, Shield, Save, X, Phone, CreditCard } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface UserFormData {
    full_name: string;
    role: string;
    is_active: boolean;
    is_admin: boolean;
    card_type: 'digital' | 'physical';
}

interface UserFormProps {
    user: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
    const [formData, setFormData] = useState<UserFormData>({
        full_name: user?.full_name || '',
        role: user?.role || 'user',
        is_active: user?.is_active ?? true,
        is_admin: user?.is_admin ?? false,
        card_type: user?.card_type || 'digital',
    });

    const [loading, setLoading] = useState(false);

    const handleInputChange = (field: keyof UserFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.users.update(user.id, formData);
            toast.success('Usuário atualizado com sucesso!');
            onSuccess();
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);
            toast.error(`Erro ao salvar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Editar Usuário</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <User className="h-4 w-4 inline mr-2" />
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Shield className="h-4 w-4 inline mr-2" />
                            Tipo de Acesso (Role)
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => handleInputChange('role', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        >
                            <option value="user">Usuário Comum</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <CreditCard className="h-4 w-4 inline mr-2" />
                            Tipo de Cartão
                        </label>
                        <select
                            value={formData.card_type}
                            onChange={(e) => handleInputChange('card_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        >
                            <option value="digital">Digital</option>
                            <option value="physical">Físico</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-4 py-2">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                            />
                            Ativo
                        </label>
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={formData.is_admin}
                                onChange={(e) => handleInputChange('is_admin', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                            />
                            Privilégios Admin
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                        >
                            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save className="h-4 w-4" />}
                            <span>Salvar Alterações</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
