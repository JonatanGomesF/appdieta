import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  List, 
  Star, 
  Clock, 
  Check, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  ArrowUpDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Reminder, ReminderCategory, PriorityLevel } from '../types/database';
import { RemindersService } from '../services/remindersService';

interface RemindersViewProps {
  reminders: Reminder[];
  categories: ReminderCategory[];
  todayDateStr: string;
  onToggleReminder: (reminderId: string, occurrenceDate: string, currentStatus: boolean) => Promise<void>;
  onToggleFavorite: (reminderId: string, currentFav: boolean) => Promise<void>;
  onEditReminder: (reminder: Reminder) => void;
  onDeleteReminder: (reminderId: string) => void;
  onOpenAddReminder: (defaultDate?: string) => void;
}

type FilterChip = 'hoje' | 'amanha' | 'proximos7' | 'mes' | 'todos' | 'atrasados' | 'concluidos' | 'favoritos';

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  categories,
  todayDateStr,
  onToggleReminder,
  onToggleFavorite,
  onEditReminder,
  onDeleteReminder,
  onOpenAddReminder,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterChip>('hoje');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  // Calendar State
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayDateStr);

  const filterChips: { id: FilterChip; label: string }[] = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'amanha', label: 'Amanhã' },
    { id: 'proximos7', label: 'Próximos 7 dias' },
    { id: 'mes', label: 'Este mês' },
    { id: 'todos', label: 'Todos' },
    { id: 'atrasados', label: 'Atrasados' },
    { id: 'concluidos', label: 'Concluídos' },
    { id: 'favoritos', label: 'Favoritos' },
  ];

  // Helper date calculations
  const today = new Date(todayDateStr + 'T00:00:00');
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split('T')[0];

  // Filter and sort items
  const filteredReminders = useMemo(() => {
    return reminders.filter((rem) => {
      const isCompleted = rem.is_completed_today || rem.status === 'Concluído';
      const targetDate = rem.computed_date || rem.reminder_date;

      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = rem.title.toLowerCase().includes(query);
        const matchesDesc = (rem.description || '').toLowerCase().includes(query);
        const matchesCat = (rem.category_name || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }

      // 2. Chip Filters
      if (activeFilter === 'hoje') {
        return targetDate === todayDateStr && !isCompleted;
      }
      if (activeFilter === 'amanha') {
        return targetDate === tomorrowStr && !isCompleted;
      }
      if (activeFilter === 'proximos7') {
        return targetDate >= todayDateStr && targetDate <= in7DaysStr && !isCompleted;
      }
      if (activeFilter === 'mes') {
        return targetDate.startsWith(`${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`) && !isCompleted;
      }
      if (activeFilter === 'atrasados') {
        return targetDate < todayDateStr && !isCompleted;
      }
      if (activeFilter === 'concluidos') {
        return isCompleted;
      }
      if (activeFilter === 'favoritos') {
        return rem.is_favorite;
      }
      if (activeFilter === 'todos') {
        return !isCompleted;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        const pA = RemindersService.getPriorityWeight(a.priority);
        const pB = RemindersService.getPriorityWeight(b.priority);
        if (pA !== pB) return pB - pA;
      }
      const dateA = (a.computed_date || a.reminder_date) + (a.reminder_time || '00:00');
      const dateB = (b.computed_date || b.reminder_date) + (b.reminder_time || '00:00');
      return dateA.localeCompare(dateB);
    });
  }, [reminders, activeFilter, searchQuery, sortBy, todayDateStr, tomorrowStr, in7DaysStr, calendarYear, calendarMonth]);

  const handleToggle = async (rem: Reminder) => {
    const isCompleted = rem.is_completed_today || rem.status === 'Concluído';
    if (!isCompleted) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ff2a85', '#10b981', '#38bdf8'],
      });
    }
    await onToggleReminder(rem.id, rem.computed_date || rem.reminder_date, isCompleted);
  };

  // Calendar generation helpers
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 is Sun

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const calendarRemindersForSelectedDate = useMemo(() => {
    return reminders.filter((r) => {
      const rDate = r.computed_date || r.reminder_date;
      return rDate === selectedCalendarDate;
    });
  }, [reminders, selectedCalendarDate]);

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
            }}>Lembretes Importantes</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              • Central de Tarefas & Avisos
            </span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tudo o que você precisa lembrar hoje, nos próximos dias e na sua vida
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-glass)',
          }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: viewMode === 'list' ? 'var(--neon-pink-subtle)' : 'transparent',
                border: viewMode === 'list' ? '1px solid var(--neon-pink-border)' : '1px solid transparent',
                color: viewMode === 'list' ? 'var(--neon-pink)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.813rem',
                fontWeight: 600,
              }}
            >
              <List size={15} />
              <span>Lista</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: viewMode === 'calendar' ? 'var(--neon-pink-subtle)' : 'transparent',
                border: viewMode === 'calendar' ? '1px solid var(--neon-pink-border)' : '1px solid transparent',
                color: viewMode === 'calendar' ? 'var(--neon-pink)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.813rem',
                fontWeight: 600,
              }}
            >
              <CalendarIcon size={15} />
              <span>Calendário</span>
            </button>
          </div>

          <button
            onClick={() => onOpenAddReminder()}
            className="btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            <span>+ Novo Lembrete</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & CONTROLS */}
      <div 
        className="glass-panel" 
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-glass"
            style={{ paddingLeft: '38px', paddingRight: '14px' }}
            placeholder="Buscar por título, descrição ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sort By Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.813rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpDown size={14} /> Ordenar:
          </span>
          <button
            onClick={() => setSortBy(sortBy === 'date' ? 'priority' : 'date')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              fontSize: '0.813rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {sortBy === 'date' ? 'Por Horário / Data' : 'Por Prioridade (Urgente primeiro)'}
          </button>
        </div>
      </div>

      {/* 3. FILTER CHIPS */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {filterChips.map((chip) => {
          const isActive = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`chip ${isActive ? 'active' : ''}`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* 4. CONTENT VIEW: LIST OR CALENDAR */}
      {viewMode === 'list' ? (
        /* ================= LIST VIEW ================= */
        <div>
          {filteredReminders.length === 0 ? (
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
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px',
              }}>
                <Bell size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
                Nenhum lembrete encontrado neste filtro
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
                {searchQuery 
                  ? 'Nenhum resultado corresponde à sua busca.' 
                  : 'Você está em dia com seus compromissos ou ainda não cadastrou lembretes para este período.'}
              </p>
              <button
                onClick={() => onOpenAddReminder()}
                className="btn-primary"
                style={{ marginTop: '10px' }}
              >
                <Plus size={16} />
                <span>+ Novo Lembrete</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredReminders.map((rem) => {
                const isCompleted = rem.is_completed_today || rem.status === 'Concluído';
                const isOverdue = (rem.computed_date || rem.reminder_date) < todayDateStr && !isCompleted;
                const isUrgent = rem.priority === 'Urgente';

                return (
                  <div
                    key={rem.id}
                    className="glass-panel glass-panel-interactive"
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      background: isCompleted 
                        ? 'rgba(16, 185, 129, 0.05)' 
                        : isOverdue 
                        ? 'rgba(239, 68, 68, 0.08)' 
                        : isUrgent 
                        ? 'rgba(255, 42, 133, 0.08)' 
                        : 'var(--bg-card)',
                      borderColor: isCompleted 
                        ? 'rgba(16, 185, 129, 0.3)' 
                        : isOverdue 
                        ? 'rgba(239, 68, 68, 0.4)' 
                        : isUrgent 
                        ? 'var(--neon-pink-border)' 
                        : 'var(--border-glass)',
                    }}
                  >
                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggle(rem)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '9px',
                        border: isCompleted ? 'none' : '2px solid rgba(255, 255, 255, 0.25)',
                        background: isCompleted ? 'var(--neon-emerald)' : 'transparent',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        marginTop: '2px',
                        boxShadow: isCompleted ? '0 0 12px rgba(16, 185, 129, 0.6)' : 'none',
                        transition: 'all var(--transition-fast)',
                      }}
                      title={isCompleted ? 'Desmarcar' : 'Concluir lembrete'}
                    >
                      {isCompleted && <Check size={18} strokeWidth={3} />}
                    </button>

                    {/* Main Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {/* Priority Badge */}
                        <span className={`badge-priority ${rem.priority.toLowerCase()}`}>
                          {rem.priority}
                        </span>

                        {/* Category Tag */}
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                        }}>
                          {rem.category_name || rem.reminder_type}
                        </span>

                        {/* Date & Time */}
                        <span style={{
                          fontSize: '0.75rem',
                          color: isOverdue ? '#f87171' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <Clock size={12} />
                          {rem.computed_date || rem.reminder_date}
                          {rem.reminder_time && ` às ${rem.reminder_time}`}
                        </span>

                        {/* Recurrence Badge */}
                        {rem.recurrence_rule && rem.recurrence_rule !== 'none' && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#c084fc',
                            background: 'rgba(168, 85, 247, 0.12)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <Repeat size={12} />
                            Recorrente ({rem.recurrence_rule})
                          </span>
                        )}

                        {isOverdue && (
                          <span style={{
                            fontSize: '0.688rem',
                            fontWeight: 700,
                            color: '#ef4444',
                            background: 'rgba(239, 68, 68, 0.15)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}>
                            ATRASADO
                          </span>
                        )}
                      </div>

                      <h3 style={{
                        fontSize: '1.1rem',
                        color: isCompleted ? 'var(--text-muted)' : '#ffffff',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        marginBottom: rem.description ? '6px' : '0',
                      }}>
                        {rem.title}
                      </h3>

                      {rem.description && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5',
                        }}>
                          {rem.description}
                        </p>
                      )}
                    </div>

                    {/* Actions: Favorite, Edit, Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className={`btn-icon ${rem.is_favorite ? 'active-fav' : ''}`}
                        onClick={() => onToggleFavorite(rem.id, rem.is_favorite)}
                        title={rem.is_favorite ? 'Remover dos favoritos' : 'Favoritar'}
                      >
                        <Star size={16} fill={rem.is_favorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onEditReminder(rem)}
                        title="Editar lembrete"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onDeleteReminder(rem.id)}
                        title="Excluir lembrete"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= CALENDAR VIEW ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            {/* Calendar Month Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
                {monthNames[calendarMonth]} de {calendarYear}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-icon" onClick={handlePrevMonth}>
                  <ChevronLeft size={18} />
                </button>
                <button type="button" className="btn-icon" onClick={handleNextMonth}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Calendar Days Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '8px' }}>
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {/* Empty leading slots */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: '70px', borderRadius: 'var(--radius-md)', background: 'transparent' }} />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isToday = dateStr === todayDateStr;
                const isSelected = dateStr === selectedCalendarDate;

                // Find reminders on this day
                const dayRems = reminders.filter((r) => (r.computed_date || r.reminder_date) === dateStr);
                const hasUrgent = dayRems.some((r) => r.priority === 'Urgente');

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    style={{
                      height: '76px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected 
                        ? 'var(--neon-pink-subtle)' 
                        : isToday 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected 
                        ? '1px solid var(--neon-pink)' 
                        : isToday 
                        ? '1px solid rgba(255, 255, 255, 0.25)' 
                        : '1px solid var(--border-glass)',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        fontSize: '0.813rem',
                        fontWeight: isToday || isSelected ? 800 : 500,
                        color: isSelected ? 'var(--neon-pink)' : isToday ? '#ffffff' : 'var(--text-secondary)',
                      }}>
                        {dayNum}
                      </span>
                      {hasUrgent && (
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--neon-pink)',
                          boxShadow: '0 0 6px var(--neon-pink)',
                        }} />
                      )}
                    </div>

                    {/* Day Mini Indicators */}
                    {dayRems.length > 0 && (
                      <div style={{
                        fontSize: '0.688rem',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}>
                        {dayRems.length} lembrete(s)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Reminders Pane */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>
                  Lembretes para {selectedCalendarDate}
                </h3>
                <p style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                  {calendarRemindersForSelectedDate.length} item(ns) agendado(s)
                </p>
              </div>

              <button
                onClick={() => onOpenAddReminder(selectedCalendarDate)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.813rem' }}
              >
                <Plus size={15} />
                <span>+ Adicionar neste dia</span>
              </button>
            </div>

            {calendarRemindersForSelectedDate.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic', padding: '16px 0' }}>
                Nenhum lembrete para esta data selecionada.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {calendarRemindersForSelectedDate.map((rem) => (
                  <div
                    key={rem.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-glass)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span className={`badge-priority ${rem.priority.toLowerCase()}`}>
                          {rem.priority}
                        </span>
                        {rem.reminder_time && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            às {rem.reminder_time}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#ffffff' }}>
                        {rem.title}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-icon" onClick={() => onEditReminder(rem)}>
                        <Edit3 size={15} />
                      </button>
                      <button className="btn-icon" onClick={() => onDeleteReminder(rem.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
