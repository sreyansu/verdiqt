

## SYSTEM CONTEXT

You are an expert full-stack engineer and UI/UX designer building **Verdiqt** — a smart escrow and AI dispute mediation platform. This is a minor academic project (B.Tech Computer Science, Semester 6→7) that must be production-deployable on a **100% free tier** infrastructure while being polished enough for a panel presentation.

Build the system incrementally. When asked to implement a module, follow the architecture and conventions defined in this master prompt precisely.

---

## PROJECT OVERVIEW

**Verdiqt** is a web platform where freelancers and clients can:
1. Create project contracts with milestones and payment escrow
2. Raise disputes when deliverables are contested
3. Submit evidence (files, text, screenshots)
4. Receive an AI-generated mediation verdict with fund split recommendation
5. Get funds released automatically based on the verdict

The AI mediator uses Claude API to analyze contract terms, deliverables, and evidence — then returns a structured JSON verdict with reasoning, fault split, and confidence score.

---

## TECH STACK (STRICT — DO NOT DEVIATE)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State**: Zustand
- **Data Fetching**: TanStack React Query v5
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **ORM**: Prisma (with Supabase PostgreSQL)
- **File Uploads**: Multer → Supabase Storage
- **Validation**: Zod
- **Deployment**: Render (free tier)

### Infrastructure
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **File Storage**: Supabase Storage
- **Realtime**: Supabase Realtime (dispute status updates)
- **AI Engine**: Anthropic Claude API (`claude-sonnet-4-6` for production, `claude-haiku-4-5-20251001` for dev/testing)
- **Email**: Resend
- **Monorepo**: Turborepo + pnpm workspaces

---

## MONOREPO FOLDER STRUCTURE

```
verdiqt/
├── apps/
│   ├── web/                          # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx        # Sidebar + topbar layout
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── contracts/
│   │   │   │   │   ├── page.tsx      # List all contracts
│   │   │   │   │   ├── new/page.tsx  # Create contract
│   │   │   │   │   └── [id]/page.tsx # Contract detail
│   │   │   │   ├── disputes/
│   │   │   │   │   ├── page.tsx      # List disputes
│   │   │   │   │   ├── new/page.tsx  # Raise dispute
│   │   │   │   │   └── [id]/page.tsx # Dispute detail + verdict
│   │   │   │   └── wallet/page.tsx   # Mock escrow wallet
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx              # Landing page
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── layout/               # Sidebar, Topbar, MobileNav
│   │   │   ├── contracts/            # ContractCard, MilestoneList
│   │   │   ├── disputes/             # DisputeCard, EvidenceUploader, VerdictPanel
│   │   │   └── shared/               # StatusBadge, UserAvatar, ConfidenceMeter
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts         # Browser Supabase client
│   │   │   │   └── server.ts         # Server-side Supabase client
│   │   │   ├── api.ts                # Axios instance pointing to backend
│   │   │   └── utils.ts
│   │   ├── store/
│   │   │   ├── authStore.ts          # Zustand: user session
│   │   │   └── disputeStore.ts       # Zustand: active dispute state
│   │   ├── hooks/
│   │   │   ├── useContracts.ts
│   │   │   ├── useDisputes.ts
│   │   │   └── useRealtime.ts        # Supabase realtime hook
│   │   └── types/
│   │       └── index.ts              # Shared TypeScript types
│   │
│   └── api/                          # Express.js backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── contracts.ts
│       │   │   ├── milestones.ts
│       │   │   ├── disputes.ts
│       │   │   ├── evidence.ts
│       │   │   └── verdicts.ts
│       │   ├── services/
│       │   │   ├── mediationEngine.ts     # Claude API integration
│       │   │   ├── escrowService.ts       # Mock wallet operations
│       │   │   ├── evidenceProcessor.ts   # File parsing + summarization
│       │   │   └── notificationService.ts # Resend emails
│       │   ├── middleware/
│       │   │   ├── auth.ts               # Supabase JWT verification
│       │   │   ├── validate.ts           # Zod request validation
│       │   │   └── errorHandler.ts
│       │   ├── lib/
│       │   │   ├── supabase.ts           # Supabase admin client
│       │   │   ├── anthropic.ts          # Anthropic client instance
│       │   │   └── prisma.ts             # Prisma client
│       │   └── index.ts                  # Express app entry
│       └── prisma/
│           ├── schema.prisma
│           └── seed.ts
│
├── packages/
│   └── shared/
│       └── types/index.ts            # Types shared across apps
│
├── .github/
│   └── workflows/ci.yml
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## PRISMA SCHEMA

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String     @id @default(uuid())
  email         String     @unique
  name          String
  role          UserRole   @default(FREELANCER)
  avatarUrl     String?
  walletBalance Float      @default(0)
  createdAt     DateTime   @default(now())

  clientContracts     Contract[]  @relation("ClientContracts")
  freelancerContracts Contract[]  @relation("FreelancerContracts")
  raisedDisputes      Dispute[]   @relation("RaisedDisputes")
  evidenceFiles       Evidence[]
}

enum UserRole {
  CLIENT
  FREELANCER
  ADMIN
}

model Contract {
  id             String           @id @default(uuid())
  title          String
  description    String
  totalAmount    Float
  currency       String           @default("INR")
  status         ContractStatus   @default(DRAFT)
  startDate      DateTime
  endDate        DateTime
  scopeDocument  String?          // Supabase storage URL
  clientId       String
  freelancerId   String
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  client         User             @relation("ClientContracts", fields: [clientId], references: [id])
  freelancer     User             @relation("FreelancerContracts", fields: [freelancerId], references: [id])
  milestones     Milestone[]
  dispute        Dispute?
  escrowWallet   EscrowWallet?
}

enum ContractStatus {
  DRAFT
  ACTIVE
  COMPLETED
  DISPUTED
  CANCELLED
}

model Milestone {
  id          String            @id @default(uuid())
  contractId  String
  title       String
  description String
  amount      Float
  dueDate     DateTime
  status      MilestoneStatus   @default(PENDING)
  completedAt DateTime?
  createdAt   DateTime          @default(now())

  contract    Contract          @relation(fields: [contractId], references: [id])
}

enum MilestoneStatus {
  PENDING
  SUBMITTED
  APPROVED
  REJECTED
  DISPUTED
}

model EscrowWallet {
  id           String        @id @default(uuid())
  contractId   String        @unique
  totalAmount  Float
  heldAmount   Float
  releasedToFreelancer Float @default(0)
  refundedToClient     Float @default(0)
  status       WalletStatus  @default(HOLDING)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  contract     Contract      @relation(fields: [contractId], references: [id])
}

enum WalletStatus {
  HOLDING
  PARTIALLY_RELEASED
  FULLY_RELEASED
  REFUNDED
  FROZEN
}

model Dispute {
  id               String         @id @default(uuid())
  contractId       String         @unique
  raisedById       String
  title            String
  clientStatement  String
  freelancerStatement String?
  status           DisputeStatus  @default(OPEN)
  createdAt        DateTime       @default(now())
  resolvedAt       DateTime?

  contract         Contract       @relation(fields: [contractId], references: [id])
  raisedBy         User           @relation("RaisedDisputes", fields: [raisedById], references: [id])
  evidence         Evidence[]
  verdict          Verdict?
}

enum DisputeStatus {
  OPEN
  EVIDENCE_COLLECTION
  AI_ANALYZING
  VERDICT_READY
  ESCALATED
  RESOLVED
}

model Evidence {
  id          String       @id @default(uuid())
  disputeId   String
  uploadedById String
  fileName    String
  fileUrl     String       // Supabase Storage URL
  fileType    String
  description String?
  createdAt   DateTime     @default(now())

  dispute     Dispute      @relation(fields: [disputeId], references: [id])
  uploadedBy  User         @relation(fields: [uploadedById], references: [id])
}

model Verdict {
  id                  String        @id @default(uuid())
  disputeId           String        @unique
  clientFaultPercent  Float
  freelancerFaultPercent Float
  clientRefundPercent Float
  freelancerReleasePercent Float
  reasoning           String        @db.Text
  contractAnalysis    String        @db.Text
  evidenceSummary     String        @db.Text
  confidenceScore     Float
  escalatedToHuman    Boolean       @default(false)
  modelUsed           String
  createdAt           DateTime      @default(now())
  acceptedAt          DateTime?

  dispute             Dispute       @relation(fields: [disputeId], references: [id])
}
```

---

## AI MEDIATION ENGINE

### File: `apps/api/src/services/mediationEngine.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface MediationInput {
  contractTitle: string;
  contractDescription: string;
  totalAmount: number;
  milestones: {
    title: string;
    description: string;
    amount: number;
    status: string;
    dueDate: string;
  }[];
  clientStatement: string;
  freelancerStatement: string;
  evidenceSummaries: string[];
  disputeTitle: string;
}

export interface MediationVerdict {
  clientFaultPercent: number;
  freelancerFaultPercent: number;
  clientRefundPercent: number;
  freelancerReleasePercent: number;
  reasoning: string;
  contractAnalysis: string;
  evidenceSummary: string;
  confidenceScore: number;
  escalatedToHuman: boolean;
}

const SYSTEM_PROMPT = `You are Verdiqt, a neutral AI dispute mediator for a freelance escrow platform. 
Your role is to analyze disputes fairly and objectively, considering:
1. The original contract terms and milestone definitions
2. Both parties' statements without bias
3. Evidence provided by either party
4. Standard freelance industry norms and practices

You must return ONLY a valid JSON object — no preamble, no markdown, no explanation outside the JSON.
Base your analysis strictly on the provided information. If information is insufficient, reflect that in a lower confidence score.
Never favor one party type (client vs freelancer) categorically.`;

export async function runMediationEngine(
  input: MediationInput
): Promise<MediationVerdict> {
  const userPrompt = `
Analyze the following freelance dispute and return a mediation verdict.

## CONTRACT DETAILS
Title: ${input.contractTitle}
Description: ${input.contractDescription}
Total Amount: ₹${input.totalAmount}

## MILESTONES
${input.milestones
  .map(
    (m, i) => `${i + 1}. ${m.title}
   Description: ${m.description}
   Amount: ₹${m.amount}
   Due Date: ${m.dueDate}
   Status: ${m.status}`
  )
  .join("\n\n")}

## DISPUTE
Title: ${input.disputeTitle}

Client's Statement:
"${input.clientStatement}"

Freelancer's Response:
"${input.freelancerStatement || "No response submitted yet."}"

## EVIDENCE SUMMARIES
${
  input.evidenceSummaries.length > 0
    ? input.evidenceSummaries.map((e, i) => `${i + 1}. ${e}`).join("\n")
    : "No evidence submitted."
}

---

Return ONLY this JSON structure:
{
  "clientFaultPercent": <0-100>,
  "freelancerFaultPercent": <0-100>,
  "clientRefundPercent": <0-100, percentage of total escrow to refund client>,
  "freelancerReleasePercent": <0-100, percentage of total escrow to release to freelancer>,
  "reasoning": "<3-5 sentence plain English explanation of the verdict>",
  "contractAnalysis": "<2-3 sentences analyzing how well deliverables matched contract scope>",
  "evidenceSummary": "<1-2 sentences on how evidence influenced the decision>",
  "confidenceScore": <0.0-1.0>,
  "escalatedToHuman": <true if confidence < 0.6 or case is genuinely ambiguous, else false>
}

Note: clientRefundPercent + freelancerReleasePercent must equal 100.
Note: clientFaultPercent + freelancerFaultPercent must equal 100.
`;

  const isDev = process.env.NODE_ENV !== "production";
  const model = isDev
    ? "claude-haiku-4-5-20251001"
    : "claude-sonnet-4-20250514";

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  const clean = rawText.replace(/```json|```/g, "").trim();
  const verdict: MediationVerdict = JSON.parse(clean);

  // Safety clamp
  verdict.confidenceScore = Math.max(0, Math.min(1, verdict.confidenceScore));
  if (verdict.confidenceScore < 0.6) verdict.escalatedToHuman = true;

  return verdict;
}
```

---

## API ROUTES SPECIFICATION

### Auth Routes (`/api/auth`)
```
POST   /api/auth/verify        — Verify Supabase JWT, return user profile
POST   /api/auth/profile        — Create/update user profile in DB after Supabase signup
```

### Contract Routes (`/api/contracts`)
```
GET    /api/contracts           — List contracts for authenticated user (as client or freelancer)
POST   /api/contracts           — Create new contract
GET    /api/contracts/:id       — Get contract detail with milestones
PUT    /api/contracts/:id       — Update contract (only DRAFT status)
PATCH  /api/contracts/:id/status — Activate / complete / cancel
```

### Milestone Routes (`/api/milestones`)
```
POST   /api/milestones          — Add milestone to contract
PATCH  /api/milestones/:id      — Update milestone status (submit/approve/reject)
```

### Dispute Routes (`/api/disputes`)
```
GET    /api/disputes            — List disputes for user
POST   /api/disputes            — Raise a new dispute (freezes escrow)
GET    /api/disputes/:id        — Get dispute detail with evidence + verdict
PATCH  /api/disputes/:id/respond — Freelancer submits their response statement
POST   /api/disputes/:id/analyze — Trigger AI mediation engine
```

### Evidence Routes (`/api/evidence`)
```
POST   /api/evidence/upload     — Upload file to Supabase Storage, save record
GET    /api/evidence/:disputeId — List all evidence for a dispute
DELETE /api/evidence/:id        — Delete own evidence (only if dispute still OPEN)
```

### Verdict Routes (`/api/verdicts`)
```
GET    /api/verdicts/:disputeId  — Get verdict for dispute
POST   /api/verdicts/:id/accept  — Accept verdict, trigger escrow execution
POST   /api/verdicts/:id/escalate — Escalate to human review
```

---

## DESIGN SYSTEM

### Color Palette (CSS Variables)
```css
:root {
  --bg-primary: #0A0F1E;         /* Deep navy — main background */
  --bg-secondary: #111827;       /* Card backgrounds */
  --bg-elevated: #1A2235;        /* Elevated surfaces, modals */
  --accent-primary: #6366F1;     /* Indigo — primary actions */
  --accent-secondary: #06B6D4;   /* Cyan — secondary highlights */
  --accent-success: #10B981;     /* Emerald — verdicts favoring freelancer */
  --accent-warning: #F59E0B;     /* Amber — disputed / escalated states */
  --accent-danger: #EF4444;      /* Red — verdicts favoring client refund */
  --text-primary: #F1F5F9;       /* Main text */
  --text-secondary: #94A3B8;     /* Muted text */
  --border: #1E2D45;             /* Subtle borders */
  --border-accent: #6366F130;    /* Glowing borders on focus/hover */
}
```

### Typography
- **Display/Headings**: `Syne` (Google Fonts) — geometric, authoritative
- **Body/UI**: `DM Sans` (Google Fonts) — clean, readable
- **Monospace/Data**: `JetBrains Mono` — for amounts, IDs, confidence scores

### Key UI Components

**StatusBadge** — color-coded by dispute/contract status
**ConfidenceMeter** — animated circular progress showing AI confidence (0–100%)
**VerdictPanel** — split bar visualization showing client/freelancer fund split
**EvidenceUploader** — drag-and-drop zone with file type validation
**MilestoneTimeline** — vertical timeline of contract milestones with status indicators
**EscrowVault** — animated card showing held/released/refunded amounts

---

## ENVIRONMENT VARIABLES

### `.env.example`
```env
# Supabase
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Resend
RESEND_API_KEY=re_...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000

