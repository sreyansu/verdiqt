"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Wallet, ArrowDownLeft, ArrowUpRight, Lock } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export default function WalletPage() {
  const { dbUser } = useUserStore();
  const balance = dbUser?.walletBalance || 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Wallet</h1>
        <p className="text-text-secondary mt-1">Your escrow wallet overview</p>
      </div>

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-elevated p-8 rounded-2xl border-border glow-primary">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Available Balance</p>
              <p className="text-3xl font-display font-bold font-mono">
                ₹{balance.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Transaction types */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="glass-elevated p-5 rounded-xl border-border">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-5 h-5 text-accent-warning" />
            <span className="text-sm font-medium">Held in Escrow</span>
          </div>
          <p className="text-xl font-display font-bold font-mono text-accent-warning">
            ₹0
          </p>
          <p className="text-xs text-text-secondary mt-1">Locked in active contracts</p>
        </Card>

        <Card className="glass-elevated p-5 rounded-xl border-border">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDownLeft className="w-5 h-5 text-accent-success" />
            <span className="text-sm font-medium">Total Received</span>
          </div>
          <p className="text-xl font-display font-bold font-mono text-accent-success">
            ₹0
          </p>
          <p className="text-xs text-text-secondary mt-1">From released escrows</p>
        </Card>

        <Card className="glass-elevated p-5 rounded-xl border-border">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpRight className="w-5 h-5 text-accent-danger" />
            <span className="text-sm font-medium">Total Spent</span>
          </div>
          <p className="text-xl font-display font-bold font-mono text-accent-danger">
            ₹0
          </p>
          <p className="text-xs text-text-secondary mt-1">Deposited into escrows</p>
        </Card>
      </div>

      {/* Transaction History placeholder */}
      <Card className="glass-elevated p-8 rounded-xl border-border text-center">
        <Wallet className="w-10 h-10 text-text-secondary mx-auto mb-3" />
        <h3 className="font-display font-semibold mb-1">No transactions yet</h3>
        <p className="text-sm text-text-secondary">
          Transactions will appear here when contracts are activated and escrow funds are moved.
        </p>
      </Card>
    </div>
  );
}
