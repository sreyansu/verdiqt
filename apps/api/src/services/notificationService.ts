import { Resend } from "resend";
import mongoose from "mongoose";
import { Notification } from "../models/Notification";
import { getIO } from "../lib/socket";

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_123" || apiKey.trim() === "") {
    return null;
  }
  if (!resendClient) {
    try {
      resendClient = new Resend(apiKey);
    } catch (err) {
      console.warn("[Resend] Failed to initialize Resend client:", err);
      return null;
    }
  }
  return resendClient;
}

const FROM_EMAIL = "Verdiqt <notifications@verdiqt.app>";

export interface CreateNotificationParams {
  recipientId: string | mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
  targetRoute: string;
}

/**
 * Persists an in-app notification to MongoDB and emits via Socket.IO
 */
export async function createInAppNotification(params: CreateNotificationParams) {
  try {
    const notification = await Notification.create({
      recipient: params.recipientId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedEntity: params.relatedEntity,
      targetRoute: params.targetRoute,
    });

    try {
      const io = getIO();
      if (io) {
        const payload = notification.toJSON();
        io.to(`user:${params.recipientId.toString()}`).emit("notification:new", payload);
      }
    } catch (sockErr) {
      // Socket not ready or caller outside HTTP context
    }

    return notification;
  } catch (error) {
    console.error("Failed to create in-app notification:", error);
    return null;
  }
}

export async function sendDisputeRaisedEmail(
  toEmail: string,
  disputeTitle: string,
  contractTitle: string
) {
  const client = getResend();
  if (!client) {
    console.info("[Notification] RESEND_API_KEY not configured. Skipping dispute email to:", toEmail);
    return;
  }
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `⚖️ Dispute Raised: ${disputeTitle}`,
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F1E; color: #F1F5F9; padding: 32px; border-radius: 12px;">
          <h1 style="color: #6366F1; font-size: 24px;">Dispute Raised</h1>
          <p>A dispute has been raised for the contract: <strong>${contractTitle}</strong></p>
          <p><strong>Dispute:</strong> ${disputeTitle}</p>
          <p>Please log in to Verdiqt to review and submit your response.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/disputes" 
             style="display: inline-block; background: #6366F1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
            View Dispute
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send dispute raised email:", error);
  }
}

export async function sendVerdictReadyEmail(
  toEmail: string,
  disputeTitle: string,
  confidenceScore: number
) {
  const client = getResend();
  if (!client) {
    console.info("[Notification] RESEND_API_KEY not configured. Skipping verdict email to:", toEmail);
    return;
  }
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `✅ Verdict Ready: ${disputeTitle}`,
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F1E; color: #F1F5F9; padding: 32px; border-radius: 12px;">
          <h1 style="color: #10B981; font-size: 24px;">Verdict Ready</h1>
          <p>The AI mediator has analyzed the dispute: <strong>${disputeTitle}</strong></p>
          <p>Confidence Score: <strong>${(confidenceScore * 100).toFixed(0)}%</strong></p>
          <p>Log in to review the verdict and accept or escalate.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/disputes" 
             style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
            View Verdict
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send verdict ready email:", error);
  }
}

export async function sendEscrowReleasedEmail(
  toEmail: string,
  amount: number,
  contractTitle: string
) {
  const client = getResend();
  if (!client) {
    console.info("[Notification] RESEND_API_KEY not configured. Skipping escrow email to:", toEmail);
    return;
  }
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `💰 Funds Released: ${contractTitle}`,
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F1E; color: #F1F5F9; padding: 32px; border-radius: 12px;">
          <h1 style="color: #06B6D4; font-size: 24px;">Funds Released</h1>
          <p>₹${amount.toLocaleString("en-IN")} has been released to your wallet from contract: <strong>${contractTitle}</strong></p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/wallet" 
             style="display: inline-block; background: #06B6D4; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
            View Wallet
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send escrow released email:", error);
  }
}
