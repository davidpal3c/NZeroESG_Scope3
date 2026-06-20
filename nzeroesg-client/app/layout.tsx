import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import TemporaryBanner from "./components/temporary-banner";

export const metadata: Metadata = {
  title: "NZeroESG Scope 3",
  description: "Traceable freight-emissions and supplier-evidence prototype.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased scroll-smooth">
        <Providers>
          {children}
          <TemporaryBanner />
        </Providers>
      </body>
    </html>
  );
}
