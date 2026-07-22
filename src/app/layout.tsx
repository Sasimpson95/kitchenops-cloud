import type { Metadata } from "next";
import "./globals.css";
import AndroidRuntime from "@/components/AndroidRuntime";

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
        <AndroidRuntime />
        {children}
      </body>
    </html>
  );
}
