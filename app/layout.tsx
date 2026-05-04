import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai"],
});

export const metadata: Metadata = {
  title: "Kruakoonpim",
  manifest: "/maniest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${anuphan.variable} font-anuphan antialiased h-[100dvh] overflow-y-auto`}
      >
        <SiteHeader />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
