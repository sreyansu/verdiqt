"use client";

import { format } from "date-fns";

interface ProfessionalContractPdfProps {
  contract: any;
}

export function ProfessionalContractPdf({ contract }: ProfessionalContractPdfProps) {
  if (!contract) return null;

  const startDateFormatted = contract.startDate
    ? format(new Date(contract.startDate), "MMMM dd, yyyy")
    : format(new Date(), "MMMM dd, yyyy");
  const endDateFormatted = contract.endDate
    ? format(new Date(contract.endDate), "MMMM dd, yyyy")
    : "Upon completion of deliverables";
  const createdDateFormatted = contract.createdAt
    ? format(new Date(contract.createdAt), "MMMM dd, yyyy")
    : startDateFormatted;

  const clientName = contract.client?.name || "Client";
  const clientCompany = contract.client?.company || contract.client?.organization?.companyName || "";
  const clientDesignation = contract.client?.designation || "";
  const clientLocation = [contract.client?.city, contract.client?.country].filter(Boolean).join(", ");

  const freelancerName = contract.freelancer?.name || "Freelancer";
  const freelancerTitle = contract.freelancer?.professionalTitle || "Independent Professional";
  const freelancerLocation = [contract.freelancer?.city, contract.freelancer?.country].filter(Boolean).join(", ");

  const totalAmount = contract.totalAmount || 0;
  const milestones = Array.isArray(contract.milestones) ? contract.milestones : [];

  return (
    <div
      id="professional-pdf-template"
      className="bg-white text-slate-900 print:block"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: -50,
        opacity: 0.01,
        pointerEvents: "none",
        width: "210mm",
        minHeight: "297mm",
        padding: "16mm 18mm",
        fontFamily: "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        lineHeight: 1.5,
      }}
    >
      {/* ── Document Cover / Top Header ── */}
      <div className="border-b-2 border-slate-900 pb-5 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center p-1.5 flex-shrink-0 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/verdiqt-icon.png" alt="Verdiqt" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-mono">VERDIQT</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                  Legal Agreement
                </span>
              </div>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium mt-0.5">
                Online Dispute Resolution & Escrow Infrastructure
              </p>
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              FREELANCE SERVICE AGREEMENT
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Ref: {contract.id || contract._id}</p>
            <p className="text-xs text-slate-500">Execution Date: {startDateFormatted}</p>
            <div className="mt-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800">
                STATUS: {contract.status || "ACTIVE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Preamble ── */}
      <div className="text-xs text-slate-700 leading-relaxed mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        This Freelance Service Agreement (the <strong>"Agreement"</strong>) is entered into and made effective as of{" "}
        <strong>{startDateFormatted}</strong>, facilitated electronically via the Verdiqt Platform, by and between the parties identified below (collectively, the <strong>"Parties"</strong>, and each, a <strong>"Party"</strong>).
      </div>

      {/* ── Section 1: Parties to Agreement ── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
          <span>1. Parties to the Agreement</span>
          <span className="text-[10px] text-slate-400 font-normal normal-case">Binding electronically upon mutual acceptance</span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Client */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Client / Engagement Authority
            </div>
            <p className="font-bold text-sm text-slate-900">{clientName}</p>
            {clientCompany && <p className="text-slate-700 font-medium">{clientCompany}</p>}
            {clientDesignation && <p className="text-slate-600 italic">{clientDesignation}</p>}
            {clientLocation && <p className="text-slate-500 mt-1">Location: {clientLocation}</p>}
            <p className="text-[11px] text-slate-400 font-mono mt-1">ID: {contract.clientId || contract.client?.id || "Verified Client"}</p>
          </div>

          {/* Freelancer */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Independent Contractor / Freelancer
            </div>
            <p className="font-bold text-sm text-slate-900">{freelancerName}</p>
            <p className="text-slate-700 font-medium">{freelancerTitle}</p>
            {freelancerLocation && <p className="text-slate-500 mt-1">Location: {freelancerLocation}</p>}
            <p className="text-[11px] text-slate-400 font-mono mt-1">ID: {contract.freelancerId || contract.freelancer?.id || "Verified Professional"}</p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Project Overview & Scope ── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-2">
          2. Project Overview & Scope of Work
        </h2>
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <p className="text-sm font-bold text-slate-900 mb-1.5">{contract.title}</p>
          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
            {contract.description || "The Freelancer agrees to perform professional services in accordance with the milestone deliverable schedule detailed in Section 3."}
          </p>
          <div className="flex items-center gap-6 mt-3 pt-2.5 border-t border-slate-200 text-[11px] text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">Commencement Date: </span>
              <span>{startDateFormatted}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Target Conclusion: </span>
              <span>{endDateFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Milestone Schedule & Compensation ── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-2 flex justify-between items-center">
          <span>3. Milestone Deliverables & Compensation Schedule</span>
          <span className="text-[11px] font-bold font-mono text-amber-700">
            Total: ₹{totalAmount.toLocaleString("en-IN")}
          </span>
        </h2>
        <div className="overflow-hidden border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
              <tr>
                <th className="px-3.5 py-2.5 w-10 text-center">#</th>
                <th className="px-3.5 py-2.5">Milestone & Technical Deliverables</th>
                <th className="px-3.5 py-2.5 w-28">Due Date</th>
                <th className="px-3.5 py-2.5 w-24 text-center">Status</th>
                <th className="px-3.5 py-2.5 w-28 text-right">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {milestones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3.5 py-3 text-center text-slate-500 italic">
                    Single milestone project: ₹{totalAmount.toLocaleString("en-IN")} upon final acceptance.
                  </td>
                </tr>
              ) : (
                milestones.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3.5 py-2.5 text-center font-mono text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="px-3.5 py-2.5">
                      <p className="font-semibold text-slate-900">{m.title}</p>
                      {m.description && <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{m.description}</p>}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600 font-mono text-[11px]">
                      {m.dueDate ? format(new Date(m.dueDate), "MMM dd, yyyy") : "N/A"}
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {m.status || "PENDING"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                      ₹{Number(m.amount || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
              <tr>
                <td colSpan={4} className="px-3.5 py-2.5 text-right uppercase tracking-wider text-[11px]">
                  Total Agreed Contract Value:
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono text-sm text-slate-900">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Section 4: Payment & Simulated Escrow Terms ── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-2">
          4. Payment & Simulated Escrow Terms
        </h2>
        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-[11px] text-slate-700 space-y-1.5 leading-relaxed">
          <p>
            <strong>Simulated Escrow Notice:</strong> All project funds recorded under this agreement are deposited into and tracked via the Verdiqt internal simulated escrow ledger. The platform&apos;s internal wallet operates as a simulated software demonstration vault and is not a regulated banking institution, licensed escrow company, or fiduciary deposit-taking entity.
          </p>
          <p>
            <strong>Release Conditions:</strong> Milestone funds are locked upon activation and released to the Freelancer&apos;s balance only upon explicit Client approval or a final binding resolution rendered through the Verdiqt Dispute Resolution subsystem.
          </p>
        </div>
      </div>

      {/* ── Section 5: Review, Revisions & Scope Change Standards ── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-2">
          5. Review, Revisions & Scope Management
        </h2>
        <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-700">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-semibold text-slate-900 block mb-0.5">Review Period</span>
            Standard 3 business days from milestone deliverable submission.
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-semibold text-slate-900 block mb-0.5">Revision Policy</span>
            Up to 2 standard rounds of revisions within initial milestone scope.
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-semibold text-slate-900 block mb-0.5">Scope Changes</span>
            Modifications require written mutual consent and milestone re-budgeting.
          </div>
        </div>
      </div>

      {/* ── Section 6: Online Dispute Resolution & AI Advisory Disclaimer ── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-2">
          6. Dispute Resolution Protocol & AI Advisory Disclaimer
        </h2>
        <div className="text-[11px] text-slate-700 space-y-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
          <p>
            In the event of disagreement regarding deliverable satisfaction, quality, or completion, the Parties agree to resolve the dispute through Verdiqt&apos;s structured resolution protocol:
          </p>
          <ol className="list-decimal pl-4 space-y-1 text-slate-600">
            <li><strong>Direct Platform Negotiation:</strong> 48-hour collaborative exchange inside the contract messaging channel.</li>
            <li><strong>Evidence Submission:</strong> Structured submission of specifications, commits, time-stamped files, and deliverable artifacts.</li>
            <li><strong>AI-Assisted Analysis:</strong> Evidentiary analysis generated by Verdiqt AI Tribunal to evaluate deliverables against agreed milestone parameters.</li>
            <li><strong>Resolution or Escalation:</strong> Voluntary settlement based on advisory recommendations, or escalation to designated human administrative review.</li>
          </ol>
          <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200">
            <strong>Advisory Notice:</strong> AI Tribunal findings and recommendations provide structured analytical guidance for fair negotiation and do not constitute formal judicial awards or legally binding arbitration rulings.
          </p>
        </div>
      </div>

      {/* ── Section 7: Intellectual Property & Governing Terms ── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-2">
          7. Intellectual Property, Confidentiality & Jurisdiction
        </h2>
        <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-700 leading-relaxed">
          <div>
            <p className="font-semibold text-slate-900 mb-0.5">Intellectual Property Ownership</p>
            <p>
              Upon complete release of payment for each respective milestone, all custom deliverables created specifically for this engagement transfer to the Client. Pre-existing tools and open-source components remain under their respective licenses.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-0.5">Governing Law</p>
            <p>
              Unless otherwise specified by explicit written mutual amendment signed by both Parties: <em>Not specified in this agreement (Subject to prevailing international commercial contracting standards)</em>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 8: Acceptance & Electronic Signatures ── */}
      <div className="mt-8 pt-6 border-t-2 border-slate-900">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
          8. Mutual Acceptance & Digital Audit Record
        </h2>
        <div className="grid grid-cols-2 gap-8">
          {/* Client Signature Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Authorized Client Representative</div>
            <div className="h-10 border-b border-slate-300 flex items-end pb-1 font-mono text-xs text-slate-700">
              ✓ Digitally Authorized & Created via Verdiqt
            </div>
            <div className="mt-2 text-xs">
              <p className="font-bold text-slate-900">{clientName}</p>
              <p className="text-slate-500 text-[11px] font-mono mt-0.5">Date: {createdDateFormatted}</p>
              <p className="text-slate-400 text-[10px] font-mono">UID: {contract.clientId || "Client-Account"}</p>
            </div>
          </div>

          {/* Freelancer Signature Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Independent Contractor</div>
            <div className="h-10 border-b border-slate-300 flex items-end pb-1 font-mono text-xs text-slate-700">
              {contract.status === "ACTIVE" || contract.status === "COMPLETED"
                ? "✓ Digitally Accepted & Locked via Platform"
                : "Awaiting Mutual Acceptance"}
            </div>
            <div className="mt-2 text-xs">
              <p className="font-bold text-slate-900">{freelancerName}</p>
              <p className="text-slate-500 text-[11px] font-mono mt-0.5">
                Status: {contract.status === "ACTIVE" ? "Accepted" : contract.status}
              </p>
              <p className="text-slate-400 text-[10px] font-mono">UID: {contract.freelancerId || "Freelancer-Account"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Document Footer / Audit Stamp ── */}
      <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono flex justify-between items-center">
        <span>VERDIQT ELECTRONIC CONTRACT ARCHIVE • CONTRACT ID: {contract.id || contract._id}</span>
        <span>GENERATED ON: {format(new Date(), "yyyy-MM-dd HH:mm:ss 'UTC'")}</span>
        <span>PAGE 1 OF 1</span>
      </div>
    </div>
  );
}
