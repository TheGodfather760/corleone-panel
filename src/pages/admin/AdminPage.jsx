import { useState } from "react";
import {
  Calendar, Map, Image, Mail, Users, Star, FolderOpen,
  Bell, Truck, Package, Layers, ChevronRight
} from "lucide-react";
import AdminEventsPage        from "./AdminEventsPage";
import AdminRoutesPage        from "./AdminRoutesPage";
import AdminMediaPage         from "./AdminMediaPage";
import AdminInvitesPage       from "./AdminInvitesPage";
import AdminUsersPage         from "./AdminUsersPage";
import AdminPointsPage        from "./AdminPointsPage";
import AdminDownloadsPage     from "./AdminDownloadsPage";
import AdminNotificationsPage from "./AdminNotificationsPage";
import AdminFleetTrucksPage   from "./AdminFleetTrucksPage";
import AdminFleetTrailersPage from "./AdminFleetTrailersPage";
import AdminPromodsETS2Page   from "./AdminPromodsETS2Page";
import AdminPromodsATSPage    from "./AdminPromodsATSPage";

const GROUPS = [
  {
    label: "Etkinlik & Rotalar",
    icon: Calendar,
    color: "#f5a623",
    items: [
      { key: "events",  label: "Etkinlikler",    icon: Calendar,   component: AdminEventsPage },
      { key: "routes",  label: "Rota Deposu",    icon: Map,        component: AdminRoutesPage },
    ],
  },
  {
    label: "Topluluk",
    icon: Users,
    color: "#3498db",
    items: [
      { key: "media",     label: "Uye Medyasi",     icon: Image,      component: AdminMediaPage },
      { key: "invites",   label: "Davetler",         icon: Mail,       component: AdminInvitesPage },
      { key: "users",     label: "Kullanicilar",     icon: Users,      component: AdminUsersPage },
      { key: "points",    label: "Puan & Rank",      icon: Star,       component: AdminPointsPage },
      { key: "downloads", label: "Dosya Yonetimi",   icon: FolderOpen, component: AdminDownloadsPage },
    ],
  },
  {
    label: "Bildirimler",
    icon: Bell,
    color: "#9b59b6",
    items: [
      { key: "notifications", label: "Bildirimler", icon: Bell, component: AdminNotificationsPage },
    ],
  },
  {
    label: "Arac Filosu",
    icon: Truck,
    color: "#2ecc71",
    items: [
      { key: "fleet-trucks",   label: "ETS2 Cekiciler", icon: Truck,   component: AdminFleetTrucksPage },
      { key: "fleet-trailers", label: "ETS2 Dorseler",  icon: Package, component: AdminFleetTrailersPage },
    ],
  },
  {
    label: "ProMods",
    icon: Layers,
    color: "#e74c3c",
    items: [
      { key: "promods-ets2", label: "ETS2", icon: Layers, component: AdminPromodsETS2Page },
      { key: "promods-ats",  label: "ATS",  icon: Layers, component: AdminPromodsATSPage },
    ],
  },
];

// Tum item'lari duz liste olarak al
const ALL_ITEMS = GROUPS.flatMap(g => g.items);

export default function AdminPage() {
  const [active, setActive] = useState("events");

  const ActiveComponent = ALL_ITEMS.find(t => t.key === active)?.component;
  const activeGroup = GROUPS.find(g => g.items.some(i => i.key === active));

  return (
    <div style={{ display: "flex", gap: 0, margin: "-28px -32px", height: "calc(100% + 56px)", minHeight: 0, overflow: "hidden" }}>

      {/* Sol sidebar */}
      <div style={{
        width: 220, flexShrink: 0, borderRight: "1px solid var(--border)",
        overflowY: "auto", paddingTop: 8, paddingBottom: 16,
      }}>
        {GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            {/* Grup baslik */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px 5px",
              fontSize: 10, fontWeight: 800, letterSpacing: 1,
              color: group.color, textTransform: "uppercase",
            }}>
              <group.icon size={11} />
              {group.label}
            </div>

            {/* Grup item'lari */}
            {group.items.map(item => {
              const isActive = active === item.key;
              return (
                <button key={item.key} onClick={() => setActive(item.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    width: "100%", padding: "8px 16px 8px 24px",
                    border: "none", cursor: "pointer", textAlign: "left",
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    background: isActive ? `${group.color}14` : "transparent",
                    color: isActive ? group.color : "var(--text-muted)",
                    borderLeft: isActive ? `2px solid ${group.color}` : "2px solid transparent",
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; } }}>
                  <item.icon size={13} style={{ flexShrink: 0 }} />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sag icerik */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", minWidth: 0 }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 11, color: "var(--text-muted)" }}>
          <span style={{ color: activeGroup?.color, fontWeight: 700 }}>{activeGroup?.label}</span>
          <ChevronRight size={11} />
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {ALL_ITEMS.find(i => i.key === active)?.label}
          </span>
        </div>

        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
