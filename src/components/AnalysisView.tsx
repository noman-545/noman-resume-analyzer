import React, { useState } from 'react';
import { Resume, Analysis } from '../types';
import { api } from '../services/api';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  Trophy,
  ShieldCheck,
  Zap,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  Tag,
  Target,
} from 'lucide-react';

interface AnalysisViewProps {
  resume: Resume | null;
  analysis: Analysis | null;
  onClose: () => void;
  onAnalysisUpdated?: (updated: Analysis) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ resume, analysis, onClose, onAnalysisUpdated }) => {
  if (!resume || !analysis) return null;

  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis>(analysis);
  const [jdText, setJdText] = useState<string>(analysis.jobDescription || '');
  const [isAnalyzingJd, setIsAnalyzingJd] = useState(false);
  const [jdError, setJdError] = useState<string | null>(null);
  const [keywordFilter, setKeywordFilter] = useState<'all' | 'found' | 'missing'>('all');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 stroke-emerald-400';
    if (score >= 60) return 'text-amber-400 stroke-amber-400';
    return 'text-rose-400 stroke-rose-400';
  };

  const handleAnalyzeJd = async () => {
    setIsAnalyzingJd(true);
    setJdError(null);
    try {
      const updated = await api.analyzeResume(resume.id, jdText);
      setCurrentAnalysis(updated);
      if (onAnalysisUpdated) {
        onAnalysisUpdated(updated);
      }
    } catch (err: any) {
      setJdError(err.message || 'Failed to analyze against job description');
    } finally {
      setIsAnalyzingJd(false);
    }
  };

  const matchingKw = currentAnalysis.matchingKeywords || [];
  const rawMissingKw = currentAnalysis.missingKeywords || [];
  // Merge missingSkills if missingKeywords is sparse to ensure a rich cloud
  const missingKw = Array.from(new Set([...rawMissingKw, ...(currentAnalysis.missingSkills || [])]));
  const matchScore = currentAnalysis.jdMatchScore ?? currentAnalysis.score;
  const totalKeywords = matchingKw.length + missingKw.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative text-slate-100 overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-indigo-500/30 flex items-center justify-between bg-gradient-to-r from-slate-950 via-indigo-950/90 to-slate-950 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white tracking-tight flex items-center space-x-2">
                <span>ATS Resume & Keyword Match Audit</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs">
                  AI Evaluated
                </span>
              </h2>
              <p className="text-xs text-slate-300 truncate max-w-md">File: {resume.fileName}</p>
            </div>
          </div>

          <button
            id="close-analysis-view-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-950/50">
          {/* ATS Score Overview Hero Card */}
          <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/40 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-500/10 relative overflow-hidden">
            <div className="flex items-center space-x-6">
              {/* Radial Gauge */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className={getScoreColor(currentAnalysis.score)}
                    strokeWidth="8"
                    strokeDasharray={289}
                    strokeDashoffset={289 - (289 * currentAnalysis.score) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-black bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                    {currentAnalysis.score}
                  </span>
                  <span className="text-[10px] block font-extrabold text-indigo-300 uppercase tracking-widest">/ 100</span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-slate-100 tracking-tight">
                    {currentAnalysis.score >= 80
                      ? 'High ATS Match Potential'
                      : currentAnalysis.score >= 60
                      ? 'Moderate Candidate Match'
                      : 'Requires Keyword Optimization'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                  Parsed content benchmarked across technical keywords, action verbs, impact metrics, and resume structure.
                </p>
              </div>
            </div>

            {/* Score Breakdown Pills */}
            <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 text-xs space-y-2 w-full md:w-auto shrink-0">
              <div className="flex items-center justify-between space-x-6">
                <span className="text-slate-400 font-medium">Strengths:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  {currentAnalysis.strengths.length}
                </span>
              </div>
              <div className="flex items-center justify-between space-x-6">
                <span className="text-slate-400 font-medium">Errors:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20">
                  {currentAnalysis.weaknesses.length}
                </span>
              </div>
              <div className="flex items-center justify-between space-x-6">
                <span className="text-slate-400 font-medium">Job Keyword Match:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                  {matchScore}% Match
                </span>
              </div>
            </div>
          </div>

          {/* NEW KEYWORD HIGHLIGHTS SECTION */}
          <div id="keyword-highlights-section" className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
            {/* Header & Alignment Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/90 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <Tag className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center space-x-2">
                    <span>Keyword Highlights & Role Alignment</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Badge Cloud
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Instant visual cloud showing found keywords vs missing role requirements
                  </p>
                </div>
              </div>

              {/* Match Stats pill */}
              <div className="flex items-center space-x-3 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0">
                <Target className="w-4 h-4 text-indigo-400" />
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Alignment Ratio</span>
                  <span className="text-xs font-extrabold text-indigo-300 font-mono">
                    {matchingKw.length} / {totalKeywords || 1} Keywords ({matchScore}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Keyword Alignment Progress Bar */}
            <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Matched ({matchingKw.length})</span>
                  <span className="text-slate-500 mx-1">•</span>
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>Missing ({missingKw.length})</span>
                </span>
                <span className="text-indigo-400 font-bold font-mono">{matchScore}% Role Match Rate</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                  style={{ width: `${totalKeywords > 0 ? (matchingKw.length / totalKeywords) * 100 : matchScore}%` }}
                ></div>
                <div
                  className="bg-rose-500/80 h-full transition-all duration-500"
                  style={{ width: `${totalKeywords > 0 ? (missingKw.length / totalKeywords) * 100 : (100 - matchScore)}%` }}
                ></div>
              </div>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <button
                  id="filter-kw-all-btn"
                  onClick={() => setKeywordFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    keywordFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Badges ({totalKeywords})
                </button>
                <button
                  id="filter-kw-found-btn"
                  onClick={() => setKeywordFilter('found')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    keywordFilter === 'found'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Found ({matchingKw.length})</span>
                </button>
                <button
                  id="filter-kw-missing-btn"
                  onClick={() => setKeywordFilter('missing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    keywordFilter === 'missing'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-rose-400'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Missing ({missingKw.length})</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 italic">
                Green = Present in Resume • Red/Rose = Missing in Target Role
              </span>
            </div>

            {/* Badge Cloud Grid */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 min-h-[100px] flex flex-wrap gap-2.5 items-center">
              {(keywordFilter === 'all' || keywordFilter === 'found') &&
                matchingKw.map((kw, idx) => (
                  <span
                    key={`found-${idx}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/60 transition-all flex items-center space-x-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{kw}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1"></span>
                  </span>
                ))}

              {(keywordFilter === 'all' || keywordFilter === 'missing') &&
                missingKw.map((kw, idx) => (
                  <span
                    key={`missing-${idx}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:border-rose-400/60 transition-all flex items-center space-x-1.5 shadow-xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{kw}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 ml-1"></span>
                  </span>
                ))}

              {totalKeywords === 0 && (
                <p className="text-xs text-slate-500 italic py-2">
                  No keywords extracted yet. Paste a target job description below to generate instant alignment.
                </p>
              )}
            </div>
          </div>

          {/* Job Description & Keyword Analyzer Section */}
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Job Description & Target Role Compare</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                Interactive Keyword Extractor
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste a specific Job Description below to evaluate your resume against real-world recruiter requirements and update the Keyword Highlights badge cloud above.
            </p>

            {jdError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-medium">
                {jdError}
              </div>
            )}

            <div className="space-y-3">
              <textarea
                id="jd-analyzer-textarea"
                rows={4}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste target Job Description here (e.g. Senior Full Stack Engineer requiring React, TypeScript, Node.js, PostgreSQL, Docker, AWS, microservices, REST APIs)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-y font-mono"
              />

              <div className="flex justify-end">
                <button
                  id="analyze-jd-keywords-btn"
                  type="button"
                  disabled={isAnalyzingJd || !jdText.trim()}
                  onClick={handleAnalyzeJd}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAnalyzingJd ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Extracting Keywords...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-white" />
                      <span>Analyze & Extract Keywords</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Grid: Strengths Cards & Weaknesses Cards with Visual Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Section */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Resume Strengths</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {currentAnalysis.strengths.length} Badges
                </span>
              </div>

              <div className="space-y-3">
                {currentAnalysis.strengths.map((str, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/30 rounded-xl p-3.5 flex items-start space-x-3 transition-colors group"
                  >
                    <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Verified Strength
                      </span>
                      <p className="text-xs text-slate-200 leading-snug font-medium">{str}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses Section */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-widest">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Detected Resume Errors & Flaws</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {currentAnalysis.weaknesses.length} Errors Found
                </span>
              </div>

              <div className="space-y-3">
                {currentAnalysis.weaknesses.map((weak, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800/80 hover:border-rose-500/30 rounded-xl p-3.5 flex items-start space-x-3 transition-colors group"
                  >
                    <div className="p-1 rounded-lg bg-rose-500/10 text-rose-400 shrink-0 mt-0.5">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        Error / Flaw Detected
                      </span>
                      <p className="text-xs text-slate-200 leading-snug font-medium">{weak}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Missing Skills / Industry Requirements Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Industry Technical Standards & Skill Gaps</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">ATS Requirement Matrix</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {currentAnalysis.missingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-slate-950/90 text-slate-200 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
