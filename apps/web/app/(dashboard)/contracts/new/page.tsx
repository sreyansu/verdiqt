"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  FileText,
  IndianRupee,
} from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";

interface MilestoneInput {
  title: string;
  description: string;
  amount: string;
  dueDate: string;
}

const steps = ["Basic Info", "Milestones", "Review"];

export default function NewContractPage() {
  const router = useRouter();
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (dbUser && dbUser.role !== "CLIENT") {
      router.replace("/dashboard");
    }
  }, [dbUser, router]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    totalAmount: "",
    freelancerEmail: "",
    startDate: "",
    endDate: "",
  });

  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", description: "", amount: "", dueDate: "" }
  ]);

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", description: "", amount: "", dueDate: "" }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneInput, value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const moveMilestoneUp = (index: number) => {
    if (index === 0) return;
    const updated = [...milestones];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setMilestones(updated);
  };

  const moveMilestoneDown = (index: number) => {
    if (index === milestones.length - 1) return;
    const updated = [...milestones];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setMilestones(updated);
  };

  const milestoneTotal = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const totalAmount = parseFloat(form.totalAmount) || 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post("/contracts", {
        ...form,
        totalAmount,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        milestones: milestones.map((m) => ({
          ...m,
          amount: parseFloat(m.amount),
          dueDate: new Date(m.dueDate).toISOString(),
        })),
      });
      router.push("/contracts");
    } catch (error: any) {
      console.error("Failed to create contract:", error);
      alert(error.response?.data?.error || "Failed to create contract");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button
        variant="ghost"
        className="text-text-secondary"
        onClick={() => router.push("/contracts")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Create New Contract</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setForm({
              title: "E-commerce Website Redesign",
              description: "Complete UI redesign of the main e-commerce platform including homepage, product pages, and checkout flow.",
              totalAmount: "35000",
              freelancerEmail: "freelancer@verdiqt.app",
              startDate: new Date().toISOString().split("T")[0],
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            });
            setMilestones([
              { title: "Wireframes & UX", description: "Initial wireframes and user flow mapping.", amount: "15000", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
              { title: "Final Design Handoff", description: "Delivery of final high-fidelity Figma components.", amount: "20000", dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
            ]);
          }}
          className="text-xs border-accent-primary/20 text-accent-primary hover:bg-accent-primary/10"
        >
          Auto-Fill Demo Data
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors ${
                i <= step
                  ? "bg-accent-primary border-accent-primary text-white"
                  : "border-border text-text-secondary"
              }`}
            >
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`ml-2 text-sm hidden sm:inline ${i <= step ? "text-text-primary" : "text-text-secondary"}`}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 rounded ${i < step ? "bg-accent-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Basic Info */}
        {step === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="glass-elevated p-6 rounded-xl border-border space-y-4">
              <div className="space-y-2">
                <Label>Contract Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., E-commerce Website Redesign"
                  className="bg-bg-primary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the project scope and deliverables..."
                  className="bg-bg-primary border-border min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Amount (₹)</Label>
                  <Input
                    type="number"
                    value={form.totalAmount}
                    onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                    placeholder="35000"
                    className="bg-bg-primary border-border font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Freelancer Email</Label>
                  <Input
                    type="email"
                    value={form.freelancerEmail}
                    onChange={(e) => setForm({ ...form, freelancerEmail: e.target.value })}
                    placeholder="freelancer@example.com"
                    className="bg-bg-primary border-border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="bg-bg-primary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="bg-bg-primary border-border"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Milestones */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {milestones.map((m, i) => (
              <Card key={i} className="glass-elevated p-5 rounded-xl border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-secondary">Milestone {i + 1}</span>
                  <div className="flex items-center gap-1">
                    {i > 0 && (
                      <button onClick={() => moveMilestoneUp(i)} className="text-text-secondary hover:text-text-primary hover:bg-bg-elevated p-1 rounded transition-colors">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    )}
                    {i < milestones.length - 1 && (
                      <button onClick={() => moveMilestoneDown(i)} className="text-text-secondary hover:text-text-primary hover:bg-bg-elevated p-1 rounded transition-colors">
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    )}
                    {milestones.length > 1 && (
                      <button onClick={() => removeMilestone(i)} className="text-accent-danger hover:bg-accent-danger/10 p-1 rounded transition-colors ml-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <Input
                  value={m.title}
                  onChange={(e) => updateMilestone(i, "title", e.target.value)}
                  placeholder="Milestone title"
                  className="bg-bg-primary border-border"
                />
                <Textarea
                  value={m.description}
                  onChange={(e) => updateMilestone(i, "description", e.target.value)}
                  placeholder="Description of deliverables..."
                  className="bg-bg-primary border-border min-h-[60px]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    value={m.amount}
                    onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                    placeholder="Amount (₹)"
                    className="bg-bg-primary border-border font-mono"
                  />
                  <Input
                    type="date"
                    value={m.dueDate}
                    onChange={(e) => updateMilestone(i, "dueDate", e.target.value)}
                    className="bg-bg-primary border-border"
                  />
                </div>
              </Card>
            ))}

            <Button onClick={addMilestone} variant="outline" className="w-full border-border border-dashed">
              <Plus className="w-4 h-4 mr-2" /> Add Milestone
            </Button>

            {/* Total check */}
            <div className={`text-sm text-center p-3 rounded-lg ${
              Math.abs(milestoneTotal - totalAmount) < 0.01
                ? "bg-accent-success/10 text-accent-success"
                : "bg-accent-warning/10 text-accent-warning"
            }`}>
              <IndianRupee className="w-3.5 h-3.5 inline" />
              Milestone total: ₹{milestoneTotal.toLocaleString("en-IN")} / ₹{totalAmount.toLocaleString("en-IN")}
              {Math.abs(milestoneTotal - totalAmount) >= 0.01 && " — amounts must match"}
            </div>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="glass-elevated p-6 rounded-xl border-border space-y-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-primary" /> Contract Summary
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-text-secondary">Title:</span> {form.title}</p>
                <p><span className="text-text-secondary">Amount:</span> <span className="font-mono">₹{totalAmount.toLocaleString("en-IN")}</span></p>
                <p><span className="text-text-secondary">Freelancer:</span> {form.freelancerEmail}</p>
                <p><span className="text-text-secondary">Duration:</span> {form.startDate} → {form.endDate}</p>
                <p><span className="text-text-secondary">Milestones:</span> {milestones.length}</p>
              </div>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="p-3 bg-bg-primary rounded-lg border border-border text-sm flex justify-between">
                    <span>{m.title}</span>
                    <span className="font-mono text-accent-primary">₹{parseFloat(m.amount || "0").toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="border-border"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Previous
        </Button>

        {step < 2 ? (
          <Button onClick={() => setStep(step + 1)} className="bg-accent-primary hover:bg-accent-primary/90">
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-accent-success hover:bg-accent-success/90"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Create Contract
          </Button>
        )}
      </div>
    </div>
  );
}
