
import React, { useMemo } from 'react';
import { Habit } from '../types';
import { getDaysInMonth, formatDateForGrid, getTodayDateString } from '../utils';

interface AnalyticsDashboardProps {
  habits: Habit[];
  currentDate: Date;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ habits, currentDate }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const todayStr = getTodayDateString();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const totalPossible = habits.length * daysInMonth;
  const totalCompletedInMonth = habits.reduce((acc, h) => {
    return acc + h.completedDates.filter(d => d.startsWith(monthPrefix)).length;
  }, 0);
  const monthlyConsistency = totalPossible > 0 ? Math.round((totalCompletedInMonth / totalPossible) * 100) : 0;

  const heatmapDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = formatDateForGrid(year, month, day);
      const completedCount = habits.filter(h => h.completedDates.includes(dateStr)).length;
      const intensity = habits.length > 0 ? completedCount / habits.length : 0;
      return { day, dateStr, intensity, completedCount };
    });
  }, [habits, daysInMonth, year, month]);

  const ambientPath = useMemo(() => {
    if (heatmapDays.length === 0) return "";
    const width = 1000;
    const height = 150;
    const padding = 20;
    const step = (width - padding * 2) / (daysInMonth - 1);
    let pathData = "";
    let isDrawing = false;
    heatmapDays.forEach((data, i) => {
      const x = padding + i * step;
      const y = height - padding - (data.intensity * (height - padding * 2));
      if (data.intensity > 0) {
        if (!isDrawing) {
          pathData += `M ${x} ${y}`;
          isDrawing = true;
        } else {
          const prevX = padding + (i - 1) * step;
          const prevY = height - padding - (heatmapDays[i-1].intensity * (height - padding * 2));
          const cpX = (prevX + x) / 2;
          pathData += ` C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
        }
      } else { isDrawing = false; }
    });
    return pathData;
  }, [heatmapDays, daysInMonth]);

  return (
    <div className="mt-8 md:mt-16 space-y-12 md:space-y-20 animate-in fade-in duration-1000">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-bloom-500 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">Ritual Review</h2>
          <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Growth Analytics</p>
        </div>
      </div>

      <div className="space-y-12">
        <div className="relative pt-4 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-6 md:mb-10 px-2 gap-2">
            <div>
              <h3 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter lowercase">{monthName} Flow</h3>
              <p className="text-[10px] md:text-xs font-black text-bloom-500 uppercase tracking-[0.3em] mt-1">Consistency Over Time</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter">{monthlyConsistency}%</span>
              <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase">Avg.</span>
            </div>
          </div>

          <div className="relative h-[150px] md:h-[220px] w-full flex items-center bg-gray-50/50 rounded-[32px] md:rounded-[48px] p-4 border border-gray-100 overflow-hidden">
            <svg viewBox="0 0 1000 150" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#80b918" stopOpacity="0" />
                  <stop offset="50%" stopColor="#80b918" stopOpacity="1" />
                  <stop offset="100%" stopColor="#80b918" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={ambientPath} fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" className="transition-all duration-1000" />
              {heatmapDays.map((data, i) => {
                const width = 1000;
                const height = 150;
                const padding = 20;
                const step = (width - padding * 2) / (daysInMonth - 1);
                const x = padding + i * step;
                const y = height - padding - (data.intensity * (height - padding * 2));
                const isToday = data.dateStr === todayStr;
                if (data.intensity <= 0) return null;
                return (
                  <circle key={data.day} cx={x} cy={y} r={isToday ? "6" : "3"} className={`${isToday ? 'fill-bloom-500' : 'fill-bloom-400 opacity-40'}`} />
                );
              })}
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between gap-10">
          <div className="lg:max-w-xs">
            <h3 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Bloom Density</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Your habit intensity mapped across the month. Darker areas show peak performance.</p>
            <div className="flex items-center gap-3 text-[9px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-4 py-2 rounded-full w-fit">
              <span>Low</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <div key={i} className={`w-3 h-3 rounded-sm ${['bg-gray-100', 'bg-bloom-100', 'bg-bloom-300', 'bg-bloom-500', 'bg-bloom-800'][i-1]}`} />)}
              </div>
              <span>High</span>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center lg:justify-end overflow-hidden">
            <div className="grid grid-cols-7 sm:grid-cols-10 lg:grid-cols-7 gap-1.5 md:gap-3 p-4 bg-gray-50/50 rounded-[32px] border border-gray-100 w-full md:w-auto">
              {heatmapDays.map((data) => {
                const isToday = data.dateStr === todayStr;
                let intensityClass = 'bg-gray-200/50'; 
                if (data.intensity > 0) intensityClass = 'bg-bloom-100';
                if (data.intensity > 0.4) intensityClass = 'bg-bloom-300';
                if (data.intensity > 0.7) intensityClass = 'bg-bloom-500';
                if (data.intensity === 1) intensityClass = 'bg-bloom-800';
                return (
                  <div key={data.day} className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl transition-all shadow-sm ${intensityClass} ${isToday ? 'ring-2 ring-bloom-500 ring-offset-2' : ''}`} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
