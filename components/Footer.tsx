import { FC } from "react";
import Link from "next/link";
import Image from "next/image";

export const Footer: FC = () => {
  const footerLinks = {
    resources: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Blog", href: "/blog" },
      { name: "Interview Tips", href: "/blog" },
      { name: "Anxiety Guide", href: "/blog/how-to-stop-mind-going-blank-interview" },
    ],
    company: [
      { name: "Careers", href: "#join-team" },
      { name: "Contact", href: "/contact" },
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
      { name: "Admin", href: "/admin" },
    ],
  };

  return (
    <footer className="bg-secondary text-white pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 mb-12 gap-x-6">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/logo.jpg"
                alt="MyInterview logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-2xl font-bold">MyInterview</span>
            </div>
            <p className="text-neutral-400 mb-6 leading-relaxed">
              Helping engineers conquer interview anxiety through AI-powered
              practice and peer support.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.linkedin.com/company/myinterview-me/"
                className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-primary transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="flex gap-24 justify-end"> 
          {/* Resources Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-lg">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-neutral-400 hover:text-white transition"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-lg">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-neutral-400 hover:text-white transition"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400 text-sm">
            &copy; 2026 MyInterview. All rights reserved.
          </p>
          <p className="text-neutral-400 text-sm mt-4 md:mt-0">
            Built with ❤️ for engineers who deserve better
          </p>
        </div>
      </div>
    </footer>
  );
};
