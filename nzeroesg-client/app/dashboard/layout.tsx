export const metadata = {
  title: "User Portal",
  description: "User Portal for NZeroes ESG",
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
