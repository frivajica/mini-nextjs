import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Next.js Test",
  description: "Production-ready Next.js learning project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
