import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Clock, 
  Calendar, 
  AlertCircle, 
  FileText,
  ChevronDown,
  ChevronRight,
  Utensils
} from 'lucide-react';
import { MealsService, ParsedDietDay } from '../services/mealsService';
import { Meal } from '../types/database';

interface ChatGPTImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
  currentMondayDate: string;
}

const SAMPLE_CHATGPT_DIET = `Cardápio Semanal Nutritivo

Segunda-feira:
- Café da manhã (07:30): 2 ovos mexidos, 1 fatia de pão 100% integral com azeite e 1 xícara de café preto sem açúcar.
- Lanche da manhã (10:00): 1 maçã gala média picada com 1 colher de sopa de canela e 4 castanhas de caju.
- Almoço (12:30): 140g de peito de frango grelhado, 4 colheres de sopa de arroz integral, 1 concha de feijão carioca e salada de alface e tomate à vontade com azeite extra virgem.
- Lanche da tarde (16:00): 1 iogurte proteico desnatado com 20g de aveia em flocos.
- Jantar (19:30): Omelete de 2 ovos com espinafre e tomatinhos cereja, acompanhado de salada verde.
- Ceia (21:30): 1 xícara de chá de camomila morno com 5 nozes.

Terça-feira:
- Café da manhã (07:30): Smoothie de 1 banana congelada, 200ml de leite vegetal e 1 scoop de whey protein.
- Lanche da manhã (10:00): 1 fatia de melão e 1 colher de sementes de abóbora.
- Almoço (12:30): 150g de filé de tilápia assada com limão e alecrim, 100g de purê de mandioquinha e brócolis cozido ao vapor.
- Lanche da tarde (16:00): 2 torradas integrais com pasta de amendoim integral e café.
- Jantar (19:30): Prato fundo de sopa de legumes com frango desfiado (abobrinha, chuchu e cenoura).
- Ceia (21:30): Chá de erva-cidreira com 1 colher de chia hidratada.`;

