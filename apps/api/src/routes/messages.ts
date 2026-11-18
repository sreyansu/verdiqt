import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Conversation, Message, Contract, User } from "../models";
import { requireAuthWithUser } from "../middleware/firebaseAuth";
import { getIO } from "../lib/socket";
import { createInAppNotification } from "../services/notificationService";

const router: any = Router();

// GET /api/messages/conversations — List all active conversations for the authenticated user
router.get(
  "/conversations",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const userId = user._id || user.id;

      const conversations = await Conversation.find({
        participantIds: userId,
      })
        .populate("contract", "title status totalAmount startDate endDate clientId freelancerId")
        .populate("participants", "name displayName avatarUrl role email")
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .lean();

      // Format with unread count for current user
      const formatted = await Promise.all(
        conversations.map(async (conv: any) => {
          const unreadCount = await Message.countDocuments({
            conversationId: conv._id,
            senderId: { $ne: userId },
            readByIds: { $ne: userId },
          });

          return {
            ...conv,
            id: conv._id.toString(),
            unreadCount,
          };
        })
      );

      res.json({ success: true, data: formatted });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/messages/contracts/:contractId — Get or automatically bootstrap conversation for a contract
router.get(
  "/contracts/:contractId",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const userId = (user._id || user.id).toString();
      const contractId = String(req.params.contractId);

      if (!mongoose.Types.ObjectId.isValid(contractId)) {
        res.status(400).json({ success: false, error: "Invalid contract ID" });
        return;
      }

      const contract: any = await Contract.findById(contractId);
      if (!contract) {
        res.status(404).json({ success: false, error: "Contract not found" });
        return;
      }

      const isClient = contract.clientId?.toString() === userId;
      const isFreelancer = contract.freelancerId?.toString() === userId;
      const isAdmin = user.role === "ADMIN";

      if (!isClient && !isFreelancer && !isAdmin) {
        res.status(403).json({ success: false, error: "Access denied. Only contract participants may access this conversation." });
        return;
      }

      // Upsert unique conversation for this contract
      let conversation = await Conversation.findOne({ contractId: contract._id })
        .populate("contract", "title status totalAmount startDate endDate clientId freelancerId")
        .populate("participants", "name displayName avatarUrl role email");

      if (!conversation) {
        conversation = await Conversation.create({
          contractId: contract._id,
          participantIds: [contract.clientId, contract.freelancerId],
        });

        conversation = await Conversation.findById(conversation._id)
          .populate("contract", "title status totalAmount startDate endDate clientId freelancerId")
          .populate("participants", "name displayName avatarUrl role email");
      }

      res.json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/messages/conversations/:conversationId/messages — Get message history
router.get(
  "/conversations/:conversationId/messages",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const userId = (user._id || user.id).toString();
      const conversationId = String(req.params.conversationId);
      const limit = parseInt(String(req.query.limit || "50"), 10);
      const before = req.query.before as string | undefined;

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        res.status(400).json({ success: false, error: "Invalid conversation ID" });
        return;
      }

      const conversation: any = await Conversation.findById(conversationId);
      if (!conversation) {
        res.status(404).json({ success: false, error: "Conversation not found" });
        return;
      }

      const isParticipant = conversation.participantIds.some((p: any) => p.toString() === userId);
      const isAdmin = user.role === "ADMIN";

      if (!isParticipant && !isAdmin) {
        res.status(403).json({ success: false, error: "Not authorized to view messages in this conversation" });
        return;
      }

      const query: any = { conversationId: conversation._id };
      if (before && mongoose.Types.ObjectId.isValid(before)) {
        query._id = { $lt: new mongoose.Types.ObjectId(before) };
      }

      const messages = await Message.find(query)
        .populate("sender", "name displayName avatarUrl role")
        .sort({ createdAt: 1 })
        .limit(limit);

      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/messages/conversations/:conversationId/messages — Send new message
router.post(
  "/conversations/:conversationId/messages",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const userId = user._id || user.id;
      const conversationId = String(req.params.conversationId);
      const { content, encryption, attachments } = req.body;

      if (!content || typeof content !== "string" || !content.trim()) {
        res.status(400).json({ success: false, error: "Message content cannot be empty" });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        res.status(400).json({ success: false, error: "Invalid conversation ID" });
        return;
      }

      const conversation: any = await Conversation.findById(conversationId).populate("contract");
      if (!conversation) {
        res.status(404).json({ success: false, error: "Conversation not found" });
        return;
      }

      const isParticipant = conversation.participantIds.some((p: any) => p.toString() === userId.toString());
      if (!isParticipant && user.role !== "ADMIN") {
        res.status(403).json({ success: false, error: "Not authorized to post to this conversation" });
        return;
      }

      // Create message document
      const message = await Message.create({
        conversationId: conversation._id,
        senderId: userId,
        content: content.trim(),
        encryption: encryption || {
          algorithm: "AES-GCM-256",
          iv: "",
          keyId: "v1",
          isEncrypted: Boolean(encryption?.isEncrypted),
        },
        readByIds: [userId],
        attachments: Array.isArray(attachments) ? attachments : [],
      });

      const populatedMessage = await Message.findById(message._id).populate("sender", "name displayName avatarUrl role");

      // Update conversation metadata
      const previewText = encryption?.isEncrypted ? "🔒 Encrypted Message" : content.substring(0, 80);
      await Conversation.findByIdAndUpdate(conversation._id, {
        $set: {
          lastMessageAt: new Date(),
          lastMessagePreview: previewText,
        },
      });

      // Realtime notification via Socket.IO
      try {
        const io = getIO();
        if (io) {
          // Emit to conversation room
          io.to(`conversation:${conversationId}`).emit("message:new", populatedMessage);

          // Find recipient and emit to their private notification channel
          const recipientId = conversation.participantIds.find((p: any) => p.toString() !== userId.toString());
          if (recipientId) {
            io.to(`user:${recipientId.toString()}`).emit("message:received", {
              conversationId,
              message: populatedMessage,
              contractTitle: conversation.contract?.title || "Contract Message",
            });

            // Also create in-app notification
            createInAppNotification({
              recipientId,
              type: "NEW_MESSAGE",
              title: `New message from ${user.name}`,
              message: previewText,
              relatedEntity: { entityType: "Conversation", entityId: conversation._id.toString() },
              targetRoute: `/messages?conversationId=${conversation._id.toString()}`,
            }).catch(console.error);
          }
        }
      } catch (socketErr) {
        console.warn("[Socket Warning] Failed to emit message event:", socketErr);
      }

      res.status(201).json({ success: true, data: populatedMessage });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/messages/conversations/:conversationId/read — Mark conversation as read
router.post(
  "/conversations/:conversationId/read",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const userId = user._id || user.id;
      const conversationId = String(req.params.conversationId);

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        res.status(400).json({ success: false, error: "Invalid conversation ID" });
        return;
      }

      await Message.updateMany(
        {
          conversationId,
          senderId: { $ne: userId },
          readByIds: { $ne: userId },
        },
        {
          $addToSet: { readByIds: userId },
        }
      );

      try {
        const io = getIO();
        if (io) {
          io.to(`conversation:${conversationId}`).emit("message:read", {
            conversationId,
            readByUserId: userId.toString(),
          });
        }
      } catch (sockErr) {
        // Socket offline
      }

      res.json({ success: true, message: "Marked as read" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
