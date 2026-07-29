import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { X, Upload, FileText, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newResumeId?: number) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      validateAndSetFile(selected);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selected: File) => {
    if (!selected.name.toLowerCase().endsWith('.pdf') && selected.type !== 'application/pdf') {
      setError('Only PDF files are allowed (.pdf)');
      setFile(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 5 MB');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const res = await api.uploadResume(file, jobDescription);
      onSuccess(res.id);
      onClose();
      setFile(null);
      setJobDescription('');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateSample = async () => {
    setUploading(true);
    setError(null);

    try {
      const res = await api.generateSampleResume();
      onSuccess(res.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Sample generation failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-slate-100">
        {/* Close Button */}
        <button
          id="close-upload-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-5">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white mb-2.5 shadow-lg shadow-purple-500/30">
            <Upload className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Upload & Analyze Resume</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Accepts PDF documents (up to 5 MB). AI text extraction & ATS scoring runs instantly.
          </p>
        </div>

        {/* Alert Error */}
        {error && (
          <div className="mb-4 bg-rose-950/80 border border-rose-800/80 rounded-xl p-3 flex items-start space-x-2 text-xs text-rose-300 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-950/40'
              : file
              ? 'border-emerald-500 bg-emerald-950/30'
              : 'border-slate-800 hover:border-indigo-500/50 bg-slate-950/50'
          }`}
        >
          <input
            id="pdf-file-input"
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-100">{file.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for parsing
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <FileText className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-xs font-semibold text-slate-200">
                Drag and drop your PDF resume here, or <span className="text-indigo-400 underline font-bold">browse files</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF format up to 5MB</p>
            </div>
          )}
        </div>

        {/* Target Job Description Field (Optional) */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Target Job Description <span className="text-slate-500 font-normal lowercase">(optional)</span></span>
            <span className="text-[10px] text-indigo-400 font-medium">Extract Match & Missing Keywords</span>
          </label>
          <textarea
            id="upload-job-description-input"
            rows={3}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target job description or requirements here to analyze exact keyword matching..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            id="confirm-upload-btn"
            type="button"
            disabled={!file || uploading}
            onClick={handleUpload}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="inline-block animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4"></span>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload PDF Resume</span>
              </>
            )}
          </button>

          <button
            id="generate-sample-pdf-btn"
            type="button"
            disabled={uploading}
            onClick={handleGenerateSample}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-40"
            title="Generate a sample software developer resume for quick testing"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Generate Sample PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
