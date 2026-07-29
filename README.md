# AI Resume Analyzer

An Express and Vite application for uploading PDF resumes and receiving Gemini-powered ATS analysis. The application uses its JSON database and JWT sessions for both email/password and Google authentication.

## Prerequisites

- Node.js 20 or later
- A Gemini API key for AI analysis
- A Firebase project with Google Authentication enabled for Google sign-in

## Environment setup

Copy `.env.example` to `.env`, then supply the required values. The Express server and Vite client run from the repository root, so both sets of variables belong in this one root `.env` file.

```powershell
Copy-Item .env.example .env
```

### Gemini

```env
GEMINI_API_KEY=your_gemini_api_key
```

### Firebase Web SDK

Register a Web app in Firebase, then copy its configuration values into the `VITE_FIREBASE_*` variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### Firebase Admin SDK

In Firebase Console, generate a service-account private key and add its values below. Keep the private key on one line with escaped `\n` characters when using a `.env` file.

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Never commit `.env` or a Firebase service-account private key.

## Firebase Console checklist

1. Create or select a Firebase project.
2. Add a Web app and copy its configuration into the `VITE_FIREBASE_*` variables.
3. Open **Authentication → Sign-in method** and enable **Google**.
4. Under **Authentication → Settings → Authorized domains**, ensure `localhost` is present for local development.
5. Open **Project settings → Service accounts**, generate a new private key, and set the three `FIREBASE_*` server variables.

## Run locally

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). One development process serves both the React UI and Express API.

## Authentication flow

Email/password registration and login continue to use the existing JSON database and JWT flow. Google login uses Firebase Authentication in the browser, sends the Firebase ID token to `POST /api/auth/google`, verifies it with Firebase Admin, creates a JSON-database user if needed, and returns the existing application JWT. Protected resume upload and analysis endpoints continue to use that JWT.
