"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Scale, Loader2, AlertTriangle } from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";

export default function NewDisputePage() {
  const router = useRouter();
  const api = useAuthenticatedApi();
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const contractId = urlParams.get("contractId");
      if (contractId) {
        setSelectedContract(contractId);
      }
    }
  }, []);
  const [title, setTitle] = useState("");
  const [statement, setStatement] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get("/contracts");
        const activeContracts = (data.data || []).filter(
          (c: any) => c.status === "ACTIVE"
        );
        setContracts(activeContracts);
      } catch (error) {
        console.error("Failed to fetch contracts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [api]);

  const handleSubmit = async () => {
    if (!selectedContract || title.length < 5 || statement.length < 20) return;

    setSubmitting(true);
    try {
      const { data } = await api.post("/disputes", {
        contractId: selectedContract,
        title,
        clientStatement: statement,
      });
      router.push(`/disputes/${data.data.id}`);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to raise dispute");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        className="text-text-secondary"
        onClick={() => router.push("/disputes")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-3">
          <Scale className="w-7 h-7 text-accent-warning" />
          Raise a Dispute
        </h1>
        <p className="text-text-secondary mt-1">
          Select a contract and describe the issue. The escrow will be frozen upon submission.
        </p>
      </div>

      <div className="p-3 bg-accent-warning/10 rounded-lg border border-accent-warning/20 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-accent-warning flex-shrink-0 mt-0.5" />
        <p className="text-sm text-accent-warning">
          Raising a dispute will freeze the escrow funds until the dispute is resolved.
        </p>
      </div>

      <Card className="glass-elevated p-6 rounded-xl border-border space-y-5">
        <div className="space-y-2">
          <Label>Select Contract</Label>
          {loading ? (
            <div className="h-10 bg-bg-primary animate-pulse rounded-lg" />
          ) : contracts.length === 0 ? (
            <p className="text-sm text-text-secondary">No active contracts available for dispute.</p>
          ) : (
            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
            >
              <option value="">Choose a contract...</option>
              {contracts.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.title} — ₹{c.totalAmount.toLocaleString("en-IN")}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <Label>Dispute Title</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Deliverable does not match agreed designs"
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Your Statement</Label>
          <Textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Describe the issue in detail. Include specific deliverables that were not met, timeline issues, or quality concerns..."
            className="bg-bg-primary border-border min-h-[150px]"
          />
          <p className="text-xs text-text-secondary">{statement.length} / 20 min characters</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || !selectedContract || title.length < 5 || statement.length < 20}
          className="w-full bg-accent-warning hover:bg-accent-warning/90 text-bg-primary"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Scale className="w-4 h-4 mr-2" />
          )}
          Raise Dispute
        </Button>
      </Card>
    </div>
  );
}
