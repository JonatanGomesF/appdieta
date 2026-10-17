import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthService } from './authService';

export interface PushStatus {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  isStandalone: boolean; // True if installed as PWA on iPhone Home Screen
  isSubscribed: boolean;
  subscription?: PushSubscription | null;
}

// Default standard VAPID public key for web push development / staging
const DEFAULT_VAPID_PUBLIC_KEY = 
  import.meta.env.VITE_VAPID_PUBLIC_KEY || 
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

export const PushService = {
  isIPhone(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  },

  isStandalonePWA(): boolean {
    // Check if running as installed standalone PWA (required for iPhone Web Push!)
    const isStandaloneNavigator = (window.navigator as any).standalone === true;
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
    return Boolean(isStandaloneNavigator || isStandaloneDisplay);
  },

  isPushSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  async getStatus(): Promise<PushStatus> {
    const supported = this.isPushSupported();
    const isStandalone = this.isStandalonePWA();

    if (!supported) {
      return {
        supported: false,
        permission: 'unsupported',
        isStandalone,
        isSubscribed: false,
      };
    }

    const permission = Notification.permission;
    let isSubscribed = false;
    let subscription: PushSubscription | null = null;

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        subscription = await reg.pushManager.getSubscription();
        isSubscribed = Boolean(subscription);
      }
    } catch (e) {
      console.warn('Erro ao verificar push subscription:', e);
    }

    return {
      supported: true,
      permission,
      isStandalone,
      isSubscribed,
      subscription,
    };
  },

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[SW] Service Worker registrado com sucesso:', registration.scope);
      return registration;
    } catch (err) {
      console.error('[SW] Falha ao registrar Service Worker:', err);
      return null;
    }
  },

  async subscribeUser(vapidPublicKey = DEFAULT_VAPID_PUBLIC_KEY): Promise<{ success: boolean; error?: string }> {
    if (!this.isPushSupported()) {
      return { success: false, error: 'Notificações Web Push não são suportadas neste navegador.' };
    }

    // On iOS, Web Push is only allowed if PWA is installed on Home Screen
    if (this.isIPhone() && !this.isStandalonePWA()) {
      return {
        success: false,
        error: 'No iPhone, adicione primeiro o aplicativo à Tela de Início pelo Safari para ativar as notificações push.',
      };
    }

    try {
      // 1. Request Notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'Permissão de notificação negada pelo usuário.' };
      }

      // 2. Ensure Service Worker is registered and ready
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = (await this.registerServiceWorker()) || undefined;
      }
      if (!reg) {
        return { success: false, error: 'Não foi possível carregar o Service Worker.' };
      }

      await navigator.serviceWorker.ready;

      // 3. Subscribe to push manager with VAPID
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as unknown as BufferSource,
        });
      }

      // 4. Save subscription to database / user account
      const subJson = sub.toJSON();
      await this.saveSubscriptionToBackend(subJson);

      return { success: true };
    } catch (err: any) {
      console.error('Erro ao inscrever para push:', err);
      return { success: false, error: err.message || 'Erro ao ativar notificações.' };
    }
  },

  async unsubscribeUser(): Promise<boolean> {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          return true;
        }
      }
      return true;
    } catch (e) {
      console.warn('Erro ao desinscrever push:', e);
      return false;
    }
  },

  async saveSubscriptionToBackend(subJson: any): Promise<void> {
    const user = await AuthService.getCurrentUser();
    if (!user || !subJson.endpoint) return;

    if (isSupabaseConfigured() && supabase && !user.isDemo) {
      try {
        await supabase.from('push_subscriptions').upsert(
          {
            user_id: user.id,
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh || '',
            auth: subJson.keys?.auth || '',
            user_agent: navigator.userAgent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );
      } catch (err) {
        console.warn('Erro ao salvar subscription no Supabase:', err);
      }
    }

    // Local storage persistence
    localStorage.setItem('minha_rotina_push_subscription', JSON.stringify(subJson));
  },

  /**
   * Envia uma notificação de teste real imediatamente para validar no aparelho
   */
  async sendTestNotification(): Promise<{ success: boolean; message: string }> {
    if (!this.isPushSupported()) {
      return { success: false, message: 'Notificações não são suportadas neste navegador.' };
    }

    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        return { success: false, message: 'Permissão de notificação não concedida.' };
      }
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await (reg as any).showNotification('💖 Minha Rotina: Notificação Ativa!', {
          body: 'Seu iPhone e dispositivo estão configurados e prontos para receber avisos da sua dieta e lembretes!',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
          tag: 'test-notification',
          data: { url: '/?tab=reminders' },
        });
        return { success: true, message: 'Notificação de teste enviada com sucesso!' };
      } else {
        new Notification('💖 Minha Rotina: Notificação Ativa!', {
          body: 'Seu dispositivo está pronto para receber alertas!',
          icon: '/icon-192.png',
        });
        return { success: true, message: 'Notificação disparada com sucesso!' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao disparar notificação.' };
    }
  },

  urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },
};
