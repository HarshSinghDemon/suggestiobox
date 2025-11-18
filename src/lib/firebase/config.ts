import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
// A robust way to initialize is to check if apps are already initialized.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

/* 
NOTE FOR THE USER:
To get started with this project, you need to set up a Firebase project and add the configuration details to your environment variables.

1. Go to the Firebase console (https://console.firebase.google.com/).
2. Create a new project or use an existing one.
3. In your project settings, find "Your apps" and create a new Web App.
4. Firebase will provide you with a `firebaseConfig` object.
5. Create a new file named `.env.local` in the root of your project (if it doesn't exist).
6. Copy the keys from the `firebaseConfig` object into your `.env.local` file, prefixing each with `NEXT_PUBLIC_`:

   NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
   NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

7. Enable the following services in the Firebase console:
   - **Authentication**: Go to the "Authentication" tab, click "Get started", and enable "Email/Password" and "Google" as sign-in methods.
   - **Firestore Database**: Go to the "Firestore Database" tab, click "Create database", and start in "test mode" for now.
   - **Storage**: Go to the "Storage" tab and click "Get started", following the prompts. You might need to adjust security rules for production.
*/
