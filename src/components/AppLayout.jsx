import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useSettings } from "../lib/SettingsContext";
import { useNotif } from "../lib/NotifContext";
import { useUpdate } from "../lib/UpdateContext";
import { LayoutDashboard, Calendar, Download, Image, User, LogOut, Settings, ShieldCheck, Bell, Info, CheckCircle, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { heartbeatApi } from "../lib/api";
import { useEffect, useState, useRef } from "react";
import InAppNotifications from "./InAppNotifications";
import BigModeScreen from "./BigModeScreen";
import { AnimatePresence, motion } from "framer-motion";

function BigIntroOverlay({ onDone }) {
  const videoRef = useRef(null);
  const [opacity, setOpacity] = useState(1);
  const doneCalledRef = useRef(false);

  const finish = () => {
    if (doneCalledRef.current) return;
    doneCalledRef.current = true;
    setOpacity(0);
    setTimeout(onDone, 800);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => finish());
    v.addEventListener("ended", finish);

    const onTimeUpdate = () => {
      if (!v.duration || doneCalledRef.current) return;
      if (v.duration - v.currentTime <= 2) finish();
    };
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      v.removeEventListener("ended", finish);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={finish}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "#000", cursor: "pointer",
        opacity, transition: "opacity 0.8s ease",
        pointerEvents: opacity < 0.1 ? "none" : "auto",
      }}
    >
      <video
        ref={videoRef}
        src="/c-one_intro.mp4"
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{
        position: "absolute", bottom: 28, right: 28,
        fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)",
        letterSpacing: 1.5, textTransform: "uppercase",
      }}>Geç ›</div>
    </motion.div>
  );
}

const LOGOS = {
  logotype2025: "/Corleone-Logotype-2025.png",
  logotype:     "/logotype.png",
  logo:         "/logo-square.png",
};

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/events",    icon: Calendar,        label: "Etkinlikler" },
  { to: "/downloads", icon: Download,        label: "İndirmeler" },
  { to: "/media",     icon: Image,           label: "Medya" },
  { to: "/profile",   icon: User,            label: "Profil" },
  { to: "/settings",  icon: Settings,        label: "Ayarlar" },
];

const TYPE_ICON = {
  info:    Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger:  AlertCircle,
  event:   Bell,
};
const TYPE_COLOR = {
  info: "#3b82f6", success: "#2ecc71", warning: "#f5a623", danger: "#e74c3c", event: "#9b59b6",
};

function formatTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m}dk önce`;
  return `${Math.floor(m / 60)}s önce`;
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { inbox, clearInbox } = useNotif();
  const { updateInfo, status: updateStatus, installUpdate, downloadProgress } = useUpdate();
  const updating = updateStatus === "downloading";
  const logoSrc = LOGOS[settings.sidebarLogo] ?? LOGOS.logotype2025;
  const isAdmin = user?.role === "admin" || user?.role === "moderator";
  const [version, setVersion] = useState("");
  const [inboxOpen, setInboxOpen] = useState(false);
  const [bigMode, setBigMode] = useState(false);
  const [bigIntro, setBigIntro] = useState(false);
  const inboxRef = useRef(null);

  // Başlangıçta C-ONE aç ayarı
  useEffect(() => {
    if (settings.c1_startWithBigMode) {
      if (settings.c1_showIntro) setBigIntro(true);
      else setBigMode(true);
    }
  }, []);

  useEffect(() => {
    getVersion()
      .then(v => { setVersion(v); heartbeatApi.ping(v).catch(() => {}); })
      .catch(() => { setVersion("0.6.2"); heartbeatApi.ping("0.6.2").catch(() => {}); });
  }, []);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    function handler(e) {
      if (inboxRef.current && !inboxRef.current.contains(e.target)) setInboxOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = inbox.length;

  return (
    <div className="app-shell">
      <AnimatePresence>
        {bigIntro && (
          <BigIntroOverlay onDone={() => { setBigIntro(false); setBigMode(true); }} />
        )}
        {bigMode && <BigModeScreen onExit={() => setBigMode(false)} />}
      </AnimatePresence>
      <InAppNotifications />

      <header className="topbar">
        <div className="topbar-logo">
          <img src={logoSrc} alt="Corleone" style={{ height: 28 }} />
          {version && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "#fff",
              background: "#555", padding: "2px 7px", borderRadius: 6, letterSpacing: .4 }}>
              v{version}
            </span>
          )}
          <span
            onClick={() => { try { const s = new Audio('/sounds/c-one_onay.wav'); s.volume = 0.5; s.play().catch(()=>{}); } catch {} if (settings.c1_showIntro) setBigIntro(true); else setBigMode(true); }}
            style={{
              fontSize: 11, fontWeight: 900, color: "#f5a623",
              background: "rgba(245,166,35,.1)",
              border: "1.5px solid #7c3aed",
              padding: "14px 20px", borderRadius: 8, letterSpacing: 3,
              textTransform: "uppercase",
              boxShadow: "0 0 10px rgba(124,58,237,.4), inset 0 0 8px rgba(245,166,35,.06)",
              lineHeight: 1, cursor: "pointer", transition: "all .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 20px rgba(124,58,237,.7), inset 0 0 12px rgba(245,166,35,.1)"; e.currentTarget.style.borderColor = "#a855f7"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 10px rgba(124,58,237,.4), inset 0 0 8px rgba(245,166,35,.06)"; e.currentTarget.style.borderColor = "#7c3aed"; }}
          >C-ONE</span>
        </div>

        <nav className="topbar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}>
              <Icon />{label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}>
              <ShieldCheck />Admin
            </NavLink>
          )}
        </nav>

        <div className="topbar-user">
          {/* Güncelleme ikonu */}
          {updateInfo && (
            <button
              onClick={async () => {
                if (updating) return;
                installUpdate();
              }}
              title={updating ? `İndiriliyor... %${downloadProgress}` : `Sürüm ${updateInfo.version} mevcut — tıkla yükle`}
              style={{
                position: "relative", width: 34, height: 34, borderRadius: 8,
                background: "rgba(245,166,35,.12)",
                border: "1px solid rgba(245,166,35,.35)",
                color: "#f5a623", cursor: updating ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s", overflow: "hidden",
              }}
            >
              {updating && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0,
                  height: 3, background: "#f5a623",
                  width: `${downloadProgress}%`, transition: "width .3s ease",
                  borderRadius: "0 0 8px 8px",
                }} />
              )}
              <RefreshCw size={15} style={{ animation: updating ? "spin 1s linear infinite" : "none" }} />
              {!updating && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#f5a623", color: "#000", borderRadius: 20,
                  fontSize: 8, fontWeight: 900, padding: "1px 4px",
                  minWidth: 16, textAlign: "center", lineHeight: "14px",
                }}>NEW</span>
              )}
              {updating && downloadProgress > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#f5a623", color: "#000", borderRadius: 20,
                  fontSize: 7, fontWeight: 900, padding: "1px 4px",
                  minWidth: 16, textAlign: "center", lineHeight: "14px",
                }}>{downloadProgress}%</span>
              )}
            </button>
          )}

          {/* Bildirim zili */}
          <div ref={inboxRef} style={{ position: "relative" }}>
            <button
              onClick={() => setInboxOpen(o => !o)}
              style={{
                position: "relative", width: 34, height: 34, borderRadius: 8,
                background: inboxOpen ? "rgba(245,166,35,.12)" : "rgba(255,255,255,.05)",
                border: `1px solid ${inboxOpen ? "rgba(245,166,35,.3)" : "rgba(255,255,255,.08)"}`,
                color: inboxOpen ? "#f5a623" : "#888", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s",
              }}
            >
              <Bell size={15} />
              {unread > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#e74c3c", color: "#fff", borderRadius: 20,
                  fontSize: 9, fontWeight: 800, padding: "1px 5px",
                  minWidth: 16, textAlign: "center", lineHeight: "14px",
                }}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {inboxOpen && (
              <div style={{
                position: "fixed", top: "calc(var(--topbar-height) + 8px)", right: 16,
                width: 320, background: "#1a1714",
                border: "1px solid rgba(255,255,255,.1)", borderRadius: 12,
                boxShadow: "0 16px 48px rgba(0,0,0,.7)", zIndex: 99999, overflow: "hidden",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Bildirimler</span>
                  {inbox.length > 0 && (
                    <button onClick={clearInbox} style={{ background: "none", border: "none", color: "#f5a623", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                      Temizle
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  {inbox.length === 0 ? (
                    <div style={{ padding: "32px 16px", textAlign: "center", color: "#555", fontSize: 13 }}>
                      <Bell size={28} style={{ marginBottom: 8, opacity: .4 }} />
                      <div>Bildirim yok</div>
                    </div>
                  ) : inbox.map(n => {
                    const Icon = TYPE_ICON[n.type] || Info;
                    const color = TYPE_COLOR[n.type] || "#3b82f6";
                    return (
                      <div key={n.id} style={{
                        display: "flex", gap: 10, padding: "10px 14px",
                        borderBottom: "1px solid rgba(255,255,255,.05)",
                        transition: "background .15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <Icon size={14} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{n.title}</div>
                          {n.body && <div style={{ fontSize: 11, color: "#888", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>}
                          <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>{formatTime(n.time)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <img
            className="topbar-avatar"
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=333&color=f5a623`}
            alt={user?.username}
          />
          <div>
            <div className="topbar-username">{user?.username}</div>
            <div className="topbar-role">{user?.role || "Üye"}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Çıkış Yap">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main className="page-content" style={{ overflowX: "hidden" }}>
        {children}
      </main>
    </div>
  );
}
