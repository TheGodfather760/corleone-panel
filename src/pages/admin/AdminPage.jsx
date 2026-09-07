import { useState } from "react";
import { Newspaper, Calendar, Mail, FolderOpen, Users } from "lucide-react";
import AdminNewsPage from "./AdminNewsPage";
import AdminEventsPage from "./AdminEventsPage";
import AdminInvitesPage from "./AdminInvitesPage";
import AdminDownloadsPage from "./AdminDownloadsPage";
import AdminUsersPage from "./AdminUsersPage";

const TABS = [
  { key: "news",      label: "Haberler",      icon: Newspaper,  component: AdminNewsPage },
  { key: "events",    label: "Etkinlikler",   icon: Calendar,   component: AdminEventsPage },
  { key: "invites",   label: "Davetler",      icon: Mail,       component: AdminInvitesPage },
  { key: "downloads", label: "Dosyalar",      icon: FolderOpen, component: AdminDownloadsPage },
  { key: "users",     label: "Üyeler",        icon: Users,      component: AdminUsersPage },
];

export default function AdminPage() {
  const [active, setActive] = useState("news");
  const ActiveComponent = TABS.find(t => t.key === active)?.component;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Admin Paneli</h1>
        <p className="page-subtitle">Yönetim araçları</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 6 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActive(key)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all .2s",
              background: active === key ? "rgba(245,166,35,.15)" : "transparent",
              color: active === key ? "#f5a623" : "#666",
              borderBottom: active === key ? "2px solid #f5a623" : "2px solid transparent",
            }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {ActiveComponent && <ActiveComponent />}
    </>
  );
}
