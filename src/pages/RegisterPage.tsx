import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSafeInterval } from '../hooks/useSafeTimeout';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  CreditCard,
  UserPlus,
  ArrowLeft,
  CheckCircle,
  Trophy,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Plan } from '../lib/supabase';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  cpf: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  cardType: 'digital' | 'physical';
  selectedPlan: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    cpf: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cardType: 'digital',
    selectedPlan: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const { setSafeInterval, clearSafeInterval } = useSafeInterval();

  // Rate limiting countdown
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (rateLimitCountdown > 0) {
      intervalId = setSafeInterval(() => {
        setRateLimitCountdown(prev => {
          if (prev <= 1) {
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearSafeInterval(intervalId);
    };
  }, [rateLimitCountdown, setSafeInterval, clearSafeInterval]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) {
        console.error('Error fetching plans:', error);
      } else {
        setPlans(data || []);
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, selectedPlan: data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const validateStep1 = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.phone) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    if (!formData.cpf) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))) {
      newErrors.cpf = 'CPF deve ter 11 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.address) {
      newErrors.address = 'Endereço é obrigatório';
    }

    if (!formData.city) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!formData.state) {
      newErrors.state = 'Estado é obrigatório';
    }

    if (!formData.zipCode) {
      newErrors.zipCode = 'CEP é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, zipCode: value }));

    // Clear error when user starts typing
    if (errors.zipCode) {
      setErrors(prev => ({ ...prev, zipCode: undefined }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, phone: value }));

    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cpf: value }));

    if (errors.cpf) {
      setErrors(prev => ({ ...prev, cpf: undefined }));
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 10) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleNextStep = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3() || loading || isRateLimited) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone.replace(/\D/g, ''),
        cpf: formData.cpf.replace(/\D/g, ''),
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode.replace(/\D/g, '')
        },
        card_type: formData.cardType
      });

      if (error) {
        if (error.isRateLimit) {
          toast.error(error.message);
          setIsRateLimited(true);
          setRateLimitCountdown(60); // 60 segundos de bloqueio
        } else if (error.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error('Erro ao criar conta. Tente novamente.');
        }
      } else {
        toast.success('Conta criada com sucesso! Verifique seu email se o login não foi automático.');
        // Redirect to Subscription page to finish payment
        if (formData.selectedPlan) {
          navigate(`/assinatura?plan=${formData.selectedPlan}`);
        } else {
          navigate('/assinatura');
        }
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">IDENTIDADE DO ATLETA</h3>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Crie sua conta para acessar os benefícios</p>
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3131] mb-3 ml-1">
          Nome Completo *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleInputChange}
            className={`block w-full pl-12 pr-6 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent transition-all font-bold placeholder:text-gray-800 ${errors.fullName ? 'border-red-500/50 bg-red-500/5' : ''
              }`}
            placeholder="Seu nome completo"
          />
        </div>
        {errors.fullName && <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.fullName}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3131] mb-3 ml-1">
          Seu Melhor Email *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-600" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`block w-full pl-12 pr-6 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent transition-all font-bold placeholder:text-gray-800 ${errors.email ? 'border-red-500/50 bg-red-500/5' : ''
              }`}
            placeholder="atleta@performa.com"
          />
        </div>
        {errors.email && <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.email}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3131] mb-3 ml-1">
            Senha *
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              className={`block w-full px-6 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent transition-all font-bold placeholder:text-gray-800 ${errors.password ? 'border-red-500/50 bg-red-500/5' : ''
                }`}
              placeholder="Mín. 6"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5 text-gray-600" /> : <Eye className="h-5 w-5 text-gray-600" />}
            </button>
          </div>
          {errors.password && <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3131] mb-3 ml-1">
            Confirmar *
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`block w-full px-6 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent transition-all font-bold placeholder:text-gray-800 ${errors.confirmPassword ? 'border-red-500/50 bg-red-500/5' : ''
                }`}
              placeholder="Confirmar"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-600" /> : <Eye className="h-5 w-5 text-gray-600" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.confirmPassword}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">VALIDAÇÃO DE PERFORMANCE</h3>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Precisamos dessas informações para seu cartão</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3131] mb-3 ml-1">
            WhatsApp Ativo *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-600" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formatPhone(formData.phone)}
              onChange={handlePhoneChange}
              className={`block w-full pl-12 pr-6 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent transition-all font-bold placeholder:text-gray-800 ${errors.phone ? 'border-red-500/50 bg-red-500/5' : ''
                }`}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>
          {errors.phone && <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.phone}</p>}
        </div>

        {/* CPF */}
        <div>
          <label htmlFor="cpf" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3131] mb-3 ml-1">
            CPF Registro *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-600" />
            </div>
            <input
              id="cpf"
              name="cpf"
              type="text"
              value={formatCPF(formData.cpf)}
              onChange={handleCpfChange}
              className={`block w-full pl-12 pr-6 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent transition-all font-bold placeholder:text-gray-800 ${errors.cpf ? 'border-red-500/50 bg-red-500/5' : ''
                }`}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
          {errors.cpf && <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.cpf}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">LOCALIZAÇÃO</h3>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Para entrega do cartão físico (se escolhido)</p>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3131] mb-3 ml-1">
          Endereço Completo *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-600" />
          </div>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleInputChange}
            className={`block w-full pl-12 pr-6 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent transition-all font-bold placeholder:text-gray-800 ${errors.address ? 'border-red-500/50 bg-red-500/5' : ''
              }`}
            placeholder="Rua, número, complemento"
          />
        </div>
        {errors.address && <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <label htmlFor="zipCode" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 ml-1">CEP *</label>
          <input
            id="zipCode"
            name="zipCode"
            type="text"
            value={formatZipCode(formData.zipCode)}
            onChange={handleZipCodeChange}
            className={`block w-full px-5 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] transition-all font-bold placeholder:text-gray-800 ${errors.zipCode ? 'border-red-500/50 bg-red-500/5' : ''}`}
            placeholder="00000-000"
            maxLength={9}
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="city" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 ml-1">Cidade *</label>
          <input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="block w-full px-5 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] transition-all font-bold placeholder:text-gray-800"
            placeholder="Cidade"
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="state" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 ml-1">Estado *</label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="block w-full px-5 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] transition-all font-bold cursor-pointer"
          >
            <option value="">UF</option>
            {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO', 'PE', 'CE'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">SINTA A ATITUDE</h3>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Escolha o plano ideal para concluir seu cadastro</p>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`group relative overflow-hidden border-2 rounded-[32px] p-6 cursor-pointer transition-all duration-300 ${formData.selectedPlan === plan.id
              ? 'border-[#FF3131] bg-[#FF3131]/5 scale-[1.02]'
              : 'border-white/5 bg-black hover:border-white/20'
              }`}
            onClick={() => setFormData(prev => ({ ...prev, selectedPlan: plan.id }))}
          >
            <div className="flex justify-between items-center relative z-10">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h5 className={`font-black uppercase italic tracking-tighter text-xl ${formData.selectedPlan === plan.id ? 'text-[#FF3131]' : 'text-white'}`}>{plan.name}</h5>
                  {plan.name === 'Premium' && (
                    <span className="bg-[#FF3131] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Elite</span>
                  )}
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{plan.description}</p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-black italic tracking-tighter ${formData.selectedPlan === plan.id ? 'text-[#FF3131]' : 'text-white'}`}>
                  R$ {plan.price.toFixed(2)}
                </div>
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1">por ciclo</div>
              </div>
            </div>
            {formData.selectedPlan === plan.id && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF3131]/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-outfit">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 opacity-5 blur-[120px] rounded-full -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#FF3131] opacity-5 blur-[120px] rounded-full -ml-32 -mb-32"></div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center space-x-2 text-gray-500 hover:text-[#FF3131] transition-colors mb-10 group font-bold uppercase tracking-widest text-xs">
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao início</span>
          </Link>

          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-[#FF3131] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(191,255,0,0.3)] transform rotate-3 hover:rotate-6 transition-transform">
              <Zap className="text-black h-10 w-10 fill-current" />
            </div>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-white italic tracking-tighter uppercase leading-none mb-6">
            LIGA <span className="text-[#FF3131]">TRINCARD</span>
          </h1>
          <p className="text-base text-gray-500 font-bold uppercase tracking-[0.2em]">
            Prepare-se para o próximo nível
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[48px] p-8 lg:p-12 shadow-3xl">
          {/* Progress Markers */}
          <div className="flex justify-between items-center mb-12 overflow-x-auto pb-4 scrollbar-hide">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center group cursor-pointer" onClick={() => step < currentStep && setCurrentStep(step)}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${step === currentStep
                      ? 'bg-[#FF3131] text-black shadow-[0_0_20px_rgba(191,255,0,0.4)] scale-110'
                      : step < currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-black text-gray-700 border border-white/5'
                    }`}>
                    {step < currentStep ? <CheckCircle className="h-5 w-5" /> : step}
                  </div>
                  <span className={`text-[8px] mt-3 font-black uppercase tracking-widest ${step === currentStep ? 'text-[#FF3131]' : 'text-gray-600'}`}>
                    ETAPA {step}
                  </span>
                </div>
                {step < 4 && <div className={`flex-1 h-0.5 mx-4 transition-colors ${step < currentStep ? 'bg-blue-600' : 'bg-white/5'}`}></div>}
              </React.Fragment>
            ))}
          </div>

          <form onSubmit={currentStep === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className={`flex items-center gap-4 mt-12 ${currentStep > 1 ? 'justify-between' : 'justify-end'}`}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-10 py-5 border-2 border-white/10 text-white font-black italic uppercase tracking-widest text-sm rounded-2xl hover:bg-white/5 transition-all active:scale-95"
                >
                  VOLTAR
                </button>
              )}

              <button
                type="submit"
                disabled={loading || isRateLimited}
                className="flex-1 lg:flex-none lg:min-w-[240px] px-10 py-5 bg-[#FF3131] text-black font-black italic uppercase tracking-widest text-sm rounded-2xl hover:bg-white transition-all transform active:scale-95 shadow-xl shadow-[#FF3131]/10 flex items-center justify-center space-x-3"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                ) : currentStep === 4 ? (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>FINALIZAR REGISTRO</span>
                  </>
                ) : (
                  <>
                    <span>PRÓXIMO</span>
                    <ArrowLeft className="h-5 w-5 rotate-180" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login link */}
          <div className="mt-10 text-center border-t border-white/5 pt-8">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              JÁ É DA LIGA?{' '}
              <Link
                to="/login"
                className="text-[#FF3131] hover:text-white transition-colors ml-1"
              >
                FAÇA LOGIN
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
