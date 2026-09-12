import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const UpdateContext = createContext(null);

export function UpdateProvider({ children }) {
  const [updateInfo, setUpdateInfo] = useState(null); // { version, update }
  const [status, setStatus] = useState(null); // null | checking | available | latest | downloading | error
  const [lastChecked, setLastChecked] = useState(null);

  // Uygulama açılınca otomatik kontrol
  useEffect(() => { checkUpdate(); }, []);

  const checkUpdate = useCallback(async () => {
    setStatus("checking");
    try {
      const u = await check();
      if (u?.available) {
        setUpdateInfo({ version: u.version, update: u });
        setStatus("available");
      } else {
        setUpdateInfo(null);
        setStatus("latest");
        setLastChecked(new Date());
        setTimeout(() => setStatus(null), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus(null), 3000);
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!updateInfo) return;
    setStatus("downloading");
    try {
      await updateInfo.update.downloadAndInstall();
      await relaunch();
    } catch {
      setStatus("error");
      setTimeout(() => setStatus(null), 3000);
    }
  }, [updateInfo]);

  return (
    <UpdateContext.Provider value={{ updateInfo, status, lastChecked, checkUpdate, installUpdate }}>
      {children}
    </UpdateContext.Provider>
  );
}

export const useUpdate = () => useContext(UpdateContext);
