import { useNotif } from "../lib/NotifContext";
import { X, Bell, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

const TYPE = {
  info:    { icon: Info,          color: "#3b82f6", bg: "rgba(59,130,246,.12)",  border: "rgba(59,130,246,.25)" },
  success: { icon: CheckCircle,   color: "#2ecc71", bg: "rgba(46,204,113,.12)",  border: "rgba(46,204,113,.25)" },
  warning: { icon: AlertTriangle, color: "#f5a623", bg: "rgba(245,166,35,.12)",  border: "rgba(245,166,35,.25)" },
  danger:  { icon: AlertCircle,   color: "#e74c3c", bg: "rgba(231,76,60,.12)",   border: "rgba(231,76,60,.25)"  },
  event:   { icon: Bell,          color: "#9b59b6", bg: "rgba(155,89,182,.12)",  border: "rgba(155,89,182,.25)" },
};

export default function InAppNotifications() {
  const { toasts, dismiss } = useNotif();

  return (
    <div style={{
      position: "fixed", top: 60, right: 16, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8,
      pointerEvents: "none",
    }}>
      {toasts.map(t => {
        const cfg = TYPE[t.type] || TYPE.info;
        const Icon = cfg.icon;
        return (
          <div key={t.id} style={{
            pointerEvents: "all",
            display: "flex", alignItems: "flex-start", gap: 10,
            background: "#1a1714", border: `1px solid ${cfg.border}`,
            borderLeft: `3px solid ${cfg.color}`,
            borderRadius: 10, padding: "12px 14px",
            minWidth: 280, maxWidth: 360,
            boxShadow: "0 8px 32px rgba(0,0,0,.6)",
            animation: "notifSlideIn .25s ease",
          }}>
            <Icon size={16} color={cfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: t.body ? 3 : 0 }}>{t.title}</div>
              {t.body && <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>{t.body}</div>}
            </div>
            <button onClick={() => dismiss(t.id)} style={{
              background: "none", border: "none", color: "#666", cursor: "pointer",
              padding: 0, flexShrink: 0, display: "flex", alignItems: "center",
            }}>
              <X size={13} />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
