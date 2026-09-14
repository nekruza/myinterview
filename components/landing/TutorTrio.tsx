import Image from "next/image";
import { TUTORS, type TutorId } from "@/lib/tutors";

const ORDER: TutorId[] = ["luna", "henry", "jake"];

/** Overlapping round portraits of Luna, Henry and Jake (the mobile welcome-screen trio). */
export function TutorTrio({
  size = 64,
  ringClassName = "ring-cream",
  priority = false,
  className = "",
}: {
  size?: number;
  ringClassName?: string;
  priority?: boolean;
  className?: string;
}) {
  const tutors = ORDER.map((id) => TUTORS.find((t) => t.id === id)!);

  return (
    <div className={`flex items-end ${className}`}>
      {tutors.map((tutor, i) => (
        <div
          key={tutor.id}
          className={`relative shrink-0 overflow-hidden rounded-full bg-line ring-4 ${ringClassName} shadow-[0_10px_24px_-12px_rgba(27,26,23,0.45)]`}
          style={{
            width: size,
            height: size,
            marginLeft: i === 0 ? 0 : -Math.round(size * 0.27),
            transform: i === 1 ? `translateY(-${Math.round(size * 0.12)}px)` : undefined,
            zIndex: ORDER.length - i,
          }}
        >
          <Image
            src={tutor.image}
            alt={tutor.name}
            width={size * 2}
            height={size * 2}
            sizes={`${size}px`}
            priority={priority}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
