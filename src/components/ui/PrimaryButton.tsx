type PrimaryButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

export default function PrimaryButton({
  children,
  onClick,
}: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900"
    >
      {children}
    </button>
  );
}