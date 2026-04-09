"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Scale,
  Shield,
  Zap,
  Brain,
  ArrowRight,
  CheckCircle2,
  FileText,
  Lock,
  Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileText,
    title: "Contract Creation",
    description:
      "Create milestone-based contracts with clear deliverables and payment schedules.",
    color: "text-accent-primary",
    bg: "bg-accent-primary/10",
  },
  {
    icon: Lock,
    title: "Escrow Lock",
    description:
      "Funds are locked in escrow and released automatically on milestone approval.",
    color: "text-accent-secondary",
    bg: "bg-accent-secondary/10",
  },
  {
    icon: Brain,
    title: "AI Mediation",
    description:
      "Advanced AI analyzes contracts, evidence, and statements to deliver fair verdicts.",
    color: "text-accent-warning",
    bg: "bg-accent-warning/10",
  },
  {
    icon: Gavel,
    title: "Instant Verdict",
    description:
      "Get a structured verdict with reasoning, confidence score, and automatic fund distribution.",
    color: "text-accent-success",
    bg: "bg-accent-success/10",
  },
];

const steps = [
  {
    number: "01",
    title: "Create a Contract",
    description: "Define milestones, set payment amounts, and invite the other party.",
  },
  {
    number: "02",
    title: "Raise a Dispute",
    description: "If deliverables are contested, submit your statement and evidence.",
  },
  {
    number: "03",
    title: "AI Resolves It",
    description: "Our AI mediator analyzes everything and delivers a fair, instant verdict.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen animated-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-primary flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">
              Verdiqt
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-text-secondary hover:text-text-primary">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-accent-primary hover:bg-accent-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <Shield className="w-4 h-4 text-accent-primary" />
              <span className="text-sm text-text-secondary">
                Freelance Escrow & AI Arbitration Platform
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="text-text-primary">Fair. Fast.</span>
              <br />
              <span className="gradient-text">AI-Powered</span>
              <br />
              <span className="text-text-primary">Dispute Resolution.</span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
              Protect your freelance payments with smart escrow. When disputes
              arise, let AI analyze the evidence and deliver instant, fair
              verdicts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-accent-primary hover:bg-accent-primary/90 text-lg px-8 py-6 glow-primary"
                >
                  Join as Client
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-bg-elevated text-lg px-8 py-6"
                >
                  Join as Freelancer
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Floating elements */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-40 left-10 w-20 h-20 rounded-2xl bg-accent-primary/5 border border-accent-primary/10 hidden xl:block"
          />
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-60 right-16 w-16 h-16 rounded-full bg-accent-secondary/5 border border-accent-secondary/10 hidden xl:block"
          />
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need for <span className="gradient-text">Safe Freelancing</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              From contract creation to AI-powered dispute resolution — all in one platform.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-elevated rounded-2xl p-6 hover:border-accent-primary/30 transition-all duration-300 group"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
          </motion.div>

          <div className="space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-elevated rounded-2xl p-8 flex items-start gap-6"
              >
                <div className="text-4xl font-display font-bold gradient-text flex-shrink-0">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl mb-2">
                    {step.title}
                  </h3>
                  <p className="text-text-secondary">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-elevated rounded-3xl p-12 glow-primary"
          >
            <Zap className="w-12 h-12 text-accent-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Ready to Protect Your Work?
            </h2>
            <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
              Join thousands of freelancers and clients who trust Verdiqt for
              fair, transparent dispute resolution.
            </p>
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-accent-primary hover:bg-accent-primary/90 text-lg px-10 py-6"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-accent-primary" />
            <span className="text-sm text-text-secondary">
              © 2026 Verdiqt. Freelance Escrow & AI Arbitration Platform.
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <CheckCircle2 className="w-4 h-4 text-accent-success" />
            <span>100% Free Tier</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
