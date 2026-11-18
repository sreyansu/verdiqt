"use client";

import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SignInPage() {
  const { signInWithEmail, sendPasswordReset, user, loading } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password Dialog State
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      router.push("/dashboard");
    } catch (e: any) {
      console.error(e);
      let errMsg = "Invalid email or password.";
      if (e.code === "auth/invalid-credential" || e.code === "auth/user-not-found" || e.code === "auth/wrong-password") {
        errMsg = "Invalid email or password. Please verify your credentials.";
      } else if (e.code === "auth/too-many-requests") {
        errMsg = "Too many failed attempts. Please reset your password or try again later.";
      } else if (e.message) {
        errMsg = e.message;
      }
      setError(errMsg);
      setIsSigningIn(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes("@")) {
      setResetError("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      await sendPasswordReset(resetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      console.error(err);
      // For security, still show confirmation or clear error if invalid email format
      setResetError(err.message || "Failed to send password reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-y-auto py-12 px-4">
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-text-secondary hover:text-text-primary transition-colors text-sm font-medium bg-bg-elevated/50 px-4 py-2 rounded-full border border-border backdrop-blur-sm z-10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="w-full max-w-md p-8 glass-elevated rounded-2xl border border-border shadow-xl">
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
            <Image
              src="/verdiqt-icon.png"
              alt="Verdiqt Logo"
              width={44}
              height={44}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="font-display font-bold text-2xl gradient-text">Verdiqt</span>
        </div>
        
        <h1 className="font-display text-2xl font-semibold mb-2 text-center text-text-primary">
          Welcome Back
        </h1>
        <p className="text-text-secondary text-sm text-center mb-8">
          Sign in with your email and password to access your contracts and disputes
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent-primary focus:outline-none transition-colors"
                required
                autoComplete="email"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetSuccess(false);
                  setResetError(null);
                  setForgotPasswordOpen(true);
                }}
                className="text-xs text-accent-primary hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent-primary focus:outline-none transition-colors"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full py-5 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium flex items-center justify-center gap-2 mt-4 shadow-sm"
            disabled={isSigningIn || loading}
          >
            {isSigningIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            <span>Sign In</span>
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-accent-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
        <p className="text-center text-xs text-text-secondary mt-3">
          <Link href="/admin-login" className="text-text-secondary hover:text-accent-primary transition-colors">
            Admin Login →
          </Link>
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-border p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
              <KeyRound className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-display font-bold text-text-primary">
              Reset Your Password
            </DialogTitle>
            <DialogDescription className="text-sm text-text-secondary">
              Enter your email address and we&apos;ll send you a secure link to reset your password.
            </DialogDescription>
          </DialogHeader>

          {resetSuccess ? (
            <div className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-accent-success/10 text-accent-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-text-primary">Password Reset Link Sent</p>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  If an account exists with <span className="font-medium text-text-primary">{resetEmail}</span>, you will receive password reset instructions shortly.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setForgotPasswordOpen(false)}
              >
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
              {resetError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent-primary focus:outline-none transition-colors"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-1/2"
                  onClick={() => setForgotPasswordOpen(false)}
                  disabled={resetLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-1/2 bg-accent-primary hover:bg-accent-primary/90 text-white"
                  disabled={resetLoading}
                >
                  {resetLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  <span>Send Link</span>
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
