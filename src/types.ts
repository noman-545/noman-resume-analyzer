export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  expires: string;
  user?: User;
}

export interface Resume {
  id: number;
  fileName: string;
  uploaded: string;
  uploadedAtFull?: string;
}

export interface Analysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  suggestions: string[];
  jobDescription?: string;
  matchingKeywords?: string[];
  missingKeywords?: string[];
  jdMatchScore?: number;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: string[];
}
