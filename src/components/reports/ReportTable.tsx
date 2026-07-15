import type { ReactNode } from "react";

type Column<Row> = {
  key: string;
  label: string;
  render: (row: Row) => ReactNode;
  align?: "left" | "center" | "right";
};

type ReportTableProps<Row> = {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  emptyTitle?: string;
};

export default function ReportTable<Row>({
  columns,
  rows,
  rowKey,
  emptyTitle = "No report data found",
}: ReportTableProps<Row>) {
  if (rows.length === 0) {
    return <div className="rounded-2xl bg-slate-50 p-10 text-center font-semibold text-gray-500">{emptyTitle}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`border-b border-gray-200 px-4 py-4 font-bold text-gray-700 ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)} className="bg-white hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.key} className={`border-b border-gray-100 px-4 py-4 text-gray-700 ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
