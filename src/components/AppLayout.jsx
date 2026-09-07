import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useSettings } from "../lib/SettingsContext";
import { LayoutDashboard, Calendar, Download, Image, User, LogOut, Settings, ShieldCheck } from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";

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



export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const logoSrc = LOGOS[settings.sidebarLogo] ?? LOGOS.logotype2025;
  const isAdmin = user?.role === "admin" || user?.role === "moderator";
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion("0.5.0"));
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-logo">
          <img src={logoSrc} alt="Corleone" style={{ height: 28 }} />
          {version && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "#fff",
              background: "#555", padding: "2px 7px", borderRadius: 6, letterSpacing: .4 }}>
              v{version}
            </span>
          )}
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
