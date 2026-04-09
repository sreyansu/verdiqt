import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Verdiqt database...");

  // Clean existing data
  await prisma.verdict.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.escrowWallet.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  const client = await prisma.user.create({
    data: {
      clerkId: "demo-client-001",
      email: "client@demo.com",
      name: "Arjun Mehta",
      role: "CLIENT",
      walletBalance: 50000,
    },
  });

  const freelancer = await prisma.user.create({
    data: {
      clerkId: "demo-freelancer-001",
      email: "freelancer@demo.com",
      name: "Priya Sharma",
      role: "FREELANCER",
      walletBalance: 12000,
    },
  });

  console.log("✅ Users created:", client.name, freelancer.name);

  // Create contract: E-commerce Website Redesign
  const contract = await prisma.contract.create({
    data: {
      title: "E-commerce Website Redesign",
      description:
        "Complete redesign of existing e-commerce platform including homepage, product pages, checkout flow, and mobile responsiveness. Must follow provided Figma designs.",
      totalAmount: 35000,
      currency: "INR",
      status: "DISPUTED",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-04-15"),
      clientId: client.id,
      freelancerId: freelancer.id,
    },
  });

  // Create milestones
  await prisma.milestone.createMany({
    data: [
      {
        contractId: contract.id,
        title: "Homepage Redesign",
        description: "New homepage with hero section, featured products, and testimonials",
        amount: 12000,
        dueDate: new Date("2026-02-20"),
        status: "APPROVED",
        completedAt: new Date("2026-02-18"),
      },
      {
        contractId: contract.id,
        title: "Product & Category Pages",
        description: "Redesigned product listing, filters, and individual product pages",
        amount: 10000,
        dueDate: new Date("2026-03-10"),
        status: "APPROVED",
        completedAt: new Date("2026-03-08"),
      },
      {
        contractId: contract.id,
        title: "Checkout & Payment Flow",
        description: "New checkout UX with address, payment, and order confirmation",
        amount: 8000,
        dueDate: new Date("2026-03-25"),
        status: "DISPUTED",
      },
      {
        contractId: contract.id,
        title: "Mobile Responsiveness & QA",
        description: "Ensure all pages are fully responsive and pass cross-browser testing",
        amount: 5000,
        dueDate: new Date("2026-04-10"),
        status: "PENDING",
      },
    ],
  });

  // Create escrow wallet
  await prisma.escrowWallet.create({
    data: {
      contractId: contract.id,
      totalAmount: 35000,
      heldAmount: 13000, // 35000 - 12000 - 10000 already released
      releasedToFreelancer: 22000,
      refundedToClient: 0,
      status: "FROZEN",
    },
  });

  // Create dispute
  const dispute = await prisma.dispute.create({
    data: {
      contractId: contract.id,
      raisedById: client.id,
      title: "Checkout flow does not match agreed Figma designs",
      clientStatement:
        "The checkout flow delivered by the freelancer significantly deviates from the Figma designs we agreed upon. The payment page is missing the saved card feature, the address form doesn't auto-complete, and the order confirmation page layout is completely different from the mockup. I've shared comparison screenshots as evidence.",
      freelancerStatement:
        "I followed the Figma designs closely. The saved card feature was not in the original scope — it was mentioned casually in a call but never added to the contract. The address auto-complete requires a Google Maps API key which the client never provided. The order confirmation page was adjusted based on the client's own feedback email from March 2nd.",
      status: "VERDICT_READY",
    },
  });

  // Create pre-seeded verdict
  await prisma.verdict.create({
    data: {
      disputeId: dispute.id,
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
    },
  });

  console.log("✅ Demo contract, dispute, and verdict created");
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
