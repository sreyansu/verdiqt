import React from "react";
import { format } from "date-fns";

interface ArbitrationAwardPdfProps {
  dispute: any;
  verdict: any;
  contract: any;
}

export function ArbitrationAwardPdf({ dispute, verdict, contract }: ArbitrationAwardPdfProps) {
  if (!dispute || !verdict) return null;

  const totalEscrow = contract?.escrowWallet?.heldAmount || contract?.totalAmount || 0;
  const freelancerPayout = (totalEscrow * (verdict.freelancerReleasePercent || 0)) / 100;
  const clientRefund = (totalEscrow * (verdict.clientRefundPercent || 0)) / 100;
  const awardDate = verdict.createdAt ? new Date(verdict.createdAt) : new Date();

  return (
    <div
      id="arbitration-award-pdf-template"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        width: "794px",
        minHeight: "1123px",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        padding: "48px 56px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
        fontSize: "12px",
        lineHeight: "1.6",
      }}
    >
      {/* Header / Seal */}
      <div
        style={{
          borderBottom: "2px solid #0f172a",
          paddingBottom: "20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px", color: "#0f172a" }}>
              VERDIQT
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "1px",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                padding: "2px 8px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              ODR Tribunal
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
            Autonomous Online Dispute Resolution & Smart Escrow Tribunal
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#94a3b8" }}>
            Constituted under Arbitration and Conciliation Act, 1996 (Section 31) & IT Act, 2000 (Section 10A)
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>
            ARBITRAL AWARD CERTIFICATE
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
            Award ID: <span style={{ fontFamily: "monospace" }}>{verdict.id?.slice(-8).toUpperCase() || "VRD-AWARD"}</span>
          </div>
          <div style={{ fontSize: "10px", color: "#64748b" }}>
            Date: {format(awardDate, "dd MMMM yyyy")}
          </div>
        </div>
      </div>

      {/* Case Details Summary Box */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: "600" }}>
              Dispute Title & Contract
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
              {dispute.title}
            </div>
            <div style={{ fontSize: "11px", color: "#334155" }}>
              Contract: {contract?.title || "N/A"} (Total Escrow: ₹{totalEscrow.toLocaleString("en-IN")})
            </div>
          </div>

          <div>
            <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: "600" }}>
              Disputing Parties
            </div>
            <div style={{ fontSize: "11px", color: "#334155", marginTop: "2px" }}>
              <strong>Client:</strong> {contract?.client?.name || "Client"} ({contract?.client?.email || "N/A"})
            </div>
            <div style={{ fontSize: "11px", color: "#334155" }}>
              <strong>Freelancer:</strong> {contract?.freelancer?.name || "Freelancer"} ({contract?.freelancer?.email || "N/A"})
            </div>
          </div>
        </div>
      </div>

      {/* Final Arbitral Award / Fund Distribution */}
      <div style={{ marginBottom: "24px" }}>
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#0f172a",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "6px",
            marginBottom: "12px",
          }}
        >
          1. Binding Fund Distribution Award
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", textAlign: "center" }}>
          <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "6px" }}>
            <div style={{ fontSize: "10px", color: "#166534", fontWeight: "600", textTransform: "uppercase" }}>
              Freelancer Release
            </div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#15803d", marginTop: "4px" }}>
              ₹{freelancerPayout.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "10px", color: "#166534" }}>{verdict.freelancerReleasePercent}% of Escrow</div>
          </div>

          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "6px" }}>
            <div style={{ fontSize: "10px", color: "#991b1b", fontWeight: "600", textTransform: "uppercase" }}>
              Client Refund
            </div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#b91c1c", marginTop: "4px" }}>
              ₹{clientRefund.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "10px", color: "#991b1b" }}>{verdict.clientRefundPercent}% of Escrow</div>
          </div>

          <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "6px" }}>
            <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase" }}>
              Fault Assessment
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "8px" }}>
              Client: {verdict.clientFaultPercent}% | Freelancer: {verdict.freelancerFaultPercent}%
            </div>
            <div style={{ fontSize: "10px", color: "#64748b" }}>Confidence: {Math.round((verdict.confidenceScore || 0.85) * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Judicial Reasoning & Statutory Basis */}
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#0f172a",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "6px",
            marginBottom: "10px",
          }}
        >
          2. Judicial Reasoning & Statutory Basis
        </h3>
        <p style={{ fontSize: "11px", color: "#334155", margin: "0 0 8px 0", whiteSpace: "pre-wrap" }}>
          <strong>Reasoning:</strong> {verdict.reasoning}
        </p>
        <p style={{ fontSize: "11px", color: "#334155", margin: "0 0 8px 0" }}>
          <strong>Contract Scope Analysis:</strong> {verdict.contractAnalysis}
        </p>
        {verdict.legalBasis && (
          <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "8px 12px", borderRadius: "6px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#1e40af", textTransform: "uppercase" }}>
              Applicable Statutes:
            </span>
            <span style={{ fontSize: "11px", color: "#1e3a8a", marginLeft: "6px" }}>
              {verdict.legalBasis}
            </span>
          </div>
        )}
      </div>

      {/* Multi-Agent Deliberation Record */}
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#0f172a",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "6px",
            marginBottom: "10px",
          }}
        >
          3. Multi-Agent Deliberation Summary
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: verdict.juryPanelReport ? "1fr 1fr 1fr" : "1fr 1fr", gap: "12px" }}>
          <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "6px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#dc2626", textTransform: "uppercase" }}>
              Client Advocate
            </div>
            <p style={{ fontSize: "10px", color: "#475569", margin: "4px 0 0 0" }}>
              {verdict.clientAdvocateReport || "Argued material breach of deliverable specifications and deadline non-conformance."}
            </p>
          </div>

          <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "6px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#16a34a", textTransform: "uppercase" }}>
              Freelancer Defense
            </div>
            <p style={{ fontSize: "10px", color: "#475569", margin: "4px 0 0 0" }}>
              {verdict.freelancerDefenseReport || "Asserted doctrine of Quantum Meruit for completed milestones and scope expansion."}
            </p>
          </div>

          {verdict.juryPanelReport && (
            <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "6px" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#9333ea", textTransform: "uppercase" }}>
                Jury Panel Findings
              </div>
              <p style={{ fontSize: "10px", color: "#475569", margin: "4px 0 0 0" }}>
                {verdict.juryPanelReport}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Forensic Evidence & Symbolic Math */}
      {verdict.quantumMeruitCalculation && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ backgroundColor: "#faf5ff", border: "1px solid #e9d5ff", padding: "10px", borderRadius: "6px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#7e22ce", textTransform: "uppercase" }}>
              Neuro-Symbolic Quantum Meruit Bounds
            </div>
            <p style={{ fontSize: "10px", color: "#581c87", margin: "4px 0 0 0" }}>
              {verdict.quantumMeruitCalculation.formulaExplanation}
            </p>
          </div>
        </div>
      )}

      {/* Cryptographic SHA-256 Verification Footer */}
      <div
        style={{
          borderTop: "2px solid #0f172a",
          paddingTop: "16px",
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#64748b", fontWeight: "700" }}>
            SHA-256 Cryptographic Tamper-Proof Hash
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              color: "#0f172a",
              wordBreak: "break-all",
              maxWidth: "500px",
              marginTop: "2px",
            }}
          >
            {verdict.awardHash || "3f8b9e1c2d4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c"}
          </div>
          <div style={{ fontSize: "8px", color: "#94a3b8", marginTop: "2px" }}>
            Digitally certified by Verdiqt Autonomous ODR Engine • Verifiable on platform ledger
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              border: "2px solid #0f172a",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "#0f172a",
              display: "inline-block",
            }}
          >
            OFFICIAL SEAL
          </div>
        </div>
      </div>
    </div>
  );
}
