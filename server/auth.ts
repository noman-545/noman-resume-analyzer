import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, UserRecord } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-resume-analyzer-jwt-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: UserRecord): { token: string; expires: string } {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + 7);
  const expires = expiresDate.toISOString().split('T')[0];

  return { token, expires };
}

export function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Access token is missing or invalid',
      errors: ['Missing Bearer token in Authorization header'],
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      name: string;
    };

    // Verify user exists
    const user = db.findUserById(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User no longer exists',
        errors: ['User ID in token not found'],
      });
      return;
    }

    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
      errors: [err.message || 'Token verification failed'],
    });
  }
}
