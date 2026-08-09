import { EscrowWallet } from "../models/EscrowWallet";
import { Contract } from "../models/Contract";
import { User } from "../models/User";

// Mock escrow operations — in production, these interface with a payment gateway

export async function createEscrowWallet(contractId: string, totalAmount: number) {
  return EscrowWallet.create({
    contractId,
    totalAmount,
    heldAmount: totalAmount,
  });
}

export async function freezeEscrow(contractId: string) {
  return EscrowWallet.findOneAndUpdate(
    { contractId },
    { status: "FROZEN" },
    { new: true }
  );
}

export async function executeEscrowSplit(
  contractId: string,
  freelancerPercent: number,
  clientRefundPercent: number
) {
  const wallet: any = await EscrowWallet.findOne({ contractId }).populate("contract");

  if (!wallet) throw new Error("Escrow wallet not found");

  const freelancerAmount = (wallet.heldAmount * freelancerPercent) / 100;
  const clientRefund = (wallet.heldAmount * clientRefundPercent) / 100;

  // Update wallet
  await EscrowWallet.findByIdAndUpdate(wallet._id, {
    heldAmount: 0,
    $inc: {
      releasedToFreelancer: freelancerAmount,
      refundedToClient: clientRefund,
    },
    status: "FULLY_RELEASED",
  });

  // Update user balances
  if (wallet.contract?.freelancerId) {
    await User.findByIdAndUpdate(wallet.contract.freelancerId, {
      $inc: { walletBalance: freelancerAmount },
    });
  }

  if (wallet.contract?.clientId) {
    await User.findByIdAndUpdate(wallet.contract.clientId, {
      $inc: { walletBalance: clientRefund },
    });
  }

  return { freelancerAmount, clientRefund };
}

