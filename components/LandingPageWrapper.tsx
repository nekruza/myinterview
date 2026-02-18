"use client";

import { FC, ReactNode } from "react";
import { ComingSoonProvider } from "./ComingSoonProvider";

export const LandingPageWrapper: FC<{ children: ReactNode }> = ({
  children,
}) => {
  return <ComingSoonProvider>{children}</ComingSoonProvider>;
};
