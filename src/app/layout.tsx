import type { Metadata } from "next";
import "./globals.css";
import AndroidRuntime from "@/components/AndroidRuntime";
import ToastProvider from "@/components/ui/ToastProvider";
import ThemeProvider from "@/components/theme/ThemeProvider";

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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('kitchenops-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ToastProvider>
            <AndroidRuntime />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
