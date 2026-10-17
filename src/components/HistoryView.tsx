import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  RotateCcw, 
  Utensils, 
  Bell, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { HistoryItem } from '../services/historyService';

interface HistoryViewProps {
  historyItems: HistoryItem[];
  onRestoreItem: (item: HistoryItem) => Promise<void>;
  onDeleteItem: (item: HistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyItems,
  onRestoreItem,
  onDeleteItem,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'meals' | 'reminders'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      // Type filter
      if (filterType === 'meals' && item.type !== 'meal') return false;
      if (filterType === 'reminders' && item.type !== 'reminder') return false;

      // Text query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesDetails = (item.details || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesDetails) return false;
      }

      return true;
    });
  }, [historyItems, filterType, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* 1. HEADER */}
      <div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: 'linear-gradient(90deg, #ff2a85, #ff6ba8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Histórico de Atividades</span>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            • Consultas & Registros Concluídos
          </span>
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Acompanhe o registro de tudo o que você concluiu na sua dieta e na sua rotina diária
        </p>
      </div>

      {/* 2. SEARCH & FILTER CHIPS */}
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
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-glass"
            style={{ paddingLeft: '38px', paddingRight: '14px' }}
            placeholder="Buscar no histórico por nome ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilterType('all')}
            className={`chip ${filterType === 'all' ? 'active' : ''}`}
          >
            Todos ({historyItems.length})
          </button>
          <button
            onClick={() => setFilterType('meals')}
            className={`chip ${filterType === 'meals' ? 'active' : ''}`}
          >
            Refeições ({historyItems.filter((h) => h.type === 'meal').length})
          </button>
          <button
            onClick={() => setFilterType('reminders')}
            className={`chip ${filterType === 'reminders' ? 'active' : ''}`}
          >
            Lembretes ({historyItems.filter((h) => h.type === 'reminder').length})
          </button>
        </div>
      </div>

      {/* 3. LIST OF HISTORY ITEMS */}
      {filteredItems.length === 0 ? (
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
            background: 'rgba(255, 42, 133, 0.1)',
            color: 'var(--neon-pink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
          }}>
            <History size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
            Nenhum registro encontrado no histórico
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
            Conforme você for concluindo suas refeições e lembretes diários, eles serão salvos aqui automaticamente!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="glass-panel glass-panel-interactive"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                {/* Type Icon */}
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: item.type === 'meal' ? 'rgba(255, 42, 133, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                  color: item.type === 'meal' ? 'var(--neon-pink)' : '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {item.type === 'meal' ? <Utensils size={18} /> : <Bell size={18} />}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: item.type === 'meal' ? 'var(--neon-pink)' : '#c084fc',
                      background: item.type === 'meal' ? 'var(--neon-pink-subtle)' : 'rgba(168, 85, 247, 0.12)',
                      padding: '1px 7px',
                      borderRadius: 'var(--radius-full)',
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {item.originalDate}
                    </span>
                  </div>

                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.title}
                  </div>

                  {item.details && (
                    <div style={{
                      fontSize: '0.813rem',
                      color: 'var(--text-secondary)',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.details}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions: Restore & Delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onRestoreItem(item)}
                  style={{ padding: '6px 12px', fontSize: '0.813rem' }}
                  title="Desmarcar como concluído e restaurar para a lista ativa"
                >
                  <RotateCcw size={14} />
                  <span>Restaurar</span>
                </button>

                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => onDeleteItem(item)}
                  title="Excluir definitivamente"
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
