import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LocalStore, getTodayDateString, getDateOffset } from './storageService';
import { AuthService } from './authService';
import { Reminder, ReminderCompletion, PriorityLevel } from '../types/database';

export const RemindersService = {
  async getAllReminders(): Promise<Reminder[]> {
    const user = await AuthService.getCurrentUser();
    if (!user) return [];

    let baseReminders: Reminder[] = [];

    if (isSupabaseConfigured() && supabase && !user.isDemo) {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .select(`
            *,
            category:reminder_categories(id, name, color, icon)
          `)
          .eq('user_id', user.id)
          .order('reminder_date', { ascending: true });

        if (!error && data) {
          baseReminders = data.map((r: any) => ({
            ...r,
            category_name: r.category?.name || 'Geral',
          }));
        }
      } catch (err) {
        console.warn('Erro ao buscar lembretes do Supabase:', err);
      }
    }

    if (baseReminders.length === 0) {
      baseReminders = LocalStore.getReminders();
    }

    // Attach category names from local if missing
    const categories = LocalStore.getCategories();
    baseReminders = baseReminders.map((r) => {
      const cat = categories.find((c) => c.id === r.category_id);
      return {
        ...r,
        category_name: r.category_name || cat?.name || 'Geral',
      };
    });

    return baseReminders;
  },

  async getCompletions(): Promise<ReminderCompletion[]> {
    const user = await AuthService.getCurrentUser();
    if (!user) return [];

    if (isSupabaseConfigured() && supabase && !user.isDemo) {
      try {
        const { data, error } = await supabase
          .from('reminder_completions')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          return data as ReminderCompletion[];
        }
      } catch (err) {
        console.warn('Erro ao buscar conclusões do Supabase:', err);
      }
    }

    return LocalStore.getCompletions();
  },

  /**
   * Generates active occurrences for a given date string (YYYY-MM-DD)
   */
  async getRemindersForDate(targetDateStr: string): Promise<Reminder[]> {
    const allReminders = await this.getAllReminders();
    const completions = await this.getCompletions();
    const targetDate = new Date(targetDateStr + 'T00:00:00');

    const result: Reminder[] = [];

    for (const reminder of allReminders) {
      const isDue = this.isReminderOccurringOnDate(reminder, targetDateStr, targetDate);
      if (!isDue) continue;

      const isCompleted = completions.some(
        (c) => c.reminder_id === reminder.id && c.occurrence_date === targetDateStr
      ) || (reminder.recurrence_rule === 'none' && reminder.status === 'Concluído');

      result.push({
        ...reminder,
        computed_date: targetDateStr,
        is_completed_today: isCompleted,
      });
    }

    return result;
  },

  /**
   * Evaluates if a reminder triggers on targetDate
   */
  isReminderOccurringOnDate(reminder: Reminder, targetDateStr: string, targetDate: Date): boolean {
    const originalDate = new Date(reminder.reminder_date + 'T00:00:00');

    // If future original date, cannot occur before its inception
    if (targetDateStr < reminder.reminder_date) {
      return false;
    }

    if (reminder.recurrence_rule === 'none' || !reminder.recurrence_rule) {
      return reminder.reminder_date === targetDateStr;
    }

    if (reminder.recurrence_rule === 'daily') {
      return true;
    }

    if (reminder.recurrence_rule === 'weekly') {
      return originalDate.getDay() === targetDate.getDay();
    }

    if (reminder.recurrence_rule === 'weekdays') {
      const day = targetDate.getDay();
      return day >= 1 && day <= 5; // Seg a Sex
    }

    if (reminder.recurrence_rule === 'monthly') {
      return originalDate.getDate() === targetDate.getDate();
    }

    if (reminder.recurrence_rule === 'yearly') {
      return (
        originalDate.getMonth() === targetDate.getMonth() &&
        originalDate.getDate() === targetDate.getDate()
      );
    }

    return false;
  },

  async addReminder(reminderData: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Reminder> {
    const user = await AuthService.getCurrentUser();
    const userId = user?.id || 'user-carol-demo';

    if (isSupabaseConfigured() && supabase && user && !user.isDemo) {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .insert({
            user_id: userId,
            ...reminderData,
          })
          .select()
          .single();

        if (!error && data) {
          return data as Reminder;
        }
      } catch (err) {
        console.warn('Erro ao inserir lembrete no Supabase:', err);
      }
    }

    const newReminder: Reminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user_id: userId,
      ...reminderData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const reminders = LocalStore.getReminders();
    reminders.push(newReminder);
    LocalStore.saveReminders(reminders);
    return newReminder;
  },

  async updateReminder(reminderId: string, updates: Partial<Reminder>): Promise<Reminder | null> {
    const user = await AuthService.getCurrentUser();

    if (isSupabaseConfigured() && supabase && user && !user.isDemo) {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reminderId)
          .select()
          .single();

        if (!error && data) {
          return data as Reminder;
        }
      } catch (err) {
        console.warn('Erro ao atualizar lembrete no Supabase:', err);
      }
    }

    const reminders = LocalStore.getReminders();
    const index = reminders.findIndex((r) => r.id === reminderId);
    if (index === -1) return null;

    reminders[index] = {
      ...reminders[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    LocalStore.saveReminders(reminders);
    return reminders[index];
  },

  async deleteReminder(reminderId: string): Promise<boolean> {
    const user = await AuthService.getCurrentUser();

    if (isSupabaseConfigured() && supabase && user && !user.isDemo) {
      try {
        await supabase.from('reminder_completions').delete().eq('reminder_id', reminderId);
        await supabase.from('notification_logs').delete().eq('reminder_id', reminderId);
        const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
        if (!error) return true;
      } catch (err) {
        console.warn('Erro ao deletar lembrete no Supabase:', err);
      }
    }

    const reminders = LocalStore.getReminders();
    LocalStore.saveReminders(reminders.filter((r) => r.id !== reminderId));

    const completions = LocalStore.getCompletions();
    LocalStore.saveCompletions(completions.filter((c) => c.reminder_id !== reminderId));

    return true;
  },

  async toggleReminderCompletion(reminderId: string, occurrenceDate: string, markCompleted: boolean): Promise<boolean> {
    const user = await AuthService.getCurrentUser();
    const userId = user?.id || 'user-carol-demo';

    const reminders = await this.getAllReminders();
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) return false;

    // Se for não-recorrente, atualiza o status na tabela reminders
    if (reminder.recurrence_rule === 'none') {
      await this.updateReminder(reminderId, {
        status: markCompleted ? 'Concluído' : 'Pendente',
      });
    }

    // Gerencia na tabela reminder_completions
    if (isSupabaseConfigured() && supabase && user && !user.isDemo) {
      try {
        if (markCompleted) {
          await supabase.from('reminder_completions').upsert({
            user_id: userId,
            reminder_id: reminderId,
            occurrence_date: occurrenceDate,
            completed_at: new Date().toISOString(),
          });
        } else {
          await supabase
            .from('reminder_completions')
            .delete()
            .eq('reminder_id', reminderId)
            .eq('occurrence_date', occurrenceDate);
        }
        return true;
      } catch (err) {
        console.warn('Erro ao salvar conclusão no Supabase:', err);
      }
    }

    // Local fallback
    const completions = LocalStore.getCompletions();
    if (markCompleted) {
      const exists = completions.some(
        (c) => c.reminder_id === reminderId && c.occurrence_date === occurrenceDate
      );
      if (!exists) {
        completions.push({
          id: `comp-${Date.now()}`,
          user_id: userId,
          reminder_id: reminderId,
          occurrence_date: occurrenceDate,
          completed_at: new Date().toISOString(),
        });
        LocalStore.saveCompletions(completions);
      }
    } else {
      const filtered = completions.filter(
        (c) => !(c.reminder_id === reminderId && c.occurrence_date === occurrenceDate)
      );
      LocalStore.saveCompletions(filtered);
    }

    return true;
  },

  async toggleFavorite(reminderId: string, currentFav: boolean): Promise<boolean> {
    const updated = await this.updateReminder(reminderId, { is_favorite: !currentFav });
    return Boolean(updated);
  },

  getPriorityWeight(p: PriorityLevel): number {
    switch (p) {
      case 'Urgente': return 4;
      case 'Alta': return 3;
      case 'Normal': return 2;
      case 'Baixa': return 1;
      default: return 0;
    }
  },
};
