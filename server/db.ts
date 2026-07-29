import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface ResumeRecord {
  id: number;
  userId: number;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

export interface ResumeAnalysisRecord {
  id: number;
  resumeId: number;
  score: number;
  strengths: string; // JSON array string
  weaknesses: string; // JSON array string
  missingSkills: string; // JSON array string
  suggestions: string; // JSON array string
  jobDescription?: string;
  matchingKeywords?: string; // JSON array string
  missingKeywords?: string; // JSON array string
  jdMatchScore?: number;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DbSchema {
  users: UserRecord[];
  resumes: ResumeRecord[];
  analyses: ResumeAnalysisRecord[];
  nextUserId: number;
  nextResumeId: number;
  nextAnalysisId: number;
}

class Database {
  private data: DbSchema = {
    users: [],
    resumes: [],
    analyses: [],
    nextUserId: 1,
    nextResumeId: 1,
    nextAnalysisId: 1,
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database file:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // Users
  public findUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: number): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(name: string, email: string, passwordHash: string): UserRecord {
    const user: UserRecord = {
      id: this.data.nextUserId++,
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Resumes
  public createResume(userId: number, fileName: string, filePath: string): ResumeRecord {
    const resume: ResumeRecord = {
      id: this.data.nextResumeId++,
      userId,
      fileName,
      filePath,
      uploadedAt: new Date().toISOString(),
    };
    this.data.resumes.push(resume);
    this.save();
    return resume;
  }

  public getResumesByUserId(userId: number): ResumeRecord[] {
    return this.data.resumes.filter((r) => r.userId === userId);
  }

  public getResumeById(id: number): ResumeRecord | undefined {
    return this.data.resumes.find((r) => r.id === id);
  }

  public deleteResume(id: number): boolean {
    const index = this.data.resumes.findIndex((r) => r.id === id);
    if (index !== -1) {
      const [resume] = this.data.resumes.splice(index, 1);
      // Delete associated analysis
      this.data.analyses = this.data.analyses.filter((a) => a.resumeId !== id);
      this.save();

      // Delete physical file
      try {
        if (fs.existsSync(resume.filePath)) {
          fs.unlinkSync(resume.filePath);
        }
      } catch (e) {
        console.error('Error unlinking file:', e);
      }
      return true;
    }
    return false;
  }

  // Analysis
  public createOrUpdateAnalysis(
    resumeId: number,
    score: number,
    strengths: string[],
    weaknesses: string[],
    missingSkills: string[],
    suggestions: string[],
    jobDescription?: string,
    matchingKeywords?: string[],
    missingKeywords?: string[],
    jdMatchScore?: number
  ): ResumeAnalysisRecord {
    // Check if exists
    let record = this.data.analyses.find((a) => a.resumeId === resumeId);
    if (record) {
      record.score = score;
      record.strengths = JSON.stringify(strengths);
      record.weaknesses = JSON.stringify(weaknesses);
      record.missingSkills = JSON.stringify(missingSkills);
      record.suggestions = JSON.stringify(suggestions);
      if (jobDescription !== undefined) record.jobDescription = jobDescription;
      if (matchingKeywords !== undefined) record.matchingKeywords = JSON.stringify(matchingKeywords);
      if (missingKeywords !== undefined) record.missingKeywords = JSON.stringify(missingKeywords);
      if (jdMatchScore !== undefined) record.jdMatchScore = jdMatchScore;
      record.createdAt = new Date().toISOString();
    } else {
      record = {
        id: this.data.nextAnalysisId++,
        resumeId,
        score,
        strengths: JSON.stringify(strengths),
        weaknesses: JSON.stringify(weaknesses),
        missingSkills: JSON.stringify(missingSkills),
        suggestions: JSON.stringify(suggestions),
        jobDescription: jobDescription || '',
        matchingKeywords: JSON.stringify(matchingKeywords || []),
        missingKeywords: JSON.stringify(missingKeywords || []),
        jdMatchScore: jdMatchScore ?? score,
        createdAt: new Date().toISOString(),
      };
      this.data.analyses.push(record);
    }
    this.save();
    return record;
  }

  public getAnalysisByResumeId(resumeId: number): ResumeAnalysisRecord | undefined {
    return this.data.analyses.find((a) => a.resumeId === resumeId);
  }
}

export const db = new Database();
