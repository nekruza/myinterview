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
        "bg-white rounded-3xl p-8 shadow-lg border-2 border-neutral-200",
        hover && "hover-lift",
        className
      )}
    >
      {children}
    </div>
  );
};
