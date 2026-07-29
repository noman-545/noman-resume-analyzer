import React from 'react';
import { Resume, Analysis } from '../types';
import { FileText, Sparkles, TrendingUp, Upload, LineChart as LineChartIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface StatsBarProps {
  resumes: Resume[];
  analyses: { [resumeId: number]: Analysis };
  onOpenUpload: () => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-3 text-white shadow-xl text-xs space-y-1 backdrop-blur-md">
        <p className="font-bold text-slate-100">{data.fullName}</p>
        <p className="text-slate-400">Date: {data.uploaded}</p>
        <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-800/80 mt-1">
          <span className="text-slate-400">ATS Score:</span>
          <span className="font-extrabold text-indigo-400">{data.score} / 100</span>
        </div>
      </div>
    );
  }
  return null;
};

export const StatsBar: React.FC<StatsBarProps> = ({ resumes, analyses, onOpenUpload }) => {
  const totalUploaded = resumes.length;
  const analyzedCount = Object.keys(analyses).length;

  const scores = (Object.values(analyses) as Analysis[]).map((a) => a.score);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Last 5 analyzed resumes over time
  const analyzedResumes = resumes.filter((r) => analyses[r.id] !== undefined);
  const lastFiveResumes = analyzedResumes.slice(-5);

  const chartData = lastFiveResumes.map((r, index) => {
    const shortName = r.fileName.length > 16 ? r.fileName.substring(0, 13) + '...' : r.fileName;
    return {
      id: r.id,
      name: shortName,
      fullName: r.fileName,
      score: analyses[r.id].score,
      uploaded: r.uploaded || `Resume #${index + 1}`,
    };
  });

  return (
    <div className="space-y-4 mb-6">
      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-950/60 via-slate-900/95 to-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-cyan-950/20 backdrop-blur-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Total Resumes</p>
            <p className="text-2xl font-black text-white mt-1 tracking-tight">{totalUploaded}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-900 to-indigo-950 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-950/60 via-slate-900/95 to-slate-900/90 border border-purple-500/30 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-purple-950/20 backdrop-blur-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-300">AI Analyzed</p>
            <p className="text-2xl font-black text-white mt-1 tracking-tight">{analyzedCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-900 to-indigo-950 border border-purple-400/30 text-purple-300 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900/95 to-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-emerald-950/20 backdrop-blur-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Average ATS Score</p>
            <p className="text-2xl font-black bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent mt-1 tracking-tight">
              {avgScore ? `${avgScore} / 100` : 'N/A'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-900 to-teal-950 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-950/60 via-slate-900/95 to-indigo-950/60 border border-pink-500/30 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-pink-950/20 backdrop-blur-md text-white">
          <div>
            <p className="text-[10px] font-mono text-pink-300 uppercase tracking-widest font-extrabold">Audit Engine</p>
            <div className="flex items-center space-x-2 mt-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-100">Active & Ready</span>
            </div>
          </div>
          <button
            id="quick-upload-btn-stats"
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-purple-600/30"
          >
            <Upload className="w-4 h-4" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Recharts Line Chart Visualization */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg shadow-black/20 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
              <LineChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                ATS Score Trend (Last 5 Analyzed Resumes)
              </h3>
              <p className="text-[11px] text-slate-400">
                Score trajectory benchmarking across recently processed candidates
              </p>
            </div>
          </div>
          {chartData.length > 0 && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-medium">Recent Peak:</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                {Math.max(...chartData.map((d) => d.score))} / 100
              </span>
            </div>
          )}
        </div>

        {chartData.length > 0 ? (
          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#6366f1', stroke: '#0f172a', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#818cf8', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-36 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/50 text-slate-400 text-xs text-center p-4 space-y-2">
            <TrendingUp className="w-6 h-6 text-slate-500" />
            <p className="font-medium text-slate-300">No ATS Score History Available Yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm">
              Upload PDF resumes and click "Analyze Resume" to view score trends plotted over time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
