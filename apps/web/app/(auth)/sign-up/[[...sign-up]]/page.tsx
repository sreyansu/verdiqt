"use client";

import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function SignUpPage() {
  const { signUpWithEmail, user, loading } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [role, setRole] = useState<"CLIENT" | "FREELANCER">("CLIENT");
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both password fields.");
      return;
    }
    
    setIsSigningIn(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, name, role);
      router.push("/dashboard");
    } catch (e: any) {
      console.error(e);
      let errMsg = "Failed to create account. Please try again.";
      if (e.code === "auth/email-already-in-use") {
        errMsg = "An account with this email address already exists. Please sign in instead.";
      } else if (e.code === "auth/invalid-email") {
        errMsg = "The email address is invalid.";
      } else if (e.code === "auth/weak-password") {
        errMsg = "The password is too weak. Please use at least 6 characters.";
      } else if (e.message) {
        errMsg = e.message;
      }
      setError(errMsg);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary py-12 px-4 relative overflow-y-auto">
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-text-secondary hover:text-text-primary transition-colors text-sm font-medium bg-bg-elevated/50 px-4 py-2 rounded-full border border-border backdrop-blur-sm z-10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="w-full max-w-md p-8 glass-elevated rounded-2xl border border-border my-8 shadow-xl">
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
          Create an Account
        </h1>
        <p className="text-text-secondary text-sm text-center mb-6">
          Join Verdiqt to create verified contracts and resolve disputes fairly
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-6 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Account Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("CLIENT")}
              className={`p-3 rounded-xl border text-sm transition-all flex flex-col items-center justify-center gap-1.5 ${
                role === "CLIENT"
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary font-semibold ring-1 ring-accent-primary shadow-xs"
                  : "border-border hover:bg-bg-elevated text-text-secondary"
              }`}
            >
              <span className="font-medium">Client / Employer</span>
              <span className="text-[11px] text-text-secondary">Hire & Fund Escrow</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("FREELANCER")}
              className={`p-3 rounded-xl border text-sm transition-all flex flex-col items-center justify-center gap-1.5 ${
                role === "FREELANCER"
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary font-semibold ring-1 ring-accent-primary shadow-xs"
                  : "border-border hover:bg-bg-elevated text-text-secondary"
              }`}
            >
              <span className="font-medium">Freelancer</span>
              <span className="text-[11px] text-text-secondary">Work & Guarantee Pay</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent-primary focus:outline-none transition-colors"
                required
                autoComplete="name"
              />
            </div>
          </div>
          
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
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent-primary focus:outline-none transition-colors"
                required
                minLength={6}
                autoComplete="new-password"
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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent-primary focus:outline-none transition-colors"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors p-1"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-bg-elevated/50 border border-border rounded-xl text-xs text-text-secondary flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
            <span>
              A verification email will be dispatched immediately. Email verification is mandatory before accessing contract creation and escrow operations.
            </span>
          </div>

          <Button 
            type="submit"
            className="w-full py-5 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium flex items-center justify-center gap-2 mt-4 shadow-sm"
            disabled={isSigningIn || loading}
          >
            {isSigningIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            <span>Create Account</span>
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-accent-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
