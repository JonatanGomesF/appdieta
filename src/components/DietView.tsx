import React, { useState } from 'react';
import { 
  Utensils, 
  Plus, 
  Sparkles, 
  Clock, 
  Check, 
  Edit3, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Meal } from '../types/database';

interface DietViewProps {
  meals: Meal[];
  onToggleMeal: (mealId: string, currentStatus: boolean) => Promise<void>;
  onEditMeal: (meal: Meal) => void;
  onDeleteMeal: (mealId: string) => void;
  onOpenAddMeal: (selectedDate: string) => void;
  onOpenChatGPTImport: () => void;
  currentMondayDate: string;
}

const WEEKDAYS = [
  { index: 0, short: 'Seg', name: 'Segunda-feira' },
  { index: 1, short: 'Ter', name: 'Terça-feira' },
  { index: 2, short: 'Qua', name: 'Quarta-feira' },
  { index: 3, short: 'Qui', name: 'Quinta-feira' },
  { index: 4, short: 'Sex', name: 'Sexta-feira' },
  { index: 5, short: 'Sáb', name: 'Sábado' },
  { index: 6, short: 'Dom', name: 'Domingo' },
];

export const DietView: React.FC<DietViewProps> = ({
  meals,
  onToggleMeal,
  onEditMeal,
  onDeleteMeal,
  onOpenAddMeal,
  onOpenChatGPTImport,
  currentMondayDate,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Calculate the dates for each day in the current week
  const monday = new Date(currentMondayDate + 'T00:00:00');
  const weekDates = WEEKDAYS.map((w) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + w.index);
    return {
      ...w,
      dateStr: d.toISOString().split('T')[0],
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    };
  });

  const activeDay = weekDates[selectedDayIndex];
  const dayMeals = meals.filter((m) => m.meal_date === activeDay.dateStr);

  const completedDayMeals = dayMeals.filter((m) => m.is_completed).length;
  const totalDayMeals = dayMeals.length;
  const progressPercent = totalDayMeals > 0 ? Math.round((completedDayMeals / totalDayMeals) * 100) : 0;

  const handleToggle = async (meal: Meal) => {
    if (!meal.is_completed) {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#ff2a85', '#10b981', '#38bdf8'],
      });
    }
    await onToggleMeal(meal.id, meal.is_completed);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* 1. HEADER WITH ACTIONS */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: 'linear-gradient(90deg, #ff2a85, #ff6ba8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Minha Dieta</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              • Planejamento Semanal
            </span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Organize suas refeições, calorias e alimentos para os 7 dias da semana
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={onOpenChatGPTImport}
            className="btn-neon-outline"
            style={{ padding: '9px 18px', fontSize: '0.875rem' }}
          >
            <Sparkles size={16} />
            <span>Importar do ChatGPT</span>
          </button>
          <button
            onClick={() => onOpenAddMeal(activeDay.dateStr)}
            className="btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            <span>+ Adicionar Refeição</span>
          </button>
        </div>
      </div>

      {/* 2. WEEKDAY SWITCHER TABS */}
      <div 
        className="glass-panel" 
        style={{
          padding: '14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          overflowX: 'auto',
        }}
      >
        {weekDates.map((day) => {
          const isSelected = selectedDayIndex === day.index;
          const dayMealsCount = meals.filter((m) => m.meal_date === day.dateStr);
          const dayCompletedCount = dayMealsCount.filter((m) => m.is_completed).length;
          const isAllDone = dayMealsCount.length > 0 && dayMealsCount.length === dayCompletedCount;

          return (
            <button
              key={day.index}
              onClick={() => setSelectedDayIndex(day.index)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '10px 6px',
                borderRadius: 'var(--radius-md)',
                background: isSelected 
                  ? 'var(--neon-pink-subtle)' 
                  : 'rgba(255, 255, 255, 0.02)',
                border: isSelected 
                  ? '1px solid var(--neon-pink)' 
                  : '1px solid var(--border-glass)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                position: 'relative',
              }}
            >
              <span style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? 'var(--neon-pink)' : 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>
                {day.short}
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                color: isSelected ? '#ffffff' : 'var(--text-primary)',
              }}>
                {day.dayNum}
              </span>

              {/* Status Dot / Count */}
              {dayMealsCount.length > 0 ? (
                <span style={{
                  fontSize: '0.688rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isAllDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  color: isAllDone ? '#34d399' : 'var(--text-secondary)',
                  fontWeight: 600,
                  marginTop: '2px',
                }}>
                  {dayCompletedCount}/{dayMealsCount.length}
                </span>
              ) : (
                <span style={{ fontSize: '0.688rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  —
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE DAY PROGRESS & SUMMARY BANNER */}
      <div 
        className="glass-panel" 
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>{activeDay.name}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({activeDay.dayNum} de {activeDay.monthName})
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {totalDayMeals > 0 
              ? `${completedDayMeals} de ${totalDayMeals} refeições concluídas hoje` 
              : 'Nenhuma refeição cadastrada para este dia'}
          </div>
        </div>

        <div style={{ minWidth: '220px', flex: '1', maxWidth: '380px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>Progresso da Alimentação</span>
            <strong style={{ color: 'var(--neon-pink)' }}>{progressPercent}%</strong>
          </div>
          <div className="progress-container">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* 4. LIST OF MEALS FOR THE DAY */}
      {dayMeals.length === 0 ? (
        <div 
          className="glass-panel" 
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--neon-pink-subtle)',
            color: 'var(--neon-pink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
          }}>
            <Utensils size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
            Nenhuma refeição planejada para {activeDay.name}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
            Você pode adicionar as refeições individualmente ou colar todo o cardápio recebido do ChatGPT para importar de uma só vez!
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              onClick={() => onOpenAddMeal(activeDay.dateStr)}
              className="btn-primary"
            >
              <Plus size={16} />
              <span>+ Adicionar Refeição</span>
            </button>
            <button
              onClick={onOpenChatGPTImport}
              className="btn-secondary"
            >
              <Sparkles size={16} color="var(--neon-pink)" />
              <span>Importar do ChatGPT</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {dayMeals.map((meal) => (
            <div
              key={meal.id}
              className="glass-panel glass-panel-interactive"
              style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                background: meal.is_completed 
                  ? 'rgba(16, 185, 129, 0.05)' 
                  : 'var(--bg-card)',
                borderColor: meal.is_completed 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : 'var(--border-glass)',
              }}
            >
              {/* Completion Checkbox */}
              <button
                onClick={() => handleToggle(meal)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  border: meal.is_completed ? 'none' : '2px solid rgba(255, 255, 255, 0.25)',
                  background: meal.is_completed ? 'var(--neon-emerald)' : 'transparent',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginTop: '2px',
                  boxShadow: meal.is_completed ? '0 0 12px rgba(16, 185, 129, 0.6)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
                title={meal.is_completed ? 'Marcar como não concluído' : 'Marcar como concluído'}
              >
                {meal.is_completed && <Check size={20} strokeWidth={3} />}
              </button>

              {/* Meal Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--neon-pink)',
                    background: 'var(--neon-pink-subtle)',
                    border: '1px solid var(--neon-pink-border)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    {meal.category}
                  </span>

                  {meal.meal_time && (
                    <span style={{
                      fontSize: '0.813rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                    }}>
                      <Clock size={13} />
                      {meal.meal_time}
                    </span>
                  )}
                </div>

                <h3 style={{
                  fontSize: '1.15rem',
                  color: meal.is_completed ? 'var(--text-muted)' : '#ffffff',
                  textDecoration: meal.is_completed ? 'line-through' : 'none',
                  marginBottom: '8px',
                }}>
                  {meal.name}
                </h3>

                {meal.foods && (
                  <div style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-glass)',
                    marginBottom: '8px',
                    lineHeight: '1.5',
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 600 }}>
                      ALIMENTOS & QUANTIDADES:
                    </div>
                    {meal.foods}
                  </div>
                )}

                {meal.quantities && meal.quantities !== meal.foods && (
                  <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <strong>Medidas:</strong> {meal.quantities}
                  </div>
                )}

                {meal.notes && (
                  <div style={{
                    fontSize: '0.813rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontStyle: 'italic',
                  }}>
                    <Info size={13} style={{ flexShrink: 0 }} />
                    <span>Obs: {meal.notes}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Edit, Delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => onEditMeal(meal)}
                  title="Editar refeição"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => onDeleteMeal(meal.id)}
                  title="Excluir refeição"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
