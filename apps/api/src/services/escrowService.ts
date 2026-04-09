import { prisma } from "../lib/prisma";

// Mock escrow operations — in production, these would interface with a payment gateway

export async function createEscrowWallet(contractId: string, totalAmount: number) {
  return prisma.escrowWallet.create({
    data: {
      contractId,
      totalAmount,
      heldAmount: totalAmount,
    },
  });
}

export async function freezeEscrow(contractId: string) {
  return prisma.escrowWallet.update({
    where: { contractId },
    data: { status: "FROZEN" },
  });
}

export async function executeEscrowSplit(
  contractId: string,
  freelancerPercent: number,
  clientRefundPercent: number
) {
  const wallet = await prisma.escrowWallet.findUnique({
    where: { contractId },
    include: { contract: true },
  });

  if (!wallet) throw new Error("Escrow wallet not found");

  const freelancerAmount = (wallet.heldAmount * freelancerPercent) / 100;
  const clientRefund = (wallet.heldAmount * clientRefundPercent) / 100;

  // Update wallet
  await prisma.escrowWallet.update({
    where: { id: wallet.id },
    data: {
      heldAmount: 0,
      releasedToFreelancer: { increment: freelancerAmount },
      refundedToClient: { increment: clientRefund },
      status: "FULLY_RELEASED",
    },
  });

  // Update user balances
  await prisma.user.update({
    where: { id: wallet.contract.freelancerId },
    data: { walletBalance: { increment: freelancerAmount } },
  });

  await prisma.user.update({
    where: { id: wallet.contract.clientId },
    data: { walletBalance: { increment: clientRefund } },
  });

  return { freelancerAmount, clientRefund };
}
