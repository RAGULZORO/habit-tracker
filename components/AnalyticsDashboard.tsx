
import React, { useMemo, useState, useEffect } from 'react';
import { Habit } from '../types.ts';
import { GoogleGenAI } from "@google/genai";

interface AnalyticsDashboardProps {
  habits: Habit[];
  currentDate: Date;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ habits, currentDate }) => {
  const [aiInsights, setAiInsights] = useState<{ weekly: string; monthly: string }>({ 
    weekly: "Your rhythm is finding its soil...", 
    monthly: "Observing the seasonal growth..." 
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // --- DATA CALCULATIONS ---

  // Weekly data: 7 days ending at the view's current date
  const weeklyData = useMemo(() => {
    const days = [];
    const anchor = new Date(currentDate);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const completions = habits.reduce((acc, h) => acc + (h.completedDates.includes(dateStr) ? 1 : 0), 0);
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNum: d.getDate(),
        fullDate: dateStr,
        count: completions,
        percentage: habits.length > 0 ? (completions / habits.length) * 100 : 0
      });
    }
    return days;
  }, [habits, currentDate]);

  // Monthly data: 6 months ending at the view's current month
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthIndex = d.getMonth() + 1;
      const year = d.getFullYear();
      const monthPrefix = `${year}-${String(monthIndex).padStart(2, '0')}`;
      
      let totalPotential = 0;
      let actualCompletions = 0;
      
      const daysInMonth = new Date(year, monthIndex, 0).getDate();
      
      habits.forEach(h => {
        const monthComps = h.completedDates.filter(date => date.startsWith(monthPrefix)).length;
        actualCompletions += monthComps;
        totalPotential += daysInMonth;
      });

      months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        year: year,
        percentage: totalPotential > 0 ? (actualCompletions / totalPotential) * 100 : 0,
        count: actualCompletions
      });
    }
    return months;
  }, [habits, currentDate]);

  // --- AI INSIGHT GENERATION ---

  const generateInsights = async () => {
    if (habits.length === 0 || isGenerating) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const weekSummary = weeklyData.map(d => `${d.label}: ${d.count}/${habits.length}`).join(', ');
      const monthSummary = monthlyData.map(m => `${m.label}: ${Math.round(m.percentage)}%`).join(', ');

      const prompt = `Analyze this habit data for the "Bloom" app.
      Weekly Context: ${weekSummary}
      Monthly Trends: ${monthSummary}
      
      Provide two very short, professional, and encouraging insights (max 12 words each):
      1. One for the weekly rhythm.
      2. One for the monthly velocity.
      
      Return as JSON: {"weekly": "...", "monthly": "..."}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setAiInsights({
        weekly: result.weekly || aiInsights.weekly,
        monthly: result.monthly || aiInsights.monthly
      });
    } catch (e) {
      console.error("AI Insight error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(generateInsights, 2000);
    return () => clearTimeout(timer);
  }, [habits, currentDate]);

  const peakWeekDay = [...weeklyData].sort((a, b) => b.count - a.count)[0];
  const peakMonth = [...monthlyData].sort((a, b) => b.percentage - a.percentage)[0];

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between px-4 gap-4">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter lowercase">Performance Reports.</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">Visualizing your discipline over time</p>
        </div>
        <button 
          onClick={generateInsights}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group w-fit"
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Refresh Insights</span>
          <svg className={`w-4 h-4 text-bloom-500 ${isGenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 px-4">
        
        {/* WEEKLY RHYTHM BAR CHART */}
        <div className="bg-white rounded-[48px] p-8 md:p-12 border border-gray-100 shadow-sm transition-all hover:border-bloom-100">
          <div className="flex justify-between items-start mb-12">
            <div>
              <span className="text-[9px] font-black text-bloom-500 uppercase tracking-[0.4em] mb-2 block">7-Day Rhythm</span>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight lowercase">Daily Flow.</h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-gray-300 uppercase block">Peak</span>
              <span className="text-2xl font-black text-orange-500 uppercase tracking-tighter">{peakWeekDay?.label}</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 md:gap-4 h-56 mb-12">
            {weeklyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="w-full relative flex items-end justify-center h-full">
                  <div 
                    className={`w-full max-w-[40px] rounded-2xl transition-all duration-1000 ease-out shadow-sm ${
                      day.count === peakWeekDay.count && day.count > 0 ? 'bg-bloom-500' : 'bg-bloom-50 group-hover:bg-bloom-100'
                    }`}
                    style={{ height: `${Math.max(day.percentage, 10)}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap z-10 shadow-xl">
                      {day.count} Rituals
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{day.label}</span>
                  <span className="text-[9px] font-bold text-gray-200">{day.dayNum}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 flex items-start gap-4">
            <span className="text-2xl">⚡</span>
            <div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Weekly Note</span>
              <p className="text-xs font-bold text-gray-700 leading-relaxed italic">"{aiInsights.weekly}"</p>
            </div>
          </div>
        </div>

        {/* MONTHLY VELOCITY BAR CHART */}
        <div className="bg-white rounded-[48px] p-8 md:p-12 border border-gray-100 shadow-sm transition-all hover:border-bloom-100">
          <div className="flex justify-between items-start mb-12">
            <div>
              <span className="text-[9px] font-black text-bloom-500 uppercase tracking-[0.4em] mb-2 block">6-Month Velocity</span>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight lowercase">Growth Trend.</h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-gray-300 uppercase block">Top</span>
              <span className="text-2xl font-black text-bloom-600 uppercase tracking-tighter">{peakMonth?.label}</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 md:gap-4 h-56 mb-12">
            {monthlyData.map((month, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="w-full relative flex items-end justify-center h-full">
                  <div 
                    className={`w-full max-w-[40px] rounded-2xl transition-all duration-1000 ease-out shadow-sm ${
                      month.label === peakMonth.label && month.percentage > 0 ? 'bg-bloom-600' : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}
                    style={{ height: `${Math.max(month.percentage, 10)}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap z-10 shadow-xl">
                      {Math.round(month.percentage)}% Capacity
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{month.label}</span>
                  <span className="text-[9px] font-bold text-gray-300">{month.year}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 flex items-start gap-4">
            <span className="text-2xl">🌱</span>
            <div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Monthly Note</span>
              <p className="text-xs font-bold text-gray-700 leading-relaxed italic">"{aiInsights.monthly}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
