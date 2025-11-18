import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This function is for SERVER-SIDE use only.
export async function initializeFirebaseForServer() {
  const apps = getApps();
  const app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // The server needs to be authenticated to perform actions.
  // We sign in anonymously for server-side operations.
  if (auth.currentUser === null) {
    await signInAnonymously(auth);
  }

  return {
    app,
    auth,
    firestore: getFirestore(app),
  };
}
