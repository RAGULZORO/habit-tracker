
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Habit } from './types.ts';
import MonthlyGrid from './components/MonthlyGrid.tsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.tsx';
import HabitModal from './components/HabitModal.tsx';
import HabitDetailView from './components/HabitDetailView.tsx';
import Login from './components/Login.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import { getTodayDateString } from './utils.ts';
import { MOTIVATIONAL_MESSAGES } from './constants.ts';
import { supabase } from './lib/supabase.ts';

const ADMIN_EMAIL = 'ragulzoro1@gmail.com';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<{ display_name: string; created_at?: string } | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [habitDetail, setHabitDetail] = useState<Habit | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'tracker' | 'admin'>('tracker');
  const lastReminderTriggered = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setCurrentView('tracker');
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!supabase || !session) return;
      try {
        const { data, error } = await supabase.from('profiles').select('display_name, created_at').eq('id', session.user.id).single();
        if (!error && data) setProfile(data);
        else setProfile({ display_name: session.user.email?.split('@')[0] || 'User' });
      } catch (e) {
        setProfile({ display_name: session.user.email?.split('@')[0] || 'User' });
      }
    };
    if (session) fetchProfile();
  }, [session]);

  const fetchHabits = useCallback(async () => {
    if (!supabase || !session) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        const habitData = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          goal: item.goal || '',
          color: item.color || '',
          completedDates: item.completed_dates || [],
          createdAt: item.created_at,
          reminderTime: item.reminder_time,
          reminderDays: item.reminder_days
        }));
        setHabits(habitData);
        setHabitDetail(current => {
          if (!current) return null;
          return habitData.find(h => h.id === current.id) || null;
        });
      }
    } catch (e: any) { 
      console.error("Fetch habits failed:", e); 
    } finally { 
      setLoading(false); 
    }
  }, [session]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDay = now.getDay();
      const todayStr = getTodayDateString();

      habits.forEach(habit => {
        if (habit.reminderTime && habit.reminderTime === currentTime) {
          const isScheduledToday = !habit.reminderDays || habit.reminderDays.length === 0 || habit.reminderDays.includes(currentDay);
          const alreadyCompleted = habit.completedDates.includes(todayStr);
          const key = `${habit.id}-${todayStr}-${currentTime}`;

          if (isScheduledToday && !alreadyCompleted && !lastReminderTriggered.current[key]) {
            lastReminderTriggered.current[key] = 'sent';
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`Bloom: ${habit.name}`, {
                body: `Time for your daily ritual: ${habit.name}.`,
                icon: '/favicon.ico'
              });
            }
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [habits]);

  useEffect(() => {
    if (session && supabase) {
      fetchHabits();
      const channel = supabase.channel('schema-db-changes').on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'habits', 
        filter: `user_id=eq.${session.user.id}` 
      }, () => {
        fetchHabits();
      }).subscribe();
      return () => { supabase.removeChannel(channel); };
    } else {
      setHabits([]);
      setLoading(false);
    }
  }, [fetchHabits, session]);

  const addHabit = async (name: string, goal: string, color: string, reminderTime?: string, reminderDays?: number[]) => {
    if (!supabase || !session) {
        alert("Session lost. Please log in again.");
        return;
    }
    
    setActionLoading(true);
    try {
      const habitData: any = { 
        name, 
        goal: goal || '', 
        color: color || 'bg-bloom-100 text-bloom-700 border-bloom-200', 
        completed_dates: [], 
        user_id: session.user.id
      };

      if (reminderTime) habitData.reminder_time = reminderTime;
      if (reminderDays && reminderDays.length > 0) habitData.reminder_days = reminderDays;

      const { error } = await supabase.from('habits').insert([habitData]);
      
      if (error) {
          console.error("Supabase Insert Error:", error);
          alert(`Failed to add habit.\n\nMessage: ${error.message}\nCode: ${error.code}`);
          throw error;
      }
      
      await fetchHabits();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Add habit exception:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const updateHabit = async (id: string, name: string, goal: string, color: string, reminderTime?: string, reminderDays?: number[]) => {
    if (!supabase || !session) return;
    
    setActionLoading(true);
    try {
      const updateData: any = { 
        name, 
        goal: goal || '', 
        color: color || 'bg-bloom-100 text-bloom-700 border-bloom-200'
      };

      if (reminderTime) updateData.reminder_time = reminderTime;
      else updateData.reminder_time = null;
      
      if (reminderDays) updateData.reminder_days = reminderDays;
      else updateData.reminder_days = null;

      const { error } = await supabase.from('habits')
        .update(updateData)
        .eq('id', id);
        
      if (error) {
          alert(`Failed to update habit: ${error.message}`);
          throw error;
      }
      await fetchHabits();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Update habit error:", error);
    } finally {
        setActionLoading(false);
    }
  };

  const toggleHabit = useCallback(async (id: string, dateStr: string) => {
    if (!supabase || !session) return;

    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const isDone = habit.completedDates.includes(dateStr);
    const newDates = isDone 
      ? habit.completedDates.filter(d => d !== dateStr) 
      : [...habit.completedDates, dateStr];

    setHabits(prev => prev.map(h => h.id === id ? { ...h, completedDates: newDates } : h));

    const { error } = await supabase.from('habits')
      .update({ completed_dates: newDates })
      .eq('id', id);

    if (error) {
      console.error("Toggle error:", error);
      fetchHabits(); 
      return;
    }

    if (!isDone && dateStr === getTodayDateString()) {
      const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
      setMotivationalMessage(msg);
      setTimeout(() => setMotivationalMessage(null), 3000);
    }
  }, [session, habits, fetchHabits]);

  const deleteHabit = async (id: string) => {
    if (!window.confirm("Permanently delete this habit?")) return;
    if (!supabase || !session) return;

    const snapshot = [...habits];
    setHabits(prev => prev.filter(h => h.id !== id));
    if (habitDetail?.id === id) setHabitDetail(null);

    try {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
      setHabits(snapshot);
    }
  };

  const deleteAllHabits = async () => {
    if (!supabase || !session) return;
    if (!habits.length) return;

    const confirmed = window.confirm("🚨 WARNING: This will permanently delete ALL habits.");
    if (!confirmed) return;

    const verification = window.prompt("Type 'CLEAR MY GARDEN' to confirm complete deletion:");
    if (verification !== 'CLEAR MY GARDEN') {
      alert("Verification failed. Deletion cancelled.");
      return;
    }

    const snapshot = [...habits];
    setLoading(true);
    try {
      const habitIds = habits.map(h => h.id);
      const { error } = await supabase
        .from('habits')
        .delete()
        .in('id', habitIds);

      if (error) throw error;
      
      setHabits([]);
      setHabitDetail(null);
      alert("Your garden has been completely cleared.");
    } catch (err: any) {
      console.error("Clear failed:", err);
      alert(`Failed to clear habits: ${err.message}`);
      setHabits(snapshot);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => { if (supabase) await supabase.auth.signOut(); };
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  if (!session) return <Login />;
  if (currentView === 'admin' && isAdmin) return <AdminPanel onBack={() => setCurrentView('tracker')} />;

  return (
    <div className="min-h-screen pb-32 text-gray-900 bg-white transition-colors duration-300">
      {motivationalMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[90%] px-4 pointer-events-none">
          <div className="bg-bloom-600 text-white px-6 py-4 rounded-[24px] shadow-2xl flex items-center justify-center gap-3 animate-bounce border border-white/10">
            <span className="text-xl">✨</span>
            <span className="font-bold text-sm text-center">{motivationalMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-12">
        <header className="flex flex-col items-center gap-8 mb-12 md:mb-20">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-bloom-500 leading-none">Bloom.</h1>
            <p className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.4em] mt-3">{profile?.display_name || 'Grower'}'s Space</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-[24px] border border-gray-100 shadow-sm w-full md:w-auto justify-between md:justify-start">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-3 hover:bg-white rounded-2xl transition-all active:scale-90">
                <svg className="h-5 w-5 text-bloom-500" viewBox="0 0 20 20" fill="currentColor"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" /></svg>
              </button>
              <span className="text-sm md:text-lg font-black min-w-[140px] text-center text-gray-900 uppercase tracking-tighter">
                {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
              </span>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-3 hover:bg-white rounded-2xl transition-all active:scale-90">
                <svg className="h-5 w-5 text-bloom-500" viewBox="0 0 20 20" fill="currentColor"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" /></svg>
              </button>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              {isAdmin && (
                <button onClick={() => setCurrentView('admin')} className="flex-1 md:flex-none px-6 py-4 bg-bloom-50 text-bloom-600 font-black rounded-[20px] hover:bg-bloom-100 transition-all text-[10px] border border-bloom-100 uppercase tracking-widest">Admin</button>
              )}
              <button onClick={handleSignOut} className="flex-1 md:flex-none px-6 py-4 bg-white text-gray-400 font-black rounded-[20px] hover:bg-red-50 hover:text-red-600 transition-all text-[10px] border border-gray-100 uppercase tracking-widest">Logout</button>
            </div>
          </div>
        </header>

        <main>
          {loading ? (
            <div className="flex items-center justify-center py-40">
              <div className="w-14 h-14 border-4 border-bloom-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center py-24 md:py-48 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-bloom-100 mx-4">
              <div className="text-6xl md:text-7xl mb-8">🌱</div>
              <h3 className="text-xl md:text-3xl font-black mb-10 text-gray-900 tracking-tight px-4">Cultivate your first habit</h3>
              <button onClick={() => setIsModalOpen(true)} className="px-10 py-5 bg-bloom-500 text-white rounded-[24px] md:rounded-[32px] font-black uppercase tracking-widest shadow-2xl shadow-bloom-500/20 transition-all hover:-translate-y-1 active:scale-95 text-xs md:text-sm">Plant a Ritual</button>
            </div>
          ) : (
            <div className="space-y-12 md:space-y-24">
              <MonthlyGrid 
                habits={habits} 
                currentDate={currentDate} 
                onToggle={toggleHabit} 
                onDeleteHabit={deleteHabit} 
                onEditHabit={(h) => { setHabitToEdit(h); setIsModalOpen(true); }}
                onViewDetail={(h) => setHabitDetail(h)}
              />
              <AnalyticsDashboard 
                habits={habits} 
                currentDate={currentDate} 
                onDeleteAll={deleteAllHabits}
                profileCreatedAt={profile?.created_at}
              />
            </div>
          )}
        </main>
      </div>

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-6 right-6 md:bottom-12 md:right-12 w-16 h-16 md:w-20 md:h-20 bg-bloom-500 text-white rounded-[20px] md:rounded-[32px] shadow-[0_20px_50px_rgba(128,185,24,0.3)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
      </button>

      <HabitModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setHabitToEdit(null); }} 
        onAdd={addHabit} 
        onUpdate={updateHabit} 
        habitToEdit={habitToEdit} 
      />
      
      {habitDetail && (
        <HabitDetailView 
          habit={habitDetail} 
          onClose={() => setHabitDetail(null)} 
          onEdit={() => { setIsModalOpen(true); setHabitToEdit(habitDetail); }} 
          onDelete={() => deleteHabit(habitDetail.id)} 
        />
      )}
    </div>
  );
};

export default App;
