export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AI Resume Analyzer API',
    version: '1.0.0',
    description: 'ASP.NET Core / Node Express standard REST API for uploading PDF resumes, extracting text, generating AI ATS feedback, and retrieving historical analyses.',
    contact: {
      name: 'API Support',
      email: 'support@airesumeanalyzer.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Current Environment API Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /api/auth/login',
      },
    },
    schemas: {
      RegisterDto: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'John' },
          email: { type: 'string', example: 'john@example.com' },
          password: { type: 'string', example: 'Password123!', minLength: 8 },
        },
      },
      LoginDto: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'john@example.com' },
          password: { type: 'string', example: 'Password123!' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          expires: { type: 'string', example: '2026-08-01' },
        },
      },
      ResumeUploadResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 5 },
          message: { type: 'string', example: 'Resume uploaded successfully' },
        },
      },
      ResumeDto: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 5 },
          fileName: { type: 'string', example: 'resume.pdf' },
          uploaded: { type: 'string', example: '2026-07-29' },
        },
      },
      AnalysisDto: {
        type: 'object',
        properties: {
          score: { type: 'integer', example: 83 },
          strengths: {
            type: 'array',
            items: { type: 'string' },
            example: ['Strong backend experience'],
          },
          weaknesses: {
            type: 'array',
            items: { type: 'string' },
            example: ['No testing experience'],
          },
          missingSkills: {
            type: 'array',
            items: { type: 'string' },
            example: ['Docker', 'Azure'],
          },
          suggestions: {
            type: 'array',
            items: { type: 'string' },
            example: ['Add unit testing', 'Include deployment project'],
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resume not found' },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: [],
          },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        operationId: 'registerUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterDto' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User created successfully' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation failed or email already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login and acquire JWT token',
        operationId: 'loginUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginDto' },
            },
          },
        },
        responses: {
          '200': {
            description: 'JWT Authentication token issued',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/resume/upload': {
      post: {
        tags: ['Resume'],
        summary: 'Upload a PDF resume (<= 5MB)',
        operationId: 'uploadResume',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  'resume.pdf': {
                    type: 'string',
                    format: 'binary',
                    description: 'The PDF file to upload',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Resume uploaded successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ResumeUploadResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid file format or file size exceeds limit',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized access token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/resume': {
      get: {
        tags: ['Resume'],
        summary: 'Get all resumes uploaded by the logged-in user',
        operationId: 'getUserResumes',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of uploaded resumes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ResumeDto' },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized access token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/resume/{id}': {
      get: {
        tags: ['Resume'],
        summary: 'Get metadata for a specific resume',
        operationId: 'getResumeById',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Resume ID',
          },
        ],
        responses: {
          '200': {
            description: 'Resume metadata',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ResumeDto' },
              },
            },
          },
          '404': {
            description: 'Resume not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Resume'],
        summary: 'Delete resume database record and physical PDF file',
        operationId: 'deleteResume',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Resume ID',
          },
        ],
        responses: {
          '200': {
            description: 'Resume deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Resume deleted successfully' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Resume not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/analysis/{resumeId}': {
      post: {
        tags: ['AI Analysis'],
        summary: 'Analyze a PDF resume using AI (Extracts PDF text, calls Gemini/AI, saves result)',
        operationId: 'analyzeResume',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'resumeId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Resume ID to analyze',
          },
        ],
        responses: {
          '200': {
            description: 'AI Analysis results generated and saved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AnalysisDto' },
              },
            },
          },
          '404': {
            description: 'Resume not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      get: {
        tags: ['AI Analysis'],
        summary: 'Get saved analysis for a resume without re-triggering AI call',
        operationId: 'getAnalysis',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'resumeId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Resume ID',
          },
        ],
        responses: {
          '200': {
            description: 'Saved analysis',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AnalysisDto' },
              },
            },
          },
          '404': {
            description: 'Analysis not found for this resume',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
};
