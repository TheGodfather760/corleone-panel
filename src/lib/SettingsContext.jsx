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
  sidebarLogo: "logotype2025",
  skipIntro: false,
  // C-ONE ayarları
  c1_startWithBigMode: false,
  c1_musicEnabled: false,
  c1_musicVolume: 12,
  c1_accentColor: "#f5a623",
  c1_showIntro: true,
  c1_soundEnabled: true,
  c1_font: "LemonMilk",
  c1_fontSize: 1,
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
    // C-ONE font
    const fontMap = {
      "LemonMilk":      "'LemonMilk', 'Segoe UI', sans-serif",
      "Orbitron":       "'Orbitron', 'Segoe UI', sans-serif",
      "Rajdhani":       "'Rajdhani', 'Segoe UI', sans-serif",
      "Exo2":           "'Exo 2', 'Segoe UI', sans-serif",
      "ShareTechMono":  "'Share Tech Mono', monospace",
      "SegoeUI":        "'Segoe UI', sans-serif",
      "Ubuntu":         "'Ubuntu', sans-serif",
      "CenturyGothic":  "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
    };
    document.documentElement.style.setProperty("--c1-font", fontMap[settings.c1_font] || fontMap["LemonMilk"]);
    // C-ONE font scale
    document.documentElement.style.setProperty("--c1-scale", settings.c1_fontSize ?? 1);
  }, [settings]);

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
