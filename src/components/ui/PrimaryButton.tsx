import type { ButtonHTMLAttributes, ReactNode } from "react";
import Button from "./Button";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function PrimaryButton({ children, ...props }: PrimaryButtonProps) {
  return <Button {...props}>{children}</Button>;
}
