import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, List, Check, X, Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface PlanFeatures {
    max_benefits: number;
    physical_card: boolean;
    priority_support: boolean;
    exclusive_benefits: boolean;
    features: string[];
}

interface PlanFormData {
    name: string;
    price: number;
    description: string;
    is_active: boolean;
    features: PlanFeatures;
}

interface PlanFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    plan?: any; // Plan object for editing
}

export default function PlanForm({
    onSuccess,
    onCancel,
    plan
}: PlanFormProps) {
    const isEditing = !!plan;
    const [formData, setFormData] = useState<PlanFormData>({
        name: plan?.name || '',
        price: plan?.price || 0,
        description: plan?.description || '',
        is_active: plan?.is_active ?? true,
        features: plan?.features || {
            max_benefits: 10,
            physical_card: false,
            priority_support: false,
            exclusive_benefits: false,
            features: []
        }
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [newFeature, setNewFeature] = useState('');

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name || '',
                price: plan.price || 0,
                description: plan.description || '',
                is_active: plan.is_active ?? true,
                features: {
                    max_benefits: plan.features?.max_benefits ?? 10,
                    physical_card: plan.features?.physical_card ?? false,
                    priority_support: plan.features?.priority_support ?? false,
                    exclusive_benefits: plan.features?.exclusive_benefits ?? false,
                    features: plan.features?.features || []
                }
            });
        }
    }, [plan]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nome do plano é obrigatório';
        }

        if (formData.price < 0) {
            newErrors.price = 'O preço não pode ser negativo';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof PlanFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleFeatureToggle = (field: keyof Omit<PlanFeatures, 'features' | 'max_benefits'>) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [field]: !prev.features[field]
            }
        }));
    };

    const handleMaxBenefitsChange = (val: number) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                max_benefits: val
            }
        }));
    };

    const addFeatureItem = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                features: {
                    ...prev.features,
                    features: [...prev.features.features, newFeature.trim()]
                }
            }));
            setNewFeature('');
        }
    };

    const removeFeatureItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                features: prev.features.features.filter((_, i) => i !== index)
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Por favor, corrija os erros no formulário');
            return;
        }

        setLoading(true);

        try {
            if (isEditing && plan?.id) {
                const { error } = await supabase
                    .from('plans')
                    .update(formData)
                    .eq('id', plan.id);

                if (error) throw error;
                toast.success('Plano atualizado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('plans')
                    .insert([formData]);

                if (error) throw error;
                toast.success('Plano criado com sucesso!');
            }

            onSuccess();
        } catch (error: any) {
            console.error('Erro ao salvar plano:', error);
            toast.error(`Erro ao salvar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {isEditing ? 'Editar Plano' : 'Criar Novo Plano'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome do Plano */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FileText className="h-4 w-4 inline mr-2" />
                                Nome do Plano *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="Ex: TrinCard VIP"
                                disabled={loading}
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        {/* Preço */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="h-4 w-4 inline mr-2" />
                                Preço *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="0.00"
                                disabled={loading}
                            />
                            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            placeholder="Descreva o plano..."
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Recursos (Flags)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.features.physical_card}
                                    onChange={() => handleFeatureToggle('physical_card')}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">Cartão Físico</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.features.priority_support}
                                    onChange={() => handleFeatureToggle('priority_support')}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">Suporte Prioritário</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.features.exclusive_benefits}
                                    onChange={() => handleFeatureToggle('exclusive_benefits')}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">Benefícios Exclusivos</span>
                            </label>
                            <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-700">Limite de Benefícios:</span>
                                <input
                                    type="number"
                                    value={formData.features.max_benefits}
                                    onChange={(e) => handleMaxBenefitsChange(parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-black"
                                    title="-1 para ilimitado"
                                />
                                <span className="text-xs text-gray-500">(-1 = ilimitado)</span>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Features */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Lista de Benefícios Visíveis</h3>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeatureItem())}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                placeholder="Ex: Acesso a todas as academias"
                            />
                            <button
                                type="button"
                                onClick={addFeatureItem}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {formData.features.features.map((item, index) => (
                                <li key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md group">
                                    <span className="text-sm text-gray-700">{item}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFeatureItem(index)}
                                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Status Ativo */}
                    <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => handleInputChange('is_active', e.target.checked)}
                            className="h-5 w-5 text-blue-600 rounded"
                        />
                        <span className="font-medium text-gray-900">Plano Ativo (Visível para usuários)</span>
                    </label>

                    {/* Botões */}
                    <div className="flex justify-end space-x-3 pt-6 border-t font-outfit">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 shadow-lg hover:shadow-blue-500/20 transition-all"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            <span>{isEditing ? 'Atualizar Plano' : 'Criar Plano'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
