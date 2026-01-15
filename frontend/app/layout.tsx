import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner"
import { LoadingProvider } from "./context/loadingContext"

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
        <LoadingProvider>
          <Toaster />
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}
