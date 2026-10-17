import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LocalStore } from './storageService';
import { AuthService } from './authService';
import { ReminderCategory } from '../types/database';

export const CategoriesService = {
  async getCategories(): Promise<ReminderCategory[]> {
    const user = await AuthService.getCurrentUser();
    if (!user) return LocalStore.getCategories();

    if (isSupabaseConfigured() && supabase && !user.isDemo) {
      try {
        const { data, error } = await supabase
          .from('reminder_categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (!error && data && data.length > 0) {
          return data as ReminderCategory[];
        }
      } catch (err) {
        console.warn('Erro ao carregar categorias do Supabase:', err);
      }
    }

    return LocalStore.getCategories();
  },

  async addCategory(name: string, icon = 'tag', color = '#ff2a85'): Promise<ReminderCategory> {
    const user = await AuthService.getCurrentUser();
    const userId = user?.id || 'user-carol-demo';

    if (isSupabaseConfigured() && supabase && user && !user.isDemo) {
      try {
        const { data, error } = await supabase
          .from('reminder_categories')
          .insert({
            user_id: userId,
            name,
            icon,
            color,
          })
          .select()
          .single();

        if (!error && data) {
          return data as ReminderCategory;
        }
      } catch (err) {
        console.warn('Erro ao adicionar categoria no Supabase:', err);
      }
    }

    const categories = LocalStore.getCategories();
    const newCategory: ReminderCategory = {
      id: `cat-${Date.now()}`,
      user_id: userId,
      name,
      icon,
      color,
      created_at: new Date().toISOString(),
    };

    categories.push(newCategory);
    LocalStore.saveCategories(categories);
    return newCategory;
  },

  async deleteCategory(categoryId: string): Promise<boolean> {
    const user = await AuthService.getCurrentUser();

    if (isSupabaseConfigured() && supabase && user && !user.isDemo) {
      try {
        const { error } = await supabase.from('reminder_categories').delete().eq('id', categoryId);
        if (!error) return true;
      } catch (err) {
        console.warn('Erro ao deletar categoria no Supabase:', err);
      }
    }

    const categories = LocalStore.getCategories();
    const filtered = categories.filter((c) => c.id !== categoryId);
    LocalStore.saveCategories(filtered);
    return true;
  },
};
