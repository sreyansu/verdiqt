"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Mail, CheckCircle2, RefreshCw, LogOut, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmailVerificationGate() {
  const { user, sendVerificationEmail, refreshVerificationStatus, signOut } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setMessage(null);
    try {
      await sendVerificationEmail();
      setMessage({
        type: "success",
        text: "Verification email resent successfully! Please check your spam/junk folder as well.",
      });
      setCooldown(60);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to resend verification email. Please try again later.",
      });
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const isVerified = await refreshVerificationStatus();
      if (!isVerified) {
        setMessage({
          type: "error",
          text: "Your email is not verified yet. Please click the link in your email and try again.",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: "Error checking verification status. Please try again.",
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-lg glass-elevated border border-border rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto text-accent-primary shadow-sm">
          <Mail className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent-warning/10 text-accent-warning border border-accent-warning/20">
            Action Required
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-primary mt-3">
            Verify Your Email
          </h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2 max-w-md mx-auto">
            We sent a verification link to{" "}
            <span className="font-semibold text-text-primary underline">
              {user?.email || "your registered email"}
            </span>
            . Please verify your email before accessing your dashboard and contracts.
          </p>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl text-sm flex items-start gap-2.5 text-left ${
              message.type === "success"
                ? "bg-accent-success/10 border border-accent-success/20 text-accent-success"
                : "bg-accent-danger/10 border border-accent-danger/20 text-accent-danger"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full h-11 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium shadow-md flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Checking Status..." : "I've Verified My Email — Continue"}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <Button
            variant="outline"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="w-full h-11 border-border text-text-secondary hover:text-text-primary hover:bg-bg-elevated text-sm"
          >
            {resending
              ? "Sending Email..."
              : cooldown > 0
              ? `Resend Email in ${cooldown}s`
              : "Resend Verification Email"}
          </Button>
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between text-xs text-text-secondary">
          <span>Wrong email account?</span>
          <button
            onClick={() => signOut()}
            className="text-accent-danger hover:underline font-medium flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

