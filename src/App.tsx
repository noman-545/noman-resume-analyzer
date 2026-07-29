import React, { useState, useEffect } from 'react';
import { User, Resume, Analysis } from './types';
import { api, clearStoredAuth } from './services/api';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { ResumeCard } from './components/ResumeCard';
import { AuthModal } from './components/AuthModal';
import { UploadModal } from './components/UploadModal';
import { AnalysisView } from './components/AnalysisView';
import {
  Upload,
  FileText,
  Sparkles,
  ShieldCheck,
  Lock,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analyses, setAnalyses] = useState<{ [resumeId: number]: Analysis }>({});

  const [loadingResumes, setLoadingResumes] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Active Analysis View Modal
  const [selectedResumeForView, setSelectedResumeForView] = useState<Resume | null>(null);
  const [selectedAnalysisForView, setSelectedAnalysisForView] = useState<Analysis | null>(null);

  // Initial load
  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  // Polling mechanism: Query status every 2 seconds for any resume without ready analysis
  useEffect(() => {
    if (!user || resumes.length === 0) return;

    const unanalyzedResumes = resumes.filter((r) => !analyses[r.id]);
    if (unanalyzedResumes.length === 0) return;

    const intervalId = setInterval(async () => {
      for (const r of unanalyzedResumes) {
        try {
          const statusRes = await api.getAnalysisStatus(r.id);
          if (statusRes.ready && statusRes.analysis) {
            setAnalyses((prev) => ({ ...prev, [r.id]: statusRes.analysis! }));

            // If selected view matches, auto update report
            if (selectedResumeForView?.id === r.id) {
              setSelectedAnalysisForView(statusRes.analysis);
            }
          }
        } catch (err) {
          console.error(`Polling status error for resume ${r.id}:`, err);
        }
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [user, resumes, analyses, selectedResumeForView]);

  const checkAuthAndLoadData = async () => {
    setLoadingResumes(true);
    setErrorMsg(null);
    try {
      const me = await api.getMe();
      setUser(me);
      await loadResumes();
    } catch {
      // Guest state
      setUser(null);
      setResumes([]);
      setAnalyses({});
    } finally {
      setLoadingResumes(false);
    }
  };

  const loadResumes = async () => {
    try {
      const list = await api.getResumes();
      setResumes(list);

      // Fetch any existing or auto-generated analyses
      const newAnalyses: { [resumeId: number]: Analysis } = {};
      for (const r of list) {
        try {
          let analysis = await api.getAnalysis(r.id);
          if (!analysis) {
            const statusRes = await api.getAnalysisStatus(r.id);
            if (statusRes.analysis) {
              analysis = statusRes.analysis;
            }
          }
          if (analysis) {
            newAnalyses[r.id] = analysis;
          }
        } catch (err) {
          console.error(`Analysis load error for resume ${r.id}:`, err);
        }
      }
      setAnalyses(newAnalyses);
    } catch (err: any) {
      console.error('Failed to load resumes:', err);
      setErrorMsg(err.message || 'Failed to load user resumes');
    }
  };

  const handleUploadSuccess = async (newResumeId?: number) => {
    await loadResumes();
    if (newResumeId) {
      const list = await api.getResumes();
      const targetResume = list.find((r) => r.id === newResumeId);
      if (targetResume) {
        // Poll immediately for the newly uploaded resume
        try {
          const statusRes = await api.getAnalysisStatus(newResumeId);
          if (statusRes.ready && statusRes.analysis) {
            setAnalyses((prev) => ({ ...prev, [newResumeId]: statusRes.analysis! }));
            setSelectedResumeForView(targetResume);
            setSelectedAnalysisForView(statusRes.analysis);
          } else {
            // Show resume card with pulsing 'Analyzing...' state while polling finishes
            setSelectedResumeForView(targetResume);
          }
        } catch (err) {
          console.error('Initial status check error after upload:', err);
        }
      }
    }
  };

  const handleAutoDemoLogin = async () => {
    setErrorMsg(null);
    try {
      // Attempt login or register demo user
      try {
        const loginRes = await api.login('john@example.com', 'Password123!');
        if (loginRes.user) {
          setUser(loginRes.user);
          await loadResumes();
          return;
        }
      } catch {
        // Register demo user if not exists
        await api.register('John Doe', 'john@example.com', 'Password123!');
        const loginRes = await api.login('john@example.com', 'Password123!');
        if (loginRes.user) {
          setUser(loginRes.user);
          await loadResumes();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setUser(null);
    setResumes([]);
    setAnalyses({});
  };

  const handleAnalyze = async (resumeId: number) => {
    try {
      const analysis = await api.analyzeResume(resumeId);
      setAnalyses((prev) => ({ ...prev, [resumeId]: analysis }));

      // Automatically open report view
      const targetResume = resumes.find((r) => r.id === resumeId);
      if (targetResume) {
        setSelectedResumeForView(targetResume);
        setSelectedAnalysisForView(analysis);
      }
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    }
  };

  const handleDeleteResume = async (resumeId: number) => {
    try {
      await api.deleteResume(resumeId);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
      setAnalyses((prev) => {
        const copy = { ...prev };
        delete copy[resumeId];
        return copy;
      });
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Header Bar */}
      <Header
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error notification banner */}
        {errorMsg && (
          <div className="mb-6 bg-rose-950/80 border border-rose-800/80 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-300 font-medium shadow-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="space-y-6">
          {/* Guest Banner if not authenticated */}
          {!user && (
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>JWT Authenticated REST Gateway</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  AI-Powered Resume ATS Analyzer
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Upload PDF resumes, extract clean structured text, run Gemini ATS scoring models, and review Strengths, Weaknesses, Missing Skills, and Actionable Recommendations in real time.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    id="guest-login-modal-btn"
                    onClick={() => setAuthModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-colors flex items-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Login / Register API Account</span>
                  </button>

                  <button
                    id="guest-auto-demo-btn"
                    onClick={handleAutoDemoLogin}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>1-Click Test Demo Login</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          {user && (
            <StatsBar
              resumes={resumes}
              analyses={analyses}
              onOpenUpload={() => setUploadModalOpen(true)}
            />
          )}

          {/* Dashboard Controls & Resume List */}
          {user && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 backdrop-blur-md">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center space-x-2">
                    <FileText className="w-4.5 h-4.5 text-indigo-400" />
                    <span>Uploaded Resumes</span>
                    <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {resumes.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select any resume to run rapid AI ATS analysis or review scores
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    id="refresh-resumes-btn"
                    onClick={loadResumes}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors"
                    title="Refresh List"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingResumes ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    id="upload-resume-main-btn"
                    onClick={() => setUploadModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Resume PDF</span>
                  </button>
                </div>
              </div>

              {/* Resume Cards Grid */}
              {loadingResumes ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p>Loading user resumes from server database...</p>
                </div>
              ) : resumes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {resumes.map((r) => (
                    <ResumeCard
                      key={r.id}
                      resume={r}
                      analysis={analyses[r.id] || null}
                      onAnalyze={handleAnalyze}
                      onViewAnalysis={(res, ana) => {
                        setSelectedResumeForView(res);
                        setSelectedAnalysisForView(ana);
                      }}
                      onDelete={handleDeleteResume}
                    />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="bg-slate-900/90 border border-slate-800/80 border-dashed rounded-3xl p-12 text-center space-y-4 shadow-xl backdrop-blur-md">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-base">No Resumes Uploaded Yet</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Upload a PDF resume (≤ 5MB) or generate a sample developer resume to test the Gemini ATS analysis pipeline.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center space-x-3">
                    <button
                      id="empty-state-upload-btn"
                      onClick={() => setUploadModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload PDF Resume</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>AI Resume Analyzer • ATS Pro Engine</p>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>System Status: Operational</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          loadResumes();
        }}
      />

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <AnalysisView
        resume={selectedResumeForView}
        analysis={selectedAnalysisForView}
        onClose={() => {
          setSelectedResumeForView(null);
          setSelectedAnalysisForView(null);
        }}
      />
    </div>
  );
}
