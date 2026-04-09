"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  User,
  ArrowLeft,
  Briefcase,
  FileText,
  AlertTriangle,
  IndianRupee,
  Filter,
  Loader2,
  Mail,
} from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

const roleConfig: Record<string, { label: string; className: string; icon: any }> = {
  CLIENT: {
    label: "Client",
    className: "bg-accent-primary/15 text-accent-primary",
    icon: Briefcase,
  },
  FREELANCER: {
    label: "Freelancer",
    className: "bg-accent-secondary/15 text-accent-secondary",
    icon: User,
  },
};

const filterOptions = [
  { value: "", label: "All Users" },
  { value: "CLIENT", label: "Clients" },
  { value: "FREELANCER", label: "Freelancers" },
];

export default function AdminUsersPage() {
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (dbUser && dbUser.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    async function fetchUsers() {
      setLoading(true);
      try {
        const params = filter ? `?role=${filter}` : "";
        const { data } = await api.get(`/admin/users${params}`);
        setUsers(data.data || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [api, filter, dbUser, router]);

  const clientCount = users.filter((u) => u.role === "CLIENT").length;
  const freelancerCount = users.filter((u) => u.role === "FREELANCER").length;

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
            <Users className="w-6 h-6 text-accent-primary" />
            Platform Users
          </h1>
          <p className="text-text-secondary mt-1">
            {!loading && (
              <>
                {users.length} total users — {clientCount} clients, {freelancerCount} freelancers
              </>
            )}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-text-secondary" />
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
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

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <Card className="glass-elevated p-12 rounded-xl border-border text-center">
          <Users className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">No users found</h3>
          <p className="text-text-secondary">
            {filter ? `No ${filter.toLowerCase()}s registered yet.` : "No users on the platform yet."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map((user, i) => {
            const role = roleConfig[user.role] || roleConfig.CLIENT;
            const contractCount =
              user.role === "CLIENT"
                ? user._count?.clientContracts ?? 0
                : user._count?.freelancerContracts ?? 0;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="glass-elevated p-5 rounded-xl border-border hover:border-accent-primary/15 transition-all duration-200">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-accent-primary" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-sm truncate">
                          {user.name}
                        </h3>
                        <Badge className={`${role.className} text-xs`}>
                          {role.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-mono font-semibold text-text-primary">
                          {contractCount}
                        </p>
                        <p className="text-xs text-text-secondary">Contracts</p>
                      </div>
                      <div className="text-center">
                        <p className="font-mono font-semibold text-text-primary">
                          {user._count?.raisedDisputes ?? 0}
                        </p>
                        <p className="text-xs text-text-secondary">Disputes</p>
                      </div>
                      <div className="text-center">
                        <p className="font-mono font-semibold text-accent-success">
                          ₹{user.walletBalance?.toLocaleString("en-IN") ?? "0"}
                        </p>
                        <p className="text-xs text-text-secondary">Balance</p>
                      </div>
                    </div>

                    {/* Joined */}
                    <div className="hidden lg:block text-right">
                      <p className="text-xs text-text-secondary">Joined</p>
                      <p className="text-xs font-medium text-text-primary">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
