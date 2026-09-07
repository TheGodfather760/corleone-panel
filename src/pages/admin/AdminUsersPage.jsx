import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import { Users, Search, Shield, Ban, ChevronDown } from "lucide-react";

const ROLES = ["member", "moderator", "admin"];
const ROLE_COLORS = { admin: "#f5a623", moderator: "#3498db", member: "#888" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    adminApi.getUsers()
      .then(r => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateUser = async (id, data) => {
    setActionLoading(id);
    try {
      await adminApi.updateUser({ id, ...data });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    } catch {}
    setActionLoading(null);
  };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Üye Yönetimi</h1>
        <p className="page-subtitle">{users.length} üye</p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <Search size={14} color="#888" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kullanıcı ara..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#ddd", fontSize: 13, fontFamily: "inherit" }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Kullanıcı bulunamadı.</div>
        ) : filtered.map(u => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--border)", opacity: actionLoading === u.id ? 0.5 : 1 }}>
            {u.avatar
              ? <img src={u.avatar} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(245,166,35,.15)", color: "#f5a623", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{u.username?.[0]?.toUpperCase()}</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{u.username}</div>
              <div style={{ fontSize: 11, color: "#666" }}>{u.email}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <select
                value={u.role || "member"}
                onChange={e => updateUser(u.id, { role: e.target.value })}
                style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 7, color: ROLE_COLORS[u.role] || "#888", fontSize: 11, fontWeight: 700, padding: "4px 8px", cursor: "pointer", outline: "none" }}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button
                onClick={() => updateUser(u.id, { is_active: u.is_active ? 0 : 1 })}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, border: `1px solid ${u.is_active ? "rgba(231,76,60,.3)" : "rgba(39,174,96,.3)"}`, background: u.is_active ? "rgba(231,76,60,.1)" : "rgba(39,174,96,.1)", color: u.is_active ? "#e74c3c" : "#2ecc71", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                {u.is_active ? <><Ban size={11} /> Banla</> : <><Shield size={11} /> Aktifleştir</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
