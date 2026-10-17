import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DietView } from './components/DietView';
import { RemindersView } from './components/RemindersView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { MealModal } from './components/MealModal';
import { ReminderModal } from './components/ReminderModal';
import { ChatGPTImportModal } from './components/ChatGPTImportModal';
import { AuthModal } from './components/AuthModal';
import { ConfirmModal } from './components/ConfirmModal';

import { ActiveTab, Meal, Reminder, ReminderCategory } from './types/database';
import { AuthService, AuthUser } from './services/authService';
import { MealsService } from './services/mealsService';
import { RemindersService } from './services/remindersService';
import { CategoriesService } from './services/categoriesService';
import { HistoryService, HistoryItem } from './services/historyService';
import { PushService } from './services/pushService';
import { isSupabaseConfigured } from './lib/supabase';
import { getTodayDateString } from './services/storageService';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [todayDateStr, setTodayDateStr] = useState<string>(getTodayDateString());
  const [currentMondayStr, setCurrentMondayStr] = useState<string>('');

  // Domain data
  const [meals, setMeals] = useState<Meal[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [categories, setCategories] = useState<ReminderCategory[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [defaultMealDate, setDefaultMealDate] = useState<string>(getTodayDateString());

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [defaultReminderDate, setDefaultReminderDate] = useState<string>(getTodayDateString());

  const [isChatGPTImportOpen, setIsChatGPTImportOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Calculate Monday of current week
  const calculateCurrentMonday = () => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sun, 1 is Mon
    const distanceToMonday = day === 0 ? -6 : 1 - day;
    const mon = new Date(today);
    mon.setDate(today.getDate() + distanceToMonday);
    return mon.toISOString().split('T')[0];
  };

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);

      const today = getTodayDateString();
      setTodayDateStr(today);
      const monStr = calculateCurrentMonday();
      setCurrentMondayStr(monStr);

      // End of current week (Sunday)
      const sun = new Date(monStr + 'T00:00:00');
      sun.setDate(sun.getDate() + 6);
      const sunStr = sun.toISOString().split('T')[0];

      const [loadedCategories, loadedMeals, loadedReminders, loadedHistory] = await Promise.all([
        CategoriesService.getCategories(),
        MealsService.getMealsForWeek(monStr, sunStr),
        RemindersService.getAllReminders(),
        HistoryService.getHistoryItems(),
      ]);

      setCategories(loadedCategories);
      setMeals(loadedMeals);
      setHistoryItems(loadedHistory);

      // Calculate occurrences for reminders
      const completions = await RemindersService.getCompletions();
      const remindersWithStatus = loadedReminders.map((r) => {
        const isCompleted = completions.some(
          (c) => c.reminder_id === r.id && c.occurrence_date === today
        ) || (r.recurrence_rule === 'none' && r.status === 'Concluído');

        return {
          ...r,
          computed_date: r.reminder_date,
          is_completed_today: isCompleted,
        };
      });

      setReminders(remindersWithStatus);
    } catch (err) {
      console.error('Erro ao carregar dados do Minha Rotina:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialization & Service Worker
  useEffect(() => {
    PushService.registerServiceWorker();
    loadData();

    // Check URL parameters for PWA shortcuts
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as ActiveTab;
    const actionParam = params.get('action');

    if (tabParam && ['dashboard', 'diet', 'reminders', 'history', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    if (actionParam === 'new') {
      if (tabParam === 'diet') {
        setIsMealModalOpen(true);
      } else if (tabParam === 'reminders') {
        setIsReminderModalOpen(true);
      }
    }
  }, [loadData]);

  // Meal Handlers
  const handleToggleMeal = async (mealId: string, currentStatus: boolean) => {
    const updated = await MealsService.toggleMealCompletion(mealId, !currentStatus);
    if (updated) {
      setMeals((prev) => prev.map((m) => (m.id === mealId ? updated : m)));
      // Update history in background
      HistoryService.getHistoryItems().then(setHistoryItems);
    }
  };

  const handleSaveMeal = async (mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingMeal) {
      const updated = await MealsService.updateMeal(editingMeal.id, mealData);
      if (updated) {
        setMeals((prev) => prev.map((m) => (m.id === editingMeal.id ? updated : m)));
      }
    } else {
      const added = await MealsService.addMeal(mealData);
      setMeals((prev) => [...prev, added]);
    }
    HistoryService.getHistoryItems().then(setHistoryItems);
  };

  const handleDeleteMeal = (mealId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Refeição',
      message: 'Tem certeza que deseja excluir esta refeição do seu planejamento alimentar?',
      onConfirm: async () => {
        await MealsService.deleteMeal(mealId);
        setMeals((prev) => prev.filter((m) => m.id !== mealId));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        HistoryService.getHistoryItems().then(setHistoryItems);
      },
    });
  };

  // Reminder Handlers
  const handleToggleReminder = async (reminderId: string, occurrenceDate: string, currentStatus: boolean) => {
    await RemindersService.toggleReminderCompletion(reminderId, occurrenceDate, !currentStatus);
    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminderId ? { ...r, is_completed_today: !currentStatus } : r
      )
    );
    HistoryService.getHistoryItems().then(setHistoryItems);
  };

  const handleToggleFavorite = async (reminderId: string, currentFav: boolean) => {
    await RemindersService.toggleFavorite(reminderId, currentFav);
    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminderId ? { ...r, is_favorite: !currentFav } : r
      )
    );
  };

  const handleSaveReminder = async (reminderData: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingReminder) {
      const updated = await RemindersService.updateReminder(editingReminder.id, reminderData);
      if (updated) {
        setReminders((prev) => prev.map((r) => (r.id === editingReminder.id ? { ...r, ...updated } : r)));
      }
    } else {
      const added = await RemindersService.addReminder(reminderData);
      setReminders((prev) => [added, ...prev]);
    }
    HistoryService.getHistoryItems().then(setHistoryItems);
  };

  const handleDeleteReminder = (reminderId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Lembrete',
      message: 'Tem certeza que deseja excluir este lembrete e todo o histórico de suas ocorrências?',
      onConfirm: async () => {
        await RemindersService.deleteReminder(reminderId);
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        HistoryService.getHistoryItems().then(setHistoryItems);
      },
    });
  };

  // History Handlers
  const handleRestoreHistoryItem = async (item: HistoryItem) => {
    await HistoryService.restoreItem(item);
    await loadData();
  };

  const handleDeleteHistoryItem = (item: HistoryItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Item do Histórico',
      message: `Tem certeza que deseja excluir definitivamente "${item.title}"?`,
      onConfirm: async () => {
        await HistoryService.deleteItem(item);
        setHistoryItems((prev) => prev.filter((h) => h.id !== item.id));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await loadData();
      },
    });
  };

  const mealsToday = meals.filter((m) => m.meal_date === todayDateStr);
  const pendingRemindersCount = reminders.filter((r) => !r.is_completed_today).length;
  const isSupabaseLive = isSupabaseConfigured();

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAdd={() => setIsReminderModalOpen(true)}
        isSupabaseLive={isSupabaseLive}
        userName={currentUser?.nome || 'Carol'}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        pendingCount={pendingRemindersCount}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '32px' }}>
        {activeTab === 'dashboard' && (
          <DashboardView
            userName={currentUser?.nome || 'Carol'}
            todayDateStr={todayDateStr}
            mealsToday={mealsToday}
            remindersToday={reminders}
            onToggleMeal={handleToggleMeal}
            onToggleReminder={handleToggleReminder}
            onNavigateTab={setActiveTab}
            onOpenAddMeal={() => {
              setEditingMeal(null);
              setDefaultMealDate(todayDateStr);
              setIsMealModalOpen(true);
            }}
            onOpenAddReminder={() => {
              setEditingReminder(null);
              setDefaultReminderDate(todayDateStr);
              setIsReminderModalOpen(true);
            }}
            onOpenChatGPTImport={() => setIsChatGPTImportOpen(true)}
          />
        )}

        {activeTab === 'diet' && (
          <DietView
            meals={meals}
            onToggleMeal={handleToggleMeal}
            onEditMeal={(meal) => {
              setEditingMeal(meal);
              setDefaultMealDate(meal.meal_date);
              setIsMealModalOpen(true);
            }}
            onDeleteMeal={handleDeleteMeal}
            onOpenAddMeal={(selectedDate) => {
              setEditingMeal(null);
              setDefaultMealDate(selectedDate);
              setIsMealModalOpen(true);
            }}
            onOpenChatGPTImport={() => setIsChatGPTImportOpen(true)}
            currentMondayDate={currentMondayStr || calculateCurrentMonday()}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            reminders={reminders}
            categories={categories}
            todayDateStr={todayDateStr}
            onToggleReminder={handleToggleReminder}
            onToggleFavorite={handleToggleFavorite}
            onEditReminder={(rem) => {
              setEditingReminder(rem);
              setDefaultReminderDate(rem.computed_date || rem.reminder_date);
              setIsReminderModalOpen(true);
            }}
            onDeleteReminder={handleDeleteReminder}
            onOpenAddReminder={(defaultDate) => {
              setEditingReminder(null);
              setDefaultReminderDate(defaultDate || todayDateStr);
              setIsReminderModalOpen(true);
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            historyItems={historyItems}
            onRestoreItem={handleRestoreHistoryItem}
            onDeleteItem={handleDeleteHistoryItem}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            categories={categories}
            onCategoriesChange={() => CategoriesService.getCategories().then(setCategories)}
            onUserDataChange={loadData}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* MODALS */}
      <MealModal
        isOpen={isMealModalOpen}
        onClose={() => {
          setIsMealModalOpen(false);
          setEditingMeal(null);
        }}
        onSave={handleSaveMeal}
        initialMeal={editingMeal}
        defaultDate={defaultMealDate}
      />

      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        initialReminder={editingReminder}
        categories={categories}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
        defaultDate={defaultReminderDate}
      />

      <ChatGPTImportModal
        isOpen={isChatGPTImportOpen}
        onClose={() => setIsChatGPTImportOpen(false)}
        onSuccess={(count) => {
          loadData();
          setActiveTab('diet');
        }}
        currentMondayDate={currentMondayStr || calculateCurrentMonday()}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthChange={loadData}
        onOpenSettings={() => setActiveTab('settings')}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default App;
