import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import "./globals.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai"],
});

export const metadata: Metadata = {
  title: "Kruakoonpim",
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
