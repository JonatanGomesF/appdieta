import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'minha_rotina_supabase_url';
const STORAGE_KEY_ANON = 'minha_rotina_supabase_anon';

export function cleanSupabaseUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim();
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const localAnon = localStorage.getItem(STORAGE_KEY_ANON) || '';

  const rawUrl = localUrl || envUrl;
  const anonKey = localAnon || envAnon;

  return { url: cleanSupabaseUrl(rawUrl), anonKey: anonKey.trim() };
}

let supabaseInstance: SupabaseClient | null = null;

export function initSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (url && anonKey && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('Erro ao inicializar Supabase:', e);
      return null;
    }
  }

  return null;
}

export const supabase = initSupabase();

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  const cleanedUrl = cleanSupabaseUrl(url);
  localStorage.setItem(STORAGE_KEY_URL, cleanedUrl);
  localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  supabaseInstance = null;
  initSupabase();
}

export function clearSupabaseCredentials(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON);
  supabaseInstance = null;
}

export async function testSupabaseConnection(rawUrl: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const url = cleanSupabaseUrl(rawUrl);
    const client = createClient(url, anonKey.trim());
    // Try pinging profiles table
    const { error } = await client.from('profiles').select('count').limit(1);
    if (error && error.code === 'PGRST116') {
      return { success: true, message: 'Conectado com sucesso ao Supabase!' };
    }
    if (error && error.message.includes('relation "public.profiles" does not exist')) {
      return {
        success: true,
        message: 'Conectado ao Supabase! Lembre-se de rodar a migração SQL no SQL Editor do painel para criar as tabelas.',
      };
    }
    return { success: true, message: 'Conectado com sucesso ao Supabase PostgreSQL!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Falha ao conectar no Supabase.' };
  }
}
