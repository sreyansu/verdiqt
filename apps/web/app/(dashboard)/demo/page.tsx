"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Scale,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  User,
  IndianRupee,
  Calendar,
  Upload,
  Loader2,
  Play,
  ArrowRight,
  Lock,
  Unlock,
  Zap,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";
import ConfidenceMeter from "@/components/shared/ConfidenceMeter";

/* ───────── DEMO DATA ───────── */
const demoContract = {
  title: "E-commerce Website Redesign",
  description:
    "Complete redesign of existing e-commerce platform including homepage, product pages, checkout flow, and mobile responsiveness. Must follow provided Figma designs.",
  totalAmount: 35000,
  startDate: "2026-02-01",
  endDate: "2026-04-15",
  client: { name: "Arjun Mehta", email: "arjun@acmecorp.in" },
  freelancer: { name: "Priya Sharma", email: "priya@designhub.in" },
};

const demoMilestones = [
  { title: "Homepage Redesign", amount: 12000, status: "APPROVED", dueDate: "2026-02-20" },
  { title: "Product & Category Pages", amount: 10000, status: "APPROVED", dueDate: "2026-03-10" },
  { title: "Checkout & Payment Flow", amount: 8000, status: "DISPUTED", dueDate: "2026-03-25" },
  { title: "Mobile Responsiveness & QA", amount: 5000, status: "PENDING", dueDate: "2026-04-10" },
];

const demoVerdict = {
  clientFaultPercent: 35,
  freelancerFaultPercent: 65,
  clientRefundPercent: 35,
  freelancerReleasePercent: 65,
  reasoning:
    "The freelancer delivered the core checkout flow but deviated from the agreed designs in key areas. However, the client's claim about the saved card feature is not supported by the contract scope, and the auto-complete dependency on a Google API key was the client's responsibility. The order confirmation changes appear to have been client-directed based on the March 2nd email.",
  contractAnalysis:
    "The contract clearly defined the checkout redesign scope with Figma reference. Two of four milestones were approved without issue, indicating satisfactory early work. The dispute centers on the third milestone where scope ambiguity exists around specific features like saved cards.",
  evidenceSummary:
    "Comparison screenshots show genuine layout differences in the order confirmation page. However, the email evidence supports the freelancer's claim that these changes were requested by the client. No contract amendment was found for the saved card feature.",
  confidenceScore: 0.81,
  escalatedToHuman: false,
  modelUsed: "claude-haiku-4-5-20251001",
};

const escrowData = {
  total: 35000,
  held: 13000,
  released: 22000,
  refunded: 0,
};

/* ───────── STAGES ───────── */
const stages = [
  { id: "contract", label: "Contract Created", icon: FileText },
  { id: "escrow", label: "Escrow Funded", icon: Lock },
  { id: "milestones", label: "Milestones Progress", icon: CheckCircle2 },
  { id: "dispute", label: "Dispute Raised", icon: AlertTriangle },
  { id: "evidence", label: "Evidence Submitted", icon: Upload },
  { id: "analyzing", label: "AI Analyzing", icon: Brain },
  { id: "verdict", label: "Verdict Delivered", icon: Scale },
  { id: "resolved", label: "Funds Distributed", icon: Unlock },
];

const milestoneStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-gray-100 text-gray-600" },
  APPROVED: { label: "Approved", className: "bg-green-50 text-green-700" },
  DISPUTED: { label: "Disputed", className: "bg-amber-50 text-amber-700" },
};

