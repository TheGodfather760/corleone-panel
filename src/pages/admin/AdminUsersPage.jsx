import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import { Search, Shield, Ban, Mail, ChevronDown, ChevronUp, KeyRound } from "lucide-react";

const ROLES       = ["member", "moderator", "admin"];
const ROLE_COLORS = { admin: "#f5a623", moderator: "#3498db", member: "#888" };
const ROLE_LABELS = { admin: "Admin", moderator: "Moderatör", member: "Üye" };

export default function AdminUsersPage() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionId, setActionId]     = useState(null);
  const [expanded, setExpanded]     = useState(null);
  const [mailStatus, setMailStatus] = useState({});

  useEffect(() => {
    adminApi.getUsers()
      .then(r => {
        const d = r.data.data ?? r.data;
        setUsers(Array.isArray(d) ? d : d.users || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateUser = async (id, data) => {
    setActionId(id);
    try {
      await adminApi.updateUser({ id, ...data });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    } catch {}
    setActionId(null);
  };

  const sendMail = async (userId, action) => {
    setMailStatus(p => ({ ...p, [userId]: "sending" }));
    try {
      await adminApi.mailUser(userId, action);
      setMailStatus(p => ({ ...p, [userId]: "sent" }));
      setTimeout(() => setMailStatus(p => ({ ...p, [userId]: null })), 3000);
    } catch {
      setMailStatus(p => ({ ...p, [userId]: "error" }));
      setTimeout(() => setMailStatus(p => ({ ...p, [userId]: null })), 3000);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <>
      {/* Üst bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>Üye Yönetimi</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{users.length} üye</div>
        </div>
        {/* Rol filtresi */}
        <div style={{ display: "flex", gap: 4 }}>
          {["all", ...ROLES].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${roleFilter === r ? (ROLE_COLORS[r] || "#f5a623") : "rgba(255,255,255,.1)"}`,
                background: roleFilter === r ? `${ROLE_COLORS[r] || "#f5a623"}22` : "rgba(255,255,255,.04)",
                color: roleFilter === r ? (ROLE_COLORS[r] || "#f5a623") : "#666",
                fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {r === "all" ? "Tümü" : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Arama */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
        padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <Search size={13} color="#888" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kullanıcı adı veya e-posta ara..."
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#ddd", fontSize: 13, fontFamily: "inherit" }} />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11 }}>✕</button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Kullanıcı bulunamadı.</div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          {filtered.map((u, i) => (
            <div key={u.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
              {/* Ana satır */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
                opacity: actionId === u.id ? 0.5 : 1, transition: "opacity .2s" }}>

                {/* Avatar */}
                {u.avatar
                  ? <img src={u.avatar} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(245,166,35,.12)",
                      color: "#f5a623", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0 }}>
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                }

                {/* İsim & mail */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{u.username}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20,
                      background: `${ROLE_COLORS[u.role] || "#888"}22`, color: ROLE_COLORS[u.role] || "#888" }}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                    {!u.is_active && (
                      <span style={{ fontSize: 10, color: "#e74c3c", background: "rgba(231,76,60,.1)",
                        padding: "1px 7px", borderRadius: 20 }}>Banlı</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 1 }}>{u.email}</div>
                </div>

                {/* Aksiyonlar */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <select value={u.role || "member"} onChange={e => updateUser(u.id, { role: e.target.value })}
                    style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                      borderRadius: 7, color: ROLE_COLORS[u.role] || "#888", fontSize: 11, fontWeight: 700,
                      padding: "4px 8px", cursor: "pointer", outline: "none" }}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>

                  <button onClick={() => updateUser(u.id, { is_active: u.is_active ? 0 : 1 })}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7,
                      border: `1px solid ${u.is_active ? "rgba(231,76,60,.3)" : "rgba(39,174,96,.3)"}`,
                      background: u.is_active ? "rgba(231,76,60,.1)" : "rgba(39,174,96,.1)",
                      color: u.is_active ? "#e74c3c" : "#2ecc71", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {u.is_active ? <><Ban size={11} /> Banla</> : <><Shield size={11} /> Aktifleştir</>}
                  </button>

                  <button onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                    style={{ padding: "5px 7px", borderRadius: 7, border: "1px solid rgba(255,255,255,.1)",
                      background: "rgba(255,255,255,.04)", color: "#888", cursor: "pointer",
                      display: "flex", alignItems: "center" }}>
                    {expanded === u.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              </div>

              {/* Genişletilmiş detay */}
              {expanded === u.id && (
                <div style={{ padding: "12px 16px 14px", borderTop: "1px solid var(--border)",
                  background: "rgba(255,255,255,.02)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: .6 }}>Bilgiler</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {[
                        ["ID", u.id],
                        ["Kayıt", u.created_at?.slice(0, 10)],
                        ["Son Giriş", u.last_login?.slice(0, 10) || "—"],
                        ["Puan", u.points ?? "—"],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", gap: 8, fontSize: 11 }}>
                          <span style={{ color: "#555", width: 70 }}>{k}</span>
                          <span style={{ color: "#aaa" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                    <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: .6, marginBottom: 2 }}>İşlemler</div>
                    <button onClick={() => sendMail(u.id, "send_reset")}
                      disabled={mailStatus[u.id] === "sending"}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                        background: "rgba(52,152,219,.1)", border: "1px solid rgba(52,152,219,.3)",
                        color: mailStatus[u.id] === "sent" ? "#2ecc71" : mailStatus[u.id] === "error" ? "#e74c3c" : "#3498db",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: mailStatus[u.id] === "sending" ? 0.6 : 1 }}>
                      <Mail size={12} />
                      {mailStatus[u.id] === "sending" ? "Gönderiliyor..." : mailStatus[u.id] === "sent" ? "✓ Gönderildi" : mailStatus[u.id] === "error" ? "Hata" : "Şifre Sıfırlama Maili"}
                    </button>
                    <button onClick={() => sendMail(u.id, "send_setup")}
                      disabled={mailStatus[u.id] === "sending"}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                        background: "rgba(155,89,182,.1)", border: "1px solid rgba(155,89,182,.3)",
                        color: "#9b59b6", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        opacity: mailStatus[u.id] === "sending" ? 0.6 : 1 }}>
                      <KeyRound size={12} /> Şifre Kurulum Daveti
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
