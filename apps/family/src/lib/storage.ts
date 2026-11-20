import type { HouseholdState } from "./types";

const STORAGE_KEY = "little-sprout-family-v1";

export function loadHousehold(): HouseholdState | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as HouseholdState : null;
  } catch {
    return null;
  }
}

export function saveHousehold(household: HouseholdState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(household));
}

export function clearHousehold(): void {
  localStorage.removeItem(STORAGE_KEY);
}
