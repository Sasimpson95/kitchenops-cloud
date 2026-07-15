import { Download, Printer } from "lucide-react";

type ReportActionsProps = {
  onCsv: () => void;
  onPrint: () => void;
};

export default function ReportActions({ onCsv, onPrint }: ReportActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button type="button" onClick={onCsv} className="inline-flex items-center gap-2 rounded-xl bg-green-800 px-4 py-2 font-semibold text-white hover:bg-green-900">
        <Download size={18} /> Export CSV
      </button>
      <button type="button" onClick={onPrint} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-slate-50">
        <Printer size={18} /> Print / Save PDF
      </button>
    </div>
  );
}
