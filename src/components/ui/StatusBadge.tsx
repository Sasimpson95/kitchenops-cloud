type StatusBadgeProps = {
  status:
    | "Active"
    | "Inactive"
    | "Draft"
    | "Sent"
    | "Completed"
    | "Received"
    | "Cancelled";
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colours: Record<StatusBadgeProps["status"], string> = {
    Active: "bg-violet-100 text-violet-800",
    Inactive: "bg-gray-200 text-gray-700",
    Draft: "bg-yellow-100 text-yellow-800",
    Sent: "bg-blue-100 text-blue-800",
    Completed: "bg-violet-100 text-violet-800",
    Received: "bg-violet-100 text-violet-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${colours[status]}`}
    >
      {status}
    </span>
  );
}
