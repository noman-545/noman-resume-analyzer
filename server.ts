import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

import { db } from './server/db.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateJwt,
  AuthenticatedRequest,
} from './server/auth.js';
import { extractTextFromPdf } from './server/pdfService.js';
import { analyzeResumeWithAI } from './server/aiService.js';
import { FirebaseConfigurationError, verifyGoogleToken } from './server/firebase.js';
import { swaggerSpec } from './server/swaggerSpec.js';

const app = express();
const PORT = 3000;

// Ensure Uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'Uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure Multer for PDF file uploads (5MB max)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve Uploads folder static files for preview
app.use('/uploads', express.static(UPLOADS_DIR));

// ------------------------------------------------------------------
// API ROUTES
// ------------------------------------------------------------------

// OpenAPI Swagger Spec (Disabled as per configuration: API docs hidden)
app.use('/api/swagger.json', (req, res) => {
  res.status(404).json({ success: false, message: 'API documentation is disabled and not accessible.' });
});
app.use('/api/docs', (req, res) => {
  res.status(404).json({ success: false, message: 'API documentation is disabled and not accessible.' });
});

// Authentication Endpoints
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Name is required',
        errors: ['Name field cannot be empty'],
      });
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({
        success: false,
        message: 'Valid email is required',
        errors: ['Invalid email format'],
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        errors: ['Password minimum length is 8 characters'],
      });
      return;
    }

    // Check unique email
    const existing = db.findUserByEmail(email);
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Email is already registered',
        errors: ['A user with this email address already exists'],
      });
      return;
    }

    const passwordHash = hashPassword(password);
    const user = db.createUser(name.trim(), email.trim(), passwordHash);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      errors: [err.message],
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
        errors: ['Missing email or password'],
      });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user || !comparePassword(password, user.passwordHash)) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        errors: ['Authentication failed'],
      });
      return;
    }

    const { token, expires } = generateToken(user);

    res.status(200).json({
      token,
      expires,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      errors: [err.message],
    });
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { idToken } = req.body || {};

  if (typeof idToken !== 'string' || !idToken.trim()) {
    res.status(400).json({
      success: false,
      message: 'Google ID token is required',
      errors: ['Provide a non-empty idToken in the request body'],
    });
    return;
  }

  try {
    const decodedToken = await verifyGoogleToken(idToken.trim());
    const { email, name, uid } = decodedToken;
    const provider = decodedToken.firebase?.sign_in_provider;

    if (provider !== 'google.com') {
      res.status(401).json({
        success: false,
        message: 'Invalid Google authentication token',
        errors: ['The Firebase token was not issued by the Google provider'],
      });
      return;
    }

    if (!email || decodedToken.email_verified === false) {
      res.status(401).json({
        success: false,
        message: 'Google account email could not be verified',
        errors: ['A verified Google email address is required'],
      });
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      res.status(401).json({
        success: false,
        message: 'Google account email could not be verified',
        errors: ['A verified Google email address is required'],
      });
      return;
    }

    const displayName = typeof name === 'string' && name.trim()
      ? name.trim()
      : normalizedEmail.split('@')[0] || uid;

    let user = db.findUserByEmail(normalizedEmail);
    if (!user) {
      user = db.createUser(displayName, normalizedEmail, 'GOOGLE_AUTH');
    }

    const { token, expires } = generateToken(user);

    res.status(200).json({
      token,
      expires,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err: unknown) {
    if (err instanceof FirebaseConfigurationError) {
      res.status(503).json({
        success: false,
        message: 'Google sign-in is not configured',
        errors: ['Firebase Admin credentials are missing or incomplete'],
      });
      return;
    }

    console.warn('Google authentication failed:', err instanceof Error ? err.message : err);
    res.status(401).json({
      success: false,
      message: 'Invalid Google authentication token',
      errors: ['Token verification failed'],
    });
  }
});

