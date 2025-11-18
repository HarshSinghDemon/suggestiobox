'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  Auth,
} from 'firebase/auth';
import { getFirestore, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase';

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
    
    // Create user profile in Firestore
    const userDocRef = doc(getFirestore(auth.app), 'users', userCredential.user.uid);
    const userData = {
      id: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName,
    };
    
    // Use the non-blocking update with contextual error handling
    setDocumentNonBlocking(userDocRef, userData, { merge: true });
    
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up: ', error);
    throw error;
  }
};

export const signInWithEmail = async (auth: Auth, email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Error signing in: ", error);
        throw error;
    }
}

export const signOut = async (auth: Auth) => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out: ', error);
  }
};
