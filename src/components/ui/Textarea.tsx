import type { TextareaHTMLAttributes } from "react";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
  label: string;
  helperText?: string;
  error?: string;
  onChange?: (value: string) => void;
};

export default function Textarea({
  label,
  helperText,
  error,
  onChange,
  className = "",
  id,
  required,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? `textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div>
      <label htmlFor={textareaId} className="mb-2 block text-sm font-bold text-slate-800">
        {label}{required ? <span className="ml-1 text-red-600">*</span> : null}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || helperText ? `${textareaId}-help` : undefined}
        onChange={(event) => onChange?.(event.target.value)}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 ${error ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100" : "border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"} ${className}`}
        {...props}
      />
      {error || helperText ? (
        <p id={`${textareaId}-help`} className={`mt-2 text-sm ${error ? "font-semibold text-red-700" : "text-slate-500"}`}>
          {error ?? helperText}
        </p>
      ) : null}
    </div>
  );
}
