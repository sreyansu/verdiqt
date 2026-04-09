"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileText, ArrowRight, Calendar, IndianRupee } from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-text-secondary/20 text-text-secondary" },
  ACTIVE: { label: "Active", className: "bg-accent-success/20 text-accent-success" },
  COMPLETED: { label: "Completed", className: "bg-accent-primary/20 text-accent-primary" },
  DISPUTED: { label: "Disputed", className: "bg-accent-warning/20 text-accent-warning" },
  CANCELLED: { label: "Cancelled", className: "bg-accent-danger/20 text-accent-danger" },
};

export default function ContractsPage() {
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const { data } = await api.get("/contracts");
        setContracts(data.data || []);
      } catch (error) {
        console.error("Failed to fetch contracts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchContracts();
  }, [api]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Contracts</h1>
          <p className="text-text-secondary mt-1">Manage your project contracts</p>
        </div>
        {dbUser?.role === "CLIENT" && (
          <Link href="/contracts/new">
            <Button className="bg-accent-primary hover:bg-accent-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Contract
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-elevated p-6 rounded-xl border-border animate-pulse">
              <div className="h-6 bg-bg-elevated rounded w-1/3 mb-4" />
              <div className="h-4 bg-bg-elevated rounded w-2/3 mb-2" />
              <div className="h-4 bg-bg-elevated rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <Card className="glass-elevated p-12 rounded-xl border-border text-center">
          <FileText className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">No contracts yet</h3>
          {dbUser?.role === "CLIENT" ? (
            <>
              <p className="text-text-secondary mb-6">Create your first contract to get started.</p>
              <Link href="/contracts/new">
                <Button className="bg-accent-primary hover:bg-accent-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Contract
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-text-secondary mb-6">You will see contracts here once a client assigns them to you.</p>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract, i) => {
            const status = statusConfig[contract.status] || statusConfig.DRAFT;
            return (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/contracts/${contract.id}`}>
                  <Card className="glass-elevated p-6 rounded-xl border-border hover:border-accent-primary/20 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display font-semibold text-lg truncate">
                            {contract.title}
                          </h3>
                          <Badge className={status.className}>{status.label}</Badge>
                        </div>
                        <p className="text-text-secondary text-sm line-clamp-2 mb-3">
                          {contract.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span className="font-mono">
                              {contract.totalAmount.toLocaleString("en-IN")}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(contract.endDate), "dd MMM yyyy")}
                          </span>
                          <span>
                            {contract.milestones?.length || 0} milestones
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
