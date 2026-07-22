"use client";

import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { WifiOff } from "lucide-react";

export default function AndroidRuntime() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!Capacitor.isNativePlatform()) {
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    document.documentElement.classList.add("capacitor-native");

    void StatusBar.setStyle({ style: Style.Light });
    void StatusBar.setBackgroundColor({ color: "#ffffff" });
    void SplashScreen.hide();

    const backListener = App.addListener("backButton", ({ canGoBack }) => {
      const openDialog = document.querySelector<HTMLElement>(
        '[role="dialog"], [data-mobile-sheet="true"]'
      );

      if (openDialog) {
        const closeButton = openDialog.querySelector<HTMLButtonElement>(
          '[data-dialog-close="true"], button[aria-label="Close"]'
        );
        closeButton?.click();
        return;
      }

      if (canGoBack && window.history.length > 1) {
        window.history.back();
        return;
      }

      void App.minimizeApp();
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.documentElement.classList.remove("capacitor-native");
      void backListener.then((listener) => listener.remove());
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
          <WifiOff size={30} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-gray-950">No internet connection</h1>
        <p className="mt-3 text-gray-600">
          KitchenOps needs an internet connection to keep your business data current.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-7 min-h-12 w-full rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
