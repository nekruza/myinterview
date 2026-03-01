"use client";

import { useState } from "react";
import { OnboardingModal } from "./OnboardingModal";

export function OnboardingWrapper({ isOnboarded }: { isOnboarded: boolean }) {
  const [showModal, setShowModal] = useState(!isOnboarded);

  if (!showModal) return null;

  return <OnboardingModal onComplete={() => setShowModal(false)} />;
}
