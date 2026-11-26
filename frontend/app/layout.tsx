import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AnimateUIProvider } from "@animate-ui/react/provider";
import { Toaster } from "sonner";
import { LoadingProvider } from "./context/loadingContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DataStorm · Retail Intelligence",
  description:
    "Sales analytics, inventory health and 7-day demand forecasting for retail teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <AnimateUIProvider>
          <LoadingProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast:
                    "!rounded-xl !border-border !bg-card !text-foreground !shadow-lg",
                  description: "!text-muted-foreground",
                },
              }}
            />
            {children}
          </LoadingProvider>
        </AnimateUIProvider>
      </body>
    </html>
  );
}
