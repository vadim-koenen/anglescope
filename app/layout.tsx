import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AngleScope",
  description: "Creative intelligence engine for analyzing winning ad angles."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