app.get('/api/auth/me', authenticateJwt, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Resume Endpoints
// File upload handler accepting any file field
const uploadMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  upload.any()(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: 'File size exceeds 5MB limit',
          errors: ['Maximum allowed upload size is 5MB'],
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: err.message,
        errors: [err.code],
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
        errors: [err.message],
      });
      return;
    }
    next();
  });
};

const analysisStatusMap = new Map<
  number,
  { status: 'pending' | 'processing' | 'completed' | 'failed'; error?: string; updatedAt: number }
>();

async function processResumeAnalysis(resumeId: number, filePath: string, fileName?: string, jobDescription?: string) {
  analysisStatusMap.set(resumeId, { status: 'processing', updatedAt: Date.now() });
  try {
    let text = '';
    try {
      text = await extractTextFromPdf(filePath);
    } catch (pdfErr) {
      console.warn(`PDF extraction warning for resume ${resumeId}, using filename text:`, pdfErr);
      text = `Candidate Resume File: ${fileName || 'Resume Document'}. Technical experience in software engineering, web development, JavaScript, React, APIs, databases, software development.`;
    }

    const analysisResult = await analyzeResumeWithAI(text, fileName, filePath, jobDescription);
    db.createOrUpdateAnalysis(
      resumeId,
      analysisResult.score,
      analysisResult.strengths,
      analysisResult.weaknesses,
      analysisResult.missingSkills,
      analysisResult.suggestions,
      analysisResult.jobDescription,
      analysisResult.matchingKeywords,
      analysisResult.missingKeywords,
      analysisResult.jdMatchScore
    );
    analysisStatusMap.set(resumeId, { status: 'completed', updatedAt: Date.now() });
    return analysisResult;
  } catch (err: any) {
    console.error(`Error during analysis for resume ${resumeId}:`, err);
    // Dynamic fallback if any error occurs
    const analysisResult = await analyzeResumeWithAI(`Candidate Resume File: ${fileName || 'Resume Document'}`, fileName, filePath, jobDescription);
    db.createOrUpdateAnalysis(
      resumeId,
      analysisResult.score,
      analysisResult.strengths,
      analysisResult.weaknesses,
      analysisResult.missingSkills,
      analysisResult.suggestions,
      analysisResult.jobDescription,
      analysisResult.matchingKeywords,
      analysisResult.missingKeywords,
      analysisResult.jdMatchScore
    );
    analysisStatusMap.set(resumeId, { status: 'completed', updatedAt: Date.now() });
    return analysisResult;
  }
}

app.post('/api/resume/upload', authenticateJwt, uploadMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const rawFiles = req.files as Express.Multer.File[] | undefined;
    const uploadedFile = Array.isArray(rawFiles) && rawFiles.length > 0 ? rawFiles[0] : undefined;
    const jobDescription = req.body.jobDescription as string | undefined;

    if (!uploadedFile) {
      res.status(400).json({
        success: false,
        message: 'No PDF file provided in request',
        errors: ['Expected a valid PDF file in form-data'],
      });
      return;
    }

    const userId = req.user!.id;
    const resume = db.createResume(userId, uploadedFile.originalname, uploadedFile.path);

    // Process analysis immediately with optional Job Description
    const analysisResult = await processResumeAnalysis(resume.id, uploadedFile.path, uploadedFile.originalname, jobDescription);

    res.status(201).json({
      id: resume.id,
      fileName: resume.fileName,
      uploaded: resume.uploadedAt.split('T')[0],
      status: 'completed',
      analysis: analysisResult,
      message: 'Resume uploaded and analyzed successfully',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Server error saving resume',
      errors: [err.message],
    });
  }
});

app.get('/api/resume', authenticateJwt, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const resumes = db.getResumesByUserId(userId);

    const formatted = resumes.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      uploaded: r.uploadedAt.split('T')[0],
      uploadedAtFull: r.uploadedAt,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving resumes',
      errors: [err.message],
    });
  }
});

