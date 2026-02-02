import React, { useState, useEffect } from 'react';
import { Building2, Percent, Mail, Phone, FileText, Save, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import FileUpload from './FileUpload';
import { toast } from 'sonner';

interface PartnerFormData {
  company_name: string;
  percentage: number;
  contact_email: string;
  contact_phone: string;
  notes: string;
  contract_url?: string;
  logo_url?: string;
  approval_status: 'pending_documentation' | 'approved' | 'rejected';
  document_status: 'missing' | 'uploaded' | 'verified';
}

interface PartnerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  partner?: any; // Partner object for editing
}

export default function PartnerForm({
  onSuccess,
  onCancel,
  partner
}: PartnerFormProps) {
  const { user } = useAuth();
  const isEditing = !!partner;

  // Inicializa o estado DIRETAMENTE dos props (já que usamos key prop no pai)
  const [formData, setFormData] = useState<PartnerFormData>({
    company_name: partner?.company_name || '',
    percentage: partner?.percentage || 0,
    contact_email: partner?.contact_email || '',
    contact_phone: partner?.contact_phone || '',
    notes: partner?.notes || '',
    contract_url: partner?.contract_url || '',
    logo_url: partner?.logo_url || '',
    approval_status: partner?.approval_status || 'pending_documentation',
    document_status: partner?.document_status || 'missing'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ... (validateForm and other handlers remain same)

  const validateForm = (): boolean => {
    // ... validate logic (copy from file or leave as is if I can skip valid lines?)
    // Actually I need to include validateForm to be safe with replace block or use multi-edit.
    // I will replace from start of function.
    const newErrors: Record<string, string> = {};
    if (!formData.company_name.trim()) newErrors.company_name = 'Nome da empresa é obrigatório';
    if (formData.percentage < 0 || formData.percentage > 100) newErrors.percentage = 'Porcentagem deve estar entre 0 e 100';
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) newErrors.contact_email = 'Email inválido';
    if (formData.contact_phone && !/^[\d\s\(\)\+\-]+$/.test(formData.contact_phone)) newErrors.contact_phone = 'Telefone inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PartnerFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFileUpload = (url: string) => {
    setFormData(prev => ({ ...prev, contract_url: url, document_status: 'uploaded' }));
    toast.success('Contrato enviado com sucesso!');
  };

  const handleFileError = (error: string) => {
    toast.error(`Erro no upload: ${error}`);
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, contract_url: '', document_status: 'missing' }));
    toast.info('Contrato removido');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (isEditing && partner?.id) {
        await api.partners.update(partner.id, dataToSave);
        toast.success('Parceiro atualizado com sucesso!');
      } else {
        await api.partners.create({
          ...dataToSave,
          created_by: user?.id
        });
        toast.success('Parceiro cadastrado com sucesso!');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar parceiro:', error);
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
            {isEditing ? 'Editar Parceiro' : 'Cadastrar Novo Parceiro'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome da Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-2" />
              Nome da Empresa *
            </label>
            {/* Company Name Input */}
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${errors.company_name ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Digite o nome da empresa"
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
            />
            {errors.company_name && (
              <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
            )}
          </div>

          {/* Porcentagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Percent className="h-4 w-4 inline mr-2" />
              Porcentagem de Comissão *
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.percentage}
                onChange={(e) => handleInputChange('percentage', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${errors.percentage ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="0.00"
                disabled={loading}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
            {errors.percentage && (
              <p className="text-red-500 text-sm mt-1">{errors.percentage}</p>
            )}
          </div>

          {/* Email de Contato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-2" />
              Email de Contato
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${errors.contact_email ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="contato@empresa.com"
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
            />
            {errors.contact_email && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
            )}
          </div>

          {/* Telefone de Contato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-2" />
              Telefone de Contato
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${errors.contact_phone ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="(11) 99999-9999"
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
            />
            {errors.contact_phone && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>
            )}
          </div>

          {/* Status de Aprovação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status de Aprovação
            </label>
            <select
              value={formData.approval_status}
              onChange={(e) => handleInputChange('approval_status', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="pending_documentation">Pendente Documentação</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>

          {/* Upload de Logo */}
          <div>
            <FileUpload
              onUploadComplete={(url) => {
                setFormData(prev => ({ ...prev, logo_url: url }));
                toast.success('Logo enviado com sucesso!');
              }}
              onUploadError={(error) => toast.error(`Erro no upload do logo: ${error}`)}
              currentFile={formData.logo_url}
              onRemoveFile={() => {
                setFormData(prev => ({ ...prev, logo_url: '' }));
                toast.info('Logo removido');
              }}
              disabled={loading}
              label="Logo da Empresa"
              description="Faça upload do logo da empresa (JPG, PNG)"
              accept=".jpg,.jpeg,.png,.webp"
            />
          </div>

          {/* Upload de Contrato */}
          <div>
            <FileUpload
              onUploadComplete={handleFileUpload}
              onUploadError={handleFileError}
              currentFile={formData.contract_url}
              onRemoveFile={handleRemoveFile}
              disabled={loading}
              label="Contrato"
              description="Faça upload do contrato do parceiro (opcional)"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="Observações sobre o parceiro..."
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isEditing ? 'Atualizar' : 'Cadastrar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
