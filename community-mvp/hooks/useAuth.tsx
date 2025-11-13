import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { Timestamp, deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '../services/firebase';
import { UserProfile } from '../types/post';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

type SignUpPayload = {
  email: string;
  password: string;
  displayName: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const nextProfile =
          (await fetchProfile(firebaseUser.uid)) ?? {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? firebaseUser.email ?? '',
            photoURL: firebaseUser.photoURL ?? undefined,
            createdAt: undefined,
          };

        setProfile(nextProfile);
      } else {
        setProfile(null);
      }

      setInitializing(false);
    });

    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      initializing,
      signIn: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUp: async ({ email, password, displayName }: SignUpPayload) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);

        if (displayName.trim().length > 0) {
          await updateProfile(credential.user, { displayName });
        }

        const usersRef = doc(db, 'users', credential.user.uid);

        await setDoc(usersRef, {
          email,
          displayName,
          photoURL: credential.user.photoURL ?? null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setProfile({
          uid: credential.user.uid,
          email,
          displayName,
          photoURL: credential.user.photoURL ?? undefined,
          createdAt: new Date(),
        });
      },
      signOut: async () => {
        await firebaseSignOut(auth);
      },
      deleteAccount: async () => {
        if (!auth.currentUser) {
          throw new Error('로그인이 필요합니다.');
        }

        await deleteDoc(doc(db, 'users', auth.currentUser.uid));
        await deleteUser(auth.currentUser);
      },
      refreshProfile: async () => {
        if (!auth.currentUser) {
          setProfile(null);
          return;
        }

        const nextProfile = await fetchProfile(auth.currentUser.uid);
        setProfile(nextProfile);
      },
    }),
    [user, profile, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}

