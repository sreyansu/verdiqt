import { format } from "date-fns";
import { Scale } from "lucide-react";

export function ProfessionalContractPdf({ contract }: { contract: any }) {
  if (!contract) return null;

  return (
    <div
      id="professional-pdf-template"
      className="bg-white text-black print:block"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: -50,
        opacity: 0.01, /* Safari/Chrome sometimes completely culls opacity: 0 from Canvas */
        pointerEvents: "none",
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-black flex items-center justify-center rounded">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">VERDIQT</h1>
            <p className="text-sm text-gray-500 font-medium tracking-widest uppercase">Smart Escrow Contracts</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-900">INDEPENDENT CONTRACTOR AGREEMENT</h2>
          <p className="text-sm text-gray-500 mt-1">Contract ID: {contract.id}</p>
          <p className="text-sm text-gray-500">Effective Date: {format(new Date(contract.startDate), "dd MMM yyyy")}</p>
        </div>
      </div>

      {/* Intro */}
      <p className="text-sm leading-relaxed text-gray-700 mb-8">
        This Independent Contractor Agreement (the "Agreement") is entered into as of{" "}
        <strong>{format(new Date(contract.startDate), "MMMM do, yyyy")}</strong>, by and between the Client and the Freelancer defined below, collectively referred to as the "Parties," facilitated through the Verdiqt platform.
      </p>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">The Client</h3>
          <p className="font-bold text-gray-900">{contract.client?.name || "N/A"}</p>
          <p className="text-sm text-gray-600">{contract.client?.email || "N/A"}</p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">The Freelancer</h3>
          <p className="font-bold text-gray-900">{contract.freelancer?.name || "N/A"}</p>
          <p className="text-sm text-gray-600">{contract.freelancer?.email || "N/A"}</p>
        </div>
      </div>

      {/* Scope of Work */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">1. Scope of Work</h3>
        <p className="text-md font-semibold text-gray-900 mb-2">{contract.title}</p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{contract.description}</p>
        <p className="text-sm text-gray-700 mt-4">
          <strong>Term:</strong> The work shall commence on {format(new Date(contract.startDate), "MMM dd, yyyy")} and is expected to conclude by {format(new Date(contract.endDate), "MMM dd, yyyy")}.
        </p>
      </div>

      {/* Compensation & Milestones */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">2. Compensation & Milestone Schedule</h3>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          For the full and complete performance of the Services described above, the Client shall pay the Freelancer a total amount of{" "}
          <strong>₹{contract.totalAmount.toLocaleString("en-IN")} via Verdiqt Escrow</strong>, distributed according to the following milestones:
        </p>
        
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 uppercase text-xs font-semibold text-gray-500">
              <tr>
                <th className="px-4 py-3">Milestone Description</th>
                <th className="px-4 py-3 w-32">Due Date</th>
                <th className="px-4 py-3 w-32 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contract.milestones?.map((m: any, i: number) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{m.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{m.description}</p>
                  </td>
                  <td className="px-4 py-3">{format(new Date(m.dueDate), "MMM dd, yyyy")}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">₹{m.amount.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right font-bold text-gray-900">Total Contract Value:</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">₹{contract.totalAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Standard Terms */}
      <div className="mb-12">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">3. General Terms & Dispute Resolution</h3>
        <ul className="list-disc pl-5 text-xs text-gray-600 space-y-2">
          <li><strong>Escrow Mechanism:</strong> All funds are held securely in the Verdiqt Escrow Vault and are only released upon mutually agreed completion of milestones.</li>
          <li><strong>Independent Contractor Status:</strong> The Freelancer acts as an independent contractor, not an employee, retaining control over how the services are rendered.</li>
          <li><strong>Dispute Resolution:</strong> Any disputes arising from this contract will be managed exclusively through the Verdiqt Dispute Resolution subsystem, which utilizes AI-assisted arbitration and human review to determine final asset disbursement.</li>
        </ul>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-gray-200">
        <div>
          <div className="h-12 border-b-2 border-gray-300 flex items-end pb-1">
            <span className="text-xs text-gray-400 italic">Digitally Authorized via Verdiqt</span>
          </div>
          <p className="font-bold text-sm text-gray-900 mt-2">Client Signature</p>
          <p className="text-xs text-gray-500">{contract.client?.name}</p>
        </div>
        <div>
          <div className="h-12 border-b-2 border-gray-300 flex items-end pb-1">
            <span className="text-xs text-gray-400 italic">
              {contract.status === "ACTIVE" || contract.status === "COMPLETED" 
                ? "Digitally Accepted via Verdiqt" 
                : "Awaiting Acceptance"}
            </span>
          </div>
          <p className="font-bold text-sm text-gray-900 mt-2">Freelancer Signature</p>
          <p className="text-xs text-gray-500">{contract.freelancer?.name}</p>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-full text-center p-8">
        <p className="text-xs text-gray-400 border-t border-gray-200 pt-4">
          Generated automatically by Verdiqt Platform • Document ID: {contract.id} • Status: {contract.status}
        </p>
      </div>
    </div>
  );
}
