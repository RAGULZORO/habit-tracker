import React from 'react';
import { Habit } from '../types';
import { getDaysInMonth, formatDateForGrid, getTodayDateString, calculateStreak } from '../utils';
import { DAYS_OF_WEEK } from '../constants';

interface MonthlyGridProps {
  habits: Habit[];
  currentDate: Date;
  onToggle: (id: string, date: string, measurableValue?: number) => void;
  onEditHabit: (habit: Habit) => void;
}

const MonthlyGrid: React.FC<MonthlyGridProps> = ({ habits, currentDate, onToggle, onEditHabit }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysCount = getDaysInMonth(year, month);
  const todayStr = getTodayDateString();
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-[24px] md:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto no-scrollbar snap-x snap-proximity scroll-smooth">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-white">
              <th className="sticky left-0 z-40 bg-white/95 backdrop-blur-md p-4 md:p-8 text-left border-b border-gray-100 min-w-[120px] md:min-w-[280px] shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Rituals</span>
                  <span className="text-xs md:text-sm font-bold text-gray-900">Your Garden</span>
                </div>
              </th>
              {daysArray.map((day) => {
                const dateStr = formatDateForGrid(year, month, day);
                const isToday = dateStr === todayStr;
                const d = new Date(year, month, day);
                const dayName = DAYS_OF_WEEK[d.getDay()][0];

                return (
                  <th key={day} className={`p-2 md:p-4 min-w-[54px] md:min-w-[64px] border-b border-gray-100 snap-center ${isToday ? 'bg-bloom-50/50' : ''}`}>
                    <div className="flex flex-col items-center justify-center py-1">
                      <span className={`text-[8px] md:text-[10px] font-black uppercase mb-1 ${isToday ? 'text-bloom-600' : 'text-gray-300'}`}>{dayName}</span>
                      <span className={`text-xs md:text-sm font-black ${isToday ? 'text-bloom-700 bg-white w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full shadow-sm ring-1 ring-bloom-200' : 'text-gray-500'}`}>{day}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const { currentStreak } = calculateStreak(habit.completedDates);
              const isMeasurable = !!habit.targetValue;
              
              return (
                <tr key={habit.id} className="group hover:bg-gray-50/30 transition-colors">
                  <td className="sticky left-0 z-30 bg-white p-3 md:p-6 border-b border-gray-50 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)] group-hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-xs md:text-base font-bold text-gray-900 tracking-tight truncate">
                          {habit.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {currentStreak > 0 && (
                            <span className="text-[9px] md:text-[10px] font-black text-orange-500">🔥{currentStreak}</span>
                          )}
                          <span className="text-[8px] md:text-[10px] font-bold text-gray-300 uppercase truncate">
                            {isMeasurable ? `${habit.targetValue} ${habit.unit}` : (habit.goal || 'Daily')}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => onEditHabit(habit)} className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-gray-300 hover:text-bloom-600 bg-gray-50 md:bg-transparent rounded-lg shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    </div>
                  </td>
                  {daysArray.map((day) => {
                    const dateStr = formatDateForGrid(year, month, day);
                    const isDone = habit.completedDates.includes(dateStr);
                    const isToday = dateStr === todayStr;
                    const currentValue = habit.dailyLogs?.[dateStr] || 0;

                    return (
                      <td key={day} className={`p-1.5 md:p-2 border-b border-gray-50 text-center snap-center ${isToday ? 'bg-bloom-50/50' : ''}`}>
                        <button
                          onClick={() => {
                            if (!isToday) return;
                            if (isMeasurable) {
                              const newValue = currentValue + 1;
                              onToggle(habit.id, dateStr, newValue);
                            } else {
                              onToggle(habit.id, dateStr);
                            }
                          }}
                          disabled={!isToday}
                          className={`w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl mx-auto transition-all duration-300 flex flex-col items-center justify-center border-2 ${
                            isDone 
                              ? `bg-bloom-500 border-bloom-400 shadow-md shadow-bloom-500/10 ${isToday ? 'scale-110 active:scale-95' : 'opacity-80 scale-90'}` 
                              : currentValue > 0
                                ? `bg-bloom-50 border-bloom-200 text-bloom-700 ${isToday ? 'hover:bg-bloom-100 active:scale-90 ring-4 ring-bloom-500/5' : 'opacity-50'}`
                                : `bg-gray-50/50 border-transparent ${isToday ? 'hover:border-bloom-200 cursor-pointer active:scale-90 ring-4 ring-bloom-500/5' : 'cursor-default opacity-30'}`
                          }`}
                        >
                          {isDone ? (
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : isMeasurable && currentValue > 0 ? (
                            <div className="flex flex-col items-center leading-none">
                              <span className="text-[10px] md:text-xs font-black">{currentValue}</span>
                              <div className="w-4 h-0.5 bg-bloom-300 mt-0.5 rounded-full" />
                            </div>
                          ) : (
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isToday ? 'bg-bloom-500' : 'bg-gray-200'}`} />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyGrid;