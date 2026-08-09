import "../env";
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import {
  User,
  Contract,
  Milestone,
  EscrowWallet,
  Dispute,
  Evidence,
  Verdict,
} from "../models";

async function main() {
  console.log("🌱 Seeding Verdiqt MongoDB database...");
  await connectDB();

  // Clean existing data
  await Verdict.deleteMany({});
  await Evidence.deleteMany({});
  await Dispute.deleteMany({});
  await EscrowWallet.deleteMany({});
  await Milestone.deleteMany({});
  await Contract.deleteMany({});
  await User.deleteMany({});

  // Create demo users
  const client = await User.create({
    clerkId: "demo-client-001",
    email: "client@demo.com",
    name: "Arjun Mehta",
    role: "CLIENT",
    walletBalance: 50000,
  });

  const freelancer = await User.create({
    clerkId: "demo-freelancer-001",
    email: "freelancer@demo.com",
    name: "Priya Sharma",
    role: "FREELANCER",
    walletBalance: 12000,
  });

  console.log("✅ Users created:", client.name, freelancer.name);

  // Create contract: E-commerce Website Redesign
  const contract = await Contract.create({
    title: "E-commerce Website Redesign",
    description:
      "Complete redesign of existing e-commerce platform including homepage, product pages, checkout flow, and mobile responsiveness. Must follow provided Figma designs.",
    totalAmount: 35000,
    currency: "INR",
    status: "DISPUTED",
    startDate: new Date("2026-02-01"),
    endDate: new Date("2026-04-15"),
    clientId: client._id,
    freelancerId: freelancer._id,
  });

  // Create milestones
  await Milestone.insertMany([
    {
      contractId: contract._id,
      title: "Homepage Redesign",
      description: "New homepage with hero section, featured products, and testimonials",
      amount: 12000,
      dueDate: new Date("2026-02-20"),
      status: "APPROVED",
      completedAt: new Date("2026-02-18"),
    },
    {
      contractId: contract._id,
      title: "Product & Category Pages",
      description: "Redesigned product listing, filters, and individual product pages",
      amount: 10000,
      dueDate: new Date("2026-03-10"),
      status: "APPROVED",
      completedAt: new Date("2026-03-08"),
    },
    {
      contractId: contract._id,
      title: "Checkout & Payment Flow",
      description: "New checkout UX with address, payment, and order confirmation",
      amount: 8000,
      dueDate: new Date("2026-03-25"),
      status: "DISPUTED",
    },
    {
      contractId: contract._id,
      title: "Mobile Responsiveness & QA",
      description: "Ensure all pages are fully responsive and pass cross-browser testing",
      amount: 5000,
      dueDate: new Date("2026-04-10"),
      status: "PENDING",
    },
  ]);

  // Create escrow wallet
  await EscrowWallet.create({
    contractId: contract._id,
    totalAmount: 35000,
    heldAmount: 13000, // 35000 - 12000 - 10000 already released
    releasedToFreelancer: 22000,
    refundedToClient: 0,
    status: "FROZEN",
  });

  // Create dispute
  const dispute = await Dispute.create({
    contractId: contract._id,
    raisedById: client._id,
    title: "Checkout flow does not match agreed Figma designs",
    clientStatement:
      "The checkout flow delivered by the freelancer significantly deviates from the Figma designs we agreed upon. The payment page is missing the saved card feature, the address form doesn't auto-complete, and the order confirmation page layout is completely different from the mockup. I've shared comparison screenshots as evidence.",
    freelancerStatement:
      "I followed the Figma designs closely. The saved card feature was not in the original scope — it was mentioned casually in a call but never added to the contract. The address auto-complete requires a Google Maps API key which the client never provided. The order confirmation page was adjusted based on the client's own feedback email from March 2nd.",
    status: "VERDICT_READY",
  });

  // Create pre-seeded verdict
  await Verdict.create({
    disputeId: dispute._id,
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
    legalBasis:
      "Quantum Meruit applied under Indian Contract Act 1872 Section 70 for delivered components; damages set-off under Section 73; award certified under Arbitration & Conciliation Act 1996 Section 31.",
    clientAdvocateReport:
      "The Client Advocate establishes material breach under ICA 1872 Section 37 and Section 73. The checkout flow failed to conform to the agreed Figma designs, and key functionality (saved cards, address autocomplete) was not delivered as expected, warranting restitution.",
    freelancerDefenseReport:
      "The Freelancer Defense asserts entitlement under ICA 1872 Section 70 (Quantum Meruit). Milestones 1 and 2 were accepted in good faith. The alleged defects stemmed from third-party API dependencies (Google Maps) unfulfilled by the client and unwritten scope additions.",
    forensicAuditReport:
      "Electronic records audit under BSA 2023 Section 65B confirms matching platform timestamps on Figma handoff assets and March 2nd email communications, corroborating partial milestone completion.",
    quantumMeruitCalculation: {
      totalEscrow: 45000,
      approvedValue: 20000,
      inReviewValue: 15000,
      pendingValue: 10000,
      baseCompletionPercent: 61,
      delayPenaltyPercent: 4,
      boundedFreelancerMin: 40,
      boundedFreelancerMax: 78,
      formulaExplanation:
        "Symbolic Quantum Meruit Baseline: Approved milestones ₹20,000 (44%), In-Review milestones ₹15,000 (33%). Liquidated delay deduction of 4% based on 8 cumulative overdue day(s). Bounded fair range: [40%, 78%] freelancer allocation.",
    },
    awardHash: "8a4f9b1c3e5d7a2b9f0e1c3d5a7b9e0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b",
    confidenceScore: 0.88,
    escalatedToHuman: false,
    modelUsed: "gemini-2.5-flash (Multi-Agent ODR)",
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
    await mongoose.disconnect();
  });
