import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import PartnerForm from '../components/PartnerForm';
import PlanForm from '../components/PlanForm';
import UserForm from '../components/UserForm';
import { SkeletonTable, SkeletonCard } from '../components/Skeleton';
import {
  Users,
  Building,
  CreditCard,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { api } from '../lib/api';
import { User as AppUser, Partner, Subscription, Plan } from '../lib/supabase';
import { toast } from 'sonner';
import { PartnerCard, UserCard, SubscriptionCard, StatsCard } from '../components/MemoizedComponents';

type TabType = 'overview' | 'users' | 'partners' | 'subscriptions' | 'plans' | 'finance';

export default function AdminPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingPartnerId, setDeletingPartnerId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingPartners: 0,
    monthlyRevenue: 0
  });
  const [financialData, setFinancialData] = useState<any>(null);

  // Memoized stats calculation
  const memoizedStats = useMemo(() => ({
    totalUsers: users.length,
    activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
    pendingPartners: partners.filter(p => p.approval_status === 'pending_documentation').length,
    monthlyRevenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + Number(s.plans?.price || 0), 0)
  }), [users.length, subscriptions, partners])

  const shouldRefetch = useCallback(() => {
    const now = Date.now();
    return now - lastFetch > 60000; // Cache por 60 segundos para admin
  }, [lastFetch]);

  useEffect(() => {
    if (shouldRefetch()) {
      fetchData();
    }
  }, [shouldRefetch]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLastFetch(Date.now());

      // Fetch all data in parallel
      const [usersData, partnersData, subscriptionsData, plansData, financialSummaryData] = await Promise.all([
        api.users.list().catch(() => []),
        api.partners.list().catch(() => []),
        api.subscriptions.list().catch(() => []),
        api.plans.list().catch(() => []),
        (api as any).admin.financialSummary().catch(() => null)
      ]);

      setUsers(usersData);
      setPartners(partnersData);
      setSubscriptions(subscriptionsData);
      setPlans(plansData);
      setFinancialData(financialSummaryData);

      // Calculate stats or use from backend
      const activeSubscriptions = subscriptionsData.filter((s: Subscription) => s.status === 'active').length;
      const pendingPartners = partnersData.filter((p: Partner) => p.approval_status === 'pending_documentation').length;

      setStats({
        totalUsers: usersData.length,
        activeSubscriptions,
        pendingPartners,
        monthlyRevenue: financialSummaryData?.summary?.monthlyRevenue || 0
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Erro ao carregar dados administrativos');
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePartnerStatusChange = useCallback(async (partnerId: string, newStatus: string) => {
    try {
      await api.partners.update(partnerId, {
        approval_status: newStatus,
        approval_date: newStatus === 'approved' ? new Date().toISOString() : null
      });

      toast.success('Status do parceiro atualizado com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status do parceiro');
    }
  }, [fetchData]);

  const handlePlanStatusChange = useCallback(async (planId: string, isActive: boolean) => {
    try {
      await api.plans.update(planId, { is_active: isActive });

      toast.success('Status do plano atualizado com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status do plano');
    }
  }, [fetchData]);

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('ATENÇÃO: Isso excluirá o usuário permanentemente, incluindo assinaturas e históricos. Deseja continuar?')) {
      return;
    }

    setDeletingUserId(userId);
    try {
      await api.users.delete(userId);
      toast.success('Usuário removido com sucesso');
      fetchData();
    } catch (error: any) {
      toast.error(`Erro ao remover usuário: ${error.message}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleUserFormSuccess = () => {
    setShowUserForm(false);
    setEditingUser(null);
    fetchData();
  };

  const handleDeleteSubscription = async (id: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a assinatura de ${userName}? Isso também removerá todos os pagamentos vinculados a ela.`)) {
      return;
    }

    try {
      await (api as any).admin.deleteSubscription(id);
      toast.success('Assinatura removida com sucesso');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao remover assinatura');
    }
  };

  const handleDeletePayment = async (id: string, amount: number) => {
    if (!confirm(`Deseja excluir este registro de pagamento de ${formatCurrency(amount)}?`)) {
      return;
    }

    try {
      await (api as any).admin.deletePayment(id);
      toast.success('Pagamento removido com sucesso');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao remover pagamento');
    }
  };

  const handleEditPartner = (partner: Partner) => {
    console.log('Editing partner:', partner);
    setEditingPartner(partner);
    setShowPartnerForm(true);
  };

  const handleDeletePartner = useCallback(async (partnerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este parceiro?')) {
      return;
    }

    setDeletingPartnerId(partnerId);

    try {
      await api.partners.delete(partnerId);

      toast.success('Parceiro excluído com sucesso');
      fetchData();
    } catch (error: any) {
      toast.error(`Erro ao excluir parceiro: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setDeletingPartnerId(null);
    }
  }, [fetchData]);

  const handleFormSuccess = () => {
    setShowPartnerForm(false);
    setEditingPartner(null);
    fetchData();
  };

  const handleFormCancel = () => {
    setShowPartnerForm(false);
    setEditingPartner(null);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setShowPlanForm(true);
  };

  const handlePlanFormSuccess = () => {
    setShowPlanForm(false);
    setEditingPlan(null);
    fetchData();
  };

  const handlePlanFormCancel = () => {
    setShowPlanForm(false);
    setEditingPlan(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pending_documentation':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      case 'pending_documentation':
        return 'Pendente Documentação';
      case 'rejected':
        return 'Rejeitado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || partner.approval_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!userProfile?.is_admin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Painel Administrativo
              </h1>
              <p className="text-gray-600">
                Gerencie usuários, parceiros e assinaturas do
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6">
                <SkeletonTable rows={10} cols={5} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Painel Administrativo
            </h1>
            <p className="text-gray-600">
              Gerencie usuários, parceiros e assinaturas do
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total de Usuários"
              value={memoizedStats.totalUsers}
              description="usuários registrados"
              icon={Users}
              bgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatsCard
              title="Assinaturas Ativas"
              value={memoizedStats.activeSubscriptions}
              description="assinaturas ativas"
              icon={CreditCard}
              bgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <StatsCard
              title="Parceiros Pendentes"
              value={memoizedStats.pendingPartners}
              description="aguardando aprovação"
              icon={Building}
              bgColor="bg-yellow-100"
              iconColor="text-yellow-600"
            />
            <StatsCard
              title="Receita Mensal"
              value={formatCurrency(memoizedStats.monthlyRevenue)}
              description="receita recorrente"
              icon={DollarSign}
              bgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
                  { id: 'users', label: 'Usuários', icon: Users },
                  { id: 'partners', label: 'Parceiros', icon: Building },
                  { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard },
                  { id: 'plans', label: 'Planos', icon: FileText },
                  { id: 'finance', label: 'Financeiro', icon: DollarSign }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Search and Filters */}
              {activeTab !== 'overview' && (
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  {activeTab === 'partners' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                        >
                          <option value="all">Todos os Status</option>
                          <option value="pending_documentation">Pendente Documentação</option>
                          <option value="approved">Aprovado</option>
                          <option value="rejected">Rejeitado</option>
                        </select>
                      </div>

                      <button
                        onClick={() => setShowPartnerForm(true)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Novo Parceiro</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'plans' && (
                    <button
                      onClick={() => setShowPlanForm(true)}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Novo Plano</span>
                    </button>
                  )}

                  <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    <Download className="h-4 w-4" />
                    <span>Exportar</span>
                  </button>
                </div>
              )}

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Users */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuários Recentes</h3>
                      <div className="space-y-3">
                        {users.slice(0, 5).map((user) => (
                          <div key={user.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{user.full_name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(user.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pending Partners */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Parceiros Pendentes</h3>
                      <div className="space-y-3">
                        {partners.filter(p => (p.approval_status as any) === 'pending_documentation').slice(0, 5).map((partner) => (
                          <div key={partner.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                              {partner.logo_url ? (
                                <img
                                  src={api.getFileUrl(partner.logo_url)}
                                  className="w-full h-full object-cover"
                                  alt={partner.company_name}
                                />
                              ) : (
                                <Building className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{partner.company_name}</p>
                              <p className="text-sm text-gray-600">{partner.contact_email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500">{partner.percentage}%</span>
                                {partner.document_status === 'missing' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Falta documento
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handlePartnerStatusChange(partner.id, 'approved')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handlePartnerStatusChange(partner.id, 'rejected')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Telefone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo de Cartão
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Cadastro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="capitalize text-sm text-gray-900">{user.card_type}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Editar usuário"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={deletingUserId === user.id}
                                className={`${deletingUserId === user.id ? 'text-gray-400' : 'text-red-600 hover:text-red-700'}`}
                                title="Excluir usuário"
                              >
                                {deletingUserId === user.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'partners' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Porcentagem
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contrato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Cadastro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPartners.map((partner) => (
                        <tr key={partner.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                                {partner.logo_url ? (
                                  <img
                                    src={api.getFileUrl(partner.logo_url)}
                                    className="w-full h-full object-cover"
                                    alt={partner.company_name}
                                  />
                                ) : (
                                  <Building className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{partner.company_name}</div>
                                <div className="text-sm text-gray-500">{partner.contact_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {partner.percentage}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {partner.contract_url ? (
                                <a
                                  href={api.getFileUrl(partner.contract_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 hover:bg-green-200"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Ver contrato
                                </a>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {partner.document_status === 'missing' ? 'Falta documento' : 'Sem contrato'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(partner.approval_status)
                              }`}>
                              {getStatusText(partner.approval_status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(partner.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditPartner(partner)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Editar parceiro"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePartner(partner.id)}
                                disabled={deletingPartnerId === partner.id}
                                className={`${deletingPartnerId === partner.id
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-700'
                                  }`}
                                title={deletingPartnerId === partner.id ? 'Excluindo...' : 'Excluir parceiro'}
                              >
                                {deletingPartnerId === partner.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                              {partner.approval_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handlePartnerStatusChange(partner.id, 'approved')}
                                    className="text-green-600 hover:text-green-700"
                                    title="Aprovar parceiro"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handlePartnerStatusChange(partner.id, 'rejected')}
                                    className="text-red-600 hover:text-red-700"
                                    title="Rejeitar parceiro"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'subscriptions' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plano
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vencimento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSubscriptions.map((subscription) => (
                        <tr key={subscription.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{subscription.users?.full_name}</div>
                              <div className="text-sm text-gray-500">{subscription.users?.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subscription.plans?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)
                              }`}>
                              {getStatusText(subscription.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(subscription.plans?.price || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(subscription.end_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-700">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-700">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubscription(subscription.id, subscription.users?.full_name || 'Usuário')}
                                className="text-red-500 hover:text-red-700"
                                title="Excluir assinatura permanentemente"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'plans' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preço
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plans.map((plan) => (
                        <tr key={plan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(plan.price)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {plan.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {plan.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleEditPlan(plan)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Editar plano"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handlePlanStatusChange(plan.id, !plan.is_active)}
                                className={`text-${plan.is_active ? 'red' : 'green'}-600 hover:text-${plan.is_active ? 'red' : 'green'}-700`}
                              >
                                {plan.is_active ? 'Desativar' : 'Ativar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'finance' && (
                <div className="space-y-8">
                  {/* Financial Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8">
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-2">RECEITA TOTAL ACUMULADA</p>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-8 w-8 text-green-500" />
                        <h3 className="text-4xl font-black text-white italic tracking-tighter">
                          {formatCurrency(financialData?.summary?.totalRevenue || 0)}
                        </h3>
                      </div>
                    </div>
                    <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8">
                      <p className="text-[#BFFF00] font-black uppercase tracking-widest text-xs mb-2">RECEITA ESTE MÊS</p>
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-8 w-8 text-[#BFFF00]" />
                        <h3 className="text-4xl font-black text-white italic tracking-tighter">
                          {formatCurrency(financialData?.summary?.monthlyRevenue || 0)}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue by Plan */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tight mb-6 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-600" />
                        Receita por Plano
                      </h3>
                      <div className="space-y-4">
                        {financialData?.planRevenue?.map((pr: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="font-bold text-gray-700">{pr.plan_name}</span>
                            <div className="text-right">
                              <p className="font-black text-gray-900">{formatCurrency(pr.total)}</p>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">{pr.count} vendas</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Revenue by Method */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tight mb-6 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-[#FF3131]" />
                        Métodos de Pagamento
                      </h3>
                      <div className="space-y-4">
                        {financialData?.methodRevenue?.map((mr: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="font-bold text-gray-700 uppercase">{mr.payment_method === 'pix' ? 'PIX' : 'CARTÃO'}</span>
                            <div className="text-right">
                              <p className="font-black text-gray-900">{formatCurrency(mr.total)}</p>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">{mr.count} transações</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions Table */}
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Últimas Transações</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plano</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {financialData?.recentTransactions?.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(tx.paid_at || tx.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                {tx.user_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 uppercase font-bold">
                                {tx.plan_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">
                                {formatCurrency(tx.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                  {tx.status === 'completed' ? 'CONCLUÍDO' : 'PENDENTE'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleDeletePayment(tx.id, tx.amount)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Excluir lançamento"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Partner Form Modal */}
      {showPartnerForm && (
        <>
          {console.log('Rendering PartnerForm with partner:', editingPartner)}
          <PartnerForm
            key={editingPartner?.id || 'new'}
            partner={editingPartner}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </>
      )}

      {/* Plan Form Modal */}
      {showPlanForm && (
        <PlanForm
          plan={editingPlan}
          onSuccess={handlePlanFormSuccess}
          onCancel={handlePlanFormCancel}
        />
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onSuccess={handleUserFormSuccess}
          onCancel={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
        />
      )}
    </Layout>
  );
}
