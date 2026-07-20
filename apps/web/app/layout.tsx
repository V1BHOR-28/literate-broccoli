import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signalboard",
  description: "AI-powered project management dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
