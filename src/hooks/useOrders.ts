"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type { PurchaseOrder } from "@/data/orders";

import {
  getOrders,
  subscribeToOrderChanges,
} from "@/lib/orderStore";

export default function useOrders() {
  const [orders, setOrders] = useState<
    PurchaseOrder[]
  >([]);

  const refreshOrders = useCallback(() => {
    setOrders(getOrders());
  }, []);

  useEffect(() => {
    refreshOrders();

    const unsubscribe =
      subscribeToOrderChanges(refreshOrders);

    return unsubscribe;
  }, [refreshOrders]);

  return {
    orders,
    refreshOrders,
  };
}