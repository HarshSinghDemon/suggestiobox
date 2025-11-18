'use server';

import * as admin from 'firebase-admin';

const getFirebaseAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    throw new Error(
      'Firebase service account credentials are not set in the environment variables. Please set FIREBASE_SERVICE_ACCOUNT.'
    );
  }

  try {
    const credentials = JSON.parse(serviceAccount);
    return admin.initializeApp({
      credential: admin.credential.cert(credentials),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
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
