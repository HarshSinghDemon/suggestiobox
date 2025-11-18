'use server';

import * as admin from 'firebase-admin';

const getFirebaseAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }

  // In a managed environment like Firebase App Hosting, the SDK is automatically
  // initialized. We can just call initializeApp() without arguments.
  if (process.env.FIREBASE_CONFIG) {
    try {
      return admin.initializeApp();
    } catch (e) {
       console.error("Failed to initialize Firebase Admin SDK automatically.", e)
       // Fall through to manual initialization
    }
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    console.warn(
      'Firebase service account credentials are not set. This is okay for client-side only operations, but server-side actions requiring admin privileges will fail.'
    );
    // Return a dummy app or handle it gracefully
    // For this app, we will let it fail downstream if admin privileges are truly needed.
    // A better approach in a real app would be to have a more robust check or a fallback.
    return admin.initializeApp(); // This will likely fail but makes the intent clear.
  }

  try {
    const credentials = JSON.parse(serviceAccount);
    return admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
  } catch (error) {
    throw new Error(
      'Failed to parse Firebase service account credentials. Make sure the JSON is valid.'
    );
  }
};

export async function initializeFirebaseForAdmin() {
  return getFirebaseAdminApp();
}
