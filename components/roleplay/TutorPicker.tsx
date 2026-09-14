"use client";

import { useRef, type KeyboardEvent } from "react";
import Image from "next/image";
import { TUTORS, type TutorId } from "@/lib/tutors";

export interface TutorPickerProps {
  value: TutorId;
  onChange: (id: TutorId) => void;
  size?: "sm" | "lg";
}

const SIZE_CLASSES: Record<"sm" | "lg", string> = {
  sm: "h-16 w-16",
  lg: "h-20 w-20",
};

const LAST_INDEX = TUTORS.length - 1;

/**
 * Accessible radiogroup of AI tutors — image, name, and blurb per option.
 *
 * Implements the ARIA APG radio group keyboard pattern with a roving
 * tabindex: only the selected radio is tabbable (`tabIndex 0`), the rest are
 * `-1`. ArrowRight/ArrowDown moves to (and wraps to) the next tutor,
 * ArrowLeft/ArrowUp to the previous, and Home/End jump to the first/last.
 * Selection follows focus, so moving calls `onChange` immediately.
 */
export function TutorPicker({ value, onChange, size = "lg" }: TutorPickerProps) {
  const avatarSize = SIZE_CLASSES[size];
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveTo(index: number) {
    const tutor = TUTORS[index];
    if (!tutor) return;
    onChange(tutor.id);
    buttonRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveTo(index === LAST_INDEX ? 0 : index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveTo(index === 0 ? LAST_INDEX : index - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(LAST_INDEX);
        break;
      default:
        break;
    }
  }

  return (
    <div role="radiogroup" aria-label="Choose your tutor" className="flex flex-wrap gap-3 sm:gap-4">
      {TUTORS.map((tutor, index) => {
        const selected = tutor.id === value;
        return (
          <button
            key={tutor.id}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tutor.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="flex w-24 flex-col items-center gap-2 rounded-2xl p-2 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
          >
            <span
              className={`relative block ${avatarSize} overflow-hidden rounded-full outline-offset-2 transition-all`}
              style={{
                outline: `2px solid ${selected ? tutor.accent : "transparent"}`,
                boxShadow: selected ? `0 0 16px ${tutor.accent}59` : "none",
              }}
            >
              <Image src={tutor.image} alt="" fill sizes="80px" className="object-cover" />
            </span>
            <span
              className="text-sm font-semibold transition-colors"
              style={{ color: selected ? tutor.accent : "var(--fina-sub)" }}
            >
              {tutor.name}
            </span>
            <span className="text-[11px] leading-snug text-sub">{tutor.blurb}</span>
          </button>
        );
      })}
    </div>
  );
}
