import { MealsService } from './mealsService';
import { RemindersService } from './remindersService';
import { Meal, Reminder, ReminderCompletion } from '../types/database';

export interface HistoryItem {
  id: string;
  type: 'meal' | 'reminder';
  title: string;
  category: string;
  originalDate: string;
  completedAt?: string;
  details?: string;
  rawMeal?: Meal;
  rawReminder?: Reminder;
  rawCompletion?: ReminderCompletion;
}

export const HistoryService = {
  async getHistoryItems(): Promise<HistoryItem[]> {
    const allReminders = await RemindersService.getAllReminders();
    const completions = await RemindersService.getCompletions();

    // Fetch meals
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 60); // Last 60 days
    const pastStr = pastDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const weekMeals = await MealsService.getMealsForWeek(pastStr, todayStr);
    const completedMeals = weekMeals.filter((m) => m.is_completed);

    const historyItems: HistoryItem[] = [];

    // Add completed meals
    for (const meal of completedMeals) {
      historyItems.push({
        id: `hist-meal-${meal.id}`,
        type: 'meal',
        title: meal.name,
        category: meal.category,
        originalDate: meal.meal_date,
        completedAt: meal.completed_at || meal.meal_date,
        details: `${meal.meal_time ? meal.meal_time + ' • ' : ''}${meal.foods || ''}`,
        rawMeal: meal,
      });
    }

    // Add completed reminders
    for (const comp of completions) {
      const rem = allReminders.find((r) => r.id === comp.reminder_id);
      if (rem) {
        historyItems.push({
          id: `hist-rem-${comp.id}`,
          type: 'reminder',
          title: rem.title,
          category: rem.category_name || rem.reminder_type,
          originalDate: comp.occurrence_date,
          completedAt: comp.completed_at,
          details: rem.description || '',
          rawReminder: rem,
          rawCompletion: comp,
        });
      }
    }

    // Also include one-off reminders marked as 'Concluído' that might not have a completion row
    for (const rem of allReminders) {
      if (rem.recurrence_rule === 'none' && rem.status === 'Concluído') {
        const alreadyIn = historyItems.some((h) => h.type === 'reminder' && h.rawReminder?.id === rem.id);
        if (!alreadyIn) {
          historyItems.push({
            id: `hist-rem-single-${rem.id}`,
            type: 'reminder',
            title: rem.title,
            category: rem.category_name || rem.reminder_type,
            originalDate: rem.reminder_date,
            completedAt: rem.updated_at || rem.reminder_date,
            details: rem.description || '',
            rawReminder: rem,
          });
        }
      }
    }

    // Sort descending by completion / original date
    return historyItems.sort((a, b) => {
      const dateA = a.completedAt || a.originalDate;
      const dateB = b.completedAt || b.originalDate;
      return dateB.localeCompare(dateA);
    });
  },

  async restoreItem(item: HistoryItem): Promise<boolean> {
    if (item.type === 'meal' && item.rawMeal) {
      await MealsService.toggleMealCompletion(item.rawMeal.id, false);
      return true;
    }
    if (item.type === 'reminder' && item.rawReminder) {
      await RemindersService.toggleReminderCompletion(
        item.rawReminder.id,
        item.originalDate,
        false
      );
      return true;
    }
    return false;
  },

  async deleteItem(item: HistoryItem): Promise<boolean> {
    if (item.type === 'meal' && item.rawMeal) {
      return MealsService.deleteMeal(item.rawMeal.id);
    }
    if (item.type === 'reminder' && item.rawReminder) {
      return RemindersService.deleteReminder(item.rawReminder.id);
    }
    return false;
  },
};
