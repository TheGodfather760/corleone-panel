import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useSettings } from "../lib/SettingsContext";
import { LayoutDashboard, Calendar, Download, Image, User, LogOut, Settings } from "lucide-react";

const LOGOS = {
  logotype2025: "/Corleone-Logotype-2025.png",
  logotype:     "/logotype.png",
  logo:         "/logo-square.png",
};

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/events",    icon: Calendar,         label: "Etkinlikler" },
  { to: "/downloads", icon: Download,         label: "İndirmeler" },
  { to: "/media",     icon: Image,            label: "Medya" },
  { to: "/profile",   icon: User,             label: "Profil" },
  { to: "/settings",  icon: Settings,         label: "Ayarlar" },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const logoSrc = LOGOS[settings.sidebarLogo] ?? LOGOS.logotype2025;

  return (
    <div className="app-shell">
      <header className="topbar">
        {/* Logo */}
        <div className="topbar-logo">
          <img src={logoSrc} alt="Corleone" style={{ height: 28 }} />
        </div>

        {/* Nav ikonları */}
        <nav className="topbar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Kullanıcı */}
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
