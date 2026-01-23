import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Edit3,
  Save,
  X,
  Camera,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Settings,
  Activity,
  Zap,
  CheckCircle,
  Smartphone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type TabType = 'profile' | 'security' | 'notifications' | 'admin' | 'danger';

export default function ProfilePage() {
  const { userProfile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const isAdmin = userProfile?.is_admin || false;
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    cpf: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    card_type: 'digital' as 'digital' | 'physical'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    email_marketing: true,
    email_benefits: true,
    push_notifications: true,
    sms_notifications: false
  });

  const getAddressField = (data: any, field: string) => {
    if (!data) return '';
    if (typeof data === 'string') return field === 'street' ? data : '';
    if (typeof data === 'object') {
      const val = data[field];
      if (typeof val === 'string') return val;
      if (typeof val === 'number') return String(val);
      return '';
    }
    return '';
  };

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || '',
        cpf: userProfile.cpf || '',
        address: getAddressField(userProfile.address, 'street'),
        city: getAddressField(userProfile.address, 'city'),
        state: getAddressField(userProfile.address, 'state'),
        zip_code: getAddressField(userProfile.address, 'zip_code'),
        card_type: (userProfile.card_type as 'digital' | 'physical') || 'digital'
      });
    }
  }, [userProfile]);

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const updateData = {
        full_name: profileData.full_name,
        phone: profileData.phone,
        cpf: profileData.cpf,
        address: {
          street: profileData.address,
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zip_code
        },
        card_type: profileData.card_type
      };

      const { error } = await updateProfile(updateData);

      if (error) throw error;

      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Senha alterada com sucesso!');
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A foto deve ter no máximo 2MB');
      return;
    }

    try {
      setLoading(true);
      // Para este MVP, vamos converter para Base64 para demonstração rápida
      // Em produção, isso deve ir para o Supabase Storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const { error } = await updateProfile({ profile_photo_url: base64String });

        if (error) throw error;

        toast.success('Foto de perfil atualizada!');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      toast.error('Funcionalidade em desenvolvimento');
    } catch (error) {
      toast.error('Erro ao excluir conta');
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  const formatPhone = (phone: string) => phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  const formatZipCode = (zipCode: string) => zipCode.replace(/(\d{5})(\d{3})/, '$1-$2');

  return (
    <Layout>
      <div className="min-h-screen bg-[#050505] py-12 relative overflow-hidden font-outfit">
        {/* Background Decorative Blur */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#FF3131] opacity-[0.03] blur-[150px] rounded-full -ml-44 -mt-44"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600 opacity-[0.03] blur-[150px] rounded-full -mr-44 -mb-44"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header Card */}
          <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-8 lg:p-12 mb-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8">
              <div className="bg-[#FF3131] text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic flex items-center space-x-2">
                <Zap className="h-3 w-3" />
                <span>Status Elite</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-10">
              <div className="relative group">
                <div className="w-32 h-32 bg-zinc-800 rounded-3xl flex items-center justify-center border border-white/10 group-hover:border-[#FF3131]/40 transition-all overflow-hidden">
                  {userProfile?.profile_photo_url ? (
                    <img src={userProfile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                      <User className="h-16 w-16 text-white/20 group-hover:text-[#FF3131] transition-colors" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#FF3131] text-black rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl cursor-pointer">
                  <Camera className="h-5 w-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={loading} />
                </label>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl lg:text-5xl font-black text-white italic tracking-tighter uppercase mb-2">
                  {userProfile?.full_name || 'ATLETA ELITE'}
                </h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-6 flex items-center justify-center md:justify-start space-x-2">
                  <Mail className="h-4 w-4 text-[#FF3131]" />
                  <span>{userProfile?.email}</span>
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-white border border-white/10">
                    <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                    Cartão {userProfile?.card_type === 'physical' ? 'Físico' : 'Digital'}
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-gray-500 border border-white/10">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    Desde 2024
                  </span>
                </div>

                {!userProfile?.profile_photo_url && (
                  <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-relaxed">
                      Atenção: Adicione uma foto de perfil para evitar fraudes e garantir sua identidade nos estabelecimentos parceiros.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Configuration Navigation */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] shadow-2xl overflow-hidden">
            <div className="border-b border-white/5 overflow-x-auto scrollbar-hide">
              <nav className="flex space-x-2 px-6 py-4 min-w-max">
                {[
                  { id: 'profile', label: 'PERFIL', icon: User },
                  { id: 'security', label: 'SEGURANÇA', icon: Shield },
                  { id: 'notifications', label: 'NOTIFICAÇÕES', icon: Bell },
                  ...(isAdmin ? [{ id: 'admin', label: 'ADMIN', icon: Settings }] : []),
                  { id: 'danger', label: 'ZONA DE RISCO', icon: AlertTriangle }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center space-x-3 py-3 px-6 rounded-2xl font-black text-xs italic tracking-widest transition-all ${activeTab === tab.id
                      ? 'bg-[#FF3131] text-black shadow-lg shadow-[#FF3131]/10'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8 lg:p-12">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">DADOS PESSOAIS</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 bg-white/5 text-white border border-white/10 px-6 py-3 rounded-2xl font-black italic uppercase tracking-widest text-xs hover:bg-[#FF3131] hover:text-black transition-all"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>EDITAR</span>
                      </button>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={handleProfileUpdate}
                          disabled={loading}
                          className="flex items-center space-x-2 bg-[#FF3131] text-black px-6 py-3 rounded-2xl font-black italic uppercase tracking-widest text-xs hover:bg-white transition-all shadow-xl shadow-[#FF3131]/10"
                        >
                          <Save className="h-4 w-4" />
                          <span>{loading ? 'SALVANDO...' : 'SALVAR'}</span>
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex items-center space-x-2 bg-zinc-800 text-white px-6 py-3 rounded-2xl font-black italic uppercase tracking-widest text-xs hover:bg-zinc-700 transition-all"
                        >
                          <X className="h-4 w-4" />
                          <span>CANCELAR</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { label: 'NOME COMPLETO', key: 'full_name', icon: User, type: 'text' },
                      { label: 'TELEFONE', key: 'phone', icon: Phone, type: 'tel' },
                      { label: 'CPF (NÃO EDITÁVEL)', key: 'cpf', icon: Activity, type: 'text', disabled: true },
                      { label: 'CEP', key: 'zip_code', icon: MapPin, type: 'text' }
                    ].map((field) => (
                      <div key={field.key} className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center space-x-2">
                          <field.icon className="h-3 w-3" />
                          <span>{field.label}</span>
                        </label>
                        {isEditing && !field.disabled ? (
                          <input
                            type={field.type}
                            value={profileData[field.key as keyof typeof profileData]}
                            onChange={(e) => setProfileData({ ...profileData, [field.key]: e.target.value })}
                            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent transition-all font-bold"
                          />
                        ) : (
                          <div className="bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold opacity-80 uppercase tracking-tight">
                            {field.key === 'cpf' ? formatCPF(profileData.cpf) :
                              field.key === 'phone' ? formatPhone(profileData.phone) :
                                profileData[field.key as keyof typeof profileData] || '---'}
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center space-x-2">
                        <MapPin className="h-3 w-3" />
                        <span>ENDEREÇO COMPLETO</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent transition-all font-bold"
                        />
                      ) : (
                        <div className="bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold opacity-80 uppercase tracking-tight">
                          {profileData.address || 'Não informado'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center space-x-2">
                        <MapPin className="h-3 w-3" />
                        <span>CIDADE / ESTADO</span>
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              placeholder="Cidade"
                              value={profileData.city}
                              onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF3131] transition-all font-bold"
                            />
                            <input
                              type="text"
                              placeholder="UF"
                              value={profileData.state}
                              onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF3131] transition-all font-bold uppercase"
                            />
                          </>
                        ) : (
                          <div className="bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold opacity-80 uppercase tracking-tight flex justify-between col-span-2">
                            <span>{profileData.city || '---'}</span>
                            <span className="text-[#FF3131]">{profileData.state || '---'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center space-x-2">
                        <Smartphone className="h-3 w-3" />
                        <span>EXPEDIR CARTÃO</span>
                      </label>
                      {isEditing ? (
                        <select
                          value={profileData.card_type}
                          onChange={(e) => setProfileData({ ...profileData, card_type: e.target.value as 'digital' | 'physical' })}
                          className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF3131] transition-all font-bold uppercase tracking-widest text-xs"
                        >
                          <option value="digital">DIGITAL (APP)</option>
                          <option value="physical">FÍSICO (ENTREGUE)</option>
                        </select>
                      ) : (
                        <div className="bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold opacity-80 uppercase tracking-tight flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${profileData.card_type === 'physical' ? 'bg-blue-500' : 'bg-[#FF3131]'}`}></div>
                          <span>{profileData.card_type === 'physical' ? 'Físico' : 'Digital'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">SEGURANÇA ELITE</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-10">Proteja seus dados de performance e benefícios.</p>

                  <div className="bg-[#FF3131]/5 border border-[#FF3131]/20 rounded-3xl p-6 mb-10 flex items-start space-x-4">
                    <Shield className="h-6 w-6 text-[#FF3131]" />
                    <div>
                      <h3 className="font-black text-[#FF3131] italic uppercase tracking-widest text-xs">Alterar Credenciais</h3>
                      <p className="text-gray-500 font-medium text-xs mt-1">Sua nova senha deve conter pelo menos 6 caracteres e símbolos de alta fidelidade.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[
                      { label: 'SENHA ATUAL', key: 'currentPassword', visible: showCurrentPassword, setter: setShowCurrentPassword },
                      { label: 'NOVA SENHA', key: 'newPassword', visible: showNewPassword, setter: setShowNewPassword },
                      { label: 'CONFIRMAR SENHA', key: 'confirmPassword', visible: showConfirmPassword, setter: setShowConfirmPassword }
                    ].map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{field.label}</label>
                        <div className="relative">
                          <input
                            type={field.visible ? 'text' : 'password'}
                            value={passwordData[field.key as keyof typeof passwordData]}
                            onChange={(e) => setPasswordData({ ...passwordData, [field.key]: e.target.value })}
                            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3 text-white pr-12 focus:ring-2 focus:ring-[#FF3131] transition-all font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => field.setter(!field.visible)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                          >
                            {field.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    disabled={loading || !passwordData.newPassword}
                    className="bg-[#FF3131] text-black px-10 py-4 rounded-2xl font-black italic uppercase tracking-widest text-xs hover:bg-white transition-all transform active:scale-95 shadow-xl shadow-[#FF3131]/10"
                  >
                    {loading ? 'AUTENTICANDO...' : 'ATUALIZAR SENHA'}
                  </button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-10">CONEXÕES & ALERTAS</h2>

                  <div className="space-y-4">
                    {[
                      { id: 'email_marketing', title: 'Marketing Direto', desc: 'Receba convites para eventos VIP e pré-lançamentos.' },
                      { id: 'email_benefits', title: 'Alertas de Rede', desc: 'Saiba imediatamente quando novos parceiros entrarem na sua região.' },
                      { id: 'push_notifications', title: 'Push Performance', desc: 'Notificações instantâneas no seu dashboard digital.' },
                      { id: 'sms_notifications', title: 'Relatórios SMS', desc: 'Resumo semanal de economia e uso de benefícios.' }
                    ].map((n) => (
                      <div key={n.id} className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-white/10 transition-all">
                        <div>
                          <h3 className="font-black text-white italic uppercase tracking-tighter text-sm">{n.title}</h3>
                          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">{n.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[n.id as keyof typeof notifications]}
                            onChange={(e) => setNotifications({ ...notifications, [n.id]: e.target.checked })}
                            className="src-only peer hidden"
                          />
                          <div className="w-12 h-6 bg-zinc-800 rounded-full peer peer-checked:bg-[#FF3131] transition-colors relative after:content-[''] after:absolute after:top-1 after:left-1 after:bg-gray-400 peer-checked:after:bg-black after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => toast.success('Preferências de elite atualizadas!')}
                    className="mt-10 bg-[#FF3131] text-black px-10 py-4 rounded-2xl font-black italic uppercase tracking-widest text-xs hover:bg-white transition-all shadow-xl shadow-[#FF3131]/10"
                  >
                    SALVAR PREFERÊNCIAS
                  </button>
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">ZONA DE RISCO</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-10">Ações irreversíveis que impactam sua conta permanentemente.</p>

                  <div className="bg-red-500/5 border border-red-500/20 rounded-[40px] p-8 lg:p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                      <AlertTriangle className="h-24 w-24 text-red-500" />
                    </div>

                    <h3 className="text-xl font-black text-red-500 italic uppercase tracking-tighter mb-4 flex items-center space-x-3">
                      <span>EXCLUIR HUB PESSOAL</span>
                    </h3>

                    <p className="text-gray-400 font-bold text-sm mb-8 max-w-lg leading-relaxed uppercase tracking-tight">
                      Ao apagar sua conta, você será removido da . Todos os descontos acumulados e o acesso às redes de elite serão deletados instantaneamente.
                    </p>

                    <div className="space-y-3 mb-10">
                      {['EXCLUSÃO DE DADOS PESSOAIS', 'CANCELAMENTO DE ASSINATURA', 'PERDA DE STATUS ELITE'].map((item, i) => (
                        <div key={i} className="flex items-center space-x-3 text-red-500/60 font-black italic text-[10px] tracking-widest">
                          <X className="h-3 w-3" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleAccountDeletion}
                      className="bg-red-500 text-white px-10 py-4 rounded-2xl font-black italic uppercase tracking-widest text-xs hover:bg-red-600 transition-all transform active:scale-95 shadow-xl shadow-red-500/10 flex items-center space-x-3"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>EXCLUIR MINHA CONTA</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
