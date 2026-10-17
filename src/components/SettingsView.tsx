import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Smartphone, 
  Bell, 
  Database, 
  User, 
  Check, 
  AlertCircle, 
  Share2, 
  PlusSquare, 
  ExternalLink,
  Shield,
  Trash2,
  Plus,
  RefreshCw,
  LogOut,
  Sparkles
} from 'lucide-react';
import { PushService, PushStatus } from '../services/pushService';
import { AuthService, AuthUser } from '../services/authService';
import { ReminderCategory, UserSettings } from '../types/database';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  clearSupabaseCredentials, 
  testSupabaseConnection,
  isSupabaseConfigured 
} from '../lib/supabase';
import { LocalStore } from '../services/storageService';
import { CategoriesService } from '../services/categoriesService';

interface SettingsViewProps {
  currentUser: AuthUser | null;
  categories: ReminderCategory[];
  onCategoriesChange: () => void;
  onUserDataChange: () => void;
  onOpenAuth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  categories,
  onCategoriesChange,
  onUserDataChange,
  onOpenAuth,
}) => {
  // Push status state
  const [pushStatus, setPushStatus] = useState<PushStatus>({
    supported: false,
    permission: 'default',
    isStandalone: false,
    isSubscribed: false,
  });
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Name
  const [displayName, setDisplayName] = useState(currentUser?.nome || 'Carol');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Default reminder advance
  const [defaultAdvance, setDefaultAdvance] = useState(15);

  // Categories
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#ff2a85');

  // Supabase Credentials
  const initialCreds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialCreds.anonKey);
  const [dbTesting, setDbTesting] = useState(false);
  const [dbMessage, setDbMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isIPhoneDevice = PushService.isIPhone();

  useEffect(() => {
    checkPush();
  }, []);

  const checkPush = async () => {
    const status = await PushService.getStatus();
    setPushStatus(status);
  };

  const handleSubscribePush = async () => {
    setPushLoading(true);
    setPushMessage(null);
    try {
      const result = await PushService.subscribeUser();
      if (result.success) {
        setPushMessage({ type: 'success', text: 'Notificações push autorizadas com sucesso no seu aparelho!' });
        await checkPush();
      } else {
        setPushMessage({ type: 'error', text: result.error || 'Falha ao autorizar notificações.' });
      }
    } catch (err: any) {
      setPushMessage({ type: 'error', text: err.message || 'Erro inesperado.' });
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestPush = async () => {
    setPushLoading(true);
    setPushMessage(null);
    try {
      const result = await PushService.sendTestNotification();
      if (result.success) {
        setPushMessage({ type: 'success', text: '🔔 Notificação de teste disparada! Verifique a tela do seu aparelho.' });
      } else {
        setPushMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setPushMessage({ type: 'error', text: err.message || 'Erro ao enviar teste.' });
    } finally {
      setPushLoading(false);
    }
  };

  const handleSaveProfileName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setProfileSaving(true);
    try {
      await AuthService.updateProfileName(displayName.trim());
      setProfileMessage('Nome atualizado com sucesso!');
      onUserDataChange();
      setTimeout(() => setProfileMessage(''), 3000);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await CategoriesService.addCategory(newCatName.trim(), 'tag', newCatColor);
      setNewCatName('');
      onCategoriesChange();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      await CategoriesService.deleteCategory(catId);
      onCategoriesChange();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestAndSaveDb = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setDbMessage({ type: 'error', text: 'Informe a URL do Supabase e a Chave Anon.' });
      return;
    }

    setDbTesting(true);
    setDbMessage(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
      if (res.success) {
        saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
        setDbMessage({ type: 'success', text: 'Conectado com sucesso ao Supabase PostgreSQL!' });
        onUserDataChange();
      } else {
        setDbMessage({ type: 'error', text: res.message });
      }
    } finally {
      setDbTesting(false);
    }
  };

  const handleClearDbConfig = () => {
    clearSupabaseCredentials();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setDbMessage({ type: 'success', text: 'Credenciais removidas. Modo Local ativado.' });
    onUserDataChange();
  };

  const handleResetDemoData = () => {
    if (window.confirm('Deseja restaurar as refeições e lembretes de demonstração da Carol?')) {
      LocalStore.resetToDemo();
      onUserDataChange();
      onCategoriesChange();
      alert('Dados de demonstração restaurados com sucesso!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* 1. HEADER */}
      <div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: 'linear-gradient(90deg, #ff2a85, #ff6ba8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Configurações</span>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            • Preferências & Dispositivo
          </span>
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Gerencie notificações push para iPhone, banco de dados Supabase e perfil
        </p>
      </div>

      {/* 2. PWA & WEB PUSH IPHONE iOS 16.4+ HUB */}
      <div 
        className="glass-panel" 
        style={{
          padding: '24px',
          border: '1px solid var(--neon-pink-border)',
          background: 'linear-gradient(135deg, rgba(255, 42, 133, 0.05), rgba(15, 17, 25, 0.85))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ff2a85, #9333ea)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(255, 42, 133, 0.4)',
          }}>
            <Smartphone size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
              Notificações Push no iPhone (iOS 16.4+) & Navegador
            </h2>
            <p style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
              Receba alertas reais na tela bloqueada e na Central de Notificações
            </p>
          </div>
        </div>

        {pushMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: pushMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: pushMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
            color: pushMessage.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.875rem',
            marginBottom: '18px',
          }}>
            {pushMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{pushMessage.text}</span>
          </div>
        )}

        {/* Status badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status da Permissão</div>
            <div style={{ fontSize: '0.938rem', fontWeight: 600, color: pushStatus.permission === 'granted' ? '#34d399' : '#fbbf24', marginTop: '2px' }}>
              {pushStatus.permission === 'granted' ? 'Autorizada (Ativa)' : pushStatus.permission === 'denied' ? 'Bloqueada pelo Usuário' : 'Não Solicitada'}
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Modo de Execução</div>
            <div style={{ fontSize: '0.938rem', fontWeight: 600, color: pushStatus.isStandalone ? '#38bdf8' : 'var(--text-primary)', marginTop: '2px' }}>
              {pushStatus.isStandalone ? 'PWA Instalado na Tela de Início' : 'Navegador Web Comum'}
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inscrição Web Push</div>
            <div style={{ fontSize: '0.938rem', fontWeight: 600, color: pushStatus.isSubscribed ? '#34d399' : 'var(--text-secondary)', marginTop: '2px' }}>
              {pushStatus.isSubscribed ? 'Inscrito e Ativo' : 'Pendente'}
            </div>
          </div>
        </div>

        {/* Push Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={handleSubscribePush}
            className="btn-primary"
            disabled={pushLoading}
          >
            <Bell size={16} />
            <span>{pushStatus.isSubscribed ? 'Revalidar Inscrição Push' : 'Ativar Notificações no Aparelho'}</span>
          </button>

          <button
            onClick={handleTestPush}
            className="btn-neon-outline"
            disabled={pushLoading}
          >
            <Sparkles size={16} />
            <span>Enviar Notificação de Teste Agora</span>
          </button>
        </div>

        {/* IPHONE iOS 16.4+ STEP BY STEP GUIDE */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-glass-bright)',
          borderRadius: 'var(--radius-md)',
          padding: '18px',
        }}>
          <h4 style={{ fontSize: '0.938rem', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={16} color="var(--neon-pink)" />
            Como instalar e ativar as Notificações no iPhone (Passo a Passo Oficial da Apple):
          </h4>

          <ol style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingLeft: '20px',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.5',
          }}>
            <li>
              Abra este site no <strong style={{ color: '#ffffff' }}>Safari</strong> no seu iPhone (iOS 16.4 ou superior).
            </li>
            <li>
              Toque no botão central inferior de <strong style={{ color: '#ffffff' }}>Compartilhar</strong> (o quadrado com a seta para cima <Share2 size={13} style={{ display: 'inline' }} />).
            </li>
            <li>
              Role a tela para baixo e selecione <strong style={{ color: 'var(--neon-pink)' }}>Adicionar à Tela de Início</strong> (<PlusSquare size={13} style={{ display: 'inline' }} />).
            </li>
            <li>
              Feche o Safari e <strong style={{ color: '#ffffff' }}>abra o aplicativo pelo novo ícone na Tela de Início</strong>.
            </li>
            <li>
              Toque no botão <strong style={{ color: 'var(--neon-pink)' }}>"Ativar Notificações no Aparelho"</strong> e selecione <strong style={{ color: '#ffffff' }}>Permitir</strong> quando o iOS perguntar.
            </li>
          </ol>
        </div>
      </div>

      {/* 3. PERFIL & NOME */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <User size={20} color="var(--neon-pink)" />
          <h2 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Perfil Pessoal</h2>
        </div>

        {profileMessage && (
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
            <span>{profileMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfileName} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Seu Nome de Exibição
            </label>
            <input
              type="text"
              className="input-glass"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Carol"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={profileSaving}>
            <Check size={16} />
            <span>{profileSaving ? 'Salvando...' : 'Atualizar Nome'}</span>
          </button>
        </form>
      </div>

      {/* 4. GERENCIADOR DE CATEGORIAS */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <SettingsIcon size={20} color="var(--neon-pink)" />
          <h2 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Categorias de Lembretes</h2>
        </div>

        <form onSubmit={handleAddCategory} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            className="input-glass"
            style={{ flex: 1, minWidth: '200px' }}
            placeholder="Nova categoria (ex: Estudos, Viagens, Pets...)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            <Plus size={16} />
            <span>Adicionar</span>
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {categories.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color || 'var(--neon-pink)' }} />
              <span>{c.name}</span>
              <button
                type="button"
                onClick={() => handleDeleteCategory(c.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                title="Excluir categoria"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. BANCO DE DADOS SUPABASE POSTGRESQL */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={20} color="var(--neon-pink)" />
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Banco de Dados Supabase (PostgreSQL)</h2>
              <p style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                {isSupabaseConfigured() ? 'Conectado ao seu projeto Supabase na nuvem' : 'Executando em Modo Local / Demonstração'}
              </p>
            </div>
          </div>

          <div style={{
            fontSize: '0.75rem',
            padding: '3px 10px',
            borderRadius: '12px',
            background: isSupabaseConfigured() ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: isSupabaseConfigured() ? '#34d399' : '#fbbf24',
            border: isSupabaseConfigured() ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            fontWeight: 600,
          }}>
            {isSupabaseConfigured() ? 'SUPABASE REAL' : 'MODO LOCAL'}
          </div>
        </div>

        {dbMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: dbMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: dbMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
            color: dbMessage.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}>
            {dbMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{dbMessage.text}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Project URL do Supabase
            </label>
            <input
              type="text"
              className="input-glass"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Project API Anon Key (Pública)
            </label>
            <input
              type="password"
              className="input-glass"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleTestAndSaveDb}
            disabled={dbTesting}
          >
            <Check size={16} />
            <span>{dbTesting ? 'Testando Conexão...' : 'Testar e Conectar ao Supabase'}</span>
          </button>

          {isSupabaseConfigured() && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClearDbConfig}
            >
              Desconectar e Voltar ao Modo Local
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={handleResetDemoData}
            title="Recarrega as refeições e lembretes de exemplo"
          >
            <RefreshCw size={15} />
            <span>Restaurar Dados Demo da Carol</span>
          </button>
        </div>
      </div>

      {/* 6. CONTA E SESSÃO */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>
            {currentUser?.email ? `Sessão ativa: ${currentUser.email}` : 'Você está em uma sessão local'}
          </div>
          <div style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
            Faça login com sua conta para sincronizar todos os dispositivos
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={onOpenAuth}
        >
          {currentUser ? 'Gerenciar Conta' : 'Fazer Login / Cadastro'}
        </button>
      </div>
    </div>
  );
};
