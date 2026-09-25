import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";

const HOME_URL = "https://corleoneteam.com.tr";

export default function InAppBrowser({ onClose, accent = "#f5a623" }) {
  const [phase, setPhase] = useState("opening"); // opening | open | closing

  useEffect(() => {
    let unlisten = null;

    const openBrowser = async () => {
      try {
        const existing = await WebviewWindow.getByLabel("browser").catch(() => null);
        if (existing) await existing.close().catch(() => {});

        new WebviewWindow("browser", {
          url: HOME_URL,
          title: "corleoneteam.com.tr — C-ONE",
          width: 1280,
          height: 820,
          center: true,
          resizable: true,
          decorations: true,
          alwaysOnTop: false,
          focus: true,
        });

        const unlistenDestroyed = await listen("tauri://destroyed", (event) => {
          if (event.windowLabel === "browser") {
            unlistenDestroyed();
            setPhase("closing");
            setTimeout(onClose, 300);
          }
        });
        unlisten = unlistenDestroyed;
        setPhase("open");
      } catch (e) {
        console.error("Browser açılamadı:", e);
        onClose();
      }
    };

    openBrowser();

    return () => {
      if (unlisten) unlisten();
      WebviewWindow.getByLabel("browser")
        .then(w => w?.close())
        .catch(() => {});
    };
  }, []);

  return (
    <AnimatePresence>
      {phase === "opening" && (
        <motion.div
          key="browser-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute", inset: 0, zIndex: 150,
            background: "rgba(0,0,0,.85)", backdropFilter: "blur(12px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 20,
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 64, height: 64, borderRadius: "50%",
              background: `${accent}15`, border: `2px solid ${accent}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Globe size={28} color={accent} />
          </motion.div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
              corleoneteam.com.tr
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>
              Açılıyor…
            </div>
          </div>

          <motion.div style={{ width: 200, height: 2, background: "rgba(255,255,255,.08)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "60%", height: "100%", background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, borderRadius: 2 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
