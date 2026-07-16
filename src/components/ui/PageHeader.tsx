type PageHeaderProps = {
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
};

export default function PageHeader({
  title,
  description,
  buttonText,
  onButtonClick,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-4xl font-bold text-gray-950">
          {title}
        </h1>

        <p className="mt-2 text-lg text-gray-600">
          {description}
        </p>
      </div>

      {buttonText && (
        <button
          onClick={onButtonClick}
          className="rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white transition hover:bg-violet-900"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}