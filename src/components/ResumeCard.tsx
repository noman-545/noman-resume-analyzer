import React, { useState } from 'react';
import { Resume, Analysis } from '../types';
import { FileText, Sparkles, Trash2, Eye, Calendar, RefreshCw, Download, AlertTriangle, Check, X } from 'lucide-react';
import { getStoredToken } from '../services/api';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://noman-resume-analyzer.onrender.com';

interface ResumeCardProps {
  resume: Resume;
  analysis: Analysis | null;
  onAnalyze: (resumeId: number) => Promise<void>;
  onViewAnalysis: (resume: Resume, analysis: Analysis) => void;
  onDelete: (resumeId: number) => Promise<void>;
}

export const ResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  analysis,
  onAnalyze,
  onViewAnalysis,
  onDelete,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleAnalyzeClick = async () => {
    setAnalyzing(true);
    try {
      await onAnalyze(resume.id);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(resume.id);
    } catch (err: any) {
      alert(`Failed to delete resume: ${err.message || err}`);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleDownload = async () => {
  setDownloading(true);

  try {
    const token = getStoredToken();

    const response = await fetch(
      `${API_BASE}/api/resume/${resume.id}?download=true`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed (${response.status})`);
    }

    const blob = await response.blob();

    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = resume.fileName;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (err: any) {
    alert(err.message || 'Failed to download resume.');
  } finally {
    setDownloading(false);
  }
};

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-300 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 border-emerald-500/40 shadow-xs shadow-emerald-500/20';
    if (score >= 60) return 'text-amber-300 bg-gradient-to-r from-amber-500/25 to-orange-500/25 border-amber-500/40 shadow-xs shadow-amber-500/20';
    return 'text-rose-300 bg-gradient-to-r from-rose-500/25 to-pink-500/25 border-rose-500/40 shadow-xs shadow-rose-500/20';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-indigo-950/40 border border-slate-800/90 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform shadow-md">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-100 truncate tracking-tight" title={resume.fileName}>
                {resume.fileName}
              </h3>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Uploaded {resume.uploaded}</span>
              </div>
            </div>
          </div>

          {/* Score Badge */}
          {analysis ? (
            <div
              className={`px-3 py-1 rounded-full text-xs font-black border flex items-center space-x-1 shrink-0 ${getScoreColor(
                analysis.score
              )}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ATS {analysis.score}/100</span>
            </div>
          ) : (
            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/40 shrink-0 animate-pulse flex items-center space-x-1.5 shadow-md shadow-amber-500/10">
              <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
              <span>Analyzing (Polling 2s)...</span>
            </span>
          )}
        </div>

        {/* Highlighted Detected Resume Errors or Processing Banner */}
        {analysis ? (
          <div className="my-3 py-2 border-y border-slate-800/60">
            <p className="text-[10px] font-bold text-rose-400/90 mb-2 uppercase tracking-wider flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Detected Resume Errors & Flaws</span>
            </p>
            <div className="space-y-1.5">
              {analysis.weaknesses.slice(0, 2).map((errText, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-200 border border-rose-500/20 flex items-start space-x-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1"></span>
                  <span className="line-clamp-1">{errText}</span>
                </div>
              ))}
              {analysis.weaknesses.length > 2 && (
                <p className="text-[10px] text-slate-400 pl-1">
                  +{analysis.weaknesses.length - 2} more errors found in full report
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="my-3 p-3 rounded-xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30">
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-200 mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>AI Evaluation Running</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Extracting text and performing ATS scoring. Status updates automatically every 2s.
            </p>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse rounded-full w-3/4"></div>
            </div>
          </div>
        )}
      </div>

      {/* Inline Delete Confirmation Overlay if active */}
      {confirmingDelete ? (
        <div className="mt-3 p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="flex items-center space-x-2 text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">Confirm delete?</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              id={`cancel-delete-btn-${resume.id}`}
              onClick={() => setConfirmingDelete(false)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              id={`confirm-delete-btn-${resume.id}`}
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1 transition-colors"
            >
              {deleting ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              <span>{deleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Action Footer */
        <div className="mt-4 pt-3 flex items-center justify-between gap-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-2">
            {analysis && (
              <button
                id={`view-analysis-btn-${resume.id}`}
                onClick={() => onViewAnalysis(resume, analysis)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/30"
              >
                <Eye className="w-3.5 h-3.5 text-white" />
                <span>View Full Report</span>
              </button>
            )}

            <button
              id={`analyze-resume-btn-${resume.id}`}
              disabled={analyzing}
              onClick={handleAnalyzeClick}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md ${
                analysis
                  ? 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30'
              }`}
              title={analysis ? 'Re-run AI Analysis' : 'Run AI Analysis'}
            >
              {analyzing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{analyzing ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze Resume'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              id={`download-resume-btn-${resume.id}`}
              disabled={downloading}
              onClick={handleDownload}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
              title="Download PDF"
            >
              <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
            </button>

            <button
              id={`delete-resume-btn-${resume.id}`}
              onClick={() => setConfirmingDelete(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
              title="Delete Resume"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
