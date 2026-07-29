import { User, LoginResponse, Resume, Analysis, ApiErrorResponse } from '../types';

const TOKEN_KEY = 'ai_resume_analyzer_token';
const USER_KEY = 'ai_resume_analyzer_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string, user?: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

async function parseResponseJson(res: Response, defaultErrorMsg: string): Promise<any> {
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error(`Server request failed (${res.status}): ${res.statusText || defaultErrorMsg}`);
    }
    throw new Error('Received unexpected non-JSON response from server');
  }

  if (!res.ok) {
    throw new Error(data.message || defaultErrorMsg);
  }
  return data;
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const updatedOptions: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, updatedOptions);

  if (response.status === 401) {
    clearStoredAuth();
  }

  return response;
}

export const api = {
  // ==========================
  // Authentication
  // ==========================

  async register(name: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    return parseResponseJson(res, 'Registration failed');
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await parseResponseJson(res, 'Login failed');

    setStoredToken(data.token, data.user);

    return data;
  },

  // ✅ NEW GOOGLE LOGIN METHOD
  async googleLogin(idToken: string): Promise<LoginResponse> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
      }),
    });

    const data = await parseResponseJson(res, 'Google login failed');

    setStoredToken(data.token, data.user);

    return data;
  },

  async getMe(): Promise<User> {
    const res = await authFetch('/api/auth/me');
    const data = await parseResponseJson(res, 'Failed to authenticate token');
    return data.user;
  },

  // ==========================
  // Resume APIs
  // ==========================

  async getResumes(): Promise<Resume[]> {
    const res = await authFetch('/api/resume');
    return parseResponseJson(res, 'Failed to fetch resumes');
  },

  async uploadResume(file: File, jobDescription?: string): Promise<{ id: number; message: string; fileName: string }> {
    const formData = new FormData();

    formData.append('resume.pdf', file);

    if (jobDescription && jobDescription.trim()) {
      formData.append('jobDescription', jobDescription.trim());
    }

    const res = await authFetch('/api/resume/upload', {
      method: 'POST',
      body: formData,
    });

    return parseResponseJson(res, 'Upload failed');
  },

  async generateSampleResume(): Promise<{ id: number; message: string }> {
    const res = await authFetch('/api/sample-resume', {
      method: 'POST',
    });

    return parseResponseJson(res, 'Failed to generate sample resume');
  },

  async getResume(id: number): Promise<Resume> {
    const res = await authFetch(`/api/resume/${id}`);
    return parseResponseJson(res, 'Failed to fetch resume metadata');
  },

  async deleteResume(id: number): Promise<{ success: boolean; message: string }> {
    const res = await authFetch(`/api/resume/${id}`, {
      method: 'DELETE',
    });

    return parseResponseJson(res, 'Failed to delete resume');
  },

  // ==========================
  // Analysis APIs
  // ==========================

  async analyzeResume(resumeId: number, jobDescription?: string): Promise<Analysis> {
    const res = await authFetch(`/api/analysis/${resumeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobDescription: jobDescription || '',
      }),
    });

    return parseResponseJson(res, 'Analysis failed');
  },

  async getAnalysis(resumeId: number): Promise<Analysis | null> {
    const res = await authFetch(`/api/analysis/${resumeId}`);

    if (res.status === 404) {
      return null;
    }

    return parseResponseJson(res, 'Failed to fetch analysis');
  },

  async getAnalysisStatus(resumeId: number): Promise<{
    resumeId: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    ready: boolean;
    analysis: Analysis | null;
    error?: string;
  }> {
    const res = await authFetch(`/api/analysis/${resumeId}/status`);

    return parseResponseJson(res, 'Failed to fetch analysis status');
  },
};