import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex" style={{ background: "#080c09" }}>
      {/* ── Left brand panel (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #071a09 0%, #0a1f0b 55%, #040d05 100%)",
        }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(45,236,41,0.07) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        {/* Ambient glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(45,236,41,0.06)" }}
        />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <Image
              src="/logo.jpg"
              alt="MyInterview"
              width={34}
              height={34}
              className="rounded-lg"
            />
            <span className="text-white font-bold text-lg">MyInterview</span>
          </Link>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center gap-8">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                style={{
                  background: "rgba(45,236,41,0.07)",
                  border: "1px solid rgba(45,236,41,0.18)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#2dec29" }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "rgba(45,236,41,0.65)" }}
                >
                  Cohort 1 · Now Forming
                </span>
              </div>

              <h2 className="text-[2.2rem] font-black leading-[1.1] mb-4 text-white">
                From graduate
                <br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #2dec29 0%, #86efac 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  to hired.
                </span>
              </h2>
              <p
                className="text-sm leading-relaxed max-w-[290px]"
                style={{ color: "rgba(255,255,255,0.42)" }}
              >
                Start with 3 free AI mock interviews — no card needed. Join the
                waitlist for the full career programme when you&apos;re ready.
              </p>
            </div>

            {/* What you get free */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(45,236,41,0.04)",
                border: "1px solid rgba(45,236,41,0.1)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(45,236,41,0.5)" }}>
                Free — no card required
              </p>
              <div className="space-y-3">
                {[
                  "3 full AI mock interview sessions",
                  "Resume-tailored questions per role",
                  "Instant scored feedback after each session",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(45,236,41,0.12)",
                        border: "1px solid rgba(45,236,41,0.25)",
                      }}
                    >
                      <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2 2 4-4" stroke="#2dec29" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Career service teaser */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.28)" }}>
                Full career programme
              </p>
              <div className="space-y-2">
                {[
                  { icon: "🏢", text: "3-month internship at a partner company" },
                  { icon: "📄", text: "1-on-1 CV rewrite from a specialist" },
                  { icon: "💼", text: "£499 placement fee — only on success" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p
              className="text-sm leading-relaxed italic mb-3"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              &ldquo;I&apos;d been rejected 14 times before this. Having 3 months of
              real internship work to talk about changed everything.&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: "rgba(45,236,41,0.2)",
                  border: "1px solid rgba(45,236,41,0.3)",
                  color: "#2dec29",
                }}
              >
                M
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Marcus T.
                </div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Hired in 2 weeks · Junior Developer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="MyInterview"
              width={34}
              height={34}
              className="rounded-lg"
            />
            <span className="text-white font-bold text-xl">MyInterview</span>
          </Link>
        </div>
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
