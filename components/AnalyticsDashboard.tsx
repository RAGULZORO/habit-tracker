
import React, { useMemo, useState } from 'react';
import { Habit } from '../types.ts';
import { getDaysInMonth, formatDateForGrid, getTodayDateString } from '../utils.ts';
import HabitAudit from './HabitAudit.tsx';
import SummaryReport from './SummaryReport.tsx';
import YearlyPlantReport from './YearlyPlantReport.tsx';

interface AnalyticsDashboardProps {
  habits: Habit[];
  currentDate: Date;
  onDeleteAll: () => void;
  profileCreatedAt?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ habits, currentDate, onDeleteAll, profileCreatedAt }) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('monthly');
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const todayStr = getTodayDateString();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Current stats calculation
  const totalPossible = habits.length * (reportType === 'monthly' ? daysInMonth : 7);
  
  const currentPeriodCompletions = habits.reduce((acc, h) => {
    if (reportType === 'monthly') {
      return acc + h.completedDates.filter(d => d.startsWith(monthPrefix)).length;
    } else {
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      });
      return acc + h.completedDates.filter(d => last7.includes(d)).length;
    }
  }, 0);

  const consistency = totalPossible > 0 ? Math.round((currentPeriodCompletions / totalPossible) * 100) : 0;

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
    <div className="mt-12 md:mt-24 space-y-12 md:space-y-24 animate-in fade-in duration-1000 pb-12">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 px-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-bloom-500 rounded-[20px] md:rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-bloom-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">Ritual Growth</h2>
            <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Deep Dive Analytics</p>
          </div>
        </div>

        <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 w-full md:w-auto overflow-hidden">
          <button 
            onClick={() => setReportType('weekly')}
            className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'weekly' ? 'bg-white shadow-sm text-bloom-600' : 'text-gray-400'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setReportType('monthly')}
            className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'monthly' ? 'bg-white shadow-sm text-bloom-600' : 'text-gray-400'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="space-y-12 md:space-y-20 px-4">
        {/* Consistency Recap Card */}
        <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-12 border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 md:mb-12 gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-5xl font-black text-gray-900 tracking-tighter lowercase">
                {reportType === 'monthly' ? `${monthName} Flow` : 'Weekly Flow'}
              </h3>
              <p className="text-[10px] font-black text-bloom-500 uppercase tracking-widest mt-1">Consistency Trend</p>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <span className={`text-5xl md:text-7xl font-black tracking-tighter leading-none ${consistency > 70 ? 'text-gray-900' : 'text-red-500'}`}>
                {consistency}%
              </span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency</span>
            </div>
          </div>

          <div className="relative h-[100px] md:h-[200px] w-full flex items-center bg-gray-50/50 rounded-[24px] md:rounded-[32px] p-3 md:p-6 border border-gray-100 overflow-hidden">
            <svg viewBox="0 0 1000 150" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#80b918" stopOpacity="0" />
                  <stop offset="50%" stopColor="#80b918" stopOpacity="1" />
                  <stop offset="100%" stopColor="#80b918" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={ambientPath} fill="none" stroke="url(#lineGradient)" strokeWidth="6" strokeLinecap="round" className="transition-all duration-1000" />
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
                  <circle key={data.day} cx={x} cy={y} r={isToday ? "10" : "5"} className={`${isToday ? 'fill-bloom-600' : 'fill-bloom-400 opacity-30'}`} />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Actionable Report */}
        <div className="transform transition-all">
          <SummaryReport 
            habits={habits} 
            periodType={reportType} 
            periodName={reportType === 'monthly' ? monthName : 'Current Week'} 
          />
        </div>

        {/* Yearly Legacy Section - New Feature */}
        <div className="pt-8">
           <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-1.5 h-6 bg-gray-900 rounded-full" />
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Annual Legacy</h3>
           </div>
           <YearlyPlantReport habits={habits} profileCreatedAt={profileCreatedAt} />
        </div>

        {/* AI Audit */}
        <HabitAudit habits={habits} />

        {/* Heatmap Grid Section */}
        <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-12 border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between gap-10">
          <div className="xl:max-w-sm text-center xl:text-left">
            <h3 className="text-xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter mb-3 md:mb-4">Bloom Density</h3>
            <p className="text-xs md:text-base text-gray-500 font-medium leading-relaxed mb-6 md:mb-8">Your total ritual intensity visualised across the garden calendar.</p>
            <div className="flex items-center justify-center xl:justify-start gap-3 bg-gray-50 px-4 py-3 rounded-full w-fit mx-auto xl:mx-0 border border-gray-100">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Less</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <div key={i} className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-md ${['bg-gray-100', 'bg-bloom-100', 'bg-bloom-300', 'bg-bloom-500', 'bg-bloom-800'][i-1]}`} />)}
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">More</span>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-7 gap-1.5 md:gap-3 p-4 md:p-6 bg-gray-50/50 rounded-[28px] md:rounded-[32px] border border-gray-100 w-full md:w-auto max-w-sm md:max-w-md">
              {heatmapDays.map((data) => {
                const isToday = data.dateStr === todayStr;
                let intensityClass = 'bg-gray-200/50'; 
                if (data.intensity > 0) intensityClass = 'bg-bloom-100';
                if (data.intensity > 0.4) intensityClass = 'bg-bloom-300';
                if (data.intensity > 0.7) intensityClass = 'bg-bloom-500';
                if (data.intensity === 1) intensityClass = 'bg-bloom-800';
                return (
                  <div key={data.day} className={`aspect-square rounded-md md:rounded-xl transition-all shadow-sm ${intensityClass} ${isToday ? 'ring-2 ring-bloom-500 ring-offset-2' : ''}`} />
                );
              })}
            </div>
          </div>
        </div>

        {/* Maintenance / Danger Zone */}
        <div className="bg-red-50/30 rounded-[32px] md:rounded-[40px] p-6 md:p-12 border border-red-100/40">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left">
            <div className="max-w-md">
              <h3 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Garden Cleanse</h3>
              <p className="text-xs md:text-sm text-gray-500 font-medium">Resetting your rituals will permanently clear all historical data from your profile.</p>
            </div>
            <button 
              onClick={onDeleteAll}
              className="w-full md:w-auto px-8 md:px-10 py-4 md:py-5 bg-white text-red-500 border-2 border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-[20px] md:rounded-[24px] font-black uppercase tracking-widest text-[10px] md:text-xs transition-all active:scale-95 shadow-sm"
            >
              Clear Entire Garden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
