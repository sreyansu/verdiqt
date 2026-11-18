"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  FileText,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Shield,
  Loader2,
} from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";
import { getSocket } from "@/lib/socket";

interface NotificationItem {
  id: string;
  _id?: string;
  type: string;
  title: string;
  message: string;
  targetRoute: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell({ className = "" }: { className?: string }) {
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!dbUser) return;
    try {
      const { data } = await api.get("/notifications?limit=25");
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // Silently catch in background poll
    }
  }, [api, dbUser]);

  useEffect(() => {
    fetchNotifications();

    // Socket.io realtime listener
    const socket = getSocket();
    const userId = dbUser?._id || dbUser?.id;
    if (userId) {
      socket.emit("joinUser", userId);

      const handleNewNotification = (notification: NotificationItem) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((c) => c + 1);
      };

      socket.on("notification:new", handleNewNotification);

      return () => {
        socket.off("notification:new", handleNewNotification);
        socket.emit("leaveUser", userId);
      };
    }
  }, [dbUser, fetchNotifications]);

  // Periodic fallback refresh (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, targetRoute?: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => ((n.id === id || n._id === id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }

    if (targetRoute) {
      setIsOpen(false);
      router.push(targetRoute);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getIconForType = (type: string) => {
    if (type.includes("CONTRACT")) return <FileText className="w-4 h-4 text-accent-primary" />;
    if (type.includes("DISPUTE") || type.includes("CHALLENGE")) return <Scale className="w-4 h-4 text-accent-warning" />;
    if (type.includes("VERDICT") || type.includes("RESOLVED")) return <CheckCircle2 className="w-4 h-4 text-accent-success" />;
    if (type.includes("MILESTONE")) return <Clock className="w-4 h-4 text-indigo-500" />;
    return <Sparkles className="w-4 h-4 text-accent-primary" />;
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date().getTime();
      const time = new Date(dateStr).getTime();
      const diffMin = Math.floor((now - time) / 60000);
      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="p-2 rounded-lg hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors relative focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-accent-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in-75 duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-border flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-text-primary">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs text-accent-primary hover:underline font-medium flex items-center gap-1 disabled:opacity-50"
              >
                {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-text-primary">No notifications yet</p>
                <p className="text-xs text-text-secondary">
                  Updates on your contracts, milestones, and disputes will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const notifId = n.id || n._id || "";
                return (
                  <div
                    key={notifId}
                    onClick={() => handleMarkAsRead(notifId, n.targetRoute)}
                    className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                      !n.isRead ? "bg-accent-primary/[0.03]" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                      {getIconForType(n.type)}
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-semibold truncate ${!n.isRead ? "text-text-primary font-bold" : "text-slate-700"}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-text-secondary whitespace-nowrap flex-shrink-0">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-accent-primary flex-shrink-0 mt-2 absolute right-3" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