export const ChatGPTImportModal: React.FC<ChatGPTImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentMondayDate,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsedDays, setParsedDays] = useState<ParsedDietDay[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleParse = () => {
    if (!inputText.trim()) {
      setErrorMsg('Por favor, cole o texto da dieta fornecido pelo ChatGPT.');
      return;
    }

    setErrorMsg('');
    const result = MealsService.parseChatGPTDiet(inputText, currentMondayDate);
    const totalMealsFound = result.reduce((acc, d) => acc + d.meals.length, 0);

    if (totalMealsFound === 0) {
      setErrorMsg('Não foi possível identificar refeições no texto fornecido. Verifique o formato e tente novamente.');
      return;
    }

    setParsedDays(result);
    setStep('preview');
  };

  const handleToggleDay = (dayIndex: number) => {
    setParsedDays((prev) =>
      prev.map((d) => (d.dayIndex === dayIndex ? { ...d, selected: !d.selected } : d))
    );
  };

  const handleUpdateMeal = (
    dayIndex: number,
    mealIndex: number,
    field: keyof Omit<Meal, 'id' | 'user_id'>,
    value: string
  ) => {
    setParsedDays((prev) =>
      prev.map((d) => {
        if (d.dayIndex !== dayIndex) return d;
        const newMeals = [...d.meals];
        newMeals[mealIndex] = {
          ...newMeals[mealIndex],
          [field]: value,
        };
        return { ...d, meals: newMeals };
      })
    );
  };

  const handleDeleteParsedMeal = (dayIndex: number, mealIndex: number) => {
    setParsedDays((prev) =>
      prev.map((d) => {
        if (d.dayIndex !== dayIndex) return d;
        return {
          ...d,
          meals: d.meals.filter((_, idx) => idx !== mealIndex),
        };
      })
    );
  };

  const handleConfirmImport = async () => {
    setIsSaving(true);
    try {
      const mealsToInsert: Omit<Meal, 'id' | 'user_id'>[] = [];

      parsedDays.forEach((day) => {
        if (day.selected) {
          day.meals.forEach((meal) => {
            mealsToInsert.push({
              ...meal,
              meal_date: day.date,
            });
          });
        }
      });

      if (mealsToInsert.length === 0) {
        setErrorMsg('Nenhuma refeição selecionada para importação.');
        setIsSaving(false);
        return;
      }

      const importedCount = await MealsService.importMealsBatch(mealsToInsert);
      onSuccess(importedCount);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar refeições no banco.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalSelectedMeals = parsedDays.reduce((acc, d) => (d.selected ? acc + d.meals.length : acc), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff2a85, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(255, 42, 133, 0.4)',
            }}>
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
                Importar Dieta do ChatGPT
              </h2>
              <p style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                {step === 'input' 
                  ? 'Cole o cardápio recebido do ChatGPT para importar automaticamente' 
                  : 'Revise e edite as refeições antes de salvar no banco de dados'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-icon" 
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            fontSize: '0.875rem',
            marginBottom: '16px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: TEXT INPUT */}
        {step === 'input' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Texto do Cardápio / Dieta
              </label>
              <button
                type="button"
                onClick={() => setInputText(SAMPLE_CHATGPT_DIET)}
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
                <FileText size={14} />
                Carregar Exemplo
              </button>
            </div>

            <textarea
              className="input-glass"
              rows={11}
              placeholder="Cole aqui o cardápio gerado pelo ChatGPT... Exemplo:&#10;&#10;Segunda-feira:&#10;- Café da manhã (07:30): 2 ovos com aveia e café&#10;- Almoço (12:30): 150g de frango, arroz integral e brócolis&#10;..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: '1.5',
              }}
            />

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              background: 'rgba(255, 42, 133, 0.08)',
              border: '1px solid var(--neon-pink-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginTop: '16px',
              fontSize: '0.813rem',
              color: 'var(--text-secondary)',
            }}>
              <Sparkles size={16} color="var(--neon-pink)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Processamento 100% Local:</strong> Nosso algoritmo inteligente identifica dias, categorias, horários e quantidades sem custo de API e sem enviar seus dados pessoais para serviços externos.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleParse}>
                <Sparkles size={16} />
                <span>Processar e Pré-visualizar</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: EDITABLE PREVIEW */}
        {step === 'preview' && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              padding: '10px 14px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Total de <strong style={{ color: 'var(--neon-pink)' }}>{totalSelectedMeals}</strong> refeições prontas para importação
              </span>
              <button
                type="button"
                onClick={() => setStep('input')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.813rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Voltar e alterar texto
              </button>
            </div>

            {/* Accordion of Days */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {parsedDays.map((day) => {
                const isExpanded = expandedDay === day.dayIndex;
                const hasMeals = day.meals.length > 0;

                return (
                  <div
                    key={day.dayIndex}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: day.selected ? '1px solid var(--neon-pink-border)' : '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Day Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: day.selected ? 'rgba(255, 42, 133, 0.06)' : 'transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          checked={day.selected}
                          onChange={() => handleToggleDay(day.dayIndex)}
                          style={{
                            accentColor: 'var(--neon-pink)',
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                          }}
                        />
                        <div>
                          <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '0.938rem',
                            fontWeight: 600,
                            color: day.selected ? '#ffffff' : 'var(--text-muted)',
                          }}>
                            {day.dayName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {day.meals.length} refeições identificadas
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedDay(isExpanded ? null : day.dayIndex)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.813rem',
                        }}
                      >
                        <span>{isExpanded ? 'Recolher' : 'Editar itens'}</span>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>

                    {/* Day Meals List */}
                    {isExpanded && (
                      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-glass)' }}>
                        {day.meals.length === 0 ? (
                          <div style={{ fontSize: '0.813rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                            Nenhuma refeição neste dia.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {day.meals.map((meal, mIdx) => (
                              <div
                                key={mIdx}
                                style={{
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  border: '1px solid var(--border-glass)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                }}
                              >
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  {/* Meal Category & Time */}
                                  <input
                                    type="time"
                                    className="input-glass"
                                    style={{ width: '105px', padding: '6px 10px', fontSize: '0.813rem' }}
                                    value={meal.meal_time}
                                    onChange={(e) => handleUpdateMeal(day.dayIndex, mIdx, 'meal_time', e.target.value)}
                                  />
                                  <input
                                    type="text"
                                    className="input-glass"
                                    placeholder="Nome da refeição"
                                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.813rem' }}
                                    value={meal.name}
                                    onChange={(e) => handleUpdateMeal(day.dayIndex, mIdx, 'name', e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteParsedMeal(day.dayIndex, mIdx)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      padding: '4px',
                                    }}
                                    title="Remover refeição"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>

                                <textarea
                                  className="input-glass"
                                  rows={2}
                                  placeholder="Alimentos e quantidades"
                                  style={{ padding: '6px 10px', fontSize: '0.813rem', resize: 'vertical' }}
                                  value={meal.foods}
                                  onChange={(e) => handleUpdateMeal(day.dayIndex, mIdx, 'foods', e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep('input')}
                disabled={isSaving}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmImport}
                disabled={isSaving || totalSelectedMeals === 0}
              >
                <Check size={16} />
                <span>{isSaving ? 'Salvando...' : `Salvar ${totalSelectedMeals} Refeições no Banco`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
