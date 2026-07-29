import React from 'react';
import { User } from '../types';
import { FileText, LogIn, LogOut, UserCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  activeTab?: 'dashboard';
  setActiveTab?: (tab: 'dashboard') => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-indigo-500/30 text-slate-100 shadow-xl shadow-indigo-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-500/30">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
                AI Resume Analyzer
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-black bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-300 border border-indigo-500/40 rounded-full shadow-xs">
                ATS Pro
              </span>
            </div>
            <p className="text-xs text-indigo-300/80 hidden sm:block font-medium">Real-Time ATS Audit & Scoring Engine</p>
          </div>
        </div>

        {/* Center: Navigation Indicator */}
        <div className="flex items-center space-x-2 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 px-4 py-1.5 rounded-2xl border border-indigo-500/30 text-xs font-bold text-indigo-200 shadow-inner">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Dashboard</span>
        </div>

        {/* Right: User Auth Controls */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 pl-3.5 pr-1.5 py-1 rounded-full border border-emerald-500/40 shadow-md">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <div className="text-right">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400">Authenticated</p>
                  <p className="text-xs font-bold text-slate-100 max-w-[120px] truncate leading-none">
                    {user.name}
                  </p>
                </div>
              </div>
              <button
                id="logout-btn"
                onClick={onLogout}
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="login-register-btn"
              onClick={onOpenAuth}
              className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
