"use client";

import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, ArrowLeft } from "lucide-react";

export default function SignInPage() {
  const { signInWithGoogle, signInWithEmail, user, loading } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle("CLIENT"); // Default to client, or freelancer if returning. The sync logic handles returning users.
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to sign in with Google");
      setIsSigningIn(false);
    }
  };

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
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Invalid email or password.");
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-y-auto py-12">
      <Link href="/" className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-text-secondary hover:text-text-primary transition-colors text-sm font-medium bg-bg-elevated/50 px-4 py-2 rounded-full border border-border backdrop-blur-sm z-10">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="w-full max-w-md p-8 glass-elevated rounded-2xl border border-border">
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-accent-primary flex items-center justify-center">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl gradient-text">Verdiqt</span>
        </div>
        
        <h1 className="font-display text-2xl font-semibold mb-2 text-center text-text-primary">Welcome Back</h1>
        <p className="text-text-secondary text-center mb-8">Sign in to your Verdiqt account</p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-text-primary">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent-primary focus:outline-none transition-colors"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-text-primary">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent-primary focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full py-6 bg-accent-primary hover:bg-accent-primary/90 text-white flex items-center gap-2 mt-2"
            disabled={isSigningIn || loading}
          >
            {isSigningIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : null}
            Sign In
          </Button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-bg-elevated px-2 text-text-secondary">Or continue with</span>
          </div>
        </div>

        <Button 
          type="button"
          variant="outline" 
          className="w-full py-6 border-border text-text-primary hover:bg-bg-primary flex items-center gap-3"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn || loading}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Button>
        
        <p className="text-center text-sm text-text-secondary mt-6">
          Don't have an account? <Link href="/sign-up" className="text-accent-primary hover:underline">Sign up</Link>
        </p>
        <p className="text-center text-xs text-text-secondary mt-3">
          <Link href="/admin-login" className="text-text-secondary hover:text-accent-primary transition-colors">
            Admin Login →
          </Link>
        </p>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={`block ${className || ''}`}>{children}</label>;
}
