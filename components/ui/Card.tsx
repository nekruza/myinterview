import { FC } from "react";
import { cn } from "@/lib/utils";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: FC<CardProps> = ({ children, className, hover = false }) => {
  return (
    <div
      className={cn(
        "glass-card rounded-3xl p-8",
        hover && "hover-lift",
        className
      )}
    >
      {children}
    </div>
  );
};
