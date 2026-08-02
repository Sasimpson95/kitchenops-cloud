import type { ReactNode } from "react";
import Button from "./Button";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  description,
  eyebrow,
  buttonText,
  onButtonClick,
  actions,
  meta,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`mb-6 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:mb-8 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-3">{meta}</div> : null}
      </div>

      {actions || buttonText ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
          {buttonText ? (
            <Button onClick={onButtonClick}>{buttonText}</Button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
