import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/40",
  secondary:
    "bg-transparent text-foreground border border-border hover:bg-muted disabled:opacity-40",
  ghost:
    "bg-transparent text-muted-foreground hover:text-foreground disabled:opacity-40",
};

// Shared with components that render a link styled as a button (see
// components/ui/link-button.tsx) instead of an actual <button>.
export function buttonClassName(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed",
    variantClasses[variant],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonClassName(variant, className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
