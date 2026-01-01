import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "DOM Team - Demand Forecasting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        <Toaster />
        {children}
      </body>
    </html>
  );
}
