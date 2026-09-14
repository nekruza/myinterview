import { Plus } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";
import { FAQ_ITEMS } from "./faq-data";
import { sectionHeading, shell } from "./styles";

export function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 border-t border-line px-4 py-20 sm:px-6 md:py-28">
      <div className={`${shell} grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20`}>
        <div className="self-start lg:sticky lg:top-28">
          <h2 id="faq-title" className={sectionHeading}>
            Good questions.
          </h2>
          <p className="mt-5 max-w-[34ch] text-[17px] leading-relaxed text-sub">
            Something we haven&apos;t covered? Email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>

        <div className="divide-y divide-line border-y border-line">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-lg font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-brand [&::-webkit-details-marker]:hidden">
                {item.question}
                <Plus
                  aria-hidden="true"
                  strokeWidth={1.75}
                  className="h-5 w-5 shrink-0 text-sub transition-transform duration-200 ease-out group-open:rotate-45"
                />
              </summary>
              <p className="max-w-[62ch] pb-6 pr-10 text-[16px] leading-relaxed text-sub">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
