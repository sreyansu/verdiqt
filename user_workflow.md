# Verdiqt Complete User Workflow

This document outlines the step-by-step journey for users (both Clients and Freelancers) interacting with the Verdiqt platform.

## Phase 1: Authentication & Onboarding
1. **Landing Page:** A user visits Verdiqt's landing page and clicks either "Get Started Free" or "Sign In".
2. **Role Selection:** When signing up, a user chooses their role:
   - **Hire Freelancers (Client):** Wants to create projects and fundescrow.
   - **Secure My Work (Freelancer):** Wants to collaborate on projects and receive guaranteed payouts.
3. **Google Authentication:** The user clicks "Continue with Google" to seamlessly authorize via standard Google OAuth flow.
4. **Database Syncing:** Under the hood, Verdiqt instantly captures the user's role, name, email, and avatar, securely linking their session and giving them a starting demo wallet balance.

---

## Phase 2: Core Contract Lifecycle (The Happy Path)
1. **Contract Draft (Client):** 
   - A Client logs into their Dashboard and clicks **New Contract**.
   - They specify the Contract Title, Description, and invite the Freelancer by inserting their known Verdiqt email address.
   - **Milestones:** The Client breaks the project down into manageable deliverables (e.g., "Wireframes", "Frontend Code") assigning a specific timeframe and monetary value to each.
2. **Review & Dispatch:** The Client reviews the total escrow value required and dispatches the contract. This puts the contract in a `PENDING` state.
3. **Freelancer Acceptance:**
   - The specific Freelancer receives the contract on their Dashboard.
   - They review the milestones, deadlines, and total value.
   - If acceptable, they click "Accept". The state becomes `ACTIVE`.
4. **Escrow Funding:** The Client's wallet balance is locked into a smart escrow corresponding to the accepted contract value.

---

## Phase 3: Project Execution & Delivery
1. **Milestone Submissions:** As the Freelancer finishes work, they navigate to the Contract details page and upload **evidence** (code zip files, design PDFs, or hosting links) alongside comments to mark a specific milestone as "Needs Review".
2. **Client Approval:** 
   - The Client is alerted to review the milestone's evidence. 
   - If satisfied, the Client approves the milestone.
3. **Automated Payouts:** Upon Client approval, Verdiqt automatically parses the milestone's assigned value from the escrow vault and credits the Freelancer's wallet.
4. **Completion:** When the final milestone is approved, the entire contract concludes and is securely archived. A beautiful PDF export is available for tax/record purposes.

---

## Phase 4: Dispute Mediation Flow (The Conflict Path)
If a disagreement occurs regarding the quality of delivery or blown deadlines:
1. **Initiate Dispute:** Either party explicitly clicks "Raise Dispute" pointing to a specific contract/milestone.
2. **Evidence Gathering:** Both the Client and Freelancer submit their side of the story along with visual/textual evidence (chat logs, code snapshots).
3. **AI Triage Mediation:** Verdiqt's autonomous Mediation Engine steps in. It rapidly analyzes the originally agreed-upon scope vs. the submitted execution evidence.
4. **Neutral Verdict:** A definitive verdict is generated (e.g., 50/50 split, full refund to client, or payout awarded to freelancer).
5. **Resolution:** Funds are distributed according to the binding verdict, and the contract case is officially closed (`RESOLVED`).

---

## Phase 5: Wallet Dynamics 
- Located in the **Wallet** tab, users govern their finances.
- **Top-ups:** Clients can infuse funds into their balance (currently artificially provided upon signup).
- **Withdrawals:** Freelancers check their settled balance from completed contracts/disputes and can initiate payouts to their primary bank accounts.
