"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Shield,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dbUser && dbUser.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    async function fetchStats() {
      try {
        const { data } = await api.get("/admin/stats");
        setStats(data.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [api, dbUser, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="glass-elevated p-12 rounded-xl border-border text-center">
        <Shield className="w-12 h-12 text-accent-danger mx-auto mb-4" />
        <h3 className="font-display text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-text-secondary">{error}</p>
      </Card>
    );
  }

  const statCards = [
    {
      label: "Escalated",
      value: stats?.escalated ?? 0,
      icon: AlertTriangle,
      color: "text-accent-danger",
      bgColor: "bg-accent-danger/10",
      borderColor: "border-accent-danger/20",
    },
    {
      label: "Challenged",
      value: stats?.challenged ?? 0,
      icon: Shield,
      color: "text-accent-warning",
      bgColor: "bg-accent-warning/10",
      borderColor: "border-accent-warning/20",
    },
    {
      label: "Awaiting AI",
      value: stats?.awaitingAI ?? 0,
      icon: Loader2,
      color: "text-accent-primary",
      bgColor: "bg-accent-primary/10",
      borderColor: "border-accent-primary/20",
    },
    {
      label: "Open Disputes",
      value: stats?.openDisputes ?? 0,
      icon: Clock,
      color: "text-text-primary",
      bgColor: "bg-bg-elevated",
      borderColor: "border-border",
    },
    {
      label: "Resolved",
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      color: "text-accent-success",
      bgColor: "bg-accent-success/10",
      borderColor: "border-accent-success/20",
    },
    {
      label: "Total Disputes",
      value: stats?.totalDisputes ?? 0,
      icon: Scale,
      color: "text-text-secondary",
      bgColor: "bg-bg-elevated",
      borderColor: "border-border",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Portal</h1>
            <p className="text-text-secondary text-sm mt-0.5">
              Platform administration & dispute management
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card
              className={`glass-elevated p-5 rounded-xl border ${stat.borderColor} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-9 h-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-display font-bold">{stat.value}</p>
              <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="glass-elevated p-6 rounded-xl border-border">
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-accent-danger" />
          Escalated Disputes Require Attention
        </h3>
        <p className="text-text-secondary text-sm mb-4">
          {stats?.escalated > 0
            ? `There are ${stats.escalated} dispute(s) that have been escalated for human review. These require manual resolution by an administrator.`
            : "No escalated disputes at this time. The AI mediation engine is handling all disputes successfully."}
        </p>
        <Link href="/admin/disputes">
          <Button className="bg-accent-primary hover:bg-accent-primary/90">
            View All Disputes
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}
