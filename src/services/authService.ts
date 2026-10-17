import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LocalStore } from './storageService';
import { UserProfile } from '../types/database';

export interface AuthUser {
  id: string;
  email?: string;
  nome: string;
  isDemo?: boolean;
}

const DEMO_USER_SESSION_KEY = 'minha_rotina_demo_logged_in';

export const AuthService = {
  async getCurrentUser(): Promise<AuthUser | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          return this.getDemoUser();
        }

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        return {
          id: session.user.id,
          email: session.user.email,
          nome: profile?.nome || session.user.user_metadata?.nome || 'Carol',
          isDemo: false,
        };
      } catch (err) {
        console.warn('Erro ao verificar sessão Supabase:', err);
        return this.getDemoUser();
      }
    }

    return this.getDemoUser();
  },

  getDemoUser(): AuthUser | null {
    const isLoggedOut = localStorage.getItem(DEMO_USER_SESSION_KEY) === 'false';
    if (isLoggedOut) return null;

    const profile = LocalStore.getProfile();
    return {
      id: profile.id,
      email: profile.email || 'carol@exemplo.com',
      nome: profile.nome || 'Carol',
      isDemo: true,
    };
  },

  async signIn(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.user) {
          localStorage.removeItem(DEMO_USER_SESSION_KEY);
          return {
            success: true,
            user: {
              id: data.user.id,
              email: data.user.email,
              nome: data.user.user_metadata?.nome || 'Carol',
              isDemo: false,
            },
          };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Demo Mode Sign In
    localStorage.setItem(DEMO_USER_SESSION_KEY, 'true');
    const profile = LocalStore.getProfile();
    return {
      success: true,
      user: {
        id: profile.id,
        email: email || profile.email,
        nome: profile.nome || 'Carol',
        isDemo: true,
      },
    };
  },

  async signUp(email: string, password: string, nome: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nome: nome || 'Carol' },
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.user) {
          return {
            success: true,
            user: {
              id: data.user.id,
              email: data.user.email,
              nome: nome || 'Carol',
              isDemo: false,
            },
          };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Demo Mode Sign Up
    LocalStore.saveProfile({
      id: 'user-carol-demo',
      nome: nome || 'Carol',
      email: email,
    });
    localStorage.setItem(DEMO_USER_SESSION_KEY, 'true');

    return {
      success: true,
      user: {
        id: 'user-carol-demo',
        email,
        nome: nome || 'Carol',
        isDemo: true,
      },
    };
  },

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Demo Mode simulation
    return { success: true };
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erro ao deslogar do Supabase:', err);
      }
    }
    localStorage.setItem(DEMO_USER_SESSION_KEY, 'false');
  },

  async updateProfileName(nome: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    if (isSupabaseConfigured() && supabase && !user.isDemo) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ nome, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (error) throw error;
        return true;
      } catch (e) {
        console.error('Erro ao atualizar nome no Supabase:', e);
        return false;
      }
    }

    // Demo fallback
    const profile = LocalStore.getProfile();
    profile.nome = nome;
    LocalStore.saveProfile(profile);
    return true;
  },
};
