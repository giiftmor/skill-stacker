import type { Metadata } from "next";
import { Fraunces, Mulish } from "next/font/google";
import "./globals.css";

const mulish = Mulish({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spectres | Skill Stack",
  description: "AI-Powered CV Builder",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body className={`${mulish.variable} ${fraunces.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}