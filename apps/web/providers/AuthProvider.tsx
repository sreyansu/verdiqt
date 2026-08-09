"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUserStore } from "@/store/userStore";
import api from "@/lib/api";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: (role?: "CLIENT" | "FREELANCER") => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, role: "CLIENT" | "FREELANCER") => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { setDbUser } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Automatically fetch our DB user when firebase auth changes
        try {
          const token = await firebaseUser.getIdToken();
          
          // Only fetch if we are not explicitly logging in (which handles its own sync)
          // We can just rely on the API to give us the DB user. 
          try {
            const { data } = await api.get("/auth/me", {
              headers: { Authorization: `Bearer ${token}` }
            });
            setDbUser(data.data);
          } catch (err: any) {
            if (err.response?.status === 404) {
              // Self-heal: User exists in Firebase but was dropped from MongoDB. Sync them back.
              const { data } = await api.post("/auth/sync", {
                name: firebaseUser.displayName,
                email: firebaseUser.email,
                avatarUrl: firebaseUser.photoURL,
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setDbUser(data.data);
            } else {
              console.error("Auth provider network error:", err);
            }
          }
        } catch (error) {
          console.error("Error getting ID token:", error);
        }
      } else {
        setDbUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setDbUser]);

  const signInWithGoogle = async (role: "CLIENT" | "FREELANCER" = "CLIENT") => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Get the ID token for backend passing
      const token = await result.user.getIdToken();
      
      // Upsert the user automatically during sign in
      const { data } = await api.post("/auth/sync", {
        name: result.user.displayName,
        email: result.user.email,
        avatarUrl: result.user.photoURL,
        role: role,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDbUser(data.data);
      
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string, role: "CLIENT" | "FREELANCER") => {
    try {
      // 1. Create the user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Update the Firebase user's profile with their name
      await updateProfile(result.user, { displayName: name });
      
      // 3. Get the token
      const token = await result.user.getIdToken();
      
      // 4. Sync to MongoDB with the requested role
      const { data } = await api.post("/auth/sync", {
        name: name,
        email: result.user.email,
        avatarUrl: null, // Initial signup with email has no avatar
        role: role,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDbUser(data.data);
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      
      // Let the onAuthStateChanged listener fetch the DB user profile normally,
      // but we can also fetch it immediately to ensure quick state update.
      const { data } = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDbUser(data.data);
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setDbUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
