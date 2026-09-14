import Link from "next/link";
import { TutorTrio } from "./TutorTrio";
import { shell } from "./styles";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="px-4 pb-20 sm:px-6 md:pb-28">
      <div className={`${shell} fina-reveal rounded-[32px] bg-accent-brand px-6 py-16 text-center text-cream sm:px-10 md:py-24`}>
        <TutorTrio size={56} ringClassName="ring-accent-brand" className="justify-center" />
        <h2
          id="final-cta-title"
          className="mx-auto mt-8 max-w-[15ch] pb-1 font-display fina-display text-[clamp(2.25rem,5.2vw,4rem)] font-medium leading-[1.06] tracking-[-0.025em] text-balance"
        >
          Say your first sentence <em className="italic">today.</em>
        </h2>
        <p className="mx-auto mt-5 max-w-[36ch] text-[17px] leading-relaxed text-cream/80">
          Luna, Henry and Jake are ready when you are.
        </p>
        <Link
          href="/onboarding"
          className="mt-9 inline-flex items-center justify-center whitespace-nowrap rounded-full bg-cream px-7 py-3.5 text-[15px] font-semibold tracking-[0.01em] text-ink transition-transform duration-200 ease-out hover:bg-surface active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream"
        >
          Get started
        </Link>
      </div>
    </section>
  );
}
