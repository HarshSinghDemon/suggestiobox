'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  Auth,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

export const signUpWithEmail = async (
  auth: Auth,
  email: string,
  password: string,
  displayName: string,
  photoURL: string
) => {
  try {
    // 1. Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 2. Update the user's auth profile
    await updateProfile(user, { displayName, photoURL });

    // 3. Create the user document in Firestore
    const userDocRef = doc(getFirestore(auth.app), 'users', user.uid);
    const userData = {
      id: user.uid, // This is critical for the 'create' rule
      email: user.email,
      displayName: displayName,
      photoURL: photoURL,
    };
    
    // This now waits for the Firestore document to be created.
    await setDoc(userDocRef, userData);

    return user;
  } catch (error) {
    console.error('Error signing up: ', error);
    // Re-throw the error so it can be caught by the form
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
