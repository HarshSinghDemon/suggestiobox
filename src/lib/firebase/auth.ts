
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
  unlink,
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
      role: user.email === 'harshroop100@gmail.com' || user.email === '15mondalatrik@gmail.com' ? 'admin' : 'user',
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

export const delinkProvider = async (auth: Auth, providerId: string) => {
    if (auth.currentUser) {
        if (auth.currentUser.providerData.length <= 1) {
            throw new Error("You cannot unlink your only sign-in method.");
        }
        try {
            await unlink(auth.currentUser, providerId);
        } catch (error) {
            console.error(`Error unlinking ${providerId}:`, error);
            throw error;
        }
    } else {
        throw new Error("No user is currently signed in.");
    }
};

const handleSocialSignIn = async (auth: Auth, provider: GoogleAuthProvider | GithubAuthProvider) => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const isNewUser = await handleNewUser(user);
        return { user, isNewUser };
    } catch (error: any) {
        // Handle account exists with different credential error
        if (error.code === 'auth/account-exists-with-different-credential') {
            const email = error.customData.email;
            if (email) {
                const methods = await fetchSignInMethodsForEmail(auth, email);
                if (methods[0] === 'password') {
                    // TODO: Prompt user to sign in with password to link accounts
                    throw new Error("An account already exists with this email address. Please sign in with your password to link your accounts.");
                }
                const existingProvider = new OAuthProvider(methods[0]);
                const credential = OAuthProvider.credentialFromError(error);
                const existingProviderResult = await signInWithPopup(auth, existingProvider);
                await linkWithCredential(existingProviderResult.user, credential);
                const isNewUser = await handleNewUser(existingProviderResult.user);
                return { user: existingProviderResult.user, isNewUser };
            }
        }
        console.error('Social sign-in error: ', error);
        throw error;
    }
};

export const signInWithGoogle = async (auth: Auth) => {
    const provider = new GoogleAuthProvider();
    return handleSocialSignIn(auth, provider);
};

export const signInWithGitHub = async (auth: Auth) => {
    const provider = new GithubAuthProvider();
    return handleSocialSignIn(auth, provider);
};
