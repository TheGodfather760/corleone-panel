import { useEffect, useState, useCallback } from "react";
import { adminMediaApi } from "../../lib/api";
import { Search, Trash2, X, ChevronLeft, HardDrive, Image, Users, Settings } from "lucide-react";

const DEFAULT_QUOTA = 200;

function fmtBytes(b) {
  if (!b) return "0 MB";
  if (b >= 1073741824) return (b / 1073741824).toFixed(1) + " GB";
  if (b >= 1048576)    return (b / 1048576).toFixed(1) + " MB";
  return Math.round(b / 1024) + " KB";
}

function fmtDate(s) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function QuotaBar({ used, quota }) {
  const pct = quota > 0 ? Math.min(100, (used / (quota * 1048576)) * 100) : 0;
  const color = pct >= 90 ? "#e74c3c" : pct >= 70 ? "#f5a623" : "#2ecc71";
  return (
    <div style={{ width: "100%" }}>
      <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width .4s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 10, color: "var(--text-muted)" }}>
        <span style={{ color }}>{fmtBytes(used)}</span>
        <span>{quota === -1 ? "Sinirsiz" : `${quota} MB`}</span>
      </div>
    </div>
  );
}

function Avatar({ user, size = 36 }) {
  return user.avatar
    ? <img src={user.avatar} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(245,166,35,.15)", color: "#f5a623", fontSize: size * .38, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {user.username?.[0]?.toUpperCase()}
      </div>;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const img = images[idx];

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx(i => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, onClose]);

  if (!img) return null;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.94)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 18, right: 22, background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", opacity: .7 }}>✕</button>
      {idx > 0 && (
        <button onClick={() => setIdx(i => i - 1)}
          style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.1)", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ‹
        </button>
      )}
      <img src={adminMediaApi.mediaUrl(img.user_id, img.filename)} alt=""
        style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 8, objectFit: "contain" }} />
      {idx < images.length - 1 && (
        <button onClick={() => setIdx(i => i + 1)}
          style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.1)", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ›
        </button>
      )}
      <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.6)", borderRadius: 8, padding: "7px 16px", fontSize: 12, color: "#ddd", textAlign: "center", whiteSpace: "nowrap" }}>
        {[img.title, img.username, img.img_width && img.img_height ? `${img.img_width}×${img.img_height}` : null, fmtBytes(img.file_size), fmtDate(img.created_at)].filter(Boolean).join(" · ")}
        <span style={{ marginLeft: 10, opacity: .5 }}>{idx + 1} / {images.length}</span>
      </div>
    </div>
  );
}

