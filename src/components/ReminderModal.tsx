import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Calendar, 
  Clock, 
  Star, 
  Repeat, 
  Tag, 
  Check, 
  AlertCircle,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import { Reminder, ReminderCategory, PriorityLevel, RecurrenceRule, ReminderType } from '../types/database';
import { CategoriesService } from '../services/categoriesService';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialReminder?: Reminder | null;
  categories: ReminderCategory[];
  onCategoryCreated: (newCat: ReminderCategory) => void;
  defaultDate?: string;
}

const PRIORITIES: PriorityLevel[] = ['Baixa', 'Normal', 'Alta', 'Urgente'];

const RECURRENCE_OPTIONS: { id: RecurrenceRule; label: string }[] = [
  { id: 'none', label: 'Sem repetição' },
  { id: 'daily', label: 'Todos os dias' },
  { id: 'weekly', label: 'Toda semana' },
  { id: 'weekdays', label: 'Dias úteis (Seg a Sex)' },
  { id: 'monthly', label: 'A cada mês' },
  { id: 'yearly', label: 'Todos os anos' },
];

const ADVANCE_OPTIONS = [
  { value: 0, label: 'No horário programado' },
  { value: 5, label: '5 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 1440, label: '1 dia antes' },
];

const REMINDER_TYPES: ReminderType[] = [
  'Pessoal',
  'Família',
  'Saúde e consultas',
  'Trabalho',
  'Contas e pagamentos',
  'Documentos',
  'Compras',
  'Compromissos',
  'Metas pessoais',
  'Outros',
];

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialReminder,
  categories,
  onCategoryCreated,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [reminderType, setReminderType] = useState<string>('Compromissos');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [hasTime, setHasTime] = useState(true);
  const [priority, setPriority] = useState<PriorityLevel>('Normal');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>('none');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [advanceMinutes, setAdvanceMinutes] = useState(15);
  const [isFavorite, setIsFavorite] = useState(false);

  // New Category inline creation
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialReminder) {
      setTitle(initialReminder.title);
      setDescription(initialReminder.description || '');
      setCategoryId(initialReminder.category_id || (categories[0]?.id || ''));
      setReminderType(initialReminder.reminder_type || 'Compromissos');
      setReminderDate(initialReminder.reminder_date);
      setReminderTime(initialReminder.reminder_time || '09:00');
      setHasTime(Boolean(initialReminder.reminder_time));
      setPriority(initialReminder.priority);
      setRecurrenceRule(initialReminder.recurrence_rule);
      setNotificationEnabled(initialReminder.notification_enabled);
      setAdvanceMinutes(initialReminder.notification_advance_minutes);
      setIsFavorite(initialReminder.is_favorite);
    } else {
      const today = defaultDate || new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setReminderType('Compromissos');
      setReminderDate(today);
      setReminderTime('09:00');
      setHasTime(true);
      setPriority('Normal');
      setRecurrenceRule('none');
      setNotificationEnabled(true);
      setAdvanceMinutes(15);
      setIsFavorite(false);
    }
    setShowNewCategory(false);
    setNewCatName('');
    setErrorMsg('');
  }, [initialReminder, isOpen, categories, defaultDate]);

  if (!isOpen) return null;

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const newCat = await CategoriesService.addCategory(newCatName.trim());
      onCategoryCreated(newCat);
      setCategoryId(newCat.id);
      setShowNewCategory(false);
      setNewCatName('');
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar categoria.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Por favor, informe o título do lembrete.');
      return;
    }
    if (!reminderDate) {
      setErrorMsg('Por favor, informe a data do lembrete.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId || undefined,
        reminder_type: reminderType,
        reminder_date: reminderDate,
        reminder_time: hasTime ? reminderTime : undefined,
        priority,
        status: initialReminder ? initialReminder.status : 'Pendente',
        is_favorite: isFavorite,
        recurrence_rule: recurrenceRule,
        notification_enabled: notificationEnabled,
        notification_advance_minutes: advanceMinutes,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar lembrete.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '26px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff2a85, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(255, 42, 133, 0.4)',
            }}>
              <Bell size={22} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
                {initialReminder ? 'Editar Lembrete' : 'Novo Lembrete Importante'}
              </h2>
              <p style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                Cadastre seus compromissos, tarefas e datas especiais
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`btn-icon ${isFavorite ? 'active-fav' : ''}`}
              onClick={() => setIsFavorite(!isFavorite)}
              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar lembrete'}
            >
              <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button type="button" className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Título do Lembrete *
            </label>
            <input
              type="text"
              className="input-glass"
              placeholder="Ex: Consulta Médica, Pagar fatura, Aniversário..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Descrição ou Detalhes
            </label>
            <textarea
              className="input-glass"
              rows={2}
              placeholder="Observações importantes, endereço, itens a levar ou informações adicionais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category & Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                  Categoria
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--neon-pink)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {showNewCategory ? 'Cancelar' : '+ Nova'}
                </button>
              </div>

              {!showNewCategory ? (
                <select
                  className="input-glass"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="Nome da categoria"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.813rem' }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleCreateCategory}
                    style={{ padding: '8px 12px', fontSize: '0.75rem' }}
                  >
                    Criar
                  </button>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Tipo
              </label>
              <select
                className="input-glass"
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value)}
              >
                {REMINDER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Data *
              </label>
              <input
                type="date"
                className="input-glass"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                  Horário (opcional)
                </label>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="checkbox"
                    checked={hasTime}
                    onChange={(e) => setHasTime(e.target.checked)}
                    style={{ accentColor: 'var(--neon-pink)' }}
                  />
                  Ativar
                </label>
              </div>
              <input
                type="time"
                className="input-glass"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                disabled={!hasTime}
                style={{ opacity: hasTime ? 1 : 0.4 }}
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Prioridade
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p;
                let bgActive = 'var(--neon-pink-subtle)';
                let borderActive = 'var(--neon-pink)';
                let colorActive = 'var(--neon-pink)';

                if (p === 'Alta') {
                  bgActive = 'rgba(245, 158, 11, 0.15)';
                  borderActive = '#f59e0b';
                  colorActive = '#fbbf24';
                } else if (p === 'Normal') {
                  bgActive = 'rgba(168, 85, 247, 0.15)';
                  borderActive = '#a855f7';
                  colorActive = '#c084fc';
                } else if (p === 'Baixa') {
                  bgActive = 'rgba(6, 182, 212, 0.15)';
                  borderActive = '#06b6d4';
                  colorActive = '#38bdf8';
                }

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? bgActive : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? `1px solid ${borderActive}` : '1px solid var(--border-glass)',
                      color: isSelected ? colorActive : 'var(--text-secondary)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.813rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      textAlign: 'center',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recurrence & Notification Advance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Repetição / Recorrência
              </label>
              <select
                className="input-glass"
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceRule)}
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Avisar com antecedência
              </label>
              <select
                className="input-glass"
                value={advanceMinutes}
                onChange={(e) => setAdvanceMinutes(Number(e.target.value))}
                disabled={!notificationEnabled || !hasTime}
                style={{ opacity: notificationEnabled && hasTime ? 1 : 0.4 }}
              >
                {ADVANCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notification Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={18} color="var(--neon-pink)" />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Notificação no Dispositivo
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Alerta push no iPhone e notificações no navegador
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationEnabled}
              onChange={(e) => setNotificationEnabled(e.target.checked)}
              style={{
                accentColor: 'var(--neon-pink)',
                width: '18px',
                height: '18px',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Check size={16} />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Lembrete'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
