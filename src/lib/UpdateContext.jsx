import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const UpdateContext = createContext(null);

export function UpdateProvider({ children }) {
  const [updateInfo, setUpdateInfo] = useState(null); // { version, update }
  const [status, setStatus] = useState(null); // null | checking | available | latest | downloading | error
  const [lastChecked, setLastChecked] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0); // 0-100

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
    setDownloadProgress(0);
    try {
      let downloaded = 0;
      let total = 0;
      await updateInfo.update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength || 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength || 0;
          if (total > 0) setDownloadProgress(Math.round((downloaded / total) * 100));
        } else if (event.event === "Finished") {
          setDownloadProgress(100);
        }
      });
      await relaunch();
    } catch {
      setStatus("error");
      setDownloadProgress(0);
      setTimeout(() => setStatus(null), 3000);
    }
  }, [updateInfo]);

  return (
    <UpdateContext.Provider value={{ updateInfo, status, lastChecked, downloadProgress, checkUpdate, installUpdate }}>
      {children}
    </UpdateContext.Provider>
  );
}

export const useUpdate = () => useContext(UpdateContext);
