"use client";

import { useEffect, useState } from "react";

/**
 * Delays expensive derived work until the user pauses typing.
 * The input itself remains immediate; only consumers of the returned value wait.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}
