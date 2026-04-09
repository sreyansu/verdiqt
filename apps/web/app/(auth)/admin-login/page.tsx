"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Loader2, Lock, Mail, Scale } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/admin");
    }
  }, [user, authLoading, router]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSigningIn(true);

    try {
      // Send credentials to backend for validation
      const { data } = await api.post("/auth/admin-login", {
        email,
        password,
      });

      // Sign into Firebase with the custom token
      await signInWithCustomToken(auth, data.data.token);

      // The AuthProvider onAuthStateChanged will handle the rest
      router.push("/admin");
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Invalid credentials. Please try again."
      );
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative">
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-text-secondary hover:text-text-primary transition-colors text-sm font-medium bg-bg-elevated/50 px-4 py-2 rounded-full border border-border backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="w-full max-w-md p-8 glass-elevated rounded-2xl border border-border">
        {/* Logo */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent-primary flex items-center justify-center">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl gradient-text">
            Verdiqt
          </span>
        </div>

        {/* Admin badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            Administrator Access
          </span>
        </div>

        <h1 className="font-display text-2xl font-semibold mb-2 text-center text-text-primary">
          Admin Sign In
        </h1>
        <p className="text-text-secondary text-center text-sm mb-8">
          Enter your administrator credentials
        </p>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@verdiqt.com"
                required
                className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-accent-danger/10 rounded-lg border border-accent-danger/20">
              <p className="text-sm text-accent-danger">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSigningIn || !email || !password}
            className="w-full py-5 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Sign In as Admin
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Not an admin?{" "}
          <Link
            href="/sign-in"
            className="text-accent-primary hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
