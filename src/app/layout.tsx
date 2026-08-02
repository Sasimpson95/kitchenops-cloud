import type { Metadata } from "next";
import "./globals.css";
import AndroidRuntime from "@/components/AndroidRuntime";
import ToastProvider from "@/components/ui/ToastProvider";
import FirstRunWelcome from "@/components/FirstRunWelcome";

export const metadata: Metadata = {
  title: { default: "KitchenOps", template: "%s | KitchenOps" },
  description: "Run kitchen inventory, prep, recipes, purchasing, waste and handovers in one clear workspace.",
  applicationName: "KitchenOps",
  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <AndroidRuntime />
          <FirstRunWelcome />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
