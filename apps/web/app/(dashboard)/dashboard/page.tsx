"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FileText,
  Scale,
  Wallet,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Briefcase,
  User,
  Shield,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Lock,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [contractsRes, disputesRes] = await Promise.all([
        api.get("/contracts"),
        api.get("/disputes"),
      ]);

      setContracts(contractsRes.data?.data || []);
      setDisputes(disputesRes.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    if (dbUser?.role === "ADMIN") {
      router.push("/admin");
      return;
    }
    fetchDashboardData();
  }, [dbUser, router, fetchDashboardData]);

  const role = dbUser?.role || "CLIENT";
  const isClient = role === "CLIENT";

  // Calculations strictly from real database items
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter((c) => c.status === "ACTIVE").length;
  const completedContracts = contracts.filter((c) => c.status === "COMPLETED").length;
  const openDisputes = disputes.filter((d) => !["RESOLVED", "CANCELLED"].includes(d.status)).length;
  const resolvedDisputes = disputes.filter((d) => d.status === "RESOLVED").length;

  // Flatten milestones from all contracts
  const allMilestones = contracts.flatMap((c) =>
    (c.milestones || []).map((m: any) => ({ ...m, contractTitle: c.title, contractId: c._id || c.id }))
  );

  const activeMilestones = allMilestones.filter((m) => m.status === "PENDING" || m.status === "SUBMITTED").length;
  const pendingApprovals = allMilestones.filter((m) => m.status === "SUBMITTED");
  const rejectedMilestones = allMilestones.filter((m) => m.status === "REJECTED");

  // Total escrow funds held
  const totalEscrowHeld = contracts.reduce((acc, c) => {
    const held = c.escrowWallet?.heldAmount || 0;
    return acc + held;
  }, 0);

  // Recent contracts (up to 5)
  const recentContracts = [...contracts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Actionable notifications for client vs freelancer
  const pendingActions: { title: string; desc: string; link: string; type: "warning" | "info" | "urgent" }[] = [];

  if (isClient) {
    if (pendingApprovals.length > 0) {
      pendingActions.push({
        title: `${pendingApprovals.length} Milestone Deliverable(s) Pending Your Review`,
        desc: `Freelancer submitted work for "${pendingApprovals[0].title}". Review and approve to release payment.`,
        link: `/contracts/${pendingApprovals[0].contractId}`,
        type: "urgent",
      });
    }
    const awaitingStatement = disputes.filter((d) => !d.clientStatement);
    if (awaitingStatement.length > 0) {
      pendingActions.push({
        title: "Dispute Statement Needed",
        desc: `Your statement is required for dispute "${awaitingStatement[0].title}".`,
        link: `/disputes/${awaitingStatement[0]._id || awaitingStatement[0].id}`,
        type: "warning",
      });
    }
  } else {
    // Freelancer
    if (pendingApprovals.length > 0) {
      pendingActions.push({
        title: `${pendingApprovals.length} Deliverable(s) Awaiting Client Approval`,
        desc: `Submitted work for "${pendingApprovals[0].title}" is awaiting client inspection and escrow release.`,
        link: `/contracts/${pendingApprovals[0].contractId}`,
        type: "info",
      });
    }
    if (rejectedMilestones.length > 0) {
      pendingActions.push({
        title: "Milestone Revision Requested",
        desc: `Client requested revisions on "${rejectedMilestones[0].title}". Check submission notes.`,
        link: `/contracts/${rejectedMilestones[0].contractId}`,
        type: "warning",
      });
    }
    const awaitingStatement = disputes.filter((d) => !d.freelancerStatement);
    if (awaitingStatement.length > 0) {
      pendingActions.push({
        title: "Dispute Response Required",
        desc: `Submit your response for dispute "${awaitingStatement[0].title}" to initiate mediation.`,
        link: `/disputes/${awaitingStatement[0]._id || awaitingStatement[0].id}`,
        type: "urgent",
      });
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold flex flex-wrap items-center gap-3">
            <span>Welcome back,</span>
            <span className="gradient-text">{dbUser?.name || "User"}</span>
            <span
              className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                isClient
                  ? "bg-accent-primary/10 text-accent-primary border-accent-primary/20"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              }`}
            >
              {role} Dashboard
            </span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {isClient
              ? "Oversee milestone deliverables, fund releases, and active arbitration."
              : "Track active contract milestones, review submissions, and guaranteed escrow payouts."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing || loading}
            className="border-border text-xs text-text-secondary hover:text-text-primary gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>

          {isClient ? (
            <Link href="/contracts/new">
              <Button size="sm" className="bg-accent-primary hover:bg-accent-primary/90 text-white gap-1.5 shadow-sm">
                <Plus className="w-4 h-4" />
                <span>Create Contract</span>
              </Button>
            </Link>
          ) : (
            <Link href="/contracts">
              <Button size="sm" className="bg-accent-primary hover:bg-accent-primary/90 text-white gap-1.5 shadow-sm">
                <Briefcase className="w-4 h-4" />
                <span>My Contracts</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Pending Actions Banner */}
      {pendingActions.length > 0 && (
        <div className="space-y-3">
          {pendingActions.map((action, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                action.type === "urgent"
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-900"
                  : action.type === "warning"
                  ? "bg-rose-500/10 border-rose-500/25 text-rose-900"
                  : "bg-indigo-500/10 border-indigo-500/25 text-indigo-900"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-sm">{action.title}</h3>
                  <p className="text-xs opacity-90 mt-0.5">{action.desc}</p>
                </div>
              </div>
              <Link href={action.link}>
                <Button size="sm" variant="outline" className="text-xs whitespace-nowrap bg-white/80 hover:bg-white border-current/20">
                  <span>Take Action</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Metric Cards Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Metric 1 */}
        <motion.div variants={item}>
          <Card className="glass-elevated p-5 rounded-2xl border-border hover:border-accent-primary/30 transition-all shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {isClient ? "Contracts Managed" : "Assigned Contracts"}
              </span>
              <div className="w-9 h-9 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary">
              {loading ? "—" : totalContracts}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
              <span className="inline-block w-2 h-2 rounded-full bg-accent-success" />
              <span>{activeContracts} Active</span>
              <span>•</span>
              <span>{completedContracts} Completed</span>
            </div>
          </Card>
        </motion.div>

        {/* Metric 2 */}
        <motion.div variants={item}>
          <Card className="glass-elevated p-5 rounded-2xl border-border hover:border-accent-primary/30 transition-all shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {isClient ? "Deliverable Reviews" : "Milestones Status"}
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary">
              {loading ? "—" : isClient ? pendingApprovals.length : activeMilestones}
            </p>
            <p className="text-xs text-text-secondary mt-2">
              {isClient
                ? `${pendingApprovals.length} awaiting your approval`
                : `${pendingApprovals.length} awaiting client review`}
            </p>
          </Card>
        </motion.div>

        {/* Metric 3 */}
        <motion.div variants={item}>
          <Card className="glass-elevated p-5 rounded-2xl border-border hover:border-accent-primary/30 transition-all shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Dispute Mediations
              </span>
              <div className="w-9 h-9 rounded-xl bg-accent-warning/10 text-accent-warning flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary">
              {loading ? "—" : openDisputes}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
              <span className="text-accent-warning font-medium">{openDisputes} In Progress</span>
              <span>•</span>
              <span>{resolvedDisputes} Resolved</span>
            </div>
          </Card>
        </motion.div>

        {/* Metric 4 */}
        <motion.div variants={item}>
          <Card className="glass-elevated p-5 rounded-2xl border-border hover:border-accent-primary/30 transition-all shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {isClient ? "Escrow Funds Held" : "Simulated Wallet"}
              </span>
              <div className="w-9 h-9 rounded-xl bg-accent-secondary/10 text-accent-secondary flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold font-mono text-text-primary">
              {loading
                ? "—"
                : isClient
                ? `₹${totalEscrowHeld.toLocaleString("en-IN")}`
                : `₹${(dbUser?.walletBalance || 0).toLocaleString("en-IN")}`}
            </p>
            <p className="text-xs text-text-secondary mt-2">
              {isClient
                ? "Secured in simulated escrow contracts"
                : "Available for simulated disbursement"}
            </p>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Actions Panel */}
      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg text-text-primary">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isClient ? (
            <>
              <Link href="/contracts/new">
                <Card className="glass-elevated p-4 rounded-xl border-border hover:border-accent-primary/40 hover:bg-slate-50 transition-all group cursor-pointer text-center sm:text-left">
                  <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">Create Contract</p>
                  <p className="text-xs text-text-secondary">Propose new terms</p>
                </Card>
              </Link>
              <Link href="/contracts">
                <Card className="glass-elevated p-4 rounded-xl border-border hover:border-accent-primary/40 hover:bg-slate-50 transition-all group cursor-pointer text-center sm:text-left">
                  <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">View Contracts</p>
                  <p className="text-xs text-text-secondary">Check active milestones</p>
                </Card>
              </Link>
              <Link href="/disputes">
                <Card className="glass-elevated p-4 rounded-xl border-border hover:border-accent-warning/40 hover:bg-slate-50 transition-all group cursor-pointer text-center sm:text-left">
                  <div className="w-8 h-8 rounded-lg bg-accent-warning/10 text-accent-warning flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Scale className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">View Disputes</p>
                  <p className="text-xs text-text-secondary">AI tribunal mediation</p>
                </Card>
              </Link>
              <Link href="/profile">
                <Card className="glass-elevated p-4 rounded-xl border-border hover:border-accent-primary/40 hover:bg-slate-50 transition-all group cursor-pointer text-center sm:text-left">
                  <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <User className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">Update Profile</p>
                  <p className="text-xs text-text-secondary">Company & settings</p>
                </Card>
              </Link>
            </>
          ) : (
            <>
              <Link href="/contracts">
                <Card className="glass-elevated p-4 rounded-xl border-border hover:border-accent-primary/40 hover:bg-slate-50 transition-all group cursor-pointer text-center sm:text-left">
                  <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">View Contracts</p>
                  <p className="text-xs text-text-secondary">Check specifications</p>
                </Card>
              </Link>
              <Link href="/contracts">
                <Card className="glass-elevated p-4 rounded-xl border-border hover:border-accent-primary/40 hover:bg-slate-50 transition-all group cursor-pointer text-center sm:text-left">
                  <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">Submit Work</p>
                  <p className="text-xs text-text-secondary">Upload deliverables</p>
                </Card>
              </Link>
              <Link href="/disputes">
                <Card className="glass-elevated p-4 rounded-xl border-border hover:border-accent-warning/40 hover:bg-slate-50 transition-all group cursor-pointer text-center sm:text-left">
                  <div className="w-8 h-8 rounded-lg bg-accent-warning/10 text-accent-warning flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Scale className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">View Disputes</p>
                  <p className="text-xs text-text-secondary">Submit counter-evidence</p>
                </Card>
              </Link>
              <Link href="/profile">
                <Card className="glass-elevated p-4 rounded-xl border-border hover:border-accent-primary/40 hover:bg-slate-50 transition-all group cursor-pointer text-center sm:text-left">
                  <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <User className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">Update Profile</p>
                  <p className="text-xs text-text-secondary">Skills & portfolio</p>
                </Card>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Recent Contracts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-text-primary">
            Recent Contract Engagements
          </h2>
          <Link href="/contracts" className="text-xs font-semibold text-accent-primary hover:underline flex items-center gap-1">
            <span>View all contracts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentContracts.length === 0 ? (
          <Card className="glass-elevated p-12 text-center rounded-2xl border-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-base text-text-primary">No Contracts Yet</h3>
            <p className="text-sm text-text-secondary max-w-sm mx-auto">
              {isClient
                ? "Create your first milestone contract to guarantee payments through simulated escrow."
                : "You don't have any active contracts assigned to your account yet."}
            </p>
            {isClient && (
              <div className="pt-2">
                <Link href="/contracts/new">
                  <Button size="sm" className="bg-accent-primary text-white">
                    Create First Contract
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentContracts.map((c) => {
              const contractId = c._id || c.id;
              const otherParty = isClient ? c.freelancer : c.client;
              const milestones = c.milestones || [];
              const approvedCount = milestones.filter((m: any) => m.status === "APPROVED").length;
              const progressPct = milestones.length > 0 ? Math.round((approvedCount / milestones.length) * 100) : 0;

              return (
                <Link key={contractId} href={`/contracts/${contractId}`}>
                  <Card className="glass-elevated p-5 rounded-2xl border-border hover:border-accent-primary/40 transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full border ${
                            c.status === "ACTIVE"
                              ? "bg-accent-success/10 text-accent-success border-accent-success/20"
                              : c.status === "DISPUTED"
                              ? "bg-accent-warning/10 text-accent-warning border-accent-warning/20"
                              : c.status === "COMPLETED"
                              ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {c.status}
                        </span>
                        <span className="font-mono font-bold text-sm text-text-primary">
                          ₹{c.totalAmount?.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm text-text-primary group-hover:text-accent-primary transition-colors line-clamp-1">
                        {c.title}
                      </h3>

                      <p className="text-xs text-text-secondary mt-1">
                        {isClient ? "Freelancer:" : "Client:"}{" "}
                        <span className="font-medium text-text-primary">
                          {otherParty?.name || otherParty?.email || "Unassigned"}
                        </span>
                      </p>

                      {/* Milestone Progress bar */}
                      <div className="mt-4 pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1">
                          <span>Milestones ({approvedCount}/{milestones.length})</span>
                          <span className="font-mono font-medium">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-accent-primary h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-secondary pt-3 mt-3 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {c.endDate ? new Date(c.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Open deadline"}
                      </span>
                      <span className="text-accent-primary font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>Details</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
