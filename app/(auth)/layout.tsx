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
          <div className="flex-1 flex flex-col justify-center gap-9">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                style={{
                  background: "rgba(45,236,41,0.07)",
                  border: "1px solid rgba(45,236,41,0.18)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#2dec29" }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "rgba(45,236,41,0.65)" }}
                >
                  AI-Powered Interview Prep
                </span>
              </div>

              <h2 className="text-[2.4rem] font-black leading-[1.1] mb-4 text-white">
                Land your dream job
                <br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #2dec29 0%, #86efac 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  with confidence.
                </span>
              </h2>
              <p
                className="text-sm leading-relaxed max-w-[280px]"
                style={{ color: "rgba(255,255,255,0.42)" }}
              >
                Practice with AI feedback, compete with peers, and track your
                progress toward your next offer.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "500+", label: "Active Users" },
                { value: "10k+", label: "Interviews Done" },
                { value: "94%", label: "Success Rate" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(45,236,41,0.04)",
                    border: "1px solid rgba(45,236,41,0.1)",
                  }}
                >
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Feature checklist */}
            <div className="space-y-3">
              {[
                "Real-time AI feedback on every answer",
                "Peer practice with live video sessions",
                "Progress tracking across all competencies",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(45,236,41,0.08)",
                      border: "1px solid rgba(45,236,41,0.22)",
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#2dec29"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {f}
                  </span>
                </div>
              ))}
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
              &ldquo;I landed 3 interviews in one week after practicing with
              MyInterview for just 2 days.&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #2dec29, #16a34a)",
                }}
              >
                S
              </div>
              <div>
                <div
                  className="text-xs font-semibold"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  Sarah K.
                </div>
                <div
                  className="text-[10px]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  Software Engineer @ Google
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