# Environment
NODE_ENV=development
```

---

## DEPLOYMENT CONFIGURATION

### `vercel.json` (Frontend)
```json
{
  "buildCommand": "cd apps/web && pnpm build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### `render.yaml` (Backend)
```yaml
services:
  - type: web
    name: verdiqt-api
    env: node
    buildCommand: cd apps/api && pnpm install && pnpm prisma generate && pnpm build
    startCommand: cd apps/api && node dist/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: RESEND_API_KEY
        sync: false
```

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {}
  }
}
```

---

## SUPABASE REALTIME SETUP

In the frontend, subscribe to dispute status changes so both parties see live updates:

```typescript
// hooks/useRealtime.ts
import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export function useDisputeRealtime(
  disputeId: string,
  onStatusChange: (status: string) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel(`dispute:${disputeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Dispute",
          filter: `id=eq.${disputeId}`,
        },
        (payload) => {
          onStatusChange(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [disputeId, onStatusChange]);
}
```

---

## PAGE-BY-PAGE FEATURE REQUIREMENTS

### 1. Landing Page (`/`)
- Hero with animated tagline: "Fair. Fast. AI-Powered Dispute Resolution"
- Feature highlights: Contract Creation, Escrow Lock, AI Mediation, Instant Verdict
- CTA: Sign Up as Client / Sign Up as Freelancer
- How It Works section (3-step visual)

### 2. Dashboard (`/dashboard`)
- Summary cards: Active Contracts, Open Disputes, Wallet Balance, Resolved Cases
- Recent activity feed
- Quick action buttons

### 3. Contract Creation (`/contracts/new`)
- Multi-step form: Basic Info → Milestones → Review → Activate
- Invite freelancer by email
- Auto-create EscrowWallet on activation

### 4. Dispute Portal (`/disputes/new`)
- Select which contract to dispute
- Title + detailed statement
- Option to attach initial evidence
- Freezes escrow on submit

### 5. Dispute Detail (`/disputes/[id]`)
- Timeline of dispute stages (Open → Evidence → Analyzing → Verdict)
- Evidence upload panel for both parties (7-day window)
- "Request AI Analysis" button (only after both statements submitted)
- Real-time status via Supabase Realtime
- Verdict Panel (revealed after analysis):
  - Fund split bar
  - AI reasoning breakdown
  - Confidence meter
  - Accept Verdict / Escalate buttons

### 6. Wallet (`/wallet`)
- Current balance
- Transaction history (escrow deposits, releases, refunds)
- Pending holds

---

## DEVELOPMENT SEQUENCE

Build in this exact order:

1. **Setup** — Turborepo + pnpm monorepo, install all dependencies
2. **Database** — Prisma schema, Supabase connection, run migrations, seed data
3. **Backend skeleton** — Express app, middleware, error handler
4. **Auth** — Supabase Auth + JWT middleware on backend
5. **Contract APIs** — CRUD + escrow wallet creation
6. **Dispute APIs** — raise, respond, evidence upload
7. **AI Engine** — `mediationEngine.ts`, test with mock dispute data
8. **Verdict APIs** — store verdict, accept/escalate logic
9. **Frontend skeleton** — Next.js app, Tailwind, shadcn/ui setup
10. **Auth pages** — Login, Signup with Supabase
11. **Dashboard + Contract pages**
12. **Dispute portal + Evidence uploader**
13. **Verdict panel + Confidence meter**
14. **Realtime integration**
15. **Email notifications via Resend**
16. **Deploy** — Vercel (frontend) + Render (backend) + UptimeRobot

---

## CODING CONVENTIONS

- All backend routes use async/await with try/catch feeding into `errorHandler` middleware
- All Zod schemas live in `schemas/` colocated with their route
- All Prisma queries go through service functions — never directly in route handlers
- Frontend API calls always go through `lib/api.ts` Axios instance (never raw fetch)
- TypeScript strict mode enabled across both apps
- Environment variables accessed only through a typed `env.ts` wrapper
- All monetary amounts stored as `Float` in DB, displayed with `toLocaleString('en-IN')` formatting
- Dates displayed using `date-fns` library

---

## SAMPLE SEED DATA (for demo)

Create two users, one contract, one dispute, and one pre-generated verdict so the demo is immediately impressive without needing live AI calls during panel presentation.

```typescript
// prisma/seed.ts — create demo data
const client = await prisma.user.create({
  data: {
    id: "demo-client-001",
    email: "client@demo.com",
    name: "Arjun Mehta",
    role: "CLIENT",
    walletBalance: 50000,
  },
});

const freelancer = await prisma.user.create({
  data: {
    id: "demo-freelancer-001",
    email: "freelancer@demo.com",
    name: "Priya Sharma",
    role: "FREELANCER",
    walletBalance: 12000,
  },
});

// Contract: E-commerce Website Redesign, ₹35,000
// Dispute: Client claims homepage not delivered per spec
// Pre-seeded verdict: 65% freelancer / 35% client, confidence: 0.81
```

---

## ACADEMIC DOCUMENTATION NOTES

When writing the SRS / project report for this system, reference:

- **ODR (Online Dispute Resolution)** — Katsh & Rifkin (2001) as foundational framework
- **LLM Reasoning in Legal Contexts** — cite recent 2023-24 papers on GPT-4 legal benchmarks
- **Escrow Automation** — reference Ethereum smart contract literature for comparison
- **Evaluation Metric**: Compare AI verdicts against a panel of 3 human arbitrators on 20 synthetic dispute cases. Measure: agreement rate, resolution time, consistency score.

---

*This master prompt is the single source of truth for building Verdiqt.
Reference it at the start of every build session.*
