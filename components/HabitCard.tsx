
import React from 'react';
import { Habit } from '../types';
import { calculateStreak, getTodayDateString } from '../utils';

interface HabitCardProps {
  habit: Habit;
  currentDate: Date;
  onToggle: (id: string, date?: string) => void;
  onDelete: (id: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, currentDate, onToggle, onDelete }) => {
  const { currentStreak, longestStreak, isCompletedToday } = calculateStreak(habit.completedDates);
  const today = getTodayDateString();
  
  // Count completions for the currently viewed month
  const monthStr = currentDate.toISOString().slice(0, 7); // YYYY-MM
  const monthCompletions = habit.completedDates.filter(d => d.startsWith(monthStr)).length;

  const isStreakActive = currentStreak > 0;
  const isPersonalBest = currentStreak > 0 && currentStreak === longestStreak;

  return (
    <div className={`group p-5 rounded-[32px] border-2 transition-all duration-500 relative overflow-hidden ${
      isCompletedToday 
        ? 'bg-bloom-50/30 border-bloom-100 opacity-95' 
        : 'bg-white border-gray-50 shadow-xl shadow-gray-200/40 hover:border-bloom-200 hover:-translate-y-1'
    }`}>
      {/* Background Glow for High Streaks */}
      {isPersonalBest && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-400/10 blur-3xl rounded-full pointer-events-none" />
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <button
            onClick={() => onToggle(habit.id, today)}
            className={`w-14 h-14 rounded-[20px] flex items-center justify-center border-2 transition-all duration-500 group/btn ${
              isCompletedToday 
                ? 'bg-bloom-500 border-bloom-400 text-white shadow-lg shadow-bloom-500/20' 
                : 'bg-gray-50 border-gray-100 text-transparent hover:border-bloom-300 hover:bg-white'
            }`}
          >
            {isCompletedToday ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-200 group-hover/btn:bg-bloom-400 transition-colors" />
            )}
          </button>
          
          <div className="flex flex-col">
            <h3 className={`font-black text-xl tracking-tight transition-all duration-500 ${isCompletedToday ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {habit.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                {monthCompletions} Blooms this month
              </span>
              {habit.goal && (
                <>
                  <span className="text-gray-200">•</span>
                  <span className="text-[10px] font-bold text-bloom-600 bg-bloom-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                    {habit.goal}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Streak Badge with Active/Broken logic */}
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
          
          {/* Personal Best Hint */}
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

      {/* Hover Action Overlay for Desktop */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onDelete(habit.id)}
          className="p-2 text-gray-300 hover:text-red-500 bg-white/80 backdrop-blur-sm rounded-xl transition-all"
          title="Delete Habit"
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
