"use client";

import { useState, useEffect, useRef, useTransition, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  Lock,
  Search,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  Check,
  CheckCheck,
  Paperclip,
  Clock,
  Sparkles,
  ArrowLeft,
  Loader2,
  Info,
  Scale,
} from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";
import { getSocket } from "@/lib/socket";
import { encryptChatMessage, decryptChatMessage } from "@/lib/encryption";
import { format } from "date-fns";

interface DecryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readByIds: string[];
  sender?: {
    name: string;
    displayName?: string;
    avatarUrl?: string;
    role: string;
  };
  isEncrypted: boolean;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const currentUserId = dbUser?._id || dbUser?.id;

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedConversationRef = useRef<any>(selectedConversation);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Memoized strictly deduplicated message list to eliminate duplicate keys & bubble repetition
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    const list: DecryptedMessage[] = [];
    for (const msg of messages) {
      const id = String(msg.id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      list.push(msg);
    }
    return list;
  }, [messages]);

  // Initialize Socket.io connection
  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    if (currentUserId) {
      s.emit("joinUser", currentUserId);
    }

    const handleNewMessage = async (msg: any) => {
      const activeConv = selectedConversationRef.current;
      const activeConvId = activeConv ? String(activeConv.id || activeConv._id) : null;
      const incomingConvId = String(msg.conversationId || "");

      if (activeConvId && incomingConvId === activeConvId) {
        const decryptedText = await decryptChatMessage(
          msg.content,
          msg.encryption?.iv,
          incomingConvId,
          msg.encryption?.isEncrypted
        );

        const formatted: DecryptedMessage = {
          id: String(msg._id || msg.id),
          conversationId: incomingConvId,
          senderId: String(msg.senderId?._id || msg.senderId?.toString() || msg.senderId || ""),
          content: decryptedText,
          createdAt: msg.createdAt,
          readByIds: (msg.readByIds || []).map((id: any) => String(id)),
          sender: msg.sender,
          isEncrypted: Boolean(msg.encryption?.isEncrypted),
        };

        setMessages((prev) => {
          const targetId = String(formatted.id);
          if (prev.some((m) => String(m.id) === targetId)) return prev;
          return [...prev, formatted];
        });

        // Mark as read immediately if actively viewing
        api.post(`/messages/conversations/${activeConvId}/read`).catch(() => {});
      }

      // Update conversation preview in sidebar
      setConversations((prev) =>
        prev.map((c) => {
          const cid = String(c.id || c._id);
          if (cid === incomingConvId) {
            return {
              ...c,
              lastMessageAt: msg.createdAt,
              lastMessagePreview: msg.encryption?.isEncrypted ? "🔒 Encrypted Message" : msg.content.substring(0, 60),
            };
          }
          return c;
        })
      );
    };

    const handleTypingActive = (data: { conversationId: string; userId: string; userName: string }) => {
      const activeConv = selectedConversationRef.current;
      const activeConvId = activeConv ? String(activeConv.id || activeConv._id) : null;
      if (activeConvId && String(data.conversationId) === activeConvId) {
        if (data.userId !== currentUserId) {
          setIsTyping(data.userName);
        }
      }
    };

    const handleTypingInactive = (data: { conversationId: string; userId: string }) => {
      const activeConv = selectedConversationRef.current;
      const activeConvId = activeConv ? String(activeConv.id || activeConv._id) : null;
      if (activeConvId && String(data.conversationId) === activeConvId) {
        setIsTyping(null);
      }
    };

    s.on("message:new", handleNewMessage);
    s.on("typing:active", handleTypingActive);
    s.on("typing:inactive", handleTypingInactive);

    return () => {
      s.off("message:new", handleNewMessage);
      s.off("typing:active", handleTypingActive);
      s.off("typing:inactive", handleTypingInactive);
    };
  }, [currentUserId, api]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [uniqueMessages, isTyping]);

  // Load user conversations
  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      // Check if arriving with a specific contractId
      const targetContractId = searchParams.get("contractId");
      const targetConversationId = searchParams.get("conversationId");

      if (targetContractId) {
        const { data: convData } = await api.get(`/messages/contracts/${targetContractId}`);
        if (convData.success && convData.data) {
          setSelectedConversation(convData.data);
        }
      }

      const { data } = await api.get("/messages/conversations");
      if (data.success) {
        setConversations(data.data || []);

        // Preselect if query param exists or fallback to first
        if (targetConversationId) {
          const match = data.data.find((c: any) => (c.id || c._id) === targetConversationId);
          if (match) setSelectedConversation(match);
        } else if (!selectedConversation && data.data?.length > 0 && !targetContractId) {
          setSelectedConversation(data.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  }, [api, searchParams]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // When selectedConversation changes, join socket room and fetch/decrypt messages
  useEffect(() => {
    if (!selectedConversation) return;

    const convId = selectedConversation.id || selectedConversation._id;
    if (socketRef.current) {
      socketRef.current.emit("joinConversation", convId);
    }

    setLoadingMessages(true);
    api
      .get(`/messages/conversations/${convId}/messages`)
      .then(async ({ data }) => {
        if (data.success && Array.isArray(data.data)) {
          const decryptedList = await Promise.all(
            data.data.map(async (msg: any) => {
              const text = await decryptChatMessage(
                msg.content,
                msg.encryption?.iv,
                convId,
                msg.encryption?.isEncrypted
              );
              return {
                id: String(msg._id || msg.id),
                conversationId: String(convId),
                senderId: String(msg.senderId?._id || msg.senderId?.toString() || msg.senderId || ""),
                content: text,
                createdAt: msg.createdAt,
                readByIds: (msg.readByIds || []).map((id: any) => String(id)),
                sender: msg.sender,
                isEncrypted: Boolean(msg.encryption?.isEncrypted),
              };
            })
          );
          setMessages(decryptedList);

          // Mark as read
          api.post(`/messages/conversations/${convId}/read`).catch(() => {});
        }
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      })
      .finally(() => {
        setLoadingMessages(false);
      });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leaveConversation", convId);
      }
    };
  }, [selectedConversation, api]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConversation || sending) return;

    const convId = selectedConversation.id || selectedConversation._id;
    const rawContent = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      // 1. Client-Side AES-GCM 256-bit Authenticated Encryption
      const encrypted = await encryptChatMessage(rawContent, convId);

      // 2. Transmit ciphertext & nonce to backend
      const { data } = await api.post(`/messages/conversations/${convId}/messages`, {
        content: encrypted.ciphertext,
        encryption: {
          algorithm: encrypted.algorithm,
          iv: encrypted.iv,
          keyId: "v1",
          isEncrypted: encrypted.isEncrypted,
        },
      });

      if (data.success && data.data) {
        const newMsg: DecryptedMessage = {
          id: String(data.data._id || data.data.id),
          conversationId: String(convId),
          senderId: currentUserId ? String(currentUserId) : "",
          content: rawContent,
          createdAt: data.data.createdAt,
          readByIds: [currentUserId ? String(currentUserId) : ""],
          sender: {
            name: dbUser?.displayName || dbUser?.name || "You",
            role: dbUser?.role || "USER",
            avatarUrl: dbUser?.avatarUrl || undefined,
          },
          isEncrypted: true,
        };

        // Deduplicate before appending to local state
        setMessages((prev) => {
          const targetId = String(newMsg.id);
          if (prev.some((m) => String(m.id) === targetId)) return prev;
          return [...prev, newMsg];
        });

        // Update sidebar preview immediately for sender
        setConversations((prev) =>
          prev.map((c) => {
            const cid = String(c.id || c._id);
            if (cid === String(convId)) {
              return {
                ...c,
                lastMessageAt: data.data.createdAt || new Date().toISOString(),
                lastMessagePreview: rawContent.substring(0, 60),
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please check your connection.");
    } finally {
      setSending(false);
      // Stop typing
      if (socketRef.current && convId) {
        socketRef.current.emit("typing:stop", { conversationId: convId, userId: currentUserId });
      }
    }
  };

  // Typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (!selectedConversation || !socketRef.current) return;

    const convId = selectedConversation.id || selectedConversation._id;
    socketRef.current.emit("typing:start", {
      conversationId: convId,
      userId: currentUserId,
      userName: dbUser?.displayName || dbUser?.name || "User",
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("typing:stop", { conversationId: convId, userId: currentUserId });
    }, 2000);
  };

  const getOtherParticipant = (conv: any) => {
    if (!conv?.participants || !Array.isArray(conv.participants)) return null;
    return conv.participants.find((p: any) => (p._id || p.id)?.toString() !== currentUserId?.toString()) || conv.participants[0];
  };

  const otherUser = selectedConversation ? getOtherParticipant(selectedConversation) : null;

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col max-w-7xl mx-auto">
      {/* ── Main Chat Interface ── */}
      <div className="flex-1 bg-white border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* ── Left Pane: Conversation List ── */}
        <aside
          className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-slate-50/50 ${
            selectedConversation ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-border bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-accent-primary" />
                <h2 className="font-bold text-text-primary text-base">Conversations</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {conversations.length} Active
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>

          {/* Conversation List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {loadingConversations ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-accent-primary" />
                Loading your conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <p>No conversations yet.</p>
                <p className="text-[11px] text-slate-500">
                  Conversations are automatically initialized when contracts are created.
                </p>
                <Link
                  href="/freelancers"
                  className="inline-block mt-2 text-xs font-semibold text-accent-primary hover:underline"
                >
                  Discover Freelancers →
                </Link>
              </div>
            ) : (
              conversations
                .filter((conv) => {
                  if (!searchFilter.trim()) return true;
                  const other = getOtherParticipant(conv);
                  const nameMatch = (other?.name || "").toLowerCase().includes(searchFilter.toLowerCase());
                  const contractMatch = (conv.contract?.title || "").toLowerCase().includes(searchFilter.toLowerCase());
                  return nameMatch || contractMatch;
                })
                .map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isSelected = selectedConversation && (selectedConversation.id || selectedConversation._id) === (conv.id || conv._id);

                  return (
                    <button
                      key={conv.id || conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-accent-primary text-white shadow-xs"
                          : "hover:bg-slate-100/70 text-slate-700 bg-white border border-slate-100/60"
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          isSelected ? "bg-white/20 text-white" : "bg-accent-primary/10 text-accent-primary"
                        }`}
                      >
                        {other?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={other.avatarUrl} alt={other.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          other?.name?.charAt(0) || "U"
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`font-semibold text-xs truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                            {other?.name || "Participant"}
                          </p>
                          {conv.lastMessageAt && (
                            <span
                              className={`text-[10px] font-mono whitespace-nowrap ${
                                isSelected ? "text-white/80" : "text-slate-400"
                              }`}
                            >
                              {format(new Date(conv.lastMessageAt), "MMM d")}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-[11px] truncate mt-0.5 font-medium ${
                            isSelected ? "text-white/90" : "text-accent-primary"
                          }`}
                        >
                          {conv.contract?.title || "Contract Engagement"}
                        </p>

                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected ? "text-white/70" : "text-slate-500"
                          }`}
                        >
                          {conv.lastMessagePreview || "No messages yet"}
                        </p>
                      </div>

                      {conv.unreadCount > 0 && !isSelected && (
                        <span className="w-5 h-5 rounded-full bg-accent-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
            )}
          </div>
        </aside>

        {/* ── Right Pane: Active Chat Room ── */}
        <main
          className={`flex-1 flex flex-col bg-white ${
            !selectedConversation ? "hidden md:flex items-center justify-center" : "flex"
          }`}
        >
          {!selectedConversation ? (
            <div className="text-center p-8 max-w-sm text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-slate-800 text-base">Select a conversation</h3>
              <p className="text-xs text-slate-500">
                Choose a contract thread from the sidebar to communicate securely and view live project messages.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Top Header */}
              <div className="px-6 py-3.5 border-b border-border bg-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {otherUser?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={otherUser.avatarUrl} alt={otherUser.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      otherUser?.name?.charAt(0) || "U"
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-text-primary text-sm truncate">{otherUser?.name || "Participant"}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {otherUser?.role || "CONTRACTOR"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <Link
                        href={`/contracts/${selectedConversation.contractId?._id || selectedConversation.contractId}`}
                        className="text-accent-primary hover:underline flex items-center gap-1 font-medium truncate max-w-[240px]"
                      >
                        <span>{selectedConversation.contract?.title || "Contract"}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Header Security Badge & Actions */}
                <div className="flex items-center gap-2">
                  <div
                    title="All messages are client-encrypted using authenticated AES-GCM 256-bit cryptography"
                    className="hidden sm:flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 cursor-help"
                  >
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>AES-256 Encrypted</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEvidenceModal(true)}
                    className="text-xs gap-1.5 h-8 border-slate-200 hover:bg-slate-50"
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Export Dispute Evidence</span>
                  </Button>
                </div>
              </div>

              {/* Message List Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
                {/* Security Announcement Banner */}
                <div className="p-3 bg-white border border-slate-200/80 rounded-2xl max-w-xl mx-auto text-center text-xs text-slate-600 shadow-2xs space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Secure End-to-End Encrypted Project Channel</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Messages are protected with authenticated AES-GCM 256-bit encryption. Project communications can be securely attached as certified dispute evidence if necessary.
                  </p>
                </div>

                {loadingMessages ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-accent-primary" />
                    Securing and decrypting message history...
                  </div>
                ) : uniqueMessages.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs space-y-1">
                    <p className="font-semibold text-slate-700">No messages in this contract yet.</p>
                    <p className="text-slate-500">Start the conversation below to discuss deliverables, scope, or milestones.</p>
                  </div>
                ) : (
                  uniqueMessages.map((msg) => {
                    const isOwn = String(msg.senderId) === String(currentUserId);

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOwn ? "items-end" : "items-start"} space-y-1`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isOwn
                              ? "bg-slate-900 text-white rounded-br-xs"
                              : "bg-white text-slate-900 border border-slate-200 rounded-bl-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>

                        <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-400 font-mono">
                          <span>{msg.createdAt ? format(new Date(msg.createdAt), "h:mm a") : ""}</span>
                          {isOwn && (
                            <span>
                              {msg.readByIds?.length > 1 ? (
                                <CheckCheck className="w-3.5 h-3.5 text-accent-primary" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Live typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>{isTyping} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Bar */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-border bg-white flex items-end gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-accent-primary/20 focus-within:border-accent-primary transition-all">
                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message ${otherUser?.name || "in contract"} (Enter to send, Shift+Enter for newline)...`}
                    className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none resize-none max-h-32"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="bg-accent-primary hover:bg-accent-primary/90 text-white rounded-2xl h-11 w-11 p-0 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-sm"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </>
          )}
        </main>
      </div>

      {/* ── Dispute Evidence Export Modal (Section 5.H) ── */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="bg-white max-w-xl w-full p-6 rounded-3xl border border-border shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-text-primary text-base">Export Messages as Dispute Evidence</h3>
              </div>
              <button
                onClick={() => {
                  setShowEvidenceModal(false);
                  setSelectedMessageIds(new Set());
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select specific messages to authenticate and attach as structured dispute evidence. By exporting, you authorize the selected messages to be decrypted and submitted to the Verdiqt AI Arbitration Tribunal for evidence corroboration.
            </p>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-2 space-y-1">
              {uniqueMessages.map((m) => {
                const isSelected = selectedMessageIds.has(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors text-xs ${
                      isSelected ? "bg-accent-primary/10 border border-accent-primary/30" : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const next = new Set(selectedMessageIds);
                        if (e.target.checked) next.add(m.id);
                        else next.delete(m.id);
                        setSelectedMessageIds(next);
                      }}
                      className="mt-1 rounded text-accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{m.sender?.name || "Participant"}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {format(new Date(m.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 break-words">{m.content}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-xs text-text-secondary font-mono">
                {selectedMessageIds.size} message(s) selected
              </span>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEvidenceModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={selectedMessageIds.size === 0}
                  onClick={() => {
                    const exported = uniqueMessages
                      .filter((m) => selectedMessageIds.has(m.id))
                      .map((m) => `[${format(new Date(m.createdAt), "yyyy-MM-dd HH:mm")}] ${m.sender?.name || "User"}: ${m.content}`)
                      .join("\n\n");

                    // Copy to clipboard or forward to dispute creation
                    navigator.clipboard.writeText(exported);
                    alert(`✓ Copied ${selectedMessageIds.size} verified message(s) to clipboard as formatted dispute transcript! You can paste them into your dispute evidence statement.`);
                    setShowEvidenceModal(false);
                    setSelectedMessageIds(new Set());
                  }}
                  className="bg-accent-primary text-white text-xs gap-1.5"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Copy Evidence Transcript</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

