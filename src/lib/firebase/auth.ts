'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const handleNewUser = async (user: User) => {
  const db = getFirestore(user.auth.app);
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  // If the user document doesn't exist, create it.
  if (!userDoc.exists()) {
    const userData = {
      id: user.uid, // This is critical for the 'create' rule
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
    await setDoc(userDocRef, userData);
  }
};

export const signInWithGoogle = async (auth: Auth) => {
  const provider = new GoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    // Check if user is new and create a document if so.
    await handleNewUser(user);
    return user;
  } catch (error) {
    console.error('Error signing in with Google: ', error);
    throw error;
  }
}

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
    // This is now handled by the handleNewUser function, but we can call it here explicitly
    // to ensure it happens immediately after sign-up.
    await handleNewUser(user);

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
