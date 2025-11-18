'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  Auth,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const signUpWithEmail = async (
  auth: Auth,
  email: string,
  password: string,
  displayName: string,
  photoURL: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // First, update the auth profile
    await updateProfile(userCredential.user, { displayName, photoURL });

    // Then, create the user document in Firestore
    const userDocRef = doc(
      getFirestore(auth.app),
      'users',
      userCredential.user.uid
    );
    // Ensure the data being written to Firestore matches security rule expectations
    const userData = {
      id: userCredential.user.uid, // This is critical for the 'create' rule
      email: userCredential.user.email,
      displayName: displayName,
      photoURL: photoURL,
    };

    // Use a non-blocking write for better UX, but handle potential permission errors
    setDoc(userDocRef, userData).catch((serverError) => {
      console.error("Error creating user document:", serverError);
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'create',
        requestResourceData: userData,
      });
      // This will show the detailed error in the dev overlay if security rules fail
      errorEmitter.emit('permission-error', permissionError);
    });

    return userCredential.user;
  } catch (error) {
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

export const signOut = async (auth: Auth) => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out: ', error);
  }
};
