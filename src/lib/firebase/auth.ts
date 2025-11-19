
'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
  Auth,
  User,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  OAuthProvider,
  EmailAuthProvider,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const handleNewUser = async (user: User, details?: { year?: string, displayName?: string, photoURL?: string }) => {
  const db = getFirestore(user.auth.app);
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    const userData: any = {
      id: user.uid,
      email: user.email,
      displayName: details?.displayName || user.displayName,
      photoURL: details?.photoURL || user.photoURL,
      createdAt: serverTimestamp(),
      role: user.email === 'harshroop100@gmail.com' ? 'admin' : 'user',
    };
    if (details?.year) {
      userData.year = details.year;
    }
    await setDoc(userDocRef, userData);
    return true; // Indicates a new user was created
  }
  return false; // Indicates user already exists
};

export const signUpWithEmail = async (
  auth: Auth,
  email: string,
  password: string,
  displayName: string,
  photoURL: string,
  year: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName, photoURL });
    await sendEmailVerification(user);

    const updatedUser = auth.currentUser;
    if (updatedUser) {
        await handleNewUser(updatedUser, { year });
    }

    return user;
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
    await handleNewUser(userCredential.user);
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

async function handleSocialSignIn(auth: Auth, provider: GoogleAuthProvider | GithubAuthProvider) {
  try {
    const result = await signInWithPopup(auth, provider);
    const isNewUser = await handleNewUser(result.user);
    return { user: result.user, isNewUser };
  } catch (error: any) {
    if (error.code === 'auth/account-exists-with-different-credential' && error.customData?.email) {
      const email = error.customData.email;
      const methods = await fetchSignInMethodsForEmail(auth, email);
      const existingProviderId = methods[0];

      let pendingCredential;
      if (provider.providerId === 'google.com') {
        pendingCredential = GoogleAuthProvider.credentialFromError(error);
      } else if (provider.providerId === 'github.com') {
        pendingCredential = GithubAuthProvider.credentialFromError(error);
      }

      if (!pendingCredential) {
        throw new Error("Could not retrieve credential from social sign-in error.");
      }

      // If the user originally signed up with a password, we can't automatically link.
      if (existingProviderId === 'password') {
        throw new Error(`You already have an account with this email. Please sign in with your password to link your ${provider.providerId} account.`);
      }

      // Prompt user to sign in with their original social provider to link accounts.
      const existingProvider = new (existingProviderId === 'google.com' ? GoogleAuthProvider : GithubAuthProvider)();
      
      try {
        const result = await signInWithPopup(auth, existingProvider);
        await linkWithCredential(result.user, pendingCredential);
        const isNewUser = await handleNewUser(result.user);
        return { user: result.user, isNewUser };
      } catch (linkError) {
        console.error("Error during account linking:", linkError);
        throw new Error("Could not link accounts. Please try signing in with your original method.");
      }
    }
    console.error(`Error signing in with ${provider.providerId}: `, error);
    throw error;
  }
}


export const signInWithGoogle = async (auth: Auth) => {
  const provider = new GoogleAuthProvider();
  return handleSocialSignIn(auth, provider);
}

export const signInWithGitHub = async (auth: Auth) => {
    const provider = new GithubAuthProvider();
    return handleSocialSignIn(auth, provider);
}
