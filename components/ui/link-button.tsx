import Link, { type LinkProps } from "next/link";
import { type ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button";

export function LinkButton({
  variant = "primary",
  className,
  children,
  ...props
}: LinkProps & {
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link className={buttonClassName(variant, className)} {...props}>
      {children}
    </Link>
  );
}
