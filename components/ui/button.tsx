import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-gray-900 text-white hover:bg-gray-800 shadow-sm active:scale-[0.98]",
    secondary:
      "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm active:scale-[0.98]",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    danger:
      "bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.98]",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
