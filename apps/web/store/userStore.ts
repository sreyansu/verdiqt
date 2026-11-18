import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface DbUser {
  id: string;
  _id?: string;
  clerkId: string;
  email: string;
  name: string;
  role: "CLIENT" | "FREELANCER" | "ADMIN" | string;
  avatarUrl?: string | null;
  walletBalance: number;
  company?: string | null;
  designation?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  phone?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;
  accountType?: "INDIVIDUAL" | "ORGANIZATION" | null;
  bio?: string | null;
  professionalTitle?: string | null;
  skills?: string[];
  specialization?: string | null;
  experienceLevel?: string | null;
  experienceYears?: number | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  availability?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface UserState {
  dbUser: DbUser | null;
  setDbUser: (user: DbUser | null) => void;
  clearDbUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      dbUser: null,
      setDbUser: (user) => set({ dbUser: user }),
      clearDbUser: () => set({ dbUser: null }),
    }),
    {
      name: "verdiqt_user_storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    }
  )
);
