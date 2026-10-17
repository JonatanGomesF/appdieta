import React from 'react';
import { 
  Home, 
  Utensils, 
  Bell, 
  History, 
  Settings, 
  Plus, 
  Sparkles,
  Database
} from 'lucide-react';
import { ActiveTab } from '../types/database';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickAdd: () => void;
  isSupabaseLive: boolean;
  userName: string;
  onOpenAuth: () => void;
  pendingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onQuickAdd,
  isSupabaseLive,
  userName,
  onOpenAuth,
  pendingCount,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<any>; badge?: number }[] = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'diet', label: 'Minha Dieta', icon: Utensils },
    { id: 'reminders', label: 'Lembretes', icon: Bell, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* ================= DESKTOP HEADER NAVBAR ================= */}
      <header className="hide-on-mobile" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(8, 9, 14, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '12px 28px',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo & Brand */}
          <div 
            onClick={() => onTabChange('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff2a85, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 18px rgba(255, 42, 133, 0.4)',
            }}>
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, #ffffff, #f1f5f9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                Minha Rotina
                <span style={{
                  fontSize: '0.688rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'var(--neon-pink-subtle)',
                  color: 'var(--neon-pink)',
                  border: '1px solid var(--neon-pink-border)',
                }}>
                  DIETA & LEMBRETES
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Organização pessoal & bem-estar
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: isActive ? 'var(--neon-pink-subtle)' : 'transparent',
                    border: isActive ? '1px solid var(--neon-pink-border)' : '1px solid transparent',
                    color: isActive ? 'var(--neon-pink)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span style={{
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      background: 'var(--neon-pink)',
                      color: '#ffffff',
                      fontSize: '0.688rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 5px',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Quick Add, Supabase status, Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Database indicator */}
            <div 
              onClick={() => onTabChange('settings')}
              title={isSupabaseLive ? 'Supabase Conectado' : 'Modo Demonstração Ativo'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: isSupabaseLive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: isSupabaseLive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                fontSize: '0.75rem',
                color: isSupabaseLive ? '#34d399' : '#fbbf24',
                cursor: 'pointer',
              }}
            >
              <Database size={13} />
              <span>{isSupabaseLive ? 'Supabase Live' : 'Modo Local'}</span>
            </div>

            {/* Quick Add Button */}
            <button
              onClick={onQuickAdd}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.875rem' }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>+ Adicionar</span>
            </button>

            {/* User Profile Avatar */}
            <button
              onClick={onOpenAuth}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px 5px 6px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff2a85, #ec4899)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span>{userName}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MOBILE TOP HEADER ================= */}
      <div className="hide-on-desktop" style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(8, 9, 14, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff2a85, #9333ea)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(255, 42, 133, 0.4)',
          }}>
            <Sparkles size={18} color="#ffffff" />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            Minha Rotina
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onQuickAdd}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.813rem', borderRadius: 'var(--radius-full)' }}
          >
            <Plus size={15} />
            <span>Novo</span>
          </button>
          <div 
            onClick={onOpenAuth}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff2a85, #ec4899)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR ================= */}
      <nav className="hide-on-desktop safe-bottom" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(10, 12, 18, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--border-glass-bright)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 12px',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--neon-pink)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px 0',
                position: 'relative',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{
                position: 'relative',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                background: isActive ? 'var(--neon-pink-subtle)' : 'transparent',
                transition: 'background var(--transition-fast)',
              }}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge && item.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '6px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--neon-pink)',
                    color: '#ffffff',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(255, 42, 133, 0.6)',
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '0.688rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: isActive ? 600 : 500,
                letterSpacing: '-0.01em',
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
