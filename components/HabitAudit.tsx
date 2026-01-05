
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Habit } from '../types';

interface HabitAuditProps {
  habits: Habit[];
}

interface AuditResult {
  weakestHabit: string;
  slumpDay: string;
  critique: string;
  prescription: string;
  lackingAreas: { area: string; gap: string }[];
}

const HabitAudit: React.FC<HabitAuditProps> = ({ habits }) => {
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<AuditResult | null>(null);

  const performAudit = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const habitData = habits.map(h => ({
        name: h.name,
        totalCompletions: h.completedDates.length,
        recentDates: h.completedDates.slice(-14) // Analyze last 2 weeks
      }));

      const prompt = `You are the 'Bloom Auditor'. Analyze these habit logs:
      ${JSON.stringify(habitData)}
      
      Identify:
      1. The 'Weakest Habit' (lowest consistency).
      2. The 'Slump Day' (if a pattern exists where they miss work on specific days, e.g., 'Thursdays').
      3. A 'Critique' of where they are lacking work (be honest but encouraging).
      4. A 'Prescription' (how to fix the lack of work).
      5. 3 specific 'lackingAreas' (e.g., "Evening discipline", "Weekend focus").

      Return JSON:
      {
        "weakestHabit": "string",
        "slumpDay": "string",
        "critique": "string",
        "prescription": "string",
        "lackingAreas": [{"area": "string", "gap": "string"}]
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 }
        },
      });

      setAudit(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Audit failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-sm overflow-hidden relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase">Performance Audit</h3>
          <p className="text-sm font-medium text-gray-500 mt-1">Identify where your work is lacking and how to bloom better.</p>
        </div>
        <button 
          onClick={performAudit}
          disabled={loading || habits.length === 0}
          className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all flex items-center gap-3 disabled:opacity-30"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : 'Run Diagnostic'}
        </button>
      </div>

      {audit ? (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">Weakest Link</span>
              <h4 className="text-xl font-black text-red-900">{audit.weakestHabit}</h4>
              <p className="text-xs font-medium text-red-700/70 mt-1">This ritual needs immediate hydration.</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-2">Detected Slump Day</span>
              <h4 className="text-xl font-black text-orange-900">{audit.slumpDay}</h4>
              <p className="text-xs font-medium text-orange-700/70 mt-1">Your energy tends to dip here.</p>
            </div>
          </div>

          <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">The Auditor's Report</h4>
            <p className="text-lg font-bold text-gray-800 leading-relaxed mb-6">"{audit.critique}"</p>
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-2xl">🌱</span>
              <div>
                <span className="text-[10px] font-black text-bloom-500 uppercase tracking-widest block mb-1">Prescription</span>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">{audit.prescription}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Lacking Areas</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {audit.lackingAreas.map((area, i) => (
                <div key={i} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <h5 className="font-black text-gray-900 text-sm mb-1">{area.area}</h5>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{area.gap}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Awaiting analysis of your garden data...</p>
        </div>
      )}
    </div>
  );
};

export default HabitAudit;
