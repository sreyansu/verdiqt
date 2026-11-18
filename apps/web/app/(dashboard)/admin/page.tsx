"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Users,
  FileText,
  RefreshCw,
  UserCheck,
  Briefcase,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load admin metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    if (dbUser && dbUser.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchStats();
  }, [dbUser, router, fetchStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-3">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        <p className="text-xs text-text-secondary">Loading platform administrative metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="glass-elevated p-12 rounded-2xl border-border text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-accent-danger/10 text-accent-danger flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="font-display text-xl font-bold text-text-primary">Administrative Access Error</h3>
        <p className="text-text-secondary text-sm">{error}</p>
        <Button variant="outline" onClick={() => fetchStats(true)} className="mt-2">
          Retry Connection
        </Button>
      </Card>
    );
  }

  const usersData = stats?.users || { total: 0, clients: 0, freelancers: 0 };
  const contractsData = stats?.contracts || { total: 0, active: 0 };
  const disputesData = stats?.disputes || {
    total: 0,
    escalated: 0,
    openDisputes: 0,
    resolved: 0,
    awaitingAI: 0,
    challenged: 0,
    casesRequiringReview: 0,
  };

  const recentDisputes = stats?.recentDisputes || [];
  const recentUsers = stats?.recentUsers || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent-danger/10 text-accent-danger border border-accent-danger/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Admin Control Center</h1>
            <p className="text-text-secondary text-xs sm:text-sm mt-0.5">
              Live platform metrics, dispute oversight & arbitration governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="border-border text-xs text-text-secondary hover:text-text-primary gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>

          <Link href="/admin/disputes">
            <Button size="sm" className="bg-accent-primary hover:bg-accent-primary/90 text-white gap-1.5 text-xs">
              <Scale className="w-4 h-4" />
              <span>Review Disputes</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Urgent Attention Banner */}
      {disputesData.casesRequiringReview > 0 ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                {disputesData.casesRequiringReview} Case(s) Require Human Arbitrator Review
              </p>
              <p className="text-xs text-rose-800 mt-0.5">
                {disputesData.escalated} escalated cases and {disputesData.challenged} challenged verdicts require manual arbitration determination.
              </p>
            </div>
          </div>
          <Link href="/admin/disputes">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs whitespace-nowrap">
              Review Cases
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-accent-success/10 border border-accent-success/20 text-accent-success flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>All dispute tribunals are operating smoothly. No urgent manual escalations pending.</span>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric: Registered Users */}
        <Card className="glass-elevated p-5 rounded-2xl border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Platform Users</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary">{usersData.total}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
            <span className="font-medium text-text-primary">{usersData.clients} Clients</span>
            <span>•</span>
            <span className="font-medium text-text-primary">{usersData.freelancers} Freelancers</span>
          </div>
        </Card>

        {/* Metric: Contracts */}
        <Card className="glass-elevated p-5 rounded-2xl border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Contracts</span>
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary">{contractsData.total}</p>
          <p className="text-xs text-text-secondary mt-2">
            <span className="font-medium text-accent-success">{contractsData.active} Currently Active</span>
          </p>
        </Card>

        {/* Metric: Active Disputes */}
        <Card className="glass-elevated p-5 rounded-2xl border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Active Disputes</span>
            <div className="w-8 h-8 rounded-lg bg-accent-warning/10 text-accent-warning flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary">{disputesData.openDisputes}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
            <span>{disputesData.resolved} Resolved</span>
            <span>•</span>
            <span>{disputesData.total} All-Time</span>
          </div>
        </Card>

        {/* Metric: Escalated & Challenged */}
        <Card className="glass-elevated p-5 rounded-2xl border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Manual Review Needed</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-rose-600 font-mono">
            {disputesData.casesRequiringReview}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
            <span>{disputesData.escalated} Escalated</span>
            <span>•</span>
            <span>{disputesData.challenged} Challenged</span>
          </div>
        </Card>
      </div>

      {/* Two Column Layout: Recent Disputes & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Disputes */}
        <Card className="glass-elevated p-6 rounded-2xl border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-display font-bold text-base text-text-primary flex items-center gap-2">
              <Scale className="w-4 h-4 text-accent-warning" />
              <span>Recent Dispute Filings</span>
            </h2>
            <Link href="/admin/disputes" className="text-xs text-accent-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {recentDisputes.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center italic">No disputes on record.</p>
            ) : (
              recentDisputes.map((d: any) => {
                const disputeId = d._id || d.id;
                return (
                  <Link
                    key={disputeId}
                    href={`/admin/disputes/${disputeId}`}
                    className="p-3 rounded-xl border border-border/70 hover:border-accent-primary/40 hover:bg-slate-50/70 transition-all flex items-center justify-between group block"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-semibold text-xs text-text-primary group-hover:text-accent-primary transition-colors truncate">
                        {d.title}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5 truncate">
                        Contract: {d.contract?.title || "N/A"} • Raised by {d.raisedBy?.name || "User"}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${
                        d.status === "ESCALATED"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : d.status === "CHALLENGED"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : d.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {d.status}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        {/* Recent Registered Users */}
        <Card className="glass-elevated p-6 rounded-2xl border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-display font-bold text-base text-text-primary flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Recent Registrations</span>
            </h2>
            <Link href="/admin/users" className="text-xs text-accent-primary hover:underline">
              User manager
            </Link>
          </div>

          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center italic">No registered users found.</p>
            ) : (
              recentUsers.map((u: any) => {
                const userId = u._id || u.id;
                return (
                  <div
                    key={userId}
                    className="p-3 rounded-xl border border-border/70 flex items-center justify-between gap-3 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary text-xs font-semibold flex-shrink-0">
                        {u.avatarUrl ? (
                          <Image src={u.avatarUrl} alt={u.name} width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          <span>{u.name ? u.name.slice(0, 2).toUpperCase() : "U"}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-text-primary truncate">{u.name}</p>
                        <p className="text-[11px] text-text-secondary truncate">{u.email}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        u.role === "ADMIN"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : u.role === "CLIENT"
                          ? "bg-accent-primary/10 text-accent-primary border-accent-primary/20"
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
