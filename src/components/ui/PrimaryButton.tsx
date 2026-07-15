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
      className="rounded-xl bg-green-800 px-6 py-3 font-semibold text-white hover:bg-green-900"
    >
      {children}
    </button>
  );
}