import { useEffect, useCallback } from "react";
import { invalidateExpenseRelatedQueries } from "@/lib/queryClient";

const DB_NAME = "expense-tracker";
const STORE_NAME = "offlineQueue";
const DB_VERSION = 1;

interface QueuedExpense {
  id?: number;
  data: {
    amount: number;
    currency: string;
    merchant: string;
    description?: string;
    categoryId?: number;
    date: string;
  };
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueue(expense: QueuedExpense["data"]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add({ data: expense, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAll(): Promise<QueuedExpense[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as QueuedExpense[]);
    req.onerror = () => reject(req.error);
  });
}

async function remove(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function flushQueue(): Promise<number> {
  const items = await getAll();
  let synced = 0;
  for (const item of items) {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(item.data),
      });
      if (res.ok && item.id !== undefined) {
        await remove(item.id);
        synced++;
      }
    } catch {
      // keep in queue
    }
  }
  if (synced > 0) {
    invalidateExpenseRelatedQueries();
  }
  return synced;
}

export function useOfflineQueue() {
  // Flush the queue whenever we come back online
  useEffect(() => {
    const handleOnline = async () => {
      try {
        const count = await flushQueue();
        if (count > 0) {
          console.log(`[OfflineQueue] Synced ${count} queued expense(s)`);
        }
      } catch {
        // silently ignore
      }
    };

    window.addEventListener("online", handleOnline);
    // Also try to flush on mount (in case we just came online)
    if (navigator.onLine) handleOnline();

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  /**
   * Submit an expense — immediately if online, or queue it for later if offline.
   */
  const submitExpense = useCallback(
    async (expense: QueuedExpense["data"]): Promise<"submitted" | "queued"> => {
      if (navigator.onLine) {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(expense),
        });
        if (!res.ok) throw new Error("Failed to submit expense");
        invalidateExpenseRelatedQueries();
        return "submitted";
      } else {
        await enqueue(expense);
        // Request background sync if supported
        if ("serviceWorker" in navigator && "SyncManager" in window) {
          const reg = await navigator.serviceWorker.ready;
          await (reg as any).sync.register("sync-expenses");
        }
        return "queued";
      }
    },
    []
  );

  return { submitExpense, isOnline: typeof navigator !== "undefined" ? navigator.onLine : true };
}
