import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Internal Checklist MVP",
  description: "Operational checklist pilot for Regent Street",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
