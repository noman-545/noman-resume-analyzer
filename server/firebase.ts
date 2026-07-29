import 'dotenv/config';
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

export class FirebaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseConfigurationError';
  }
}

interface FirebaseServiceAccountConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function getFirebaseServiceAccountConfig(): FirebaseServiceAccountConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();

  const missingVariables = [
    !projectId && 'FIREBASE_PROJECT_ID',
    !clientEmail && 'FIREBASE_CLIENT_EMAIL',
    !privateKey && 'FIREBASE_PRIVATE_KEY',
  ].filter(Boolean);

  if (missingVariables.length > 0) {
    throw new FirebaseConfigurationError(
      `Missing Firebase Admin environment variable(s): ${missingVariables.join(', ')}`
    );
  }

  return {
    projectId: projectId!,
    clientEmail: clientEmail!,
    privateKey: privateKey!,
  };
}

function getFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccount = getFirebaseServiceAccountConfig();

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function verifyGoogleToken(idToken: string): Promise<DecodedIdToken> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google ID token is required');
  }

  return getAuth(getFirebaseApp()).verifyIdToken(idToken);
}