// ── Uye Detay Paneli ──────────────────────────────────────────────────────────
function UserMediaPanel({ user, onBack, onDelete }) {
  const [media, setMedia]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [lbIdx, setLbIdx]     = useState(null);
  const [editQuota, setEditQuota] = useState(false);
  const [quotaVal, setQuotaVal]   = useState(user.quota_mb);
  const [savingQuota, setSavingQuota] = useState(false);

  useEffect(() => {
    adminMediaApi.userMedia(user.id).then(res => {
      setMedia(res.data?.data?.media || []);
      setLoading(false);
    });
  }, [user.id]);

  const handleDelete = async (id) => {
    if (!confirm("Bu gorseli silmek istediginize emin misiniz?")) return;
    await adminMediaApi.delete(id);
    setMedia(p => p.filter(m => m.id !== id));
    onDelete(id);
  };

  const saveQuota = async () => {
    setSavingQuota(true);
    await adminMediaApi.setQuota(user.id, parseInt(quotaVal));
    setSavingQuota(false);
    setEditQuota(false);
    user.quota_mb = parseInt(quotaVal);
  };

  const filtered = media.filter(m =>
    !search || (m.title || m.filename || "").toLowerCase().includes(search.toLowerCase())
  );

  const usedBytes = media.reduce((s, m) => s + (m.file_size || 0), 0);
  const pct = user.quota_mb > 0 ? Math.min(100, (usedBytes / (user.quota_mb * 1048576)) * 100) : 0;
  const quotaColor = pct >= 90 ? "#e74c3c" : pct >= 70 ? "#f5a623" : "#2ecc71";

  return (
    <div>
      {/* Geri + baslik */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
          <ChevronLeft size={13} /> Geri
        </button>
        <Avatar user={user} size={40} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{user.username}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{media.length} gorsel · {fmtBytes(usedBytes)}</div>
        </div>
      </div>

      {/* Kota karti */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <HardDrive size={14} color={quotaColor} /> Depolama Kotasi
            </div>
            <button onClick={() => { setEditQuota(e => !e); setQuotaVal(user.quota_mb); }}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,.05)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 11, cursor: "pointer" }}>
              <Settings size={11} /> Duzenle
            </button>
          </div>
          <QuotaBar used={usedBytes} quota={user.quota_mb} />
          {editQuota && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
              <input type="number" value={quotaVal} onChange={e => setQuotaVal(e.target.value)} min="10" max="10000"
                style={{ width: 100, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 10px", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>MB</span>
              <button onClick={() => setQuotaVal(-1)} style={{ padding: "5px 10px", borderRadius: 7, background: "rgba(255,255,255,.05)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 11, cursor: "pointer" }}>Sinirsiz</button>
              <button onClick={saveQuota} disabled={savingQuota}
                style={{ padding: "5px 14px", borderRadius: 7, background: "#f5a623", border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: savingQuota ? .6 : 1 }}>
                {savingQuota ? "..." : "Kaydet"}
              </button>
              <button onClick={() => setEditQuota(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
          {[
            ["Gorsel", media.length, "#f5a623"],
            ["Kullanilan", fmtBytes(usedBytes), quotaColor],
            ["Kota", user.quota_mb === -1 ? "Sinirsiz" : `${user.quota_mb} MB`, "#888"],
          ].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Arama */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", flex: 1, maxWidth: 280 }}>
          <Search size={13} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Gorsel ara..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit" }} />
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} gorsel</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Yukleniyor...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Gorsel bulunamadi.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {filtered.map((m, i) => (
            <div key={m.id}
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", position: "relative", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,166,35,.35)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", cursor: "pointer" }} onClick={() => setLbIdx(i)}>
                <img src={adminMediaApi.mediaUrl(m.user_id, m.filename)} alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", transition: "background .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0)"; }} />
              </div>
              <button onClick={() => handleDelete(m.id)}
                style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 7, background: "rgba(231,76,60,.8)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .15s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                className="del-btn">
                <Trash2 size={11} />
              </button>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                  {m.title || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Isimsiz</span>}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {fmtBytes(m.file_size)}{m.img_width ? ` · ${m.img_width}×${m.img_height}` : ""} · {fmtDate(m.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lbIdx !== null && (
        <Lightbox images={filtered} startIdx={lbIdx} onClose={() => setLbIdx(null)} />
      )}

      <style>{`.del-btn { opacity: 0 !important; } div:hover > .del-btn { opacity: 1 !important; }`}</style>
    </div>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function AdminMediaPage() {
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortBy, setSortBy]       = useState("used_desc");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminMediaApi.summary();
    setSummary(res.data?.data || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (deletedId) => {
    // Ozet sayilarini guncelle
    setSummary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        total_files: prev.total_files - 1,
        users: prev.users.map(u =>
          u.id === selectedUser?.id
            ? { ...u, media_count: u.media_count - 1 }
            : u
        ).filter(u => u.media_count > 0),
      };
    });
  };

  if (selectedUser) {
    return (
      <UserMediaPanel
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onDelete={handleDelete}
      />
    );
  }

  const users = summary?.users || [];

  const sorted = [...users].sort((a, b) => {
    if (sortBy === "used_desc")  return b.used_bytes - a.used_bytes;
    if (sortBy === "used_asc")   return a.used_bytes - b.used_bytes;
    if (sortBy === "count_desc") return b.media_count - a.media_count;
    if (sortBy === "count_asc")  return a.media_count - b.media_count;
    if (sortBy === "pct_desc") {
      const pa = a.quota_mb > 0 ? a.used_bytes / (a.quota_mb * 1048576) : 0;
      const pb = b.quota_mb > 0 ? b.used_bytes / (b.quota_mb * 1048576) : 0;
      return pb - pa;
    }
    return 0;
  });

  const filtered = sorted.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase())
  );

  const totalBytes = summary?.total_bytes || 0;
  const totalFiles = summary?.total_files || 0;
  const totalUsers = users.length;
  const avgPct = users.length > 0
    ? users.reduce((s, u) => s + (u.quota_mb > 0 ? (u.used_bytes / (u.quota_mb * 1048576)) * 100 : 0), 0) / users.length
    : 0;

  return (
    <>
      {/* Stat kartlari */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Toplam Gorsel",    value: totalFiles,          color: "#f5a623", icon: <Image size={18} color="#f5a623" /> },
          { label: "Toplam Kullanim",  value: fmtBytes(totalBytes), color: "#3498db", icon: <HardDrive size={18} color="#3498db" /> },
          { label: "Medya Yukleyen",   value: totalUsers,           color: "#2ecc71", icon: <Users size={18} color="#2ecc71" /> },
          { label: "Ort. Kota Doluluk", value: `%${avgPct.toFixed(1)}`, color: avgPct >= 70 ? "#e74c3c" : "#9b59b6", icon: <HardDrive size={18} color={avgPct >= 70 ? "#e74c3c" : "#9b59b6"} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>{value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5, marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", flex: 1, maxWidth: 260 }}>
          <Search size={13} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Uye ara..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit" }} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="used_desc">Kullanim (Cok-Az)</option>
          <option value="used_asc">Kullanim (Az-Cok)</option>
          <option value="count_desc">Gorsel Sayisi (Cok-Az)</option>
          <option value="count_asc">Gorsel Sayisi (Az-Cok)</option>
          <option value="pct_desc">Kota Dolulugu (Cok-Az)</option>
        </select>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{filtered.length} uye</span>
      </div>

      {/* Uye listesi */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Yukleniyor...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Medya yukleyen uye bulunamadi.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(u => {
            const pct = u.quota_mb > 0 ? Math.min(100, (u.used_bytes / (u.quota_mb * 1048576)) * 100) : 0;
            const color = pct >= 90 ? "#e74c3c" : pct >= 70 ? "#f5a623" : "#2ecc71";
            return (
              <div key={u.id}
                onClick={() => setSelectedUser(u)}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,166,35,.3)"; e.currentTarget.style.background = "rgba(245,166,35,.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}>

                <Avatar user={u} size={42} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{u.username}</div>
                  <QuotaBar used={u.used_bytes} quota={u.quota_mb} />
                </div>

                <div style={{ display: "flex", gap: 20, flexShrink: 0, textAlign: "center" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f5a623" }}>{u.media_count}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .4 }}>Gorsel</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#3498db" }}>{fmtBytes(u.used_bytes)}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .4 }}>Kullanim</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: color }}>{pct.toFixed(0)}%</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .4 }}>Dolu</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-muted)" }}>{u.quota_mb === -1 ? "∞" : u.quota_mb + " MB"}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .4 }}>Kota</div>
                  </div>
                </div>

                {/* Kota doluluk renk cubugu (sag kenar) */}
                <div style={{ width: 4, height: 42, borderRadius: 4, background: color, flexShrink: 0, opacity: .8 }} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
