// TypeScript interfaces for Minha Rotina

export type PriorityLevel = 'Baixa' | 'Normal' | 'Alta' | 'Urgente';

export type ReminderType = 
  | 'Pessoal' 
  | 'Família' 
  | 'Saúde e consultas' 
  | 'Trabalho' 
  | 'Contas e pagamentos' 
  | 'Documentos' 
  | 'Compras' 
  | 'Compromissos' 
  | 'Metas pessoais' 
  | 'Outros';

export type RecurrenceRule = 
  | 'none' 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'yearly' 
  | 'weekdays';

export interface UserProfile {
  id: string;
  nome: string;
  avatar_url?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  nome: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export type MealCategory = 
  | 'Café da manhã' 
  | 'Lanche da manhã' 
  | 'Almoço' 
  | 'Lanche da tarde' 
  | 'Jantar' 
  | 'Ceia';

export interface Meal {
  id: string;
  user_id: string;
  meal_plan_id?: string;
  meal_date: string; // YYYY-MM-DD
  day_of_week?: number; // 0 (Dom) a 6 (Sáb)
  category: MealCategory | string;
  name: string;
  meal_time: string; // HH:mm
  foods: string; // Lista de alimentos descritivos
  quantities: string; // Quantidades e medidas
  notes?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReminderCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  created_at?: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  reminder_date: string; // YYYY-MM-DD
  reminder_time?: string; // HH:mm
  priority: PriorityLevel;
  reminder_type: ReminderType | string;
  status: 'Pendente' | 'Concluído' | 'Arquivado';
  is_favorite: boolean;
  recurrence_rule: RecurrenceRule;
  recurrence_days?: string[]; // ['seg', 'qua', 'sex']
  notification_enabled: boolean;
  notification_advance_minutes: number; // 0, 5, 15, 30, 60, 1440
  created_at?: string;
  updated_at?: string;
  // Computed runtime properties for display
  is_completed_today?: boolean;
  computed_date?: string;
}

export interface ReminderCompletion {
  id: string;
  user_id: string;
  reminder_id: string;
  occurrence_date: string; // YYYY-MM-DD
  completed_at: string;
}

export interface PushSubscriptionData {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  created_at?: string;
}

export interface UserSettings {
  id?: string;
  user_id: string;
  default_advance_minutes: number;
  notifications_enabled: boolean;
  theme: string;
  supabase_connected?: boolean;
}

export type ActiveTab = 'dashboard' | 'diet' | 'reminders' | 'history' | 'settings';