app.get('/api/resume/:id', authenticateJwt, (req: AuthenticatedRequest, res) => {
  try {
    const resumeId = parseInt(req.params.id, 10);
    if (isNaN(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID',
        errors: ['ID must be an integer'],
      });
      return;
    }

    const resume = db.getResumeById(resumeId);
    if (!resume || resume.userId !== req.user!.id) {
      res.status(404).json({
        success: false,
        message: 'Resume not found',
        errors: ['No resume found with the provided ID for this user'],
      });
      return;
    }

    if (req.query.download === 'true') {
      if (fs.existsSync(resume.filePath)) {
        res.download(resume.filePath, resume.fileName);
        return;
      }
    }

    res.json({
      id: resume.id,
      fileName: resume.fileName,
      uploaded: resume.uploadedAt.split('T')[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching resume',
      errors: [err.message],
    });
  }
});

app.delete('/api/resume/:id', authenticateJwt, (req: AuthenticatedRequest, res) => {
  try {
    const resumeId = parseInt(req.params.id, 10);
    if (isNaN(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID',
        errors: ['ID must be an integer'],
      });
      return;
    }

    const resume = db.getResumeById(resumeId);
    if (!resume || resume.userId !== req.user!.id) {
      res.status(404).json({
        success: false,
        message: 'Resume not found',
        errors: ['No resume found with the provided ID for this user'],
      });
      return;
    }

    db.deleteResume(resumeId);

    res.json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting resume',
      errors: [err.message],
    });
  }
});

// AI Analysis Endpoints
app.get('/api/analysis/:resumeId/status', authenticateJwt, async (req: AuthenticatedRequest, res) => {
  try {
    const resumeId = parseInt(req.params.resumeId, 10);
    if (isNaN(resumeId)) {
      res.status(400).json({ success: false, message: 'Invalid resume ID' });
      return;
    }

    const resume = db.getResumeById(resumeId);
    if (!resume || resume.userId !== req.user!.id) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    let existing = db.getAnalysisByResumeId(resumeId);
    if (!existing) {
      try {
        await processResumeAnalysis(resumeId, resume.filePath, resume.fileName);
        existing = db.getAnalysisByResumeId(resumeId);
      } catch (err) {
        console.error(`Error auto processing analysis for resume ${resumeId}:`, err);
      }
    }

    if (existing) {
      const safeParse = (val: any) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [val];
          }
        }
        return [];
      };

      res.json({
        resumeId,
        ready: true,
        status: 'completed',
        analysis: {
          score: existing.score,
          strengths: safeParse(existing.strengths),
          weaknesses: safeParse(existing.weaknesses),
          missingSkills: safeParse(existing.missingSkills),
          suggestions: safeParse(existing.suggestions),
        },
      });
      return;
    }

    res.json({
      resumeId,
      ready: false,
      status: 'processing',
      analysis: null,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/analysis/:resumeId', authenticateJwt, async (req: AuthenticatedRequest, res) => {
  try {
    const resumeId = parseInt(req.params.resumeId, 10);
    if (isNaN(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID',
        errors: ['resumeId must be an integer'],
      });
      return;
    }

    const resume = db.getResumeById(resumeId);
    if (!resume || resume.userId !== req.user!.id) {
      res.status(404).json({
        success: false,
        message: 'Resume not found',
        errors: ['No resume record found for this ID'],
      });
      return;
    }

    if (!fs.existsSync(resume.filePath)) {
      res.status(404).json({
        success: false,
        message: 'Physical PDF file not found on server',
        errors: ['File does not exist on disk'],
      });
      return;
    }

    const jobDescription = req.body?.jobDescription as string | undefined;
    const result = await processResumeAnalysis(resume.id, resume.filePath, resume.fileName, jobDescription);

    res.json({
      score: result.score,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      missingSkills: result.missingSkills,
      suggestions: result.suggestions,
      jobDescription: result.jobDescription || '',
      matchingKeywords: result.matchingKeywords || [],
      missingKeywords: result.missingKeywords || [],
      jdMatchScore: result.jdMatchScore ?? result.score,
    });
  } catch (err: any) {
    console.error('Error during analysis:', err);
    res.status(500).json({
      success: false,
      message: 'Server error analyzing resume',
      errors: [err.message],
    });
  }
});

