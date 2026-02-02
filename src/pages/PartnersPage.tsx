import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Clock,
  Phone,
  Globe,
  Tag,
  ChevronDown,
  Heart,
  Share2,
  ExternalLink
} from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Partner } from '../lib/supabase';
import { toast } from 'sonner';
import { useDebounce } from '../hooks/useDebounce';

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const categories = [
    'Saúde',
    'Farmácias',
    'Esportes',
    'Lojas',
    'Alimentação',
    'Hospitais',
    'Consultas',
    'Educação',
    'Entretenimento',
    'Beleza',
    'Tecnologia',
    'Varejo',
    'Serviços'
  ];

  useEffect(() => {
    fetchPartners();
    loadFavorites();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      // Buscar TODOS os parceiros via API própria
      const data = await api.partners.list();

      if (!data) {
        toast.error('Erro ao carregar parceiros');
      } else {
        // Filtrar apenas os aprovados no JavaScript (caso a API retorne todos)
        const approvedPartners = (data || []).filter(
          (p: Partner) => p.approval_status === 'approved'
        );
        console.log('Total partners:', data?.length, 'Approved:', approvedPartners.length);
        setPartners(approvedPartners);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Erro inesperado ao carregar parceiros');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (partnerId: string) => {
    const newFavorites = favorites.includes(partnerId)
      ? favorites.filter(id => id !== partnerId)
      : [...favorites, partnerId];

    setFavorites(newFavorites);
    localStorage.setItem('_favorites', JSON.stringify(newFavorites));

    toast.success(
      favorites.includes(partnerId)
        ? 'Removido dos favoritos'
        : 'Adicionado aos favoritos'
    );
  };

  const sharePartner = async (partner: Partner) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: partner.name,
          text: `Confira este parceiro do : ${partner.name}`,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(
        `Confira este parceiro do : ${partner.name} - ${window.location.href}`
      );
      toast.success('Link copiado para a área de transferência');
    }
  };

  // Memoize filtered partners to avoid recalculation on every render
  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
      const matchesSearch = (partner.company_name || partner.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        partner.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || partner.category === selectedCategory;
      const matchesCity = selectedCity === 'all' || partner.city === selectedCity;

      return matchesSearch && matchesCategory && matchesCity;
    });
  }, [partners, debouncedSearchTerm, selectedCategory, selectedCity]);

  // Memoize sorted partners to avoid recalculation on every render
  const sortedPartners = useMemo(() => {
    return [...filteredPartners].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.company_name || a.name || '').localeCompare(b.company_name || b.name || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'city':
          return (a.city || '').localeCompare(b.city || '');
        default:
          return 0;
      }
    });
  }, [filteredPartners, sortBy]);

  // Memoize unique cities to avoid recalculation
  const uniqueCities = useMemo(() => {
    return [...new Set(partners.map(p => p.city).filter(Boolean))].sort();
  }, [partners]);

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#050505]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF3131] border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">Buscando Parceiros Elite...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#050505] py-12 lg:py-20 overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 opacity-5 blur-[120px] rounded-full -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#FF3131] opacity-5 blur-[120px] rounded-full -ml-32 -mb-32"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-5xl lg:text-7xl font-black text-white italic tracking-tighter uppercase leading-none mb-6">
              REDES DE <span className="text-[#FF3131]">ELITE</span>
            </h1>
            <p className="text-xl text-gray-500 font-bold max-w-2xl leading-relaxed">
              Explore os melhores estabelecimentos esportivos do país que confiam na nossa plataforma para entregar valor real.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-4 lg:p-8 mb-12 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
              {/* Search */}
              <div className="lg:col-span-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3131] mb-3 ml-1">Buscar Nome ou Serviço</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Ex: Bodytech, Suplementos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-black border border-white/10 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent font-bold transition-all placeholder:text-gray-700"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 ml-1">Categoria</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full appearance-none bg-black border border-white/10 text-white rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent font-bold transition-all cursor-pointer"
                  >
                    <option value="all">Todas as Categorias</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#FF3131] pointer-events-none" />
                </div>
              </div>

              {/* City Filter */}
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 ml-1">Cidade</label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full appearance-none bg-black border border-white/10 text-white rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-[#FF3131] focus:border-transparent font-bold transition-all cursor-pointer"
                  >
                    <option value="all">Brasil (Todas)</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#FF3131] pointer-events-none" />
                </div>
              </div>

              {/* Results Count & View Mode */}
              <div className="lg:col-span-2 flex flex-col justify-end">
                <div className="flex bg-black rounded-2xl p-1.5 border border-white/5 shadow-inner">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all ${viewMode === 'grid'
                      ? 'bg-[#FF3131] text-black shadow-lg scale-[1.02]'
                      : 'text-gray-500 hover:text-white'
                      }`}
                  >
                    <Filter className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all ${viewMode === 'list'
                      ? 'bg-[#FF3131] text-black shadow-lg scale-[1.02]'
                      : 'text-gray-500 hover:text-white'
                      }`}
                  >
                    <MapPin className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-[#FF3131] animate-pulse"></div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                {sortedPartners.length} Estabelecimentos na sua área
              </p>
            </div>
          </div>

          {/* Partners Grid/List */}
          {sortedPartners.length === 0 ? (
            <div className="text-center py-32 bg-zinc-900/30 rounded-[40px] border border-dashed border-white/10">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Search className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-4">Sem correspondência</h3>
              <p className="text-gray-500 font-bold max-w-sm mx-auto">Tente ajustar seus filtros para encontrar a rede ideal para sua performance.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedCity('all'); }}
                className="mt-8 text-[#FF3131] font-black uppercase tracking-widest text-xs hover:underline"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
              : 'space-y-6'
            }>
              {sortedPartners.map((partner) => (
                <div
                  key={partner.id}
                  className={`group bg-zinc-900 rounded-[32px] border border-white/5 overflow-hidden hover:border-[#FF3131]/30 transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] ${viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
                    }`}
                >
                  {/* Partner Image */}
                  <div className={`relative overflow-hidden ${viewMode === 'list' ? 'md:w-80 flex-shrink-0' : 'h-64'
                    }`}>
                    <img
                      src={partner.logo_url || `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern business logo for ${encodeURIComponent(partner.name || '')} ${encodeURIComponent(partner.category || '')}&image_size=square`}
                      alt={partner.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

                    <div className="absolute top-4 right-4 flex flex-col space-y-2">
                      <button
                        onClick={() => toggleFavorite(partner.id)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all ${favorites.includes(partner.id)
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                          : 'bg-black/40 text-white hover:bg-[#FF3131] hover:text-black'
                          }`}
                      >
                        <Heart className={`h-5 w-5 ${favorites.includes(partner.id) ? 'fill-current' : ''
                          }`} />
                      </button>
                      <button
                        onClick={() => sharePartner(partner)}
                        className="w-12 h-12 bg-black/40 backdrop-blur-md text-white hover:bg-blue-500 rounded-2xl flex items-center justify-center transition-all"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="absolute bottom-4 left-4">
                      <span className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#FF3131] text-black shadow-lg">
                        <Tag className="h-3 w-3 mr-2" />
                        {partner.category}
                      </span>
                    </div>
                  </div>

                  {/* Partner Info */}
                  <div className={`p-8 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-center' : ''}`}>
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{partner.name}</h3>
                      <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                        <Star className="h-4 w-4 text-[#FF3131] fill-current" />
                        <span className="text-xs font-black text-white drop-shadow-sm">4.8</span>
                      </div>
                    </div>

                    <p className="text-gray-400 font-bold mb-8 line-clamp-2 text-sm leading-relaxed">
                      {partner.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <div className="flex items-center text-xs font-bold text-gray-500 space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-[#FF3131]" />
                        </div>
                        <span className="truncate">
                          {partner.address && typeof partner.address === 'object'
                            ? `${partner.address.street || 'Endereço não informado'}`
                            : (typeof partner.address === 'string' ? partner.address : 'Endereço não informado')}
                          {partner.city ? `, ${partner.city}` : (partner.address && typeof partner.address === 'object' && partner.address.city ? `, ${partner.address.city}` : '')}
                        </span>
                      </div>

                      {partner.phone && (
                        <div className="flex items-center text-xs font-bold text-gray-500 space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                            <Phone className="h-4 w-4 text-blue-500" />
                          </div>
                          <span>{formatPhone(partner.phone)}</span>
                        </div>
                      )}
                    </div>

                    {/* Benefits Highlight */}
                    <div className="mb-10 bg-gradient-to-r from-[#FF3131]/10 to-transparent border-l-4 border-[#FF3131] p-5 rounded-r-2xl">
                      <h4 className="text-[10px] font-black text-[#FF3131] uppercase tracking-[0.2em] mb-2 uppercase italic leading-none">Vantagem Exclusiva:</h4>
                      <p className="text-white font-black italic tracking-tighter text-lg leading-tight">
                        🎯 DESCONTO DE 15% EM PERFORMANCE
                      </p>
                    </div>

                    {/* Action Button */}
                    <button className="w-full bg-white text-black py-4 px-6 rounded-2xl font-black italic uppercase tracking-widest hover:bg-[#FF3131] transition-all flex items-center justify-center space-x-3 transform group-hover:scale-[1.02] active:scale-95 shadow-xl">
                      <span>VER DETALHES</span>
                      <ExternalLink className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {sortedPartners.length > 0 && (
            <div className="text-center mt-20">
              <button className="relative group overflow-hidden bg-transparent border-2 border-white/20 hover:border-[#FF3131] py-5 px-12 rounded-full transition-all">
                <span className="relative z-10 text-white group-hover:text-black font-black uppercase tracking-widest text-sm transition-colors uppercase italic">Explorar Mais Estabelecimentos</span>
                <div className="absolute inset-0 bg-[#FF3131] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
