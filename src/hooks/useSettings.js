import { useState } from "react";

const SETTINGS_KEY = "stortrack_settings";
export const defaultSettings = { storeName: "StorTrack", overdueDays: 7, commissions: {} };

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; }
    catch { return defaultSettings; }
  });
  const save = (updates) => {
    const next = { ...settings, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    setSettings(next);
  };
  return { settings, save };
}