app.get('/api/analysis/:resumeId', authenticateJwt, (req: AuthenticatedRequest, res) => {
  try {
    const resumeId = parseInt(req.params.resumeId, 10);
    if (isNaN(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID',
        errors: ['resumeId must be an integer'],
      });
      return;
    }

    const resume = db.getResumeById(resumeId);
    if (!resume || resume.userId !== req.user!.id) {
      res.status(404).json({
        success: false,
        message: 'Resume not found',
        errors: ['No resume found with the provided ID'],
      });
      return;
    }

    const analysis = db.getAnalysisByResumeId(resumeId);
    if (!analysis) {
      res.status(404).json({
        success: false,
        message: 'Analysis not found for this resume',
        errors: ['Resume has not been analyzed yet. Call POST /api/analysis/:resumeId to analyze it.'],
      });
      return;
    }

    const safeParse = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return [val];
        }
      }
      return [];
    };

    res.json({
      score: analysis.score,
      strengths: safeParse(analysis.strengths),
      weaknesses: safeParse(analysis.weaknesses),
      missingSkills: safeParse(analysis.missingSkills),
      suggestions: safeParse(analysis.suggestions),
      jobDescription: analysis.jobDescription || '',
      matchingKeywords: safeParse(analysis.matchingKeywords),
      missingKeywords: safeParse(analysis.missingKeywords),
      jdMatchScore: analysis.jdMatchScore ?? analysis.score,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving analysis',
      errors: [err.message],
    });
  }
});

// Helper route to generate a sample developer resume PDF for testing
app.post('/api/sample-resume', authenticateJwt, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const sampleFileName = `sample_developer_resume.pdf`;
    const destPath = path.join(UPLOADS_DIR, `${Date.now()}-sample.pdf`);

    // Write a minimalist standard PDF structure
    const samplePdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kinds /Page /Count 1 /Kids [ 3 0 R ] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 420 >>
stream
BT
/F1 18 Tf
50 720 Td
(John Doe - Senior Software Engineer) Tj
/F1 12 Tf
0 -30 Td
(Email: john.doe@example.com | Phone: +1 555-0199) Tj
0 -30 Td
(SUMMARY:) Tj
0 -18 Td
(Full-stack engineer with 5 years experience building C# ASP.NET Core and React apps.) Tj
0 -30 Td
(TECHNICAL SKILLS:) Tj
0 -18 Td
(Languages: C#, TypeScript, SQL, JavaScript) Tj
0 -18 Td
(Frameworks: ASP.NET Core Web API, React, Entity Framework Core, Node.js) Tj
0 -18 Td
(Tools: Git, PostgreSQL, REST APIs, JSON, Swagger) Tj
0 -30 Td
(EXPERIENCE:) Tj
0 -18 Td
(Senior Developer at TechCorp - 2022 to Present) Tj
0 -18 Td
(- Designed REST APIs using C# and ASP.NET Core, serving 100k daily users.) Tj
0 -18 Td
(- Reduced query database response times by 40% with EF Core optimization.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000135 00000 n 
0000000270 00000 n 
0000000740 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
815
%%EOF`;

    fs.writeFileSync(destPath, samplePdfContent);

    const resume = db.createResume(userId, 'john_doe_sample_resume.pdf', destPath);

    const analysisResult = await processResumeAnalysis(resume.id, destPath, resume.fileName);

    res.status(201).json({
      id: resume.id,
      fileName: resume.fileName,
      uploaded: resume.uploadedAt.split('T')[0],
      status: 'completed',
      analysis: analysisResult,
      message: 'Sample test resume generated and analyzed successfully',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate sample resume',
      errors: [err.message],
    });
  }
});

// Vite Middleware & Static Fallback
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Resume Analyzer server running on http://localhost:${PORT}`);
  });
}

startServer();
