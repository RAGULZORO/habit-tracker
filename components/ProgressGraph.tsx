import React, { useMemo } from 'react';
import { Habit } from '../types';
import { getDaysInMonth, formatDateForGrid, getTodayDateString } from '../utils';

interface ProgressGraphProps {
  habits: Habit[];
  currentDate: Date;
}

const ProgressGraph: React.FC<ProgressGraphProps> = ({ habits, currentDate }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysCount = getDaysInMonth(year, month);
  const todayStr = getTodayDateString();

  const daysData = useMemo(() => {
    return Array.from({ length: daysCount }, (_, i) => {
      const day = i + 1;
      const dateStr = formatDateForGrid(year, month, day);
      const completedCount = habits.filter(h => h.completedDates.includes(dateStr)).length;
      const totalCount = habits.length;
      const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      
      const dateObj = new Date(year, month, day);
      const formattedDate = dateObj.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });

      return {
        day,
        percentage,
        completedCount,
        totalCount,
        formattedDate,
        isToday: dateStr === todayStr,
        isFuture: new Date(dateStr) > new Date(todayStr)
      };
    });
  }, [habits, year, month, daysCount, todayStr]);

  const avgCompletion = useMemo(() => {
    if (habits.length === 0) return 0;
    const pastDays = daysData.filter(d => !d.isFuture);
    if (pastDays.length === 0) return 0;
    const sum = pastDays.reduce((acc, d) => acc + d.percentage, 0);
    return Math.round(sum / pastDays.length);
  }, [daysData, habits.length]);

  const bestDay = useMemo(() => {
    return [...daysData].sort((a, b) => b.percentage - a.percentage)[0];
  }, [daysData]);

  const chartHeight = 100;

  return (
    <div className="bg-white rounded-[40px] p-8 md:p-10 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Monthly Consistency</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Seasonal growth trend</p>
        </div>
        
        <div className="flex gap-4">
          <div className="px-5 py-3 bg-bloom-50 rounded-2xl border border-bloom-100">
            <span className="block text-[9px] font-black text-bloom-500 uppercase tracking-widest mb-1">Avg. Success</span>
            <span className="text-xl font-black text-bloom-700">{avgCompletion}%</span>
          </div>
          <div className="px-5 py-3 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Best Day</span>
            <span className="text-xl font-black text-gray-900 uppercase">Day {bestDay?.day}</span>
          </div>
        </div>
      </div>

      <div className="relative h-[160px] flex items-end justify-between gap-1 px-1">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-2">
          <div className="w-full border-t border-gray-50"></div>
          <div className="w-full border-t border-gray-50"></div>
          <div className="w-full border-t border-gray-50"></div>
        </div>

        {daysData.map((data, idx) => {
          const barHeight = (data.percentage / 100) * chartHeight;
          const isActive = data.percentage > 0;
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-gray-900 text-white text-[10px] font-black px-3 py-2 rounded-xl whitespace-nowrap z-20 shadow-xl pointer-events-none flex flex-col items-center gap-0.5">
                <span className="text-gray-400 uppercase text-[8px]">{data.formattedDate}</span>
                <span>{data.completedCount} / {data.totalCount} Rituals</span>
              </div>

              {/* Bar */}
              <div 
                className={`w-full rounded-t-[4px] sm:rounded-t-lg transition-all duration-700 ease-out relative ${
                  data.isToday 
                    ? 'bg-bloom-500 shadow-lg shadow-bloom-500/20' 
                    : !data.isFuture && isActive 
                      ? 'bg-bloom-100 group-hover:bg-bloom-200' 
                      : 'bg-gray-50'
                }`}
                style={{ height: `${Math.max(barHeight, 6)}px` }}
              >
                {data.percentage === 100 && !data.isFuture && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] hidden sm:block">✨</div>
                )}
              </div>

              {/* Labels - Only show some labels on small screens to avoid crowding */}
              <div className="mt-3">
                <span className={`text-[8px] sm:text-[10px] font-bold ${data.isToday ? 'text-bloom-600' : 'text-gray-300'}`}>
                  {data.day % (daysCount > 15 ? 5 : 1) === 0 || data.day === 1 || data.isToday ? data.day : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 pt-8 border-t border-gray-100 flex items-center gap-4">
        <div className="w-10 h-10 bg-bloom-50 rounded-full flex items-center justify-center shrink-0">
          <span className="text-lg">🗓️</span>
        </div>
        <p className="text-xs font-medium text-gray-500 leading-relaxed">
          Your seasonal score is <span className="text-bloom-600 font-bold">{avgCompletion}%</span>. 
          {avgCompletion >= 75 
            ? " Your garden is in full bloom! This level of consistency is truly elite." 
            : avgCompletion >= 40 
              ? " You're nurturing steady growth. Focus on making your rituals non-negotiable." 
              : " Every season starts with a single seed. Keep showing up for yourself."}
        </p>
      </div>
    </div>
  );
};

export default ProgressGraph;