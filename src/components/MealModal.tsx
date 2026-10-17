import React, { useState, useEffect } from 'react';
import { X, Utensils, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { Meal, MealCategory } from '../types/database';

interface MealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialMeal?: Meal | null;
  defaultDate: string;
}

const CATEGORIES: MealCategory[] = [
  'Café da manhã',
  'Lanche da manhã',
  'Almoço',
  'Lanche da tarde',
  'Jantar',
  'Ceia',
];

export const MealModal: React.FC<MealModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMeal,
  defaultDate,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Café da manhã');
  const [mealDate, setMealDate] = useState(defaultDate);
  const [mealTime, setMealTime] = useState('08:00');
  const [foods, setFoods] = useState('');
  const [quantities, setQuantities] = useState('');
  const [notes, setNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialMeal) {
      setName(initialMeal.name);
      setCategory(initialMeal.category);
      setMealDate(initialMeal.meal_date);
      setMealTime(initialMeal.meal_time || '08:00');
      setFoods(initialMeal.foods || '');
      setQuantities(initialMeal.quantities || '');
      setNotes(initialMeal.notes || '');
      setIsCompleted(initialMeal.is_completed);
    } else {
      setName('');
      setCategory('Café da manhã');
      setMealDate(defaultDate);
      setMealTime('08:00');
      setFoods('');
      setQuantities('');
      setNotes('');
      setIsCompleted(false);
    }
    setErrorMsg('');
  }, [initialMeal, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor, informe o nome ou descrição da refeição.');
      return;
    }
    if (!mealDate) {
      setErrorMsg('Por favor, selecione a data da refeição.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        meal_date: mealDate,
        meal_time: mealTime,
        foods: foods.trim(),
        quantities: quantities.trim(),
        notes: notes.trim(),
        is_completed: isCompleted,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar refeição.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff2a85, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(255, 42, 133, 0.4)',
            }}>
              <Utensils size={20} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
              {initialMeal ? 'Editar Refeição' : 'Nova Refeição'}
            </h2>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
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
          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nome da Refeição *
            </label>
            <input
              type="text"
              className="input-glass"
              placeholder="Ex: Ovos mexidos com aveia e mamão"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Categoria
              </label>
              <select
                className="input-glass"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Horário da Refeição
              </label>
              <input
                type="time"
                className="input-glass"
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Data da Refeição
            </label>
            <input
              type="date"
              className="input-glass"
              value={mealDate}
              onChange={(e) => setMealDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Alimentos e Ingredientes
            </label>
            <textarea
              className="input-glass"
              rows={3}
              placeholder="Ex: 2 ovos caipiras, 30g de aveia em flocos, 1 banana prata picada com canela"
              value={foods}
              onChange={(e) => setFoods(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Quantidades e Unidades de Medida
            </label>
            <input
              type="text"
              className="input-glass"
              placeholder="Ex: 2 un, 140g, 4 colheres de sopa, 1 scoop"
              value={quantities}
              onChange={(e) => setQuantities(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Observações (opcional)
            </label>
            <input
              type="text"
              className="input-glass"
              placeholder="Ex: Tomar com 300ml de água morna; usar pouco sal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
          }}>
            <input
              type="checkbox"
              id="mealCompletedCheck"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              style={{
                accentColor: 'var(--neon-pink)',
                width: '18px',
                height: '18px',
                cursor: 'pointer',
              }}
            />
            <label htmlFor="mealCompletedCheck" style={{ fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
              Marcar como já consumida/concluída
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Check size={16} />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Refeição'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
