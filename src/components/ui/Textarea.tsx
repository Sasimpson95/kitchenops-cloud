type TextareaProps = {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
};

export default function Textarea({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
}: TextareaProps) {
  return (
    <div>
      <label className="mb-2 block font-semibold">{label}</label>

      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-violet-800"
      />
    </div>
  );
}