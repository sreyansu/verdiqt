"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FileText,
  Scale,
  Wallet,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";

interface DashboardStats {
  activeContracts: number;
  openDisputes: number;
  walletBalance: number;
  resolvedCases: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const [stats, setStats] = useState<DashboardStats>({
    activeContracts: 0,
    openDisputes: 0,
    walletBalance: 0,
    resolvedCases: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [contractsRes, disputesRes] = await Promise.all([
          api.get("/contracts"),
          api.get("/disputes"),
        ]);

        const contracts = contractsRes.data.data || [];
        const disputes = disputesRes.data.data || [];

        setStats({
          activeContracts: contracts.filter((c: any) => c.status === "ACTIVE").length,
          openDisputes: disputes.filter(
            (d: any) => !["RESOLVED", "ESCALATED"].includes(d.status)
          ).length,
          walletBalance: dbUser?.walletBalance || 0,
          resolvedCases: disputes.filter((d: any) => d.status === "RESOLVED").length,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [api, dbUser]);

  const statCards = [
    {
      title: "Active Contracts",
      value: stats.activeContracts,
      icon: FileText,
      color: "text-accent-primary",
      bg: "bg-accent-primary/10",
      glow: "glow-primary",
    },
    {
      title: "Open Disputes",
      value: stats.openDisputes,
      icon: AlertCircle,
      color: "text-accent-warning",
      bg: "bg-accent-warning/10",
      glow: "glow-warning",
    },
    {
      title: "Wallet Balance",
      value: `₹${stats.walletBalance.toLocaleString("en-IN")}`,
      icon: Wallet,
      color: "text-accent-secondary",
      bg: "bg-accent-secondary/10",
      glow: "",
    },
    {
      title: "Resolved Cases",
      value: stats.resolvedCases,
      icon: CheckCircle2,
      color: "text-accent-success",
      bg: "bg-accent-success/10",
      glow: "glow-success",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold flex flex-wrap items-center gap-3">
          Welcome back, <span className="gradient-text">{dbUser?.name || "User"}</span>
          {dbUser?.role && (
            <span className="text-xs md:text-sm font-medium px-3 py-1 bg-accent-primary/10 text-accent-primary rounded-full border border-accent-primary/20 uppercase tracking-wide">
              {dbUser.role}
            </span>
          )}
        </h1>
        <p className="text-text-secondary mt-1">
          Here&apos;s an overview of your account activity.
        </p>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card
              className={`glass-elevated p-5 rounded-xl border-border hover:border-accent-primary/20 transition-all duration-300 ${stat.glow}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-text-secondary" />
              </div>
              <p className="text-2xl font-display font-bold">{loading ? "—" : stat.value}</p>
              <p className="text-sm text-text-secondary mt-1">{stat.title}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dbUser?.role === "CLIENT" && (
            <Link href="/contracts/new">
              <Card className="glass-elevated p-5 rounded-xl border-border hover:border-accent-primary/30 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <p className="font-medium">New Contract</p>
                    <p className="text-sm text-text-secondary">Create a contract</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Card>
            </Link>
          )}

          <Link href="/disputes/new">
            <Card className="glass-elevated p-5 rounded-xl border-border hover:border-accent-warning/30 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Scale className="w-5 h-5 text-accent-warning" />
                </div>
                <div>
                  <p className="font-medium">Raise Dispute</p>
                  <p className="text-sm text-text-secondary">Start a mediation</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          </Link>

          <Link href="/wallet">
            <Card className="glass-elevated p-5 rounded-xl border-border hover:border-accent-secondary/30 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5 text-accent-secondary" />
                </div>
                <div>
                  <p className="font-medium">View Wallet</p>
                  <p className="text-sm text-text-secondary">Check your balance</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
