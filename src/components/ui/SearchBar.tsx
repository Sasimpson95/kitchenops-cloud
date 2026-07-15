type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: SearchBarProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`🔍 ${placeholder}`}
      className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 font-semibold shadow-sm outline-none transition focus:border-green-800"
    />
  );
}