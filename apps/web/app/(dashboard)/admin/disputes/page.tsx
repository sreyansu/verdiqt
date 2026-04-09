"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertTriangle,
  Scale,
  User,
  IndianRupee,
  Loader2,
  Filter,
} from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-accent-primary/20 text-accent-primary" },
  EVIDENCE_COLLECTION: {
    label: "Collecting Evidence",
    className: "bg-accent-secondary/20 text-accent-secondary",
  },
  AI_ANALYZING: {
    label: "AI Analyzing",
    className: "bg-accent-warning/20 text-accent-warning animate-pulse",
  },
  VERDICT_READY: {
    label: "Verdict Ready",
    className: "bg-accent-success/20 text-accent-success",
  },
  ESCALATED: {
    label: "Escalated",
    className: "bg-accent-danger/20 text-accent-danger",
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-text-secondary/20 text-text-secondary",
  },
};

const filterOptions = [
  { value: "", label: "All" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "OPEN", label: "Open" },
  { value: "EVIDENCE_COLLECTION", label: "Evidence Collection" },
  { value: "AI_ANALYZING", label: "AI Analyzing" },
  { value: "VERDICT_READY", label: "Verdict Ready" },
  { value: "RESOLVED", label: "Resolved" },
];

export default function AdminDisputesPage() {
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const router = useRouter();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (dbUser && dbUser.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    async function fetch() {
      try {
        const params = filter ? `?status=${filter}` : "";
        const { data } = await api.get(`/admin/disputes${params}`);
        setDisputes(data.data || []);
      } catch (error) {
        console.error("Failed to fetch disputes:", error);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [api, filter, dbUser, router]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="text-text-secondary hover:text-text-primary"
          onClick={() => router.push("/admin")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Admin Portal
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent-primary" />
            All Platform Disputes
          </h1>
          <p className="text-text-secondary mt-1">
            Review and resolve disputes across the platform
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-text-secondary" />
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setFilter(opt.value); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
              filter === opt.value
                ? "bg-accent-primary text-white font-medium"
                : "bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-primary border border-border"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="glass-elevated p-6 rounded-xl border-border animate-pulse"
            >
              <div className="h-6 bg-bg-elevated rounded w-1/3 mb-4" />
              <div className="h-4 bg-bg-elevated rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <Card className="glass-elevated p-12 rounded-xl border-border text-center">
          <Scale className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">
            No disputes found
          </h3>
          <p className="text-text-secondary">
            {filter
              ? `No disputes with status "${filter}"`
              : "There are no disputes on the platform yet."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {disputes.map((dispute, i) => {
            const status =
              statusConfig[dispute.status] || statusConfig.OPEN;
            const escrowAmount =
              dispute.contract?.escrowWallet?.heldAmount ?? 0;

            return (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/admin/disputes/${dispute.id}`}>
                  <Card
                    className={`glass-elevated p-6 rounded-xl border-border hover:border-accent-primary/20 transition-all duration-200 cursor-pointer group ${
                      dispute.status === "ESCALATED"
                        ? "ring-1 ring-accent-danger/30"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {dispute.status === "ESCALATED" && (
                            <AlertTriangle className="w-4 h-4 text-accent-danger flex-shrink-0" />
                          )}
                          <h3 className="font-display font-semibold text-lg truncate">
                            {dispute.title}
                          </h3>
                          <Badge className={status.className}>
                            {status.label}
                          </Badge>
                        </div>

                        <p className="text-text-secondary text-sm mb-3">
                          Contract: {dispute.contract?.title}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {dispute.contract?.client?.name} vs{" "}
                            {dispute.contract?.freelancer?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDistanceToNow(
                              new Date(dispute.createdAt),
                              { addSuffix: true }
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5" />
                            ₹{escrowAmount.toLocaleString("en-IN")} in escrow
                          </span>
                          <span>
                            {dispute.evidence?.length || 0} evidence files
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
