
import React from 'react';
import { Habit } from '../types';
import { calculateStreak, getTodayDateString } from '../utils';

interface HabitCardProps {
  habit: Habit;
  currentDate: Date;
  onToggle: (id: string, date?: string) => void;
  onDelete: (id: string) => void;
}

// Map for Tailwind literal classes to ensure JIT picks them up from CDN
const COLOR_MAP: Record<string, { btnActive: string; btnHover: string; textHighlight: string; bgTint: string }> = {
  'pink': { btnActive: 'bg-pink-500 border-pink-400', btnHover: 'hover:border-pink-300', textHighlight: 'text-pink-600', bgTint: 'bg-pink-50' },
  'blue': { btnActive: 'bg-blue-500 border-blue-400', btnHover: 'hover:border-blue-300', textHighlight: 'text-blue-600', bgTint: 'bg-blue-50' },
  'green': { btnActive: 'bg-green-500 border-green-400', btnHover: 'hover:border-green-300', textHighlight: 'text-green-600', bgTint: 'bg-green-50' },
  'purple': { btnActive: 'bg-purple-500 border-purple-400', btnHover: 'hover:border-purple-300', textHighlight: 'text-purple-600', bgTint: 'bg-purple-50' },
  'orange': { btnActive: 'bg-orange-500 border-orange-400', btnHover: 'hover:border-orange-300', textHighlight: 'text-orange-600', bgTint: 'bg-orange-50' },
  'indigo': { btnActive: 'bg-indigo-500 border-indigo-400', btnHover: 'hover:border-indigo-300', textHighlight: 'text-indigo-600', bgTint: 'bg-indigo-50' },
  'rose': { btnActive: 'bg-rose-500 border-rose-400', btnHover: 'hover:border-rose-300', textHighlight: 'text-rose-600', bgTint: 'bg-rose-50' },
  'teal': { btnActive: 'bg-teal-500 border-teal-400', btnHover: 'hover:border-teal-300', textHighlight: 'text-teal-600', bgTint: 'bg-teal-50' },
  'bloom': { btnActive: 'bg-bloom-500 border-bloom-400', btnHover: 'hover:border-bloom-300', textHighlight: 'text-bloom-600', bgTint: 'bg-bloom-50' },
};

const HabitCard: React.FC<HabitCardProps> = ({ habit, currentDate, onToggle, onDelete }) => {
  const { currentStreak, longestStreak, isCompletedToday } = calculateStreak(habit.completedDates);
  const today = getTodayDateString();
  
  // Extract base color name safely (e.g. "bg-pink-100 ..." -> "pink")
  const rawColor = habit.color || 'bg-bloom-100 text-bloom-700 border-bloom-200';
  const colorParts = rawColor.split(' ');
  const colorName = colorParts[1]?.split('-')[1] || 'bloom';
  const theme = COLOR_MAP[colorName] || COLOR_MAP['bloom'];

  // Count completions for the currently viewed month
  const monthStr = currentDate.toISOString().slice(0, 7); // YYYY-MM
  const monthCompletions = habit.completedDates.filter(d => d.startsWith(monthStr)).length;

  const isStreakActive = currentStreak > 0;
  const isPersonalBest = currentStreak > 0 && currentStreak === longestStreak;

  return (
    <div className={`group p-5 rounded-[32px] border-2 transition-all duration-500 relative overflow-hidden ${
      isCompletedToday 
        ? `${theme.bgTint}/40 border-current opacity-95` 
        : 'bg-white border-gray-50 shadow-xl shadow-gray-200/40 hover:border-gray-200 hover:-translate-y-1'
    }`}>
      {/* Background Glow for High Streaks */}
      {isPersonalBest && (
        <div className={`absolute -top-12 -right-12 w-32 h-32 ${theme.bgTint} opacity-40 blur-3xl rounded-full pointer-events-none`} />
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <button
            onClick={() => onToggle(habit.id, today)}
            className={`w-14 h-14 rounded-[20px] flex items-center justify-center border-2 transition-all duration-500 group/btn ${
              isCompletedToday 
                ? `${theme.btnActive} text-white shadow-lg shadow-black/5` 
                : `bg-gray-50 border-gray-100 text-transparent ${theme.btnHover} hover:bg-white`
            }`}
          >
            {isCompletedToday ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-200 group-hover/btn:bg-gray-400 transition-colors" />
            )}
          </button>
          
          <div className="flex flex-col">
            <h3 className={`font-black text-xl tracking-tight transition-all duration-500 ${isCompletedToday ? 'text-gray-300 line-through' : 'text-gray-900'}`}>
              {habit.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                {monthCompletions} Blooms this month
              </span>
              {habit.goal && (
                <>
                  <span className="text-gray-200">•</span>
                  <span className={`text-[10px] font-bold ${theme.textHighlight} ${theme.bgTint} px-2 py-0.5 rounded-md uppercase tracking-tighter`}>
                    {habit.goal}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 transition-all duration-500 ${
            isStreakActive 
              ? 'bg-orange-50 border-orange-100 shadow-sm' 
              : 'bg-gray-50 border-gray-100 grayscale opacity-60'
          }`}>
            <span className={`text-lg transform transition-transform duration-700 ${isStreakActive ? 'animate-pulse scale-110' : 'scale-100'}`}>
              {isStreakActive ? '🔥' : '🧊'}
            </span>
            <div className="flex flex-col items-start leading-none">
              <span className={`text-base font-black ${isStreakActive ? 'text-orange-600' : 'text-gray-500'}`}>
                {currentStreak}
              </span>
              <span className={`text-[8px] font-black uppercase tracking-tighter ${isStreakActive ? 'text-orange-400' : 'text-gray-400'}`}>
                {isStreakActive ? 'On Fire' : 'Broken'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-2">
            {isPersonalBest ? (
              <span className="text-[9px] font-black text-yellow-500 uppercase flex items-center gap-1">
                👑 Best Ever
              </span>
            ) : (
              <span className="text-[9px] font-bold text-gray-300 uppercase">
                PB: {longestStreak}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onDelete(habit.id)}
          className="p-2 text-gray-300 hover:text-red-500 bg-white/80 backdrop-blur-sm rounded-xl transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HabitCard;
