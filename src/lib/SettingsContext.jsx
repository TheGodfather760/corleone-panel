import { createContext, useContext, useState, useEffect } from "react";

const DEFAULTS = {
  theme: "corleone",
  fontSize: "normal",
  startPage: "dashboard",
  downloadPath: "",
  animationsEnabled: true,
  eventReminder: true,
  announcementNotif: true,
  downloadNotif: true,
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("corleone_settings");
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  useEffect(() => {
    localStorage.setItem("corleone_settings", JSON.stringify(settings));
    document.documentElement.setAttribute("data-theme", settings.theme);
    const sizes = { small: "13px", normal: "14px", large: "16px" };
    document.documentElement.style.fontSize = sizes[settings.fontSize] || "14px";
    if (settings.animationsEnabled) {
      document.documentElement.style.removeProperty("--transition-speed");
    } else {
      document.documentElement.style.setProperty("--transition-speed", "0s");
    }
  }, [settings]);

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
