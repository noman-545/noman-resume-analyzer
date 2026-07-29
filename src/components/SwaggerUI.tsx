import React, { useState } from 'react';
import { getStoredToken } from '../services/api';
import { Code2, Play, ChevronDown, ChevronRight, Lock, CheckCircle2, Copy, Check, Download } from 'lucide-react';

export const SwaggerUI: React.FC = () => {
  const token = getStoredToken();
  const [openEndpoint, setOpenEndpoint] = useState<string | null>('POST-/api/auth/register');

  // Input states for testing
  const [registerInput, setRegisterInput] = useState({ name: 'Jane Smith', email: 'jane@example.com', password: 'Password123!' });
  const [loginInput, setLoginInput] = useState({ email: 'john@example.com', password: 'Password123!' });
  const [getResumeIdInput, setGetResumeIdInput] = useState('1');
  const [deleteResumeIdInput, setDeleteResumeIdInput] = useState('1');
  const [postAnalysisIdInput, setPostAnalysisIdInput] = useState('1');
  const [getAnalysisIdInput, setGetAnalysisIdInput] = useState('1');

  // Response state for each endpoint test
  const [responses, setResponses] = useState<{ [key: string]: { status?: number; data?: any; loading?: boolean } }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleEndpoint = (key: string) => {
    setOpenEndpoint(openEndpoint === key ? null : key);
  };

  const handleExecute = async (key: string, fetcher: () => Promise<{ status: number; data: any }>) => {
    setResponses((prev) => ({ ...prev, [key]: { loading: true } }));
    try {
      const res = await fetcher();
      setResponses((prev) => ({ ...prev, [key]: { status: res.status, data: res.data, loading: false } }));
    } catch (err: any) {
      setResponses((prev) => ({
        ...prev,
        [key]: { status: 500, data: { success: false, message: err.message }, loading: false },
      }));
    }
  };

  const handleCopySpec = () => {
    fetch('/api/swagger.json')
      .then((res) => res.text())
      .then((txt) => {
        navigator.clipboard.writeText(txt);
        setCopiedKey('spec');
        setTimeout(() => setCopiedKey(null), 2000);
      });
  };

  const getMethodBadge = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'POST':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Swagger Hero Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Code2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Swagger OpenAPI 3.0 Documentation</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive REST API specification for testing endpoints and reviewing response schemas.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="copy-swagger-json-btn"
              onClick={handleCopySpec}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center space-x-1.5 transition-colors"
            >
              {copiedKey === 'spec' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'spec' ? 'Copied Spec' : 'Copy OpenAPI JSON'}</span>
            </button>

            <a
              href="/api/swagger.json"
              target="_blank"
              download="openapi.json"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Spec</span>
            </a>
          </div>
        </div>

        {/* Authorization Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <span className="text-slate-700 font-semibold">JWT Authorization State:</span>
            {token ? (
              <span className="text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded text-[11px] font-medium">
                Bearer Token Active ({token.substring(0, 18)}...)
              </span>
            ) : (
              <span className="text-amber-700 font-mono bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded text-[11px] font-medium">
                Unauthenticated (Login to access protected endpoints)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* API Endpoint Accordions */}
      <div className="space-y-4">
        {/* Section: Authentication */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Authentication Module</h3>

          {/* POST /api/auth/register */}
          <EndpointAccordion
            id="endpoint-register"
            method="POST"
            path="/api/auth/register"
            summary="Register a new user account"
            isOpen={openEndpoint === 'POST-/api/auth/register'}
            onToggle={() => toggleEndpoint('POST-/api/auth/register')}
            getMethodBadge={getMethodBadge}
          >
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Request Body (JSON)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={registerInput.name}
                    onChange={(e) => setRegisterInput({ ...registerInput, name: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={registerInput.email}
                    onChange={(e) => setRegisterInput({ ...registerInput, email: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={registerInput.password}
                    onChange={(e) => setRegisterInput({ ...registerInput, password: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                onClick={() =>
                  handleExecute('register', async () => {
                    const res = await fetch('/api/auth/register', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(registerInput),
                    });
                    return { status: res.status, data: await res.json() };
                  })
                }
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center space-x-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute POST</span>
              </button>

              <ResponseBox response={responses['register']} />
            </div>
          </EndpointAccordion>

          {/* POST /api/auth/login */}
          <EndpointAccordion
            id="endpoint-login"
            method="POST"
            path="/api/auth/login"
            summary="Login and acquire JWT token"
            isOpen={openEndpoint === 'POST-/api/auth/login'}
            onToggle={() => toggleEndpoint('POST-/api/auth/login')}
            getMethodBadge={getMethodBadge}
          >
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginInput.email}
                  onChange={(e) => setLoginInput({ ...loginInput, email: e.target.value })}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginInput.password}
                  onChange={(e) => setLoginInput({ ...loginInput, password: e.target.value })}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                onClick={() =>
                  handleExecute('login', async () => {
                    const res = await fetch('/api/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(loginInput),
                    });
                    return { status: res.status, data: await res.json() };
                  })
                }
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center space-x-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute POST</span>
              </button>

              <ResponseBox response={responses['login']} />
            </div>
          </EndpointAccordion>
        </div>

        {/* Section: Resumes */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Resume Module (Authenticated)</h3>

          {/* GET /api/resume */}
          <EndpointAccordion
            id="endpoint-get-resumes"
            method="GET"
            path="/api/resume"
            summary="Get all resumes uploaded by logged-in user"
            isOpen={openEndpoint === 'GET-/api/resume'}
            onToggle={() => toggleEndpoint('GET-/api/resume')}
            getMethodBadge={getMethodBadge}
          >
            <div className="space-y-3 text-xs">
              <button
                onClick={() =>
                  handleExecute('get-resumes', async () => {
                    const res = await fetch('/api/resume', {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    return { status: res.status, data: await res.json() };
                  })
                }
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute GET</span>
              </button>

              <ResponseBox response={responses['get-resumes']} />
            </div>
          </EndpointAccordion>

          {/* GET /api/resume/{id} */}
          <EndpointAccordion
            id="endpoint-get-resume-id"
            method="GET"
            path="/api/resume/{id}"
            summary="Get single resume metadata by ID"
            isOpen={openEndpoint === 'GET-/api/resume/{id}'}
            onToggle={() => toggleEndpoint('GET-/api/resume/{id}')}
            getMethodBadge={getMethodBadge}
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-semibold">Parameter id:</span>
                <input
                  type="number"
                  value={getResumeIdInput}
                  onChange={(e) => setGetResumeIdInput(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 w-24 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                onClick={() =>
                  handleExecute('get-resume-id', async () => {
                    const res = await fetch(`/api/resume/${getResumeIdInput}`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    return { status: res.status, data: await res.json() };
                  })
                }
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute GET</span>
              </button>

              <ResponseBox response={responses['get-resume-id']} />
            </div>
          </EndpointAccordion>

          {/* DELETE /api/resume/{id} */}
          <EndpointAccordion
            id="endpoint-delete-resume-id"
            method="DELETE"
            path="/api/resume/{id}"
            summary="Delete resume record and physical PDF file"
            isOpen={openEndpoint === 'DELETE-/api/resume/{id}'}
            onToggle={() => toggleEndpoint('DELETE-/api/resume/{id}')}
            getMethodBadge={getMethodBadge}
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-semibold">Parameter id:</span>
                <input
                  type="number"
                  value={deleteResumeIdInput}
                  onChange={(e) => setDeleteResumeIdInput(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 w-24 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                onClick={() =>
                  handleExecute('delete-resume-id', async () => {
                    const res = await fetch(`/api/resume/${deleteResumeIdInput}`, {
                      method: 'DELETE',
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    return { status: res.status, data: await res.json() };
                  })
                }
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center space-x-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute DELETE</span>
              </button>

              <ResponseBox response={responses['delete-resume-id']} />
            </div>
          </EndpointAccordion>
        </div>

        {/* Section: AI Analysis */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">AI Analysis Module</h3>

          {/* POST /api/analysis/{resumeId} */}
          <EndpointAccordion
            id="endpoint-post-analysis"
            method="POST"
            path="/api/analysis/{resumeId}"
            summary="Extract PDF text, call AI API, and save ATS analysis"
            isOpen={openEndpoint === 'POST-/api/analysis/{resumeId}'}
            onToggle={() => toggleEndpoint('POST-/api/analysis/{resumeId}')}
            getMethodBadge={getMethodBadge}
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-semibold">Parameter resumeId:</span>
                <input
                  type="number"
                  value={postAnalysisIdInput}
                  onChange={(e) => setPostAnalysisIdInput(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 w-24 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                onClick={() =>
                  handleExecute('post-analysis', async () => {
                    const res = await fetch(`/api/analysis/${postAnalysisIdInput}`, {
                      method: 'POST',
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    return { status: res.status, data: await res.json() };
                  })
                }
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center space-x-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute POST</span>
              </button>

              <ResponseBox response={responses['post-analysis']} />
            </div>
          </EndpointAccordion>

          {/* GET /api/analysis/{resumeId} */}
          <EndpointAccordion
            id="endpoint-get-analysis"
            method="GET"
            path="/api/analysis/{resumeId}"
            summary="Get saved analysis without re-triggering AI call"
            isOpen={openEndpoint === 'GET-/api/analysis/{resumeId}'}
            onToggle={() => toggleEndpoint('GET-/api/analysis/{resumeId}')}
            getMethodBadge={getMethodBadge}
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-semibold">Parameter resumeId:</span>
                <input
                  type="number"
                  value={getAnalysisIdInput}
                  onChange={(e) => setGetAnalysisIdInput(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 w-24 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                onClick={() =>
                  handleExecute('get-analysis', async () => {
                    const res = await fetch(`/api/analysis/${getAnalysisIdInput}`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    return { status: res.status, data: await res.json() };
                  })
                }
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute GET</span>
              </button>

              <ResponseBox response={responses['get-analysis']} />
            </div>
          </EndpointAccordion>
        </div>
      </div>
    </div>
  );
};

interface AccordionProps {
  id: string;
  method: string;
  path: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  getMethodBadge: (m: string) => string;
  children: React.ReactNode;
}

const EndpointAccordion: React.FC<AccordionProps> = ({
  id,
  method,
  path,
  summary,
  isOpen,
  onToggle,
  getMethodBadge,
  children,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-colors shadow-xs">
      <button
        id={id}
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center space-x-3">
          <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getMethodBadge(method)}`}>
            {method}
          </span>
          <span className="font-mono text-xs font-bold text-slate-900">{path}</span>
          <span className="text-xs text-slate-500 hidden sm:inline">{summary}</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {isOpen && <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50">{children}</div>}
    </div>
  );
};

const ResponseBox: React.FC<{ response?: { status?: number; data?: any; loading?: boolean } }> = ({ response }) => {
  if (!response) return null;
  if (response.loading) {
    return (
      <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center space-x-2 text-slate-500 text-xs">
        <span className="animate-spin border-2 border-blue-600 border-t-transparent rounded-full w-4 h-4"></span>
        <span>Sending API request...</span>
      </div>
    );
  }

  const isSuccess = response.status && response.status >= 200 && response.status < 300;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-slate-500 font-semibold">HTTP Status Code:</span>
        <span
          className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
            isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {response.status}
        </span>
      </div>

      <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-blue-300 overflow-x-auto max-h-60">
        {JSON.stringify(response.data, null, 2)}
      </pre>
    </div>
  );
};
