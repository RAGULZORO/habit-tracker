import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Habit } from './types.ts';
import MonthlyGrid from './components/MonthlyGrid.tsx';
import HabitModal from './components/HabitModal.tsx';
import Login from './components/Login.tsx';
import ProgressGraph from './components/ProgressGraph.tsx';
import WeeklyConsistencyReport from './components/WeeklyConsistencyReport.tsx';
import RitualFrictionReport from './components/RitualFrictionReport.tsx';
import { getTodayDateString } from './utils.ts';
import { MOTIVATIONAL_MESSAGES } from './constants.ts';
import { supabase } from './lib/supabase.ts';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<{ display_name: string } | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const lastNotifiedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!supabase || !session) return;
      const { data } = await supabase.from('profiles').select('display_name').eq('id', session.user.id).single();
      setProfile(data || { display_name: session.user.email?.split('@')[0] || 'User' });
    };
    if (session) {
      fetchProfile();
      requestNotificationPermission();
    }
  }, [session]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const fetchHabits = useCallback(async () => {
    if (!supabase || !session) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHabits(data.map((item: any) => ({
        id: item.id,
        name: item.name,
        goal: item.goal || '',
        color: item.color || '',
        completedDates: item.completed_dates || [],
        createdAt: item.created_at,
        reminderTime: item.reminder_time,
        reminderDays: item.reminder_days,
        targetValue: item.target_value,
        unit: item.unit,
        dailyLogs: item.daily_logs || {}
      })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [session]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDay = now.getDay();
      const todayStr = getTodayDateString();

      habits.forEach(habit => {
        if (habit.reminderTime && 
            habit.reminderDays?.includes(currentDay) && 
            habit.reminderTime === currentHourMin &&
            !habit.completedDates.includes(todayStr) &&
            lastNotifiedRef.current[`${habit.id}-${todayStr}`] !== currentHourMin) {
          
          if (Notification.permission === 'granted') {
            new Notification('Ritual Reminder', {
              body: `Time for your "${habit.name}" ritual! 🌱`,
              icon: '/favicon.ico'
            });
            lastNotifiedRef.current[`${habit.id}-${todayStr}`] = currentHourMin;
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [habits]);

  useEffect(() => {
    if (session && supabase) fetchHabits();
    else { setHabits([]); setLoading(false); }
  }, [fetchHabits, session]);

  const addHabit = async (name: string, goal: string, color: string, reminderTime?: string, reminderDays?: number[], targetValue?: number, unit?: string) => {
    if (!supabase || !session) return;
    await supabase.from('habits').insert([{ 
      name, goal, color, user_id: session.user.id, completed_dates: [],
      reminder_time: reminderTime, reminder_days: reminderDays,
      target_value: targetValue, unit: unit, daily_logs: {}
    }]);
    fetchHabits();
    setIsModalOpen(false);
  };

  const updateHabit = async (id: string, name: string, goal: string, color: string, reminderTime?: string, reminderDays?: number[], targetValue?: number, unit?: string) => {
    if (!supabase || !session) return;
    await supabase.from('habits').update({ 
      name, goal, color, reminder_time: reminderTime, reminder_days: reminderDays,
      target_value: targetValue, unit: unit
    }).eq('id', id);
    fetchHabits();
    setIsModalOpen(false);
  };

  const toggleHabit = useCallback(async (id: string, dateStr: string, measurableValue?: number) => {
    if (!supabase || !session) return;
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    let newLogs = { ...habit.dailyLogs };
    let newDates = [...habit.completedDates];
    let isNowDone = false;

    if (measurableValue !== undefined && habit.targetValue) {
      newLogs[dateStr] = measurableValue;
      if (measurableValue >= habit.targetValue && !habit.completedDates.includes(dateStr)) {
        newDates.push(dateStr);
        isNowDone = true;
      } else if (measurableValue < habit.targetValue && habit.completedDates.includes(dateStr)) {
        newDates = newDates.filter(d => d !== dateStr);
      }
    } else {
      const isDone = habit.completedDates.includes(dateStr);
      newDates = isDone ? habit.completedDates.filter(d => d !== dateStr) : [...habit.completedDates, dateStr];
      isNowDone = !isDone;
    }
    
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completedDates: newDates, dailyLogs: newLogs } : h));
    await supabase.from('habits').update({ completed_dates: newDates, daily_logs: newLogs }).eq('id', id);

    if (isNowDone && dateStr === getTodayDateString()) {
      setMotivationalMessage(MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]);
      setTimeout(() => setMotivationalMessage(null), 3000);
    }
  }, [session, habits]);

  const deleteHabit = async (id: string) => {
    if (!window.confirm("Remove this ritual?")) return;
    setHabits(prev => prev.filter(h => h.id !== id));
    await supabase?.from('habits').delete().eq('id', id);
    setIsModalOpen(false);
  };

  if (!session) return <Login />;

  return (
    <div className="min-h-screen pb-40">
      {motivationalMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="bg-bloom-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm">
            ✨ {motivationalMessage}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex flex-col items-center mb-20 gap-8">
          <div className="text-center">
            <h1 className="text-7xl font-black tracking-tighter text-bloom-500">Bloom.</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2">
              {profile?.display_name}'s Ritual Garden
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors text-bloom-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-lg font-black min-w-[160px] text-center uppercase tracking-tighter">
              {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
            </span>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors text-bloom-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          
          <button onClick={() => supabase?.auth.signOut()} className="text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-red-400 transition-colors">Sign Out</button>
        </header>

        <main>
          {loading ? (
            <div className="flex justify-center py-40">
              <div className="w-8 h-8 border-4 border-bloom-100 border-t-bloom-500 rounded-full animate-spin" />
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-gray-100">
              <h3 className="text-2xl font-black text-gray-900 mb-6">Your garden is empty.</h3>
              <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-bloom-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg">Plant First Habit</button>
            </div>
          ) : (
            <div className="space-y-16">
              <MonthlyGrid 
                habits={habits} 
                currentDate={currentDate} 
                onToggle={toggleHabit} 
                onEditHabit={(h) => { setHabitToEdit(h); setIsModalOpen(true); }}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <WeeklyConsistencyReport habits={habits} currentDate={currentDate} />
                <ProgressGraph habits={habits} currentDate={currentDate} />
              </div>
              <RitualFrictionReport habits={habits} />
            </div>
          )}
        </main>
      </div>

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-10 right-10 w-20 h-20 bg-bloom-500 text-white rounded-[28px] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
      </button>

      <HabitModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setHabitToEdit(null); }} 
        onAdd={addHabit} 
        onUpdate={updateHabit} 
        habitToEdit={habitToEdit} 
        onDelete={habitToEdit ? () => deleteHabit(habitToEdit.id) : undefined}
      />
    </div>
  );
};

export default App;