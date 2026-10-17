import { Meal, Reminder, ReminderCategory, ReminderCompletion, UserProfile, UserSettings } from '../types/database';

const STORAGE_KEYS = {
  PROFILE: 'minha_rotina_profile',
  MEALS: 'minha_rotina_meals',
  REMINDERS: 'minha_rotina_reminders',
  CATEGORIES: 'minha_rotina_categories',
  COMPLETIONS: 'minha_rotina_completions',
  SETTINGS: 'minha_rotina_settings',
  INITIALIZED: 'minha_rotina_initialized_v2',
};

// Helper: Formata data de hoje em YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initial Sample Data
const DEFAULT_PROFILE: UserProfile = {
  id: 'user-carol-demo',
  nome: 'Carol',
  email: 'carol@exemplo.com',
};

const DEFAULT_SETTINGS: UserSettings = {
  user_id: 'user-carol-demo',
  default_advance_minutes: 15,
  notifications_enabled: true,
  theme: 'smorphy-dark',
};

const DEFAULT_CATEGORIES: ReminderCategory[] = [
  { id: 'cat-1', user_id: 'user-carol-demo', name: 'Pessoal', icon: 'user', color: '#ff2a85' },
  { id: 'cat-2', user_id: 'user-carol-demo', name: 'Família', icon: 'heart', color: '#ec4899' },
  { id: 'cat-3', user_id: 'user-carol-demo', name: 'Saúde e consultas', icon: 'activity', color: '#10b981' },
  { id: 'cat-4', user_id: 'user-carol-demo', name: 'Trabalho', icon: 'briefcase', color: '#3b82f6' },
  { id: 'cat-5', user_id: 'user-carol-demo', name: 'Contas e pagamentos', icon: 'dollar-sign', color: '#f59e0b' },
  { id: 'cat-6', user_id: 'user-carol-demo', name: 'Documentos', icon: 'file-text', color: '#8b5cf6' },
  { id: 'cat-7', user_id: 'user-carol-demo', name: 'Compras', icon: 'shopping-cart', color: '#06b6d4' },
  { id: 'cat-8', user_id: 'user-carol-demo', name: 'Compromissos', icon: 'calendar', color: '#6366f1' },
  { id: 'cat-9', user_id: 'user-carol-demo', name: 'Metas pessoais', icon: 'target', color: '#f43f5e' },
  { id: 'cat-10', user_id: 'user-carol-demo', name: 'Outros', icon: 'tag', color: '#94a3b8' },
];

function generateInitialMeals(): Meal[] {
  const days = [0, 1, 2, 3, 4, 5, 6]; // Seg a Dom
  const meals: Meal[] = [];
  const today = new Date();

  // Encontra a segunda-feira da semana atual
  const currentDayOfWeek = today.getDay(); // 0 é Domingo, 1 é Segunda
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMonday);

  const mealTemplates = [
    {
      category: 'Café da manhã',
      meal_time: '07:30',
      name: 'Ovos mexidos com aveia e frutas',
      foods: '2 ovos caipiras, 30g de aveia em flocos, 1 banana prata picada com canela',
      quantities: '2 unidades, 2 colheres de sopa, 1 fruta',
      notes: 'Tomar com 300ml de água morna ou café preto sem açúcar',
    },
    {
      category: 'Lanche da manhã',
      meal_time: '10:00',
      name: 'Iogurte natural com castanhas',
      foods: 'Iogurte natural desnatado, castanhas-do-pará e chia',
      quantities: '1 pote (170g), 3 castanhas, 1 colher de chá',
      notes: 'Rico em gorduras boas e saciedade',
    },
    {
      category: 'Almoço',
      meal_time: '12:30',
      name: 'Filé de frango grelhado com arroz integral e legumes',
      foods: 'Peito de frango temperado com ervas, arroz integral cozido, brócolis e cenoura no vapor, salada de folhas verdes',
      quantities: '140g de frango, 4 colheres de sopa de arroz, 1 xícara de legumes, à vontade',
      notes: 'Temperar salada com 1 colher de sobremesa de azeite extra virgem e limão',
    },
    {
      category: 'Lanche da tarde',
      meal_time: '16:00',
      name: 'Shake de proteína com frutas vermelhas',
      foods: 'Whey protein isolado batido com água ou leite vegetal, morangos frescos',
      quantities: '1 scoop (30g), 200ml de água, 6 morangos',
      notes: 'Pré-treino ou lanche proteico da tarde',
    },
    {
      category: 'Jantar',
      meal_time: '19:30',
      name: 'Salmão ou peixe branco com batata-doce e salada colorida',
      foods: 'Filé de tilápia ou salmão assado, batata-doce assada em cubos, tomatinhos cereja e rúcula',
      quantities: '150g de peixe, 100g de batata-doce, salada à vontade',
      notes: 'Refeição leve para facilitar uma boa noite de sono',
    },
    {
      category: 'Ceia',
      meal_time: '21:45',
      name: 'Chá calmante com sementes de abóbora',
      foods: 'Chá de camomila ou melissa com sementes de abóbora tostadas',
      quantities: '1 xícara (250ml), 1 colher de sopa de sementes',
      notes: 'Ajuda a relaxar o corpo e estimula a melatonina natural',
    },
  ];

  for (let i = 0; i < 7; i++) {
    const mealDate = new Date(monday);
    mealDate.setDate(monday.getDate() + i);
    const dateStr = mealDate.toISOString().split('T')[0];

    mealTemplates.forEach((template, idx) => {
      meals.push({
        id: `meal-${i}-${idx}-${Date.now()}`,
        user_id: 'user-carol-demo',
        meal_date: dateStr,
        day_of_week: mealDate.getDay(),
        category: template.category,
        name: template.name,
        meal_time: template.meal_time,
        foods: template.foods,
        quantities: template.quantities,
        notes: template.notes,
        is_completed: i < (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1) ? true : false,
      });
    });
  }

  return meals;
}

