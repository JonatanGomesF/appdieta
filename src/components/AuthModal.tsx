import React, { useState } from 'react';
import { X, Lock, Mail, User, LogOut, Check, AlertCircle, Sparkles } from 'lucide-react';
import { AuthService, AuthUser } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onAuthChange: () => void;
  onOpenSettings: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthChange,
  onOpenSettings,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await AuthService.signIn(email, password);
        if (!res.success) throw new Error(res.error || 'Falha no login');
        onAuthChange();
        onClose();
      } else if (mode === 'signup') {
        const res = await AuthService.signUp(email, password, nome);
        if (!res.success) throw new Error(res.error || 'Falha no cadastro');
        setSuccessMsg('Cadastro realizado com sucesso!');
        setTimeout(() => {
          onAuthChange();
          onClose();
        }, 1200);
      } else if (mode === 'forgot') {
        const res = await AuthService.resetPassword(email);
        if (!res.success) throw new Error(res.error || 'Falha ao recuperar senha');
        setSuccessMsg('Instruções de recuperação enviadas para seu e-mail!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.signOut();
    onAuthChange();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', padding: '28px' }}
      >
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
              <Lock size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
                {currentUser ? 'Minha Conta' : mode === 'signin' ? 'Entrar' : mode === 'signup' ? 'Cadastrar' : 'Recuperar Senha'}
              </h2>
              <p style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                {currentUser ? 'Gerencie seus dados e acesso' : 'Autenticação segura via Supabase Auth'}
              </p>
            </div>
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

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}>
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {currentUser ? (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-glass)',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff2a85, #ec4899)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(255, 42, 133, 0.35)',
              }}>
                {currentUser.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                  {currentUser.nome}
                </div>
                <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                  {currentUser.email}
                </div>
                <div style={{
                  display: 'inline-block',
                  fontSize: '0.688rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: currentUser.isDemo ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: currentUser.isDemo ? '#fbbf24' : '#34d399',
                  border: currentUser.isDemo ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  marginTop: '6px',
                }}>
                  {currentUser.isDemo ? 'Modo Demonstração Ativo' : 'Autenticado no Supabase'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
              >
                Abrir Configurações e Banco de Dados
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleLogout}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                  boxShadow: '0 4px 18px rgba(239, 68, 68, 0.3)',
                }}
              >
                <LogOut size={16} />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Seu Nome
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-glass"
                    style={{ paddingLeft: '40px' }}
                    placeholder="Carol"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-glass"
                  style={{ paddingLeft: '40px' }}
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                    Senha
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--neon-pink)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    className="input-glass"
                    style={{ paddingLeft: '40px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }} disabled={isSubmitting}>
              <Sparkles size={16} />
              <span>
                {isSubmitting
                  ? 'Processando...'
                  : mode === 'signin'
                  ? 'Entrar no Minha Rotina'
                  : mode === 'signup'
                  ? 'Criar Conta'
                  : 'Enviar Link de Recuperação'}
              </span>
            </button>

            {/* Switch Mode Links */}
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
              {mode === 'signin' && (
                <div>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    style={{ background: 'none', border: 'none', color: 'var(--neon-pink)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Criar conta agora
                  </button>
                </div>
              )}
              {mode === 'signup' && (
                <div>
                  Já possui conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    style={{ background: 'none', border: 'none', color: 'var(--neon-pink)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Fazer login
                  </button>
                </div>
              )}
              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Voltar ao login
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
