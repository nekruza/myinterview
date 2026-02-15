import { FC, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-100 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer";

  const variantStyles = {
    primary:
      "bg-primary text-secondary shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95",
    secondary:
      "bg-secondary text-white shadow-[4px_4px_0px_0px_#374151] hover:brightness-110 active:shadow-[2px_2px_0px_0px_#374151]",
    outline:
      "border-2 border-secondary text-secondary shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-neutral-100",
  };

  const sizeStyles = {
    sm: "px-6 py-2 text-sm",
    md: "px-8 py-3 text-base",
    lg: "px-10 py-5 text-lg",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
