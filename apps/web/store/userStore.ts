import { create } from "zustand";

interface UserState {
  dbUser: {
    id: string;
    clerkId: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string;
    walletBalance: number;
  } | null;
  setDbUser: (user: UserState["dbUser"]) => void;
  clearDbUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  dbUser: null,
  setDbUser: (user) => set({ dbUser: user }),
  clearDbUser: () => set({ dbUser: null }),
}));
