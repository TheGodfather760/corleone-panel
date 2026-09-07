import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useSettings } from "../lib/SettingsContext";
import { LayoutDashboard, Calendar, Download, Image, User, LogOut, Settings, Newspaper, Users, Mail, FolderOpen } from "lucide-react";

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

const adminItems = [
  { to: "/admin/news",      icon: Newspaper,  label: "Haberler" },
  { to: "/admin/events",    icon: Calendar,   label: "Etkinlik Yön." },
  { to: "/admin/invites",   icon: Mail,       label: "Davetler" },
  { to: "/admin/downloads", icon: FolderOpen, label: "Dosya Yön." },
  { to: "/admin/users",     icon: Users,      label: "Üye Yönetimi" },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const logoSrc = LOGOS[settings.sidebarLogo] ?? LOGOS.logotype2025;
  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-logo">
          <img src={logoSrc} alt="Corleone" style={{ height: 28 }} />
        </div>

        <nav className="topbar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}>
              <Icon />{label}
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <div style={{ width: 1, height: 20, background: "rgba(255,255,255,.1)", margin: "0 6px", alignSelf: "center" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "#f5a623", letterSpacing: 1, alignSelf: "center", opacity: .7 }}>ADMIN</span>
              {adminItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}>
                  <Icon />{label}
                </NavLink>
              ))}
            </>
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
