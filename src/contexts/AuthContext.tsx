import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { User as AppUser } from '../lib/supabase';
import { useSafeTimeout } from '../hooks/useSafeTimeout';

interface AuthContextType {
  user: User | null;
  userProfile: AppUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Partial<AppUser>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { setSafeTimeout } = useSafeTimeout();
  const lastFetchedUserId = useRef<string | null>(null);
  const isFetchingProfile = useRef(false);

  useEffect(() => {
    console.log('🚀 Inicializando AuthContext...');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📋 Sessão inicial:', session ? 'Encontrada' : 'Não encontrada');
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    }).catch(error => {
      console.error('❌ Erro ao obter sessão inicial:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Only fetch if data changed or we haven't fetched for this user yet
        if (session.user.id !== lastFetchedUserId.current) {
          await fetchUserProfile(session.user.id);
        } else {
          console.log('Skipping redundant profile fetch for', session.user.id);
        }
      } else {
        setUserProfile(null);
        lastFetchedUserId.current = null;
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    if (isFetchingProfile.current) {
      console.log('⚠️ Already fetching profile, skipping duplicate call');
      return;
    }

    try {
      isFetchingProfile.current = true;
      console.log('🔍 Buscando perfil do usuário com ID:', userId);

      // Timeout para evitar carregamento infinito
      const timeoutPromise = new Promise((_, reject) =>
        setSafeTimeout(() => reject(new Error('Timeout ao buscar perfil')), 10000)
      );

      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);

        // Se usuário não existe na tabela users, apenas notificar ou retornar null
        // Não criar automaticamente para evitar conflito com o processo de Signup
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          console.log('⚠️ Usuário não encontrado na tabela users.');
        }
        setUserProfile(null);
      } else {
        console.log('✅ Perfil do usuário carregado com sucesso');
        setUserProfile(data);
        lastFetchedUserId.current = userId;
      }
    } catch (error: any) {
      console.error('❌ Erro inesperado ao buscar perfil:', error);
      // Don't crash loading state on timeout, just finish
      setUserProfile(null);
    } finally {
      setLoading(false);
      isFetchingProfile.current = false;
    }
  };

  const signUp = useCallback(async (email: string, password: string, userData: Partial<AppUser>) => {
    try {
      setLoading(true);

      console.log('🚀 Iniciando criação de conta...');

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Tratamento específico para rate limiting
        if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          return {
            error: {
              ...error,
              isRateLimit: true,
              message: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
            }
          };
        }
        return { error };
      }

      // If user is created, add profile data
      if (data.user) {
        const profileData = {
          id: data.user.id,
          email: data.user.email!,
          full_name: userData.full_name || '',
          phone: userData.phone || '',
          cpf: userData.cpf || '',
          address: {
            street: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            zip_code: userData.zip_code || ''
          },
          card_type: userData.card_type || 'digital',
          is_active: true,
          is_admin: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: profileError } = await supabase
          .from('users')
          .insert(profileData);

        if (profileError) {
          console.error('❌ Erro ao criar perfil do usuário:', profileError);

          if (profileError.code === '23505') { // Unique constraint violation
            let errorMessage = 'Já existe um cadastro com estes dados.';
            if (profileError.message?.includes('cpf')) {
              errorMessage = 'Este CPF já está cadastrado em outra conta.';
            } else if (profileError.message?.includes('email')) {
              errorMessage = 'Este email já está cadastrado.';
            }
            return { error: { message: errorMessage } };
          }
          return { error: profileError };
        }

        setUserProfile(profileData as any);
        lastFetchedUserId.current = data.user.id;
      }

      return { error: null };
    } catch (error: any) {
      console.error('❌ Erro inesperado durante criação da conta:', error);
      if (error.status === 429 || (error.message && error.message.includes('429'))) {
        return {
          error: {
            ...error,
            isRateLimit: true,
            message: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
          }
        };
      }
      return { error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setSession(null);
      lastFetchedUserId.current = null;
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (updates: Partial<AppUser>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { error };
      }

      // Refresh user profile
      // Force fetch even if ID matches because data changed
      await fetchUserProfile(user.id);
      // Reset ref to ensure next automated fetch works if needed, usually unnecessary here as we just fetched
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}