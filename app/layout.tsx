import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai"],
});

export const metadata: Metadata = {
  title: "monkey",
  description: "jeung",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${anuphan.variable} font-anuphan antialiased size-full`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
