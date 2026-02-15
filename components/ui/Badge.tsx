import { FC } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps {
  variant?: "primary" | "secondary" | "success" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export const Badge: FC<BadgeProps> = ({
  variant = "primary",
  children,
  className,
}) => {
  const variantStyles = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    success: "bg-green-100 text-green-700",
    neutral: "bg-neutral-100 text-neutral-700",
  };

  return (
    <span
      className={cn(
        "inline-block px-4 py-2 rounded-full text-sm font-bold",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
