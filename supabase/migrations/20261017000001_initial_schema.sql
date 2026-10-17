-- =========================================================================
-- ESQUEMA DO BANCO DE DADOS POSTGRESQL (SUPABASE)
-- APLICATIVO MINHA ROTINA: DIETA SEMANAL E LEMBRETES IMPORTANTES
-- =========================================================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. TABELA PROFILES (Perfis de usuário)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL DEFAULT 'Carol',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- 2. TABELA MEAL_PLANS (Planos de Refeição Semanal)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL DEFAULT 'Minha Dieta Semanal',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- 3. TABELA MEALS (Refeições Detalhadas)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE SET NULL,
    meal_date DATE NOT NULL,
    category TEXT NOT NULL, -- 'Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia'
    name TEXT NOT NULL,
    meal_time TIME,
    foods TEXT,
    quantities TEXT,
    notes TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- 4. TABELA REMINDER_CATEGORIES (Categorias de Lembretes)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminder_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'tag',
    color TEXT NOT NULL DEFAULT '#ff2a85',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- 5. TABELA REMINDERS (Lembretes Importantes e Compromissos)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.reminder_categories(id) ON DELETE SET NULL,
    reminder_date DATE NOT NULL,
    reminder_time TIME,
    priority TEXT NOT NULL DEFAULT 'Normal', -- 'Baixa', 'Normal', 'Alta', 'Urgente'
    reminder_type TEXT NOT NULL DEFAULT 'Tarefa', -- 'Pessoal', 'Família', 'Saúde', 'Trabalho', 'Contas', etc.
    status TEXT NOT NULL DEFAULT 'Pendente', -- 'Pendente', 'Concluído', 'Arquivado'
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    recurrence_rule TEXT NOT NULL DEFAULT 'none', -- 'none', 'daily', 'weekly', 'monthly', 'yearly', 'weekdays'
    recurrence_days TEXT[] DEFAULT '{}',
    notification_enabled BOOLEAN NOT NULL DEFAULT true,
    notification_advance_minutes INT NOT NULL DEFAULT 15, -- 0 (no horário), 5, 15, 30, 60, 1440
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- 6. TABELA REMINDER_COMPLETIONS (Histórico de Conclusão de Ocorrências Recorrentes)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminder_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
    occurrence_date DATE NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_reminder_occurrence_completion UNIQUE (reminder_id, occurrence_date)
);

-- -------------------------------------------------------------------------
-- 7. TABELA PUSH_SUBSCRIPTIONS (Inscrições Web Push para iOS 16.4+, Android e Desktop)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- 8. TABELA NOTIFICATION_LOGS (Prevenção de Duplicatas de Notificação Push)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
    occurrence_date DATE NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'sent',
    CONSTRAINT unique_notification_reminder_date UNIQUE (reminder_id, occurrence_date)
);

-- -------------------------------------------------------------------------
-- 9. TABELA USER_SETTINGS (Configurações e Preferências)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    default_advance_minutes INT NOT NULL DEFAULT 15,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    theme TEXT NOT NULL DEFAULT 'smorphy-dark',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- ÍNDICES DE DESEMPENHO
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON public.reminders(user_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status_priority ON public.reminders(user_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_reminder_completions_search ON public.reminder_completions(reminder_id, occurrence_date);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) — SEGURANÇA E PRIVACIDADE TOTAL
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas Profiles
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuários podem inserir seu próprio perfil" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas Meal Plans
CREATE POLICY "Usuários gerenciam seus próprios planos de refeição" ON public.meal_plans
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas Meals
CREATE POLICY "Usuários gerenciam suas próprias refeições" ON public.meals
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas Reminder Categories
CREATE POLICY "Usuários gerenciam suas próprias categorias" ON public.reminder_categories
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas Reminders
CREATE POLICY "Usuários gerenciam seus próprios lembretes" ON public.reminders
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas Reminder Completions
CREATE POLICY "Usuários gerenciam suas conclusões de lembretes" ON public.reminder_completions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas Push Subscriptions
CREATE POLICY "Usuários gerenciam suas inscrições push" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas Notification Logs
CREATE POLICY "Usuários gerenciam seus logs de notificação" ON public.notification_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas User Settings
CREATE POLICY "Usuários gerenciam suas próprias configurações" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- TRIGGER: CRIAÇÃO AUTOMÁTICA DE PERFIL E CATEGORIAS INICIAIS NO CADASTRO
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Cria perfil padrão
    INSERT INTO public.profiles (id, nome)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', 'Carol'))
    ON CONFLICT (id) DO NOTHING;

    -- 2. Cria configurações padrão
    INSERT INTO public.user_settings (user_id, default_advance_minutes, notifications_enabled)
    VALUES (NEW.id, 15, true)
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Cria categorias iniciais solicitadas no projeto
    INSERT INTO public.reminder_categories (user_id, name, icon, color)
    VALUES
        (NEW.id, 'Pessoal', 'user', '#ff2a85'),
        (NEW.id, 'Família', 'heart', '#ec4899'),
        (NEW.id, 'Saúde e consultas', 'activity', '#10b981'),
        (NEW.id, 'Trabalho', 'briefcase', '#3b82f6'),
        (NEW.id, 'Contas e pagamentos', 'dollar-sign', '#f59e0b'),
        (NEW.id, 'Documentos', 'file-text', '#8b5cf6'),
        (NEW.id, 'Compras', 'shopping-cart', '#06b6d4'),
        (NEW.id, 'Compromissos', 'calendar', '#6366f1'),
        (NEW.id, 'Metas pessoais', 'target', '#f43f5e'),
        (NEW.id, 'Outros', 'tag', '#94a3b8')
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dispara trigger após INSERT na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
