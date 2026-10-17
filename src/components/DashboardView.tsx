import React from 'react';
import { 
  Sparkles, 
  Utensils, 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  ArrowRight,
  Plus,
  Flame,
  Check,
  ChevronRight,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Meal, Reminder, ActiveTab } from '../types/database';

interface DashboardViewProps {
  userName: string;
  todayDateStr: string;
  mealsToday: Meal[];
  remindersToday: Reminder[];
  onToggleMeal: (mealId: string, currentStatus: boolean) => Promise<void>;
  onToggleReminder: (reminderId: string, occurrenceDate: string, currentStatus: boolean) => Promise<void>;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAddMeal: () => void;
  onOpenAddReminder: () => void;
  onOpenChatGPTImport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userName,
  todayDateStr,
  mealsToday,
  remindersToday,
  onToggleMeal,
  onToggleReminder,
  onNavigateTab,
  onOpenAddMeal,
  onOpenAddReminder,
  onOpenChatGPTImport,
}) => {
  // Format current date in PT-BR (ex: "Sábado, 17 de Outubro")
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Calculations
  const completedMealsCount = mealsToday.filter((m) => m.is_completed).length;
  const totalMealsCount = mealsToday.length;
  const mealProgressPercent = totalMealsCount > 0 ? Math.round((completedMealsCount / totalMealsCount) * 100) : 0;

  const completedRemindersCount = remindersToday.filter((r) => r.is_completed_today).length;
  const pendingReminders = remindersToday.filter((r) => !r.is_completed_today);
  const urgentReminders = pendingReminders.filter((r) => r.priority === 'Urgente');

  // Trigger subtle confetti on completing item
  const handleMealCheck = async (meal: Meal) => {
    if (!meal.is_completed) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#ff2a85', '#a855f7', '#38bdf8'],
      });
    }
    await onToggleMeal(meal.id, meal.is_completed);
  };

  const handleReminderCheck = async (reminder: Reminder) => {
    if (!reminder.is_completed_today) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#ff2a85', '#10b981', '#fbbf24'],
      });
    }
    await onToggleReminder(reminder.id, reminder.computed_date || todayDateStr, Boolean(reminder.is_completed_today));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* 1. HERO BANNER: GREETING & DATE */}
      <div 
        className="glass-panel" 
        style={{
          padding: '28px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(20, 24, 40, 0.75), rgba(12, 14, 22, 0.85))',
          border: '1px solid var(--border-glass-bright)',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 42, 133, 0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--neon-pink-subtle)',
              border: '1px solid var(--neon-pink-border)',
              fontSize: '0.813rem',
              color: 'var(--neon-pink)',
              fontWeight: 600,
              marginBottom: '10px',
            }}>
              <Calendar size={14} />
              <span>{capitalizedDate}</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)',
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '8px',
            }}>
              Olá, <span style={{
                background: 'linear-gradient(90deg, #ff2a85, #ff6ba8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>{userName}</span>! ✨
            </h1>
            <p style={{ fontSize: '0.938rem', color: 'var(--text-secondary)' }}>
              Tenha um dia produtivo, focado e saudável na sua alimentação e rotina.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={onOpenAddReminder}
              className="btn-primary"
              style={{ padding: '10px 18px', fontSize: '0.875rem' }}
            >
              <Bell size={16} />
              <span>+ Novo Lembrete</span>
            </button>
            <button
              onClick={onOpenAddMeal}
              className="btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.875rem' }}
            >
              <Utensils size={16} />
              <span>+ Nova Refeição</span>
            </button>
            <button
              onClick={onOpenChatGPTImport}
              className="btn-neon-outline"
              style={{ padding: '10px 18px', fontSize: '0.875rem' }}
            >
              <Sparkles size={16} />
              <span>Importar Dieta</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. URGENT ALERT BANNER (If there are urgent pending reminders) */}
      {urgentReminders.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255, 42, 133, 0.12)',
          border: '1px solid var(--neon-pink)',
          boxShadow: '0 0 20px rgba(255, 42, 133, 0.25)',
          animation: 'pulse-glow 2.5s infinite ease-in-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--neon-pink)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(255, 42, 133, 0.8)',
              flexShrink: 0,
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                Atenção: Você tem {urgentReminders.length} lembrete(s) urgente(s) hoje!
              </div>
              <div style={{ fontSize: '0.813rem', color: '#ffb3d9', marginTop: '2px' }}>
                {urgentReminders.map((r) => r.title).join(' • ')}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('reminders')}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.813rem', flexShrink: 0 }}
          >
            Ver Lembretes
          </button>
        </div>
      )}

      {/* 3. FOUR KPI STATS CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
      }}>
        {/* KPI 1: Meals Today */}
        <div 
          className="glass-panel glass-card-neon" 
          onClick={() => onNavigateTab('diet')}
          style={{ padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dieta de Hoje
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 42, 133, 0.15)',
              color: 'var(--neon-pink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Utensils size={18} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: 800, color: '#ffffff' }}>
              {completedMealsCount}/{totalMealsCount}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--neon-pink)', fontWeight: 600 }}>
              {mealProgressPercent}% concluído
            </span>
          </div>

          <div className="progress-container">
            <div className="progress-fill" style={{ width: `${mealProgressPercent}%` }} />
          </div>
        </div>

        {/* KPI 2: Pending Reminders */}
        <div 
          className="glass-panel glass-card-neon" 
          onClick={() => onNavigateTab('reminders')}
          style={{ padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lembretes Pendentes
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bell size={18} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: 800, color: '#ffffff' }}>
              {pendingReminders.length}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              para hoje
            </span>
          </div>

          <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
            {urgentReminders.length > 0 ? (
              <span style={{ color: 'var(--neon-pink)', fontWeight: 600 }}>
                {urgentReminders.length} com prioridade urgente
              </span>
            ) : (
              <span>Todas as prioridades normais</span>
            )}
          </div>
        </div>

        {/* KPI 3: Completed Today */}
        <div 
          className="glass-panel glass-card-neon" 
          onClick={() => onNavigateTab('history')}
          style={{ padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Concluídos Hoje
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle2 size={18} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: 800, color: '#ffffff' }}>
              {completedMealsCount + completedRemindersCount}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#34d399', fontWeight: 600 }}>
              atividades feitas
            </span>
          </div>

          <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
            Registrado no seu histórico pessoal
          </div>
        </div>

        {/* KPI 4: Water & Routine Streak */}
        <div 
          className="glass-panel glass-card-neon" 
          onClick={() => onNavigateTab('settings')}
          style={{ padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notificações Push
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Zap size={18} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
              iOS & Web
            </span>
          </div>

          <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
            Pronto para iPhone e notificações push
          </div>
        </div>
      </div>

      {/* 4. TWO-COLUMN SPLIT: REFEIÇÕES DE HOJE & PRÓXIMOS LEMBRETES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
      }}>
        {/* LEFT COLUMN: MEALS TODAY */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--neon-pink-subtle)',
                color: 'var(--neon-pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Utensils size={18} />
              </div>
              <h2 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Refeições de Hoje</h2>
            </div>

            <button
              onClick={() => onNavigateTab('diet')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--neon-pink)',
                fontSize: '0.813rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Ver Semana</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {mealsToday.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px 16px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
            }}>
              <Utensils size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '14px' }}>
                Nenhuma refeição cadastrada para hoje.
              </p>
              <button onClick={onOpenAddMeal} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.813rem' }}>
                + Cadastrar Refeição
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mealsToday.map((meal) => (
                <div
                  key={meal.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: meal.is_completed ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                    border: meal.is_completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-glass)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <button
                    onClick={() => handleMealCheck(meal)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      border: meal.is_completed ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                      background: meal.is_completed ? 'var(--neon-emerald)' : 'transparent',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      marginTop: '2px',
                      boxShadow: meal.is_completed ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                    }}
                    title={meal.is_completed ? 'Desmarcar' : 'Concluir refeição'}
                  >
                    {meal.is_completed && <Check size={16} strokeWidth={3} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--neon-pink)',
                        background: 'var(--neon-pink-subtle)',
                        padding: '1px 6px',
                        borderRadius: '6px',
                      }}>
                        {meal.category}
                      </span>
                      {meal.meal_time && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={12} />
                          {meal.meal_time}
                        </span>
                      )}
                    </div>

                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.938rem',
                      fontWeight: 600,
                      color: meal.is_completed ? 'var(--text-muted)' : '#ffffff',
                      textDecoration: meal.is_completed ? 'line-through' : 'none',
                    }}>
                      {meal.name}
                    </div>

                    {meal.foods && (
                      <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {meal.foods}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PRÓXIMOS LEMBRETES */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Bell size={18} />
              </div>
              <h2 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Lembretes de Hoje</h2>
            </div>

            <button
              onClick={() => onNavigateTab('reminders')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--neon-pink)',
                fontSize: '0.813rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Ver Todos</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {remindersToday.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px 16px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
            }}>
              <Bell size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '14px' }}>
                Nenhum lembrete para hoje.
              </p>
              <button onClick={onOpenAddReminder} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.813rem' }}>
                + Cadastrar Lembrete
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {remindersToday.map((rem) => {
                const isCompleted = rem.is_completed_today;
                const isUrgent = rem.priority === 'Urgente';

                return (
                  <div
                    key={rem.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isCompleted 
                        ? 'rgba(16, 185, 129, 0.06)' 
                        : isUrgent 
                        ? 'rgba(255, 42, 133, 0.08)' 
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isCompleted 
                        ? '1px solid rgba(16, 185, 129, 0.3)' 
                        : isUrgent 
                        ? '1px solid var(--neon-pink-border)' 
                        : '1px solid var(--border-glass)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <button
                      onClick={() => handleReminderCheck(rem)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        border: isCompleted ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                        background: isCompleted ? 'var(--neon-emerald)' : 'transparent',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        marginTop: '2px',
                        boxShadow: isCompleted ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                      }}
                      title={isCompleted ? 'Desmarcar' : 'Concluir lembrete'}
                    >
                      {isCompleted && <Check size={16} strokeWidth={3} />}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span className={`badge-priority ${rem.priority.toLowerCase()}`}>
                          {rem.priority}
                        </span>
                        {rem.reminder_time && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={12} />
                            {rem.reminder_time}
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          • {rem.category_name || rem.reminder_type}
                        </span>
                      </div>

                      <div style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.938rem',
                        fontWeight: 600,
                        color: isCompleted ? 'var(--text-muted)' : '#ffffff',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                      }}>
                        {rem.title}
                      </div>

                      {rem.description && (
                        <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rem.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
