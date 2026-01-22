import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { User as AppUser } from '../lib/supabase';
import { useSafeTimeout } from '../hooks/useSafeTimeout';

// Import API URL logic implicitly or define it here
const API_URL = import.meta.env.VITE_API_URL || '/api';

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

    // Load session from token on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token) {
            // Validate token via /me endpoint
            fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        // Invalid token
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setLoading(false);
                    } else {
                        // Valid user
                        // Adapt to Supabase User shape
                        const supabaseUser = { id: data.id, email: data.email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as User;
                        setUser(supabaseUser);
                        setUserProfile(data); // data includes profile fields
                        setSession({ access_token: token, user: supabaseUser } as Session);
                        setLoading(false);
                    }
                })
                .catch(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Success
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            const supabaseUser = { id: data.user.id, email: data.user.email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as User;

            setUser(supabaseUser);
            setUserProfile(data.user);
            setSession({ access_token: data.token, user: supabaseUser } as Session);

            return { error: null };
        } catch (error: any) {
            console.error('Login failed', error);
            return { error: { message: error.message || 'Login failed' } };
        } finally {
            setLoading(false);
        }
    }, []);

    const signUp = useCallback(async (email: string, password: string, userData: Partial<AppUser>) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: userData.full_name,
                    cpf: userData.cpf,
                    phone: userData.phone
                    // Address is handled separately or need to update register controller to accept it
                })
            });
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Auto login after register
            localStorage.setItem('token', data.token);
            const supabaseUser = { id: data.user.id, email: data.user.email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as User;

            setUser(supabaseUser);
            setUserProfile(data.user);
            setSession({ access_token: data.token, user: supabaseUser } as Session);

            return { error: null };
        } catch (error: any) {
            return { error: { message: error.message || 'Signup failed' } };
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setUserProfile(null);
        setSession(null);
    }, []);

    const updateProfile = async (updates: Partial<AppUser>) => {
        // TODO: Implement update profile API
        // For now, minimal support
        return { error: null };
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

// Hook to access auth (compatible with existing code)
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
