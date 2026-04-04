"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fireSignupConversion } from "@/lib/conversion";

export function SignupConversionTracker() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams?.get("new") !== "1") return;
    fireSignupConversion();
    router.replace("/app/dashboard");
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
