
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
  unlink,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { generateAndExportKey } from '../e2ee';

/**
 * Handles user sign-in and sign-up logic.
 *
 * @param user - The Firebase User object from authentication.
 * @param details - Optional details for new user creation (e.g., year).
 * @returns {Promise<boolean>} True if a new user document was created.
 */
export const handleUserSignIn = async (user: User, details?: { year?: string; publicKey?: string; }) => {
  const db = getFirestore(user.auth.app);
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // New user: create the document.
    let publicKey = details?.publicKey;
    if (!publicKey) {
      // Generate keys if not provided (e.g., social login)
      publicKey = await generateAndExportKey();
    }

    const userData: any = {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      role: user.email === 'harshroop100@gmail.com' || user.email === '15mondalatrik@gmail.com' ? 'admin' : 'user',
      friends: [],
      friendRequestsSent: [],
      friendRequestsReceived: [],
      chatRoomIds: [],
      publicKey: publicKey, // Store public key
    };
    if (details?.year) {
      userData.year = details.year;
    }
    await setDoc(userDocRef, userData);
    return true; // Indicates a new user was created
  } else {
     // Also update profile info that may have changed from social login
     await updateDoc(userDocRef, {
        displayName: user.displayName,
        photoURL: user.photoURL,
    });
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
    const publicKeyBase64 = await generateAndExportKey();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName, photoURL });
    await sendEmailVerification(user);

    await handleUserSignIn(user, { year, publicKey: publicKeyBase64 });

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
    await handleUserSignIn(userCredential.user);
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
        
        const isNewUser = await handleUserSignIn(user);

        return { user, isNewUser };
    } catch (error: any) {
        if (error.code === 'auth/account-exists-with-different-credential') {
            const email = error.customData.email;
            if (email) {
                const methods = await fetchSignInMethodsForEmail(auth, email);
                if (methods[0] === 'password') {
                    throw new Error("An account already exists with this email address. Please sign in with your password to link your accounts.");
                }
                const existingProvider = new OAuthProvider(methods[0]);
                const credential = OAuthProvider.credentialFromError(error);
                const existingProviderResult = await signInWithPopup(auth, existingProvider);
                await linkWithCredential(existingProviderResult.user, credential);
                
                const isNewUser = await handleUserSignIn(existingProviderResult.user);
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
