import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LocalStore, getTodayDateString } from './storageService';
import { AuthService } from './authService';
import { Meal } from '../types/database';

export interface ParsedDietDay {
  dayName: string;
  dayIndex: number; // 0 to 6
  date: string;
  selected: boolean;
  meals: Omit<Meal, 'id' | 'user_id'>[];
}

export const MealsService = {
  async getMealsForDate(dateStr: string): Promise<Meal[]> {
    const user = await AuthService.getCurrentUser();
    if (!user) return [];

    if (isSupabaseConfigured() && supabase && !user.isDemo) {
      try {
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .eq('meal_date', dateStr)
          .order('meal_time', { ascending: true });

        if (!error && data) {
          return data as Meal[];
        }
      } catch (err) {
        console.warn('Erro ao carregar refeições do Supabase:', err);
      }
    }

    // Demo/LocalStorage fallback
    const allMeals = LocalStore.getMeals();
    return allMeals.filter((m) => m.meal_date === dateStr);
  },

  async getMealsForWeek(startDateStr: string, endDateStr: string): Promise<Meal[]> {
    const user = await AuthService.getCurrentUser();
    if (!user) return [];

    if (isSupabaseConfigured() && supabase && !user.isDemo) {
      try {
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .gte('meal_date', startDateStr)
          .lte('meal_date', endDateStr)
          .order('meal_time', { ascending: true });

        if (!error && data) {
          return data as Meal[];
        }
      } catch (err) {
        console.warn('Erro ao carregar semana do Supabase:', err);
      }
    }

    const allMeals = LocalStore.getMeals();
    return allMeals.filter((m) => m.meal_date >= startDateStr && m.meal_date <= endDateStr);
  },

  async addMeal(mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Meal> {
    const user = await AuthService.getCurrentUser();
    const userId = user?.id || 'user-carol-demo';

    if (isSupabaseConfigured() && supabase && user && !user.isDemo) {
      try {
        const { data, error } = await supabase
          .from('meals')
          .insert({
            user_id: userId,
            ...mealData,
          })
          .select()
          .single();

        if (!error && data) {
          return data as Meal;
        }
      } catch (err) {
        console.warn('Erro ao adicionar refeição no Supabase:', err);
      }
    }

    const newMeal: Meal = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user_id: userId,
      ...mealData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const meals = LocalStore.getMeals();
    meals.push(newMeal);
    LocalStore.saveMeals(meals);
    return newMeal;
  },

  async updateMeal(mealId: string, updates: Partial<Meal>): Promise<Meal | null> {
    const user = await AuthService.getCurrentUser();

    if (isSupabaseConfigured() && supabase && user && !user.isDemo) {
      try {
        const { data, error } = await supabase
          .from('meals')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', mealId)
          .select()
          .single();

        if (!error && data) {
          return data as Meal;
        }
      } catch (err) {
        console.warn('Erro ao atualizar refeição no Supabase:', err);
      }
    }

    const meals = LocalStore.getMeals();
    const index = meals.findIndex((m) => m.id === mealId);
    if (index === -1) return null;

    meals[index] = {
      ...meals[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    LocalStore.saveMeals(meals);
    return meals[index];
  },

  async deleteMeal(mealId: string): Promise<boolean> {
    const user = await AuthService.getCurrentUser();

    if (isSupabaseConfigured() && supabase && user && !user.isDemo) {
      try {
        const { error } = await supabase.from('meals').delete().eq('id', mealId);
        if (!error) return true;
      } catch (err) {
        console.warn('Erro ao deletar refeição no Supabase:', err);
      }
    }

    const meals = LocalStore.getMeals();
    const filtered = meals.filter((m) => m.id !== mealId);
    LocalStore.saveMeals(filtered);
    return true;
  },

  async toggleMealCompletion(mealId: string, isCompleted: boolean): Promise<Meal | null> {
    return this.updateMeal(mealId, {
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : undefined,
    });
  },

  async importMealsBatch(mealsToAdd: Omit<Meal, 'id' | 'user_id'>[]): Promise<number> {
    const user = await AuthService.getCurrentUser();
    const userId = user?.id || 'user-carol-demo';

    if (isSupabaseConfigured() && supabase && user && !user.isDemo) {
      try {
        const payload = mealsToAdd.map((m) => ({
          ...m,
          user_id: userId,
        }));
        const { data, error } = await supabase.from('meals').insert(payload).select();
        if (!error && data) {
          return data.length;
        }
      } catch (err) {
        console.warn('Erro ao importar refeições no Supabase:', err);
      }
    }

    const meals = LocalStore.getMeals();
    const newItems = mealsToAdd.map((m) => ({
      id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      ...m,
      created_at: new Date().toISOString(),
    }));

    meals.push(...newItems);
    LocalStore.saveMeals(meals);
    return newItems.length;
  },

  /**
   * Smart ChatGPT Diet Parser
   * Parses Brazilian Portuguese diet routines pasted directly from ChatGPT!
   */
  parseChatGPTDiet(rawText: string, weekMondayDate: string): ParsedDietDay[] {
    const dayNames = [
      { key: 'segunda', name: 'Segunda-feira', index: 0 },
      { key: 'terça', name: 'Terça-feira', index: 1 },
      { key: 'terca', name: 'Terça-feira', index: 1 },
      { key: 'quarta', name: 'Quarta-feira', index: 2 },
      { key: 'quinta', name: 'Quinta-feira', index: 3 },
      { key: 'sexta', name: 'Sexta-feira', index: 4 },
      { key: 'sábado', name: 'Sábado', index: 5 },
      { key: 'sabado', name: 'Sábado', index: 5 },
      { key: 'domingo', name: 'Domingo', index: 6 },
    ];

    const mealCategories = [
      { name: 'Café da manhã', defaultTime: '07:30', regex: /caf[eé]\s+da\s+manh[aã]/i },
      { name: 'Lanche da manhã', defaultTime: '10:00', regex: /lanche\s+da\s+manh[aã]|colação/i },
      { name: 'Almoço', defaultTime: '12:30', regex: /almo[cç]o/i },
      { name: 'Lanche da tarde', defaultTime: '16:00', regex: /lanche\s+da\s+tarde|pr[eé]-treino/i },
      { name: 'Jantar', defaultTime: '19:30', regex: /jantar|janta/i },
      { name: 'Ceia', defaultTime: '21:30', regex: /ceia|p[oó]s-jantar/i },
    ];

    const monday = new Date(weekMondayDate + 'T00:00:00');
    const resultDays: ParsedDietDay[] = [];

    // Initialize the 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const standardName = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'][i];

      resultDays.push({
        dayName: standardName,
        dayIndex: i,
        date: dateStr,
        selected: true,
        meals: [],
      });
    }

    const lines = rawText.split('\n');
    let currentDayIndex = 0;
    let currentCategory = 'Café da manhã';
    let currentMealName = '';
    let currentMealTime = '08:00';
    let currentFoods: string[] = [];
    let currentNotes = '';

    const saveCurrentMeal = () => {
      if (currentMealName || currentFoods.length > 0) {
        resultDays[currentDayIndex].meals.push({
          meal_date: resultDays[currentDayIndex].date,
          day_of_week: (currentDayIndex + 1) % 7,
          category: currentCategory,
          name: currentMealName || currentCategory,
          meal_time: currentMealTime,
          foods: currentFoods.join(', '),
          quantities: currentFoods.join(', '),
          notes: currentNotes,
          is_completed: false,
        });
        currentMealName = '';
        currentFoods = [];
        currentNotes = '';
      }
    };

    let hasExplicitDays = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Check if line contains a day of the week header
      const matchedDay = dayNames.find((d) => {
        const regex = new RegExp(`(^|#|\\*|\\b)${d.key}(\\s*(-|:|$|feira))`, 'i');
        return regex.test(line);
      });

      if (matchedDay) {
        saveCurrentMeal();
        currentDayIndex = matchedDay.index;
        hasExplicitDays = true;
        continue;
      }

      // Check if line matches a meal category
      const matchedCat = mealCategories.find((cat) => cat.regex.test(line));
      if (matchedCat) {
        saveCurrentMeal();
        currentCategory = matchedCat.name;
        currentMealTime = matchedCat.defaultTime;

        // Try to find custom time in line (e.g. 08:30 or 8h30 or 14:00)
        const timeMatch = line.match(/(\d{1,2})[:h](\d{2})/i);
        if (timeMatch) {
          const hours = timeMatch[1].padStart(2, '0');
          const minutes = timeMatch[2];
          currentMealTime = `${hours}:${minutes}`;
        }

        // Clean meal name
        const cleanName = line.replace(/^[#*\-•\d.]+\s*/, '').replace(/:\s*$/, '').trim();
        currentMealName = cleanName;
        continue;
      }

      // It is a food item or bullet point
      if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•') || /^\d+[.)]/.test(line)) {
        const foodClean = line.replace(/^[-*•\d.)]+\s*/, '').trim();
        if (foodClean) {
          currentFoods.push(foodClean);
        }
      } else if (line.toLowerCase().startsWith('obs:') || line.toLowerCase().startsWith('observação:')) {
        currentNotes = line.replace(/^(obs|observação):\s*/i, '').trim();
      } else if (currentFoods.length > 0) {
        currentFoods.push(line);
      } else if (!currentMealName) {
        currentMealName = line;
      }
    }

    saveCurrentMeal();

    // If user pasted a single day without mentioning weekdays, replicate for the selected days or apply to Monday
    if (!hasExplicitDays && resultDays[0].meals.length > 0) {
      const parsedTemplate = [...resultDays[0].meals];
      for (let i = 1; i < 7; i++) {
        resultDays[i].meals = parsedTemplate.map((m) => ({
          ...m,
          meal_date: resultDays[i].date,
          day_of_week: (i + 1) % 7,
        }));
      }
    }

    return resultDays;
  },
};
