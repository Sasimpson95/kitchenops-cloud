import type { Metadata } from "next";
import "./globals.css";
import AndroidRuntime from "@/components/AndroidRuntime";
import ToastProvider from "@/components/ui/ToastProvider";

export const metadata: Metadata = {
  title: "KitchenOps",
  description: "Hospitality operations, inventory, prep and reporting.",
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
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
