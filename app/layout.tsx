import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PaymentProvider } from "@/components/providers/payment-provider";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "APIfyn – No-code API Automation",
  description:
    "Build powerful API automations with a visual workflow builder. Connect GitHub, Slack, and more without writing code.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <PaymentProvider>
            <ToastProvider>{children}</ToastProvider>
          </PaymentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
