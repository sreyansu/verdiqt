"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUserStore, DbUser } from "@/store/userStore";
import api from "@/lib/api";

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: DbUser | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string, name: string, role: "CLIENT" | "FREELANCER") => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshDbUser: () => Promise<DbUser | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  signOut: async () => {},
  sendVerificationEmail: async () => {},
  refreshVerificationStatus: async () => false,
  sendPasswordReset: async () => {},
  changePassword: async () => {},
  refreshDbUser: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { dbUser, setDbUser } = useUserStore();

  const fetchDbUser = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      try {
        const { data } = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDbUser(data.data);
        return data.data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Self-heal: User exists in Firebase but needs MongoDB doc sync
          try {
            const { data } = await api.post("/auth/sync", {
              name: firebaseUser.displayName,
              email: firebaseUser.email,
              avatarUrl: firebaseUser.photoURL,
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setDbUser(data.data);
            return data.data;
          } catch (syncErr) {
            console.error("Auth provider self-heal /auth/sync error:", syncErr);
          }
        } else {
          console.error("Auth provider fetch /auth/me error:", err);
        }
      }
    } catch (error) {
      console.error("Error getting ID token / fetching DB user:", error);
    }
    return null;
  }, [setDbUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await fetchDbUser(firebaseUser);
      } else {
        setDbUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchDbUser, setDbUser]);

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string,
    role: "CLIENT" | "FREELANCER"
  ) => {
    try {
      // 1. Create the user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // 2. Update Firebase display name
      await updateProfile(result.user, { displayName: name.trim() });
      
      // 3. Send verification email immediately
      try {
        await sendEmailVerification(result.user);
      } catch (emailErr) {
        console.warn("Failed to send verification email during signup:", emailErr);
      }
      
      // 4. Get ID token and sync user to MongoDB with role
      const token = await result.user.getIdToken();
      const { data } = await api.post("/auth/sync", {
        name: name.trim(),
        email: result.user.email,
        avatarUrl: null,
        role: role,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDbUser(data.data);
      setUser(result.user);
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      setUser(result.user);
      await fetchDbUser(result.user);
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setDbUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error("No authenticated user found");
    await sendEmailVerification(auth.currentUser);
  };

  const refreshVerificationStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const updated = auth.currentUser;
    setUser(updated);
    if (updated.emailVerified) {
      // Force token refresh so new claims contain email_verified: true
      await updated.getIdToken(true);
      await fetchDbUser(updated);
      return true;
    }
    return false;
  };

  const sendPasswordReset = async (email: string) => {
    if (!email || !email.includes("@")) {
      throw new Error("Please enter a valid email address");
    }
    await sendPasswordResetEmail(auth, email.trim());
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error("No active user session");
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long");
    }

    // Re-authenticate first
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    // Update password
    await updatePassword(auth.currentUser, newPassword);
  };

  const refreshDbUser = async (): Promise<DbUser | null> => {
    if (auth.currentUser) {
      return await fetchDbUser(auth.currentUser);
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signOut,
        sendVerificationEmail,
        refreshVerificationStatus,
        sendPasswordReset,
        changePassword,
        refreshDbUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
