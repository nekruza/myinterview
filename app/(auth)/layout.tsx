import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.jpg"
              alt="MyInterview logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold text-secondary">
              MyInterview
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
