import { useEffect, useState, useCallback } from "react";
import { adminNotificationsApi } from "../../lib/api";
import { Send, Trash2, Bell, Users, Target, Info, CheckCircle, AlertTriangle, AlertCircle, Calendar, Search, X } from "lucide-react";

const TYPES = [
  { key: "info",    label: "Bilgi",    color: "#3498db", Icon: Info },
  { key: "success", label: "Basari",   color: "#2ecc71", Icon: CheckCircle },
  { key: "warning", label: "Uyari",    color: "#f5a623", Icon: AlertTriangle },
  { key: "danger",  label: "Hata",     color: "#e74c3c", Icon: AlertCircle },
  { key: "event",   label: "Etkinlik", color: "#9b59b6", Icon: Calendar },
];

function typeInfo(key) {
  return TYPES.find(t => t.key === key) || TYPES[0];
}

function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)   return "Az once";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk once`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa once`;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Avatar({ user, size = 28 }) {
  return user?.avatar
    ? <img src={user.avatar} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(245,166,35,.15)", color: "#f5a623", fontSize: size * .38, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {(user?.username || "?")[0].toUpperCase()}
      </div>;
}

// ── Bildirim Gonder Formu ─────────────────────────────────────────────────────
function SendForm({ users, onSend }) {
  const [form, setForm] = useState({ title: "", body: "", type: "info", target: "all", target_user_id: "" });
  const [sending, setSending] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filteredUsers = users.filter(u =>
    !userSearch || u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const selectUser = (u) => {
    setSelectedUser(u);
    set("target_user_id", u.id);
    setUserSearch(u.username);
    setShowUserList(false);
  };

  const handleSend = async () => {
    if (!form.title.trim()) return;
    if (form.target === "specific" && !form.target_user_id) return;
    setSending(true);
    await onSend(form);
    setSending(false);
    setForm({ title: "", body: "", type: "info", target: "all", target_user_id: "" });
    setSelectedUser(null);
    setUserSearch("");
  };

  const inp = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
  const selectedType = typeInfo(form.type);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,166,35,.15)", border: "1px solid rgba(245,166,35,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Send size={15} color="#f5a623" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Yeni Bildirim Gonder</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Baslik */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 5 }}>Baslik *</label>
          <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Bildirim basligi..."
            style={inp} onKeyDown={e => e.key === "Enter" && handleSend()} />
        </div>

        {/* Mesaj */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 5 }}>Mesaj (opsiyonel)</label>
          <textarea value={form.body} onChange={e => set("body", e.target.value)} placeholder="Bildirim aciklamasi..." rows={2}
            style={{ ...inp, resize: "vertical" }} />
        </div>

        {/* Tip */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 8 }}>Tip</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TYPES.map(t => (
              <button key={t.key} onClick={() => set("type", t.key)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: `1px solid ${form.type === t.key ? t.color + "60" : "var(--border)"}`, background: form.type === t.key ? t.color + "18" : "var(--bg)", color: form.type === t.key ? t.color : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>
                <t.Icon size={12} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hedef */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 8 }}>Hedef</label>
          <div style={{ display: "flex", gap: 6, marginBottom: form.target === "specific" ? 10 : 0 }}>
            <button onClick={() => { set("target", "all"); setSelectedUser(null); setUserSearch(""); }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, border: `1px solid ${form.target === "all" ? "#3498db60" : "var(--border)"}`, background: form.target === "all" ? "#3498db18" : "var(--bg)", color: form.target === "all" ? "#3498db" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Users size={12} /> Tum Uyeler
            </button>
            <button onClick={() => set("target", "specific")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, border: `1px solid ${form.target === "specific" ? "#9b59b660" : "var(--border)"}`, background: form.target === "specific" ? "#9b59b618" : "var(--bg)", color: form.target === "specific" ? "#9b59b6" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Target size={12} /> Belirli Uye
            </button>
          </div>

          {form.target === "specific" && (
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px" }}>
                {selectedUser && <Avatar user={selectedUser} size={20} />}
                <input value={userSearch} onChange={e => { setUserSearch(e.target.value); setShowUserList(true); if (!e.target.value) { setSelectedUser(null); set("target_user_id", ""); } }}
                  onFocus={() => setShowUserList(true)}
                  placeholder="Uye ara..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit" }} />
                {selectedUser && <button onClick={() => { setSelectedUser(null); setUserSearch(""); set("target_user_id", ""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}><X size={13} /></button>}
              </div>
              {showUserList && filteredUsers.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, zIndex: 100, maxHeight: 200, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>
                  {filteredUsers.slice(0, 20).map(u => (
                    <div key={u.id} onClick={() => selectUser(u)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.04)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                      <Avatar user={u} size={24} />
                      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{u.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Onizleme + Gonder */}
        <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 12 }}>
          {/* Mini onizleme */}
          {form.title && (
            <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: `${selectedType.color}0a`, border: `1px solid ${selectedType.color}25`, borderRadius: 10 }}>
              <selectedType.Icon size={16} color={selectedType.color} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{form.title}</div>
                {form.body && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{form.body}</div>}
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                  {form.target === "all" ? "Tum uyeler" : selectedUser ? `@${selectedUser.username}` : "Hedef secilmedi"}
                </div>
              </div>
            </div>
          )}
          <button onClick={handleSend} disabled={sending || !form.title.trim() || (form.target === "specific" && !form.target_user_id)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 9, background: form.title.trim() ? "#f5a623" : "rgba(255,255,255,.06)", border: "none", color: form.title.trim() ? "#000" : "var(--text-muted)", fontSize: 13, fontWeight: 700, cursor: form.title.trim() ? "pointer" : "not-allowed", opacity: sending ? .6 : 1, transition: "all .2s", flexShrink: 0 }}>
            <Send size={14} /> {sending ? "Gonderiliyor..." : "Gonder"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
  const [notifs, setNotifs]   = useState([]);
  const [stats, setStats]     = useState({});
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTarget, setFilterTarget] = useState("");
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [nRes, uRes] = await Promise.all([adminNotificationsApi.list(), adminNotificationsApi.users()]);
    setNotifs(nRes.data?.data?.notifications || []);
    setStats(nRes.data?.data?.stats || {});
    setUsers(uRes.data?.data?.users || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (form) => {
    const res = await adminNotificationsApi.send(form);
    if (res.data?.success !== false) { showToast("Bildirim gonderildi."); load(); }
    else showToast(res.data?.message || "Hata.", "error");
  };

  const handleDelete = async (id) => {
    await adminNotificationsApi.delete(id);
    setNotifs(p => p.filter(n => n.id !== id));
    setStats(s => ({ ...s, total: Math.max(0, (s.total || 0) - 1) }));
  };

  const handleDeleteAll = async () => {
    if (!confirm("Tum bildirimler silinecek. Emin misiniz?")) return;
    await adminNotificationsApi.deleteAll();
    setNotifs([]);
    setStats(s => ({ ...s, total: 0, broadcast: 0, targeted: 0 }));
    showToast("Tum bildirimler silindi.");
  };

  const filtered = notifs.filter(n => {
    const q = search.toLowerCase();
    const matchQ = !q || n.title.toLowerCase().includes(q) || (n.body || "").toLowerCase().includes(q);
    return matchQ && (!filterType || n.type === filterType) && (!filterTarget || n.target === filterTarget);
  });

  return (
    <>
      {/* Stat kartlari */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Toplam",       value: stats.total || 0,      color: "#f5a623", icon: <Bell size={16} color="#f5a623" /> },
          { label: "Yayın",        value: stats.broadcast || 0,  color: "#3498db", icon: <Users size={16} color="#3498db" /> },
          { label: "Hedefli",      value: stats.targeted || 0,   color: "#9b59b6", icon: <Target size={16} color="#9b59b6" /> },
          { label: "Son 7 Gun",    value: stats.last_week || 0,  color: "#2ecc71", icon: <Calendar size={16} color="#2ecc71" /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>{value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5, marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gonder formu */}
      <SendForm users={users} onSend={handleSend} />

      {/* Liste toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", flex: 1, maxWidth: 260 }}>
          <Search size={13} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Bildirim ara..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit" }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="">Tum Tipler</option>
          {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <select value={filterTarget} onChange={e => setFilterTarget(e.target.value)}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="">Tum Hedefler</option>
          <option value="all">Yayin</option>
          <option value="specific">Hedefli</option>
        </select>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} bildirim</span>
        {notifs.length > 0 && (
          <button onClick={handleDeleteAll}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", color: "#e74c3c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Trash2 size={12} /> Tumunu Sil
          </button>
        )}
      </div>

      {/* Bildirim listesi */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Yukleniyor...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "48px 20px", textAlign: "center" }}>
          <Bell size={32} style={{ opacity: .2, marginBottom: 12 }} />
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Bildirim bulunamadi.</div>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          {filtered.map((n, i) => {
            const t = typeInfo(n.type);
            const readPct = n.total_users > 0 ? Math.round((n.read_count / n.total_users) * 100) : 0;
            return (
              <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none", transition: "background .15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = ""; }}>

                {/* Tip ikonu */}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${t.color}15`, border: `1px solid ${t.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <t.Icon size={16} color={t.color} />
                </div>

                {/* Icerik */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{n.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30` }}>{t.label}</span>
                    {n.target === "all"
                      ? <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: "rgba(52,152,219,.12)", color: "#3498db", border: "1px solid rgba(52,152,219,.2)" }}>Yayin</span>
                      : <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: "rgba(155,89,182,.12)", color: "#9b59b6", border: "1px solid rgba(155,89,182,.2)" }}>Hedefli</span>
                    }
                  </div>
                  {n.body && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 5, lineHeight: 1.5 }}>{n.body}</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDate(n.created_at)}</span>
                    {n.creator_name && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Gonderen: {n.creator_name}</span>}
                    {n.target === "all" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 60, height: 3, borderRadius: 3, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${readPct}%`, background: "#2ecc71", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{n.read_count}/{n.total_users} okudu</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sil */}
                <button onClick={() => handleDelete(n.id)}
                  style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.15)", color: "#e74c3c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: .6, transition: "opacity .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = ".6"; }}>
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--surface)", border: `1px solid ${toast.type === "error" ? "#e74c3c40" : "#2ecc7140"}`, borderRadius: 10, padding: "10px 18px", fontSize: 13, color: toast.type === "error" ? "#e74c3c" : "#2ecc71", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 32px rgba(0,0,0,.5)", zIndex: 9999, whiteSpace: "nowrap" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: toast.type === "error" ? "#e74c3c" : "#2ecc71" }} />
          {toast.msg}
        </div>
      )}
    </>
  );
}
