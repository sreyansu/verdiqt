"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Scale, ArrowRight, Clock } from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-accent-primary/20 text-accent-primary" },
  EVIDENCE_COLLECTION: { label: "Collecting Evidence", className: "bg-accent-secondary/20 text-accent-secondary" },
  AI_ANALYZING: { label: "AI Analyzing", className: "bg-accent-warning/20 text-accent-warning animate-pulse" },
  VERDICT_READY: { label: "Verdict Ready", className: "bg-accent-success/20 text-accent-success" },
  CHALLENGED: { label: "Challenged", className: "bg-accent-warning/20 text-accent-warning" },
  ESCALATED: { label: "Escalated", className: "bg-accent-danger/20 text-accent-danger" },
  RESOLVED: { label: "Resolved", className: "bg-text-secondary/20 text-text-secondary" },
};

export default function DisputesPage() {
  const api = useAuthenticatedApi();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get("/disputes");
        setDisputes(data.data || []);
      } catch (error) {
        console.error("Failed to fetch disputes:", error);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [api]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold">Disputes</h1>
          <p className="text-text-secondary mt-1 text-sm">Track and manage your disputes</p>
        </div>
        <Link href="/disputes/new">
          <Button className="bg-accent-warning hover:bg-accent-warning/90 text-bg-primary w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Raise Dispute
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="glass-elevated p-6 rounded-xl border-border animate-pulse">
              <div className="h-6 bg-bg-elevated rounded w-1/3 mb-4" />
              <div className="h-4 bg-bg-elevated rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <Card className="glass-elevated p-12 rounded-xl border-border text-center">
          <Scale className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">No disputes</h3>
          <p className="text-text-secondary mb-6">No active disputes. That&apos;s a good sign!</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {disputes.map((dispute, i) => {
            const status = statusConfig[dispute.status] || statusConfig.OPEN;
            return (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/disputes/${dispute.id}`}>
                  <Card className="glass-elevated p-6 rounded-xl border-border hover:border-accent-warning/20 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="font-display font-semibold text-base sm:text-lg truncate">
                            {dispute.title}
                          </h3>
                          <Badge className={status.className}>{status.label}</Badge>
                        </div>
                        <p className="text-text-secondary text-sm mb-3">
                          Contract: {dispute.contract?.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDistanceToNow(new Date(dispute.createdAt), { addSuffix: true })}
                          </span>
                          <span>
                            {dispute.evidence?.length || 0} evidence files
                          </span>
                          {dispute.verdict && (
                            <span className="text-accent-success flex items-center gap-1">
                              ✓ Verdict available
                            </span>
                          )}
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