function generateInitialReminders(): Reminder[] {
  const today = getTodayDateString();
  const tomorrow = getDateOffset(1);
  const nextWeek = getDateOffset(5);

  return [
    {
      id: 'rem-1',
      user_id: 'user-carol-demo',
      title: 'Tomar 500ml de água e creatina',
      description: 'Manter a hidratação diária logo no início da manhã',
      category_id: 'cat-3',
      reminder_date: today,
      reminder_time: '08:00',
      priority: 'Normal',
      reminder_type: 'Saúde e consultas',
      status: 'Pendente',
      is_favorite: true,
      recurrence_rule: 'daily',
      notification_enabled: true,
      notification_advance_minutes: 0,
    },
    {
      id: 'rem-2',
      user_id: 'user-carol-demo',
      title: 'Consulta Médica de Rotina (Check-up Anual)',
      description: 'Clínica São Camilo — Levar últimos exames de sangue impressos',
      category_id: 'cat-3',
      reminder_date: today,
      reminder_time: '15:30',
      priority: 'Urgente',
      reminder_type: 'Saúde e consultas',
      status: 'Pendente',
      is_favorite: true,
      recurrence_rule: 'none',
      notification_enabled: true,
      notification_advance_minutes: 30,
    },
    {
      id: 'rem-3',
      user_id: 'user-carol-demo',
      title: 'Pagar Fatura do Cartão de Crédito',
      description: 'Conferir lançamentos e agendar pagamento pelo aplicativo bancário',
      category_id: 'cat-5',
      reminder_date: tomorrow,
      reminder_time: '11:00',
      priority: 'Alta',
      reminder_type: 'Contas e pagamentos',
      status: 'Pendente',
      is_favorite: true,
      recurrence_rule: 'monthly',
      notification_enabled: true,
      notification_advance_minutes: 60,
    },
    {
      id: 'rem-4',
      user_id: 'user-carol-demo',
      title: 'Treino de Musculação & Cardio (Pernas)',
      description: 'Foco em agachamento livre, leg press e 20 minutos de caminhada inclinada',
      category_id: 'cat-1',
      reminder_date: today,
      reminder_time: '18:00',
      priority: 'Normal',
      reminder_type: 'Metas pessoais',
      status: 'Pendente',
      is_favorite: false,
      recurrence_rule: 'daily',
      notification_enabled: true,
      notification_advance_minutes: 15,
    },
    {
      id: 'rem-5',
      user_id: 'user-carol-demo',
      title: 'Comprar frutas frescas e ovos na feira orgânica',
      description: 'Morangos, maçãs, espinafre, banana da terra e ovos caipiras',
      category_id: 'cat-7',
      reminder_date: nextWeek,
      reminder_time: '09:00',
      priority: 'Baixa',
      reminder_type: 'Compras',
      status: 'Pendente',
      is_favorite: false,
      recurrence_rule: 'weekly',
      notification_enabled: true,
      notification_advance_minutes: 15,
    },
  ];
}

// Storage Operations
export const LocalStore = {
  initializeIfNeeded(): void {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(generateInitialMeals()));
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(generateInitialReminders()));
      localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  },

  resetToDemo(): void {
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    this.initializeIfNeeded();
  },

  getProfile(): UserProfile {
    this.initializeIfNeeded();
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : DEFAULT_PROFILE;
  },

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getSettings(): UserSettings {
    this.initializeIfNeeded();
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getCategories(): ReminderCategory[] {
    this.initializeIfNeeded();
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  },

  saveCategories(categories: ReminderCategory[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getMeals(): Meal[] {
    this.initializeIfNeeded();
    const data = localStorage.getItem(STORAGE_KEYS.MEALS);
    return data ? JSON.parse(data) : [];
  },

  saveMeals(meals: Meal[]): void {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
  },

  getReminders(): Reminder[] {
    this.initializeIfNeeded();
    const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    return data ? JSON.parse(data) : [];
  },

  saveReminders(reminders: Reminder[]): void {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  },

  getCompletions(): ReminderCompletion[] {
    this.initializeIfNeeded();
    const data = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
    return data ? JSON.parse(data) : [];
  },

  saveCompletions(completions: ReminderCompletion[]): void {
    localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
  },
};
