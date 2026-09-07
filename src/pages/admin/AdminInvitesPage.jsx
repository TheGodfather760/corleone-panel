import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import { Plus, Trash2, Check, X, Copy } from "lucide-react";

export default function AdminInvitesPage() {
  const [tab, setTab] = useState("invites");
  const [invites, setInvites] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, req] = await Promise.all([adminApi.getInvites(), adminApi.getInviteRequests()]);
      setInvites(inv.data.invites || []);
      setRequests(req.data.requests || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createInvite = async () => {
    setCreating(true);
    try {
      await adminApi.createInvite({});
      load();
    } catch {}
    setCreating(false);
  };

  const deleteInvite = async (id) => {
    setActionId(id);
    try { await adminApi.deleteInvite(id); setInvites(p => p.filter(i => i.id !== id)); } catch {}
    setActionId(null);
  };

  const updateRequest = async (id, status) => {
    setActionId(id);
    try {
      await adminApi.updateInviteRequest(id, status);
      setRequests(p => p.map(r => r.id === id ? { ...r, status } : r));
    } catch {}
    setActionId(null);
  };

  const STATUS_COLORS = { pending: "#f5a623", approved: "#2ecc71", rejected: "#e74c3c" };
  const STATUS_LABELS = { pending: "Bekliyor", approved: "Onaylandı", rejected: "Reddedildi" };

  return (
    <>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Davetler</h1>
          <p className="page-subtitle">Davet kodları ve başvurular</p>
        </div>
        {tab === "invites" && (
          <button onClick={createInvite} disabled={creating}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(245,166,35,.15)", border: "1px solid #f5a623", color: "#f5a623", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: creating ? 0.6 : 1 }}>
            <Plus size={14} /> Davet Oluştur
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["invites", "requests"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${tab === t ? "#f5a623" : "rgba(255,255,255,.1)"}`, background: tab === t ? "rgba(245,166,35,.15)" : "rgba(255,255,255,.04)", color: tab === t ? "#f5a623" : "#888", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {t === "invites" ? `Davetler (${invites.length})` : `Başvurular (${requests.filter(r => r.status === "pending").length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Yükleniyor...</div>
      ) : tab === "invites" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {invites.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Davet kodu yok.</div>
          ) : invites.map(inv => (
            <div key={inv.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, opacity: actionId === inv.id ? 0.5 : 1 }}>
              <code style={{ flex: 1, fontSize: 13, color: "#f5a623", fontFamily: "monospace", letterSpacing: 1 }}>{inv.code}</code>
              <span style={{ fontSize: 11, color: inv.used_by ? "#2ecc71" : "#888" }}>{inv.used_by ? `Kullanıldı: ${inv.used_by}` : "Kullanılmadı"}</span>
              <button onClick={() => navigator.clipboard?.writeText(inv.code)}
                style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#888", borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Copy size={12} />
              </button>
              <button onClick={() => deleteInvite(inv.id)}
                style={{ background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.2)", color: "#e74c3c", borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {requests.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Başvuru yok.</div>
          ) : requests.map(r => (
            <div key={r.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, opacity: actionId === r.id ? 0.5 : 1 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{r.username || r.discord_username || "—"}</div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{r.message || r.note || ""}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>{r.created_at}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[r.status], padding: "2px 8px", borderRadius: 20, background: `${STATUS_COLORS[r.status]}22` }}>
                {STATUS_LABELS[r.status]}
              </span>
              {r.status === "pending" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => updateRequest(r.id, "approved")}
                    style={{ background: "rgba(39,174,96,.15)", border: "1px solid rgba(39,174,96,.3)", color: "#2ecc71", borderRadius: 6, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
                    <Check size={12} /> Onayla
                  </button>
                  <button onClick={() => updateRequest(r.id, "rejected")}
                    style={{ background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.2)", color: "#e74c3c", borderRadius: 6, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
                    <X size={12} /> Reddet
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
