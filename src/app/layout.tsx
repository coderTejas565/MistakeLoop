import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MistakeLoop",
  description: "Turn mistakes into targeted revision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}