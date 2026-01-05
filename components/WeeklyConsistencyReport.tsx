import React, { useMemo } from 'react';
import { Habit } from '../types';
import { getWeekDays, getTodayDateString } from '../utils';
import { DAYS_OF_WEEK } from '../constants';

interface WeeklyConsistencyReportProps {
  habits: Habit[];
  currentDate: Date;
}

const WeeklyConsistencyReport: React.FC<WeeklyConsistencyReportProps> = ({ habits, currentDate }) => {
  const todayStr = getTodayDateString();
  
  // Calculate week data
  const weekData = useMemo(() => {
    // We use the start of the week based on currentDate
    const day = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - day);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const completions = habits.filter(h => h.completedDates.includes(dateStr)).length;
      const total = habits.length;
      const percentage = total > 0 ? (completions / total) * 100 : 0;
      
      dates.push({
        dateStr,
        dayName: DAYS_OF_WEEK[i],
        dayNum: d.getDate(),
        completions,
        total,
        percentage,
        isToday: dateStr === todayStr
      });
    }
    return dates;
  }, [habits, currentDate, todayStr]);

  const avgCompletion = useMemo(() => {
    if (weekData.length === 0) return 0;
    const sum = weekData.reduce((acc, d) => acc + d.percentage, 0);
    return Math.round(sum / weekData.length);
  }, [weekData]);

  const bestDay = useMemo(() => {
    return [...weekData].sort((a, b) => b.percentage - a.percentage)[0];
  }, [weekData]);

  const chartHeight = 100;

  return (
    <div className="bg-white rounded-[40px] p-8 md:p-10 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Weekly Bloom Report</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Current rhythm analysis</p>
        </div>
        
        <div className="flex gap-4">
          <div className="px-5 py-3 bg-bloom-50 rounded-2xl border border-bloom-100">
            <span className="block text-[9px] font-black text-bloom-500 uppercase tracking-widest mb-1">Avg. Success</span>
            <span className="text-xl font-black text-bloom-700">{avgCompletion}%</span>
          </div>
          <div className="px-5 py-3 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Best Day</span>
            <span className="text-xl font-black text-gray-900 uppercase">{bestDay?.dayName}</span>
          </div>
        </div>
      </div>

      <div className="relative h-[160px] flex items-end justify-between gap-2 md:gap-4 px-2">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-2">
          <div className="w-full border-t border-gray-50"></div>
          <div className="w-full border-t border-gray-50"></div>
          <div className="w-full border-t border-gray-50"></div>
        </div>

        {weekData.map((day, idx) => {
          const barHeight = (day.percentage / 100) * chartHeight;
          const isActive = day.percentage > 0;
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap z-20 shadow-xl pointer-events-none">
                {day.completions} / {day.total} Rituals
              </div>

              {/* Bar */}
              <div 
                className={`w-full max-w-[42px] rounded-t-xl transition-all duration-700 ease-out relative ${
                  day.isToday 
                    ? 'bg-bloom-500 shadow-lg shadow-bloom-500/20' 
                    : isActive 
                      ? 'bg-bloom-100 group-hover:bg-bloom-200' 
                      : 'bg-gray-50'
                }`}
                style={{ height: `${Math.max(barHeight, 8)}px` }}
              >
                {day.percentage === 100 && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]">✨</div>
                )}
              </div>

              {/* Labels */}
              <div className="mt-3 flex flex-col items-center">
                <span className={`text-[10px] font-black uppercase tracking-widest ${day.isToday ? 'text-bloom-600' : 'text-gray-400'}`}>
                  {day.dayName}
                </span>
                <span className={`text-[9px] font-bold ${day.isToday ? 'text-bloom-400' : 'text-gray-300'}`}>
                  {day.dayNum}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 pt-8 border-t border-gray-50 flex items-center gap-4">
        <div className="w-10 h-10 bg-bloom-50 rounded-full flex items-center justify-center shrink-0">
          <span className="text-lg">📈</span>
        </div>
        <p className="text-xs font-medium text-gray-500 leading-relaxed">
          Your consistency is <span className="text-bloom-600 font-bold">{avgCompletion}%</span> this week. 
          {avgCompletion >= 80 
            ? " You're in an elite flow state! Keep this momentum." 
            : avgCompletion >= 50 
              ? " You're building a solid foundation. Focus on closing the gaps." 
              : " Take it one ritual at a time. Every small bloom counts."}
        </p>
      </div>
    </div>
  );
};

export default WeeklyConsistencyReport;