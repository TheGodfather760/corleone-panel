import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import { Plus, Trash2, Check, X, Copy, Mail, Clock, UserCheck, Send } from "lucide-react";

const STATUS_COLOR = { pending: "#f5a623", approved: "#2ecc71", rejected: "#e74c3c" };
const STATUS_LABEL = { pending: "Bekliyor", approved: "Onaylandı", rejected: "Reddedildi" };

function Badge({ status }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      background: `${STATUS_COLOR[status]}22`, color: STATUS_COLOR[status] }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function AdminInvitesPage() {
  const [tab, setTab]           = useState("invites");
  const [invites, setInvites]   = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [email, setEmail]       = useState("");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");
  const [actionId, setActionId] = useState(null);
  const [copied, setCopied]     = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, req] = await Promise.all([
        adminApi.getInvites(),
        adminApi.getInviteRequests(),
      ]);
      setInvites(inv.data.data?.invites || inv.data.invites || []);
      setRequests(req.data.data?.requests || req.data.requests || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createInvite = async () => {
    if (!email.trim()) return;
    setCreating(true);
    setCreateErr("");
    try {
      const r = await adminApi.createInvite({ email: email.trim() });
      if (r.data.success === false || (r.data.data === undefined && !r.data.invite)) {
        setCreateErr(r.data.message || "Hata oluştu.");
      } else {
        setEmail("");
        load();
      }
    } catch (e) {
      setCreateErr(e.response?.data?.message || "Hata oluştu.");
    }
    setCreating(false);
  };

  const deleteInvite = async (id) => {
    setActionId(id);
    try {
      await adminApi.deleteInvite(id);
      setInvites(p => p.filter(i => i.id !== id));
    } catch {}
    setActionId(null);
  };

  const updateRequest = async (id, status) => {
    setActionId(id);
    try {
      await adminApi.updateInviteRequest(id, status);
      setRequests(p => p.map(r => r.id === id ? { ...r, status } : r));
      if (status === "approved") load(); // davetler listesini de yenile
    } catch {}
    setActionId(null);
  };

  const deleteRequest = async (id) => {
    setActionId(id);
    try {
      await adminApi.deleteInviteRequest(id);
      setRequests(p => p.filter(r => r.id !== id));
    } catch {}
    setActionId(null);
  };

  const copyLink = (token) => {
    const link = `https://corleoneteam.com.tr/auth.php?invite=${token}`;
    navigator.clipboard?.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  const inputStyle = {
    flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
    padding: "9px 12px", color: "#ddd", fontSize: 13, outline: "none", fontFamily: "inherit",
  };

  return (
    <>
      {/* Sekme başlıkları */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 4 }}>
        {[
          { key: "invites",  label: "Giden Davetler", icon: Send,      count: invites.length },
          { key: "requests", label: "Başvurular",     icon: UserCheck, count: pendingCount, badge: pendingCount > 0 },
        ].map(({ key, label, icon: Icon, count, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: tab === key ? "rgba(245,166,35,.15)" : "transparent",
              color: tab === key ? "#f5a623" : "#666",
              borderBottom: tab === key ? "2px solid #f5a623" : "2px solid transparent",
              transition: "all .2s", position: "relative" }}>
            <Icon size={13} />{label}
            <span style={{ marginLeft: 4, fontSize: 10, padding: "1px 6px", borderRadius: 10,
              background: badge ? "rgba(245,166,35,.3)" : "rgba(255,255,255,.08)",
              color: badge ? "#f5a623" : "#666" }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── GİDEN DAVETLER ── */}
      {tab === "invites" && (
        <>
          {/* Yeni davet formu */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: .6 }}>
              Yeni Davet Gönder
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={email} onChange={e => { setEmail(e.target.value); setCreateErr(""); }}
                onKeyDown={e => e.key === "Enter" && createInvite()}
                placeholder="ornek@email.com" style={inputStyle} />
              <button onClick={createInvite} disabled={creating || !email.trim()}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8,
                  background: "rgba(245,166,35,.15)", border: "1px solid #f5a623", color: "#f5a623",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (creating || !email.trim()) ? 0.5 : 1 }}>
                <Plus size={14} />{creating ? "Oluşturuluyor..." : "Davet Et"}
              </button>
            </div>
            {createErr && <div style={{ fontSize: 11, color: "#e74c3c", marginTop: 8 }}>{createErr}</div>}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Yükleniyor...</div>
          ) : invites.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Henüz davet yok.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {invites.map(inv => {
                const used      = !!inv.used_at;
                const expired   = !used && new Date(inv.expires_at) < new Date();
                const statusColor = used ? "#2ecc71" : expired ? "#e74c3c" : "#f5a623";
                const statusLabel = used ? "Kullanıldı" : expired ? "Süresi Doldu" : "Aktif";

                return (
                  <div key={inv.id} style={{ background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                    opacity: actionId === inv.id ? 0.5 : 1 }}>

                    <Mail size={14} color={statusColor} style={{ flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{inv.email}</div>
                      <div style={{ fontSize: 10, color: "#555", marginTop: 2, display: "flex", gap: 10 }}>
                        <span><Clock size={9} style={{ marginRight: 3 }} />
                          {used ? `Kullanıldı: ${inv.used_at?.slice(0,10)}` : `Son: ${inv.expires_at?.slice(0,10)}`}
                        </span>
                        {inv.used_by_username && <span>→ {inv.used_by_username}</span>}
                      </div>
                    </div>

                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: `${statusColor}22`, color: statusColor }}>
                      {statusLabel}
                    </span>

                    {!used && !expired && (
                      <button onClick={() => copyLink(inv.token)} title="Davet linkini kopyala"
                        style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,.1)",
                          background: copied === inv.token ? "rgba(39,174,96,.15)" : "rgba(255,255,255,.04)",
                          color: copied === inv.token ? "#2ecc71" : "#888", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                        <Copy size={12} />{copied === inv.token ? "Kopyalandı!" : "Link"}
                      </button>
                    )}

                    <button onClick={() => deleteInvite(inv.id)} title="Sil"
                      style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(231,76,60,.2)",
                        background: "rgba(231,76,60,.1)", color: "#e74c3c", cursor: "pointer",
                        display: "flex", alignItems: "center" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── BAŞVURULAR ── */}
      {tab === "requests" && (
        <>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Yükleniyor...</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Başvuru yok.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {requests.map(r => (
                <div key={r.id} style={{ background: "var(--surface)", border: `1px solid ${r.status === "pending" ? "rgba(245,166,35,.2)" : "var(--border)"}`,
                  borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                  opacity: actionId === r.id ? 0.5 : 1 }}>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{r.email}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>{r.created_at?.slice(0, 16)}</div>
                  </div>

                  <Badge status={r.status} />

                  {r.status === "pending" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => updateRequest(r.id, "approved")}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7,
                          background: "rgba(39,174,96,.15)", border: "1px solid rgba(39,174,96,.3)",
                          color: "#2ecc71", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        <Check size={12} /> Onayla
                      </button>
                      <button onClick={() => updateRequest(r.id, "rejected")}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7,
                          background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.2)",
                          color: "#e74c3c", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        <X size={12} /> Reddet
                      </button>
                    </div>
                  )}

                  <button onClick={() => deleteRequest(r.id)} title="Sil"
                    style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(231,76,60,.2)",
                      background: "rgba(231,76,60,.1)", color: "#e74c3c", cursor: "pointer",
                      display: "flex", alignItems: "center" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
