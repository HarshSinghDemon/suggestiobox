
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
      const credential = (provider.providerId === 'google.com' 
          ? GoogleAuthProvider.credentialFromError(error) 
          : GithubAuthProvider.credentialFromError(error));

      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods[0] === 'password' && auth.currentUser) {
        const result = await linkWithCredential(auth.currentUser, credential!);
        const isNewUser = await handleNewUser(result.user);
        return { user: result.user, isNewUser };
      }
      
      // If user is not signed in with password, or some other issue, we can't link automatically.
      // For a better UX, you might prompt user to sign in with their password first.
      // For now, we re-throw a more user-friendly error.
      throw new Error(
        `An account with ${email} already exists. Please sign in with your password to link your ${provider.providerId.split('.')[0]} account.`
      );
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