export default function DemoPage() {
  const [currentStage, setCurrentStage] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdictAccepted, setVerdictAccepted] = useState(false);

  const handleNext = () => {
    if (currentStage === 5) {
      // AI Analyzing stage — show shimmer then advance
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowVerdict(true);
        setCurrentStage(6);
      }, 3000);
    } else if (currentStage === 6 && !verdictAccepted) {
      setVerdictAccepted(true);
      setCurrentStage(7);
    } else if (currentStage < stages.length - 1) {
      setCurrentStage(currentStage + 1);
    }
  };

  const handleReset = () => {
    setCurrentStage(0);
    setIsAnalyzing(false);
    setShowVerdict(false);
    setVerdictAccepted(false);
  };

  const freelancerAmount = (escrowData.held * demoVerdict.freelancerReleasePercent) / 100;
  const clientRefund = (escrowData.held * demoVerdict.clientRefundPercent) / 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <Play className="w-7 h-7 text-accent-primary" />
            Demo <span className="gradient-text">Sandbox</span>
          </h1>
          <p className="text-text-secondary mt-1">
            Walk through a complete escrow → dispute → AI verdict flow
          </p>
        </div>
        <Button onClick={handleReset} variant="outline" className="border-border">
          Reset Demo
        </Button>
      </div>

      {/* ─── Stage Timeline ─── */}
      <Card className="glass-elevated p-6 rounded-xl">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {stages.map((stage, i) => {
            const isCompleted = i < currentStage;
            const isCurrent = i === currentStage;
            return (
              <div key={stage.id} className="flex items-center min-w-0">
                <button
                  onClick={() => {
                    if (i <= currentStage) setCurrentStage(i);
                  }}
                  className="flex flex-col items-center flex-shrink-0"
                >
                  <motion.div
                    animate={{
                      scale: isCurrent ? 1.15 : 1,
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted
                        ? "bg-accent-primary text-white"
                        : isCurrent
                        ? "bg-accent-primary/10 text-accent-primary border-2 border-accent-primary"
                        : "bg-bg-elevated text-text-secondary border border-border"
                    } ${isCurrent ? "animate-pulse-ring" : ""}`}
                  >
                    <stage.icon className="w-4 h-4" />
                  </motion.div>
                  <span
                    className={`text-[10px] mt-1.5 font-medium text-center leading-tight w-16 ${
                      isCurrent ? "text-accent-primary" : "text-text-secondary"
                    }`}
                  >
                    {stage.label}
                  </span>
                </button>
                {i < stages.length - 1 && (
                  <div
                    className={`w-6 h-0.5 mx-0.5 rounded flex-shrink-0 mt-[-18px] ${
                      i < currentStage ? "bg-accent-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─── Stage Content ─── */}
      <AnimatePresence mode="wait">
        {/* STAGE 0: Contract */}
        {currentStage === 0 && (
          <StageWrapper key="s0">
            <Card className="glass-elevated p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">{demoContract.title}</h2>
                  <p className="text-sm text-text-secondary">{demoContract.description}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <InfoCard icon={IndianRupee} label="Total" value={`₹${demoContract.totalAmount.toLocaleString("en-IN")}`} />
                <InfoCard icon={Calendar} label="Start" value="01 Feb 2026" />
                <InfoCard icon={User} label="Client" value={demoContract.client.name} />
                <InfoCard icon={User} label="Freelancer" value={demoContract.freelancer.name} />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text-secondary">Milestones</h3>
                {demoMilestones.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-bg-primary rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-xs text-text-secondary font-medium">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium">{m.title}</span>
                    </div>
                    <span className="text-sm font-mono text-accent-primary">₹{m.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </Card>
          </StageWrapper>
        )}

        {/* STAGE 1: Escrow Funded */}
        {currentStage === 1 && (
          <StageWrapper key="s1">
            <Card className="glass-elevated p-6 rounded-xl glow-primary">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">Escrow Vault Funded</h2>
                  <p className="text-sm text-text-secondary">
                    ₹35,000 has been locked in the escrow vault. Funds cannot be withdrawn by either party.
                  </p>
                </div>
              </div>

              <div className="relative p-6 bg-bg-primary rounded-xl border border-border">
                <div className="text-center">
                  <p className="text-sm text-text-secondary mb-1">Total Escrowed</p>
                  <p className="text-4xl font-display font-bold font-mono text-accent-primary">₹35,000</p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-text-secondary">
                    <Lock className="w-4 h-4" />
                    <span>Funds are locked and secured</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mt-6">
                  {demoMilestones.map((m, i) => (
                    <div key={i} className="text-center p-3 bg-white rounded-lg border border-border">
                      <p className="text-xs text-text-secondary mb-1">M{i + 1}</p>
                      <p className="text-sm font-mono font-semibold">₹{(m.amount / 1000).toFixed(0)}k</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </StageWrapper>
        )}

        {/* STAGE 2: Milestones Progress */}
        {currentStage === 2 && (
          <StageWrapper key="s2">
            <Card className="glass-elevated p-6 rounded-xl">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent-success" />
                Milestone Progress
              </h2>

              <div className="space-y-3">
                {demoMilestones.map((m, i) => {
                  const st = milestoneStatusConfig[m.status];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center gap-4 p-4 bg-bg-primary rounded-lg border border-border"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          m.status === "APPROVED"
                            ? "bg-accent-success text-white"
                            : m.status === "DISPUTED"
                            ? "bg-accent-warning text-white"
                            : "bg-bg-elevated border border-border"
                        }`}
                      >
                        {m.status === "APPROVED" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : m.status === "DISPUTED" ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4 text-text-secondary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{m.title}</p>
                        <p className="text-xs text-text-secondary">Due: {m.dueDate}</p>
                      </div>
                      <span className="font-mono text-sm">₹{m.amount.toLocaleString("en-IN")}</span>
                      <Badge className={st.className}>{st.label}</Badge>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-4 p-4 bg-accent-success/5 rounded-lg border border-accent-success/20">
                <p className="text-sm text-accent-success font-medium">
                  ✓ ₹22,000 released to freelancer for approved milestones (M1 + M2)
                </p>
              </div>
            </Card>
          </StageWrapper>
        )}

        {/* STAGE 3: Dispute Raised */}
        {currentStage === 3 && (
          <StageWrapper key="s3">
            <Card className="glass-elevated p-6 rounded-xl border-l-4 border-l-accent-warning">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-accent-warning" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">Dispute Raised</h2>
                  <p className="text-sm text-text-secondary">Escrow is now frozen — no funds can be accessed</p>
                </div>
              </div>

              <div className="p-4 bg-accent-warning/5 rounded-lg border border-accent-warning/20 mb-5">
                <p className="font-semibold text-sm mb-1">Checkout flow does not match agreed Figma designs</p>
                <p className="text-xs text-text-secondary">Raised by Arjun Mehta (Client) • 25 Mar 2026</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="p-4 bg-bg-primary rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-accent-primary" />
                    <span className="text-sm font-semibold">Client&apos;s Statement</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    &ldquo;The checkout flow delivered significantly deviates from the Figma designs. The payment page is missing the saved card feature, the address form doesn&apos;t auto-complete, and the order confirmation layout is completely different.&rdquo;
                  </p>
                </div>

                <div className="p-4 bg-bg-primary rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-accent-secondary" />
                    <span className="text-sm font-semibold">Freelancer&apos;s Response</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    &ldquo;I followed the Figma designs closely. The saved card feature was not in the original scope. The address auto-complete requires a Google Maps API key which the client never provided. The confirmation page was adjusted based on client&apos;s feedback email.&rdquo;
                  </p>
                </div>
              </div>
            </Card>
          </StageWrapper>
        )}

        {/* STAGE 4: Evidence Submitted */}
        {currentStage === 4 && (
          <StageWrapper key="s4">
            <Card className="glass-elevated p-6 rounded-xl">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-accent-secondary" />
                Evidence Submitted
              </h2>

              <div className="space-y-3">
                {[
                  { name: "checkout-comparison.png", type: "Image", by: "Arjun Mehta", desc: "Side-by-side Figma vs actual screenshots" },
                  { name: "figma-designs-v2.pdf", type: "PDF", by: "Arjun Mehta", desc: "Original Figma export of checkout flow" },
                  { name: "client-email-march2.pdf", type: "PDF", by: "Priya Sharma", desc: "Email from client requesting confirmation page changes" },
                  { name: "contract-scope.pdf", type: "PDF", by: "Priya Sharma", desc: "Original contract scope document — no saved card feature mentioned" },
                ].map((ev, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg border border-border"
                  >
                    <div className="w-9 h-9 rounded-lg bg-bg-elevated flex items-center justify-center flex-shrink-0">
                      {ev.type === "Image" ? (
                        <ImageIcon className="w-4 h-4 text-text-secondary" />
                      ) : (
                        <FileText className="w-4 h-4 text-text-secondary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ev.name}</p>
                      <p className="text-xs text-text-secondary">{ev.desc}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{ev.by.split(" ")[0]}</Badge>
                  </motion.div>
                ))}
              </div>
            </Card>
          </StageWrapper>
        )}

        {/* STAGE 5: AI Analyzing */}
        {currentStage === 5 && (
          <StageWrapper key="s5">
            <Card className="glass-elevated p-10 rounded-xl text-center">
              {isAnalyzing ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 mx-auto rounded-full border-4 border-accent-primary/20 border-t-accent-primary"
                  />
                  <div>
                    <h2 className="font-display text-xl font-bold mb-2">AI Mediator Analyzing</h2>
                    <p className="text-text-secondary text-sm">
                      Reviewing contract terms, statements, and evidence...
                    </p>
                  </div>
                  <div className="max-w-sm mx-auto space-y-2">
                    {["Parsing contract scope...", "Comparing evidence files...", "Cross-referencing statements...", "Generating verdict..."].map(
                      (step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.7 }}
                          className="flex items-center gap-2 text-sm text-text-secondary"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent-success" />
                          {step}
                        </motion.div>
                      )
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <Brain className="w-14 h-14 text-accent-primary mx-auto" />
                  <h2 className="font-display text-xl font-bold">Ready for AI Analysis</h2>
                  <p className="text-text-secondary text-sm max-w-md mx-auto">
                    Both parties have submitted statements and evidence. Click below to trigger the AI mediator.
                  </p>
                  <Button onClick={handleNext} size="lg" className="bg-accent-primary hover:bg-accent-primary/90">
                    <Brain className="w-4 h-4 mr-2" />
                    Run AI Analysis
                  </Button>
                </div>
              )}
            </Card>
          </StageWrapper>
        )}

        {/* STAGE 6: Verdict */}
        {currentStage === 6 && showVerdict && (
          <StageWrapper key="s6">
            {/* Full verdict panel */}
            <Card className="glass-elevated rounded-2xl overflow-hidden">
              {/* Verdict header */}
              <div className="bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Scale className="w-6 h-6 text-accent-primary" />
                  <h3 className="font-display text-xl font-bold">AI Verdict</h3>
                  <Badge className="bg-accent-success/10 text-accent-success ml-auto">
                    {demoVerdict.confidenceScore * 100}% Confidence
                  </Badge>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Confidence + Fund Split */}
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="flex justify-center">
                    <ConfidenceMeter score={demoVerdict.confidenceScore} />
                  </div>

                  <div className="lg:col-span-2">
                    <h4 className="text-sm font-medium text-text-secondary mb-3">
                      Escrow Split • ₹{escrowData.held.toLocaleString("en-IN")} remaining
                    </h4>
                    <div className="relative h-10 rounded-lg overflow-hidden bg-bg-primary border border-border">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${demoVerdict.freelancerReleasePercent}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center"
                      >
                        <span className="text-xs font-mono font-medium text-white">
                          {demoVerdict.freelancerReleasePercent}%
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${demoVerdict.clientRefundPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-400 flex items-center justify-center"
                      >
                        <span className="text-xs font-mono font-medium text-white">
                          {demoVerdict.clientRefundPercent}%
                        </span>
                      </motion.div>
                    </div>
                    <div className="flex justify-between mt-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span className="text-text-secondary">Freelancer</span>
                        <span className="font-mono font-semibold text-green-700">₹{freelancerAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-red-700">₹{clientRefund.toLocaleString("en-IN")}</span>
                        <span className="text-text-secondary">Client Refund</span>
                        <div className="w-3 h-3 rounded bg-red-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fault bar */}
                <div className="p-4 bg-bg-primary rounded-xl border border-border">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Fault Assessment</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      Client: <span className="font-mono font-semibold text-red-600">{demoVerdict.clientFaultPercent}%</span>
                    </span>
                    <div className="flex-1 h-2.5 bg-bg-elevated rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${demoVerdict.freelancerFaultPercent}%` }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                    <span className="text-sm">
                      Freelancer: <span className="font-mono font-semibold text-amber-600">{demoVerdict.freelancerFaultPercent}%</span>
                    </span>
                  </div>
                </div>

                {/* Reasoning sections */}
                <div className="space-y-4">
                  <ReasoningBlock icon={Scale} label="Reasoning" text={demoVerdict.reasoning} />
                  <ReasoningBlock icon={FileText} label="Contract Analysis" text={demoVerdict.contractAnalysis} />
                  <ReasoningBlock icon={Upload} label="Evidence Summary" text={demoVerdict.evidenceSummary} />
                </div>

                <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border">
                  <span>Model: <span className="font-mono">{demoVerdict.modelUsed}</span></span>
                  <span>Generated: 08 Apr 2026</span>
                </div>

                {/* Accept / Escalate */}
                {!verdictAccepted && (
                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleNext} className="flex-1 bg-accent-success hover:bg-accent-success/90 text-white">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept Verdict
                    </Button>
                    <Button variant="outline" className="flex-1 border-accent-danger text-accent-danger hover:bg-red-50">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Escalate to Human
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </StageWrapper>
        )}

        {/* STAGE 7: Resolved */}
        {currentStage === 7 && (
          <StageWrapper key="s7">
            <Card className="glass-elevated p-8 rounded-xl text-center glow-success">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="w-16 h-16 text-accent-success mx-auto mb-4" />
              </motion.div>
              <h2 className="font-display text-2xl font-bold mb-2">Dispute Resolved</h2>
              <p className="text-text-secondary mb-6">Funds have been distributed based on the AI verdict</p>

              <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-6">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <User className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-sm text-text-secondary">Freelancer (Priya)</p>
                  <p className="text-xl font-display font-bold font-mono text-green-700">
                    ₹{freelancerAmount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Released to wallet</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <User className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <p className="text-sm text-text-secondary">Client (Arjun)</p>
                  <p className="text-xl font-display font-bold font-mono text-red-700">
                    ₹{clientRefund.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-red-600 mt-1">Refunded to wallet</p>
                </div>
              </div>

              <Button onClick={handleReset} variant="outline" className="border-border">
                <Play className="w-4 h-4 mr-2" />
                Replay Demo
              </Button>
            </Card>
          </StageWrapper>
        )}
      </AnimatePresence>

      {/* ─── Next Button ─── */}
      {currentStage < stages.length - 1 && currentStage !== 5 && !(currentStage === 6 && !verdictAccepted) && (
        <div className="flex justify-end">
          <Button onClick={handleNext} size="lg" className="bg-accent-primary hover:bg-accent-primary/90">
            Next Step
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Helper Components ─── */

function StageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-3 bg-bg-primary rounded-lg border border-border">
      <Icon className="w-4 h-4 text-text-secondary mb-1" />
      <p className="font-medium text-sm">{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  );
}

function ReasoningBlock({ icon: Icon, label, text }: { icon: any; label: string; text: string }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label}
      </h4>
      <p className="text-sm text-text-primary leading-relaxed bg-bg-primary rounded-lg p-4 border border-border">
        {text}
      </p>
    </div>
  );
}
