import { storageKeyName } from "./storage";

export interface StorageHealth {
  localBytes: number;
  usageBytes: number | null;
  quotaBytes: number | null;
  usageRatio: number | null;
  persisted: boolean | null;
}

export async function getStorageHealth(): Promise<StorageHealth> {
  const local = localStorage.getItem(storageKeyName()) ?? "";
  const localBytes = new TextEncoder().encode(local).byteLength;
  if (!navigator.storage?.estimate) {
    return { localBytes, usageBytes: null, quotaBytes: null, usageRatio: null, persisted: null };
  }
  const [estimate, persisted] = await Promise.all([
    navigator.storage.estimate(),
    navigator.storage.persisted?.().catch(() => null) ?? Promise.resolve(null)
  ]);
  const usageBytes = estimate.usage ?? null;
  const quotaBytes = estimate.quota ?? null;
  const usageRatio = usageBytes !== null && quotaBytes ? usageBytes / quotaBytes : null;
  return { localBytes, usageBytes, quotaBytes, usageRatio, persisted };
}

export async function requestPersistentStorage(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null;
  try {
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
