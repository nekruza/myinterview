import Link from "next/link";
import Image from "next/image";
import { CONTACT_EMAIL } from "@/lib/site";
import { FOCUS_RING } from "@/components/landing/styles";

// Root-relative so the anchors also work from /privacy and /terms.
const linkGroups = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#features", label: "Features" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

const linkClass = `rounded text-[15px] text-sub transition-colors duration-200 hover:text-ink ${FOCUS_RING}`;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface px-4 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 py-14 sm:grid-cols-2 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <div className="sm:col-span-2 md:col-span-1">
          <Link href="/" className={`inline-flex items-center gap-2.5 rounded-lg ${FOCUS_RING}`}>
            <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg" />
            <span className="font-display fina-display text-xl font-semibold text-ink">Fina</span>
          </Link>
          <p className="mt-4 max-w-[30ch] text-[15px] leading-relaxed text-sub">
            Speak a new language out loud with AI tutors Luna, Henry and Jake.
          </p>
        </div>

        {linkGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-[13px] font-semibold text-ink">{group.title}</p>
            <ul className="mt-4 space-y-3">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <p className="text-[13px] font-semibold text-ink">Contact</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className={`mt-4 inline-block [overflow-wrap:anywhere] ${linkClass}`}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-6xl border-t border-line py-6">
        <p className="text-sm text-sub">&copy; {year} Fina. All rights reserved.</p>
      </div>
    </footer>
  );
}
