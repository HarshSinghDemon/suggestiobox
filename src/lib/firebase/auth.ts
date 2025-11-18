'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const signUpWithEmail = async (
  auth: Auth,
  email: string,
  password: string,
  displayName: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(userCredential.user, { displayName });

    const userDocRef = doc(
      getFirestore(auth.app),
      'users',
      userCredential.user.uid
    );
    const userData = {
      id: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName,
    };

    // Non-blocking write with contextual error handling
    setDoc(userDocRef, userData, { merge: true }).catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'create',
        requestResourceData: userData,
      });
      errorEmitter.emit('permission-error', permissionError);
      // We still throw the original error for other handlers, but the listener will catch the detailed one
      throw serverError;
    });

    return userCredential.user;
  } catch (error) {
    // This will catch the initial auth error, or the re-thrown firestore error
    console.error('Error signing up: ', error);
    throw error;
  }
};

export const signInWithEmail = async (
  auth: Auth,
  email: string,
  password: string
) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in: ', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
    const auth = (await import('@/firebase')).useAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Create user profile in Firestore if it doesn't exist
      const userDocRef = doc(getFirestore(auth.app), "users", user.uid);
      const userData = {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
      };

      setDoc(userDocRef, userData, { merge: true }).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'create',
          requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
      });

      return user;

    } catch (error) {
      console.error("Error during Google sign-in:", error);
      throw error;
    }
};

export const signOut = async (auth: Auth) => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out: ', error);
  }
};
