export const metadata = {
  title: "CarbonSage Control Plane",
  description: "Manage workspace evidence and test CarbonSage decisions.",
};

import { ReactNode } from "react";

export default function UserPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-primary">{children}</main>
  );
}
