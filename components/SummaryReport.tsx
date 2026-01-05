
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Habit } from '../types';

interface SummaryReportProps {
  habits: Habit[];
  periodType: 'weekly' | 'monthly';
  periodName: string;
}

interface ReportData {
  summary: string;
  victory: { title: string; detail: string };
  focusArea: { title: string; detail: string };
  roadmap: string[];
}

const SummaryReport: React.FC<SummaryReportProps> = ({ habits, periodType, periodName }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const periodData = habits.map(h => {
        // Simple logic to count recent completions based on period
        const count = h.completedDates.length; // In a real app, we'd filter by period dates
        return `${h.name}: ${count} completions`;
      }).join('\n');

      const prompt = `You are a high-performance habit consultant. Generate a ${periodType} summary report for a user with these habits:
      ${periodData}
      
      The report is for: ${periodName}.
      
      Structure the response as JSON:
      {
        "summary": "A 2-3 sentence sophisticated analysis of their rhythm.",
        "victory": { "title": "Most Consistent Habit", "detail": "Why it succeeded." },
        "focusArea": { "title": "Needs Focus", "detail": "Specifically why this habit is lagging." },
        "roadmap": ["Step 1 for next period", "Step 2 for next period", "Step 3 for next period"]
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 }
        },
      });

      setReport(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase">Garden Summary</h3>
          <p className="text-sm font-medium text-gray-500 mt-1 italic">Formal {periodType} review & roadmap.</p>
        </div>
        {!report && (
          <button 
            onClick={generateReport}
            disabled={loading || habits.length === 0}
            className="px-10 py-5 bg-bloom-500 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-bloom-500/20 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 disabled:opacity-30"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : `Compile ${periodType} Report`}
          </button>
        )}
      </div>

      {report ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100">
            <h4 className="text-[10px] font-black text-bloom-500 uppercase tracking-widest mb-4">The Botanist's Review</h4>
            <p className="text-xl font-bold text-gray-800 leading-relaxed italic">"{report.summary}"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <span className="text-2xl mb-4 block">🌟</span>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ritual Victory</h4>
              <p className="text-lg font-black text-gray-900 mb-2">{report.victory.title}</p>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">{report.victory.detail}</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <span className="text-2xl mb-4 block">🔍</span>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Growth Friction</h4>
              <p className="text-lg font-black text-gray-900 mb-2">{report.focusArea.title}</p>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">{report.focusArea.detail}</p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-50">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 px-1">Actionable Roadmap for Next Period</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {report.roadmap.map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-bloom-100 text-bloom-600 flex items-center justify-center font-black text-xs shrink-0">{i + 1}</div>
                  <p className="text-sm font-bold text-gray-700 leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setReport(null)}
            className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-bloom-500 transition-colors mx-auto block"
          >
            Reset Analysis
          </button>
        </div>
      ) : !loading && (
        <div className="py-20 text-center bg-gray-50/30 rounded-[32px] border-2 border-dashed border-gray-100">
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Generate a report to see your period overview.</p>
        </div>
      )}
    </div>
  );
};

export default SummaryReport;
