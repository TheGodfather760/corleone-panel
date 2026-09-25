import { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/AuthContext";
import { profileApi, authApi } from "../lib/api";
import {
  Camera, Trash2, Check, X, Save, Eye, EyeOff,
  RefreshCw, Plus, Edit2, Globe, Truck, Shield,
  Bell, Monitor, Smartphone, LogOut, AlertTriangle,
  Mail, Lock, User, MapPin, Phone, Calendar, FileText,
  Link2, ChevronDown
} from "lucide-react";

const ALL_PLATFORMS = [
  { key: "twitter",      label: "X (Twitter)",  color: "#e7e7e7", prefix: "https://x.com/",             hint: "Kullanıcı adı" },
  { key: "instagram",    label: "Instagram",     color: "#e1306c", prefix: "https://instagram.com/",     hint: "Kullanıcı adı" },
  { key: "youtube",      label: "YouTube",       color: "#ff0000", prefix: "",                            hint: "Kanal URL" },
  { key: "twitch",       label: "Twitch",        color: "#9146ff", prefix: "https://twitch.tv/",         hint: "Kullanıcı adı" },
  { key: "tiktok",       label: "TikTok",        color: "#e7e7e7", prefix: "https://tiktok.com/@",       hint: "Kullanıcı adı" },
  { key: "kick",         label: "Kick",          color: "#53fc18", prefix: "https://kick.com/",          hint: "Kullanıcı adı" },
  { key: "facebook",     label: "Facebook",      color: "#1877f2", prefix: "https://facebook.com/",      hint: "Kullanıcı adı" },
  { key: "linkedin",     label: "LinkedIn",      color: "#0a66c2", prefix: "",                            hint: "Profil URL" },
  { key: "github",       label: "GitHub",        color: "#e7e7e7", prefix: "https://github.com/",        hint: "Kullanıcı adı" },
  { key: "reddit",       label: "Reddit",        color: "#ff4500", prefix: "https://reddit.com/u/",      hint: "Kullanıcı adı" },
  { key: "bluesky",      label: "Bluesky",       color: "#0085ff", prefix: "https://bsky.app/profile/",  hint: "handle.bsky.social" },
  { key: "telegram",     label: "Telegram",      color: "#26a5e4", prefix: "https://t.me/",              hint: "Kullanıcı adı" },
  { key: "discord_social", label: "Discord",     color: "#5865f2", prefix: "",                            hint: "Kullanıcı adı" },
  { key: "spotify",      label: "Spotify",       color: "#1db954", prefix: "",                            hint: "Profil URL" },
  { key: "snapchat",     label: "Snapchat",      color: "#fffc00", prefix: "https://snapchat.com/add/",  hint: "Kullanıcı adı" },
  { key: "pinterest",    label: "Pinterest",     color: "#e60023", prefix: "https://pinterest.com/",     hint: "Kullanıcı adı" },
  { key: "behance",      label: "Behance",       color: "#1769ff", prefix: "https://behance.net/",       hint: "Kullanıcı adı" },
  { key: "dribbble",     label: "Dribbble",      color: "#ea4c89", prefix: "https://dribbble.com/",      hint: "Kullanıcı adı" },
  { key: "truckersmp",   label: "TruckersMP",    color: "#f5a623", prefix: "",                            hint: "Profil URL" },
  { key: "website",      label: "Web Sitesi",    color: "#3498db", prefix: "",                            hint: "https://..." },
  { key: "mastodon",     label: "Mastodon",      color: "#6364ff", prefix: "",                            hint: "@kullanici@sunucu" },
];

const PLATFORM_ICONS = {
  twitter: "𝕏", instagram: "📸", youtube: "▶", twitch: "🎮", tiktok: "🎵",
  kick: "🟢", facebook: "📘", linkedin: "💼", github: "🐙", reddit: "🤖",
  bluesky: "🫋", telegram: "📬", discord_social: "💬", spotify: "🎶",
  snapchat: "👻", pinterest: "📌", behance: "🎨", dribbble: "🎯",
  truckersmp: "🚚", website: "🌐", mastodon: "🐘",
};

function SectionTitle({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.7px" }}>
      {children}
    </p>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0 }} />
    </label>
  );
}

function PasswordInput({ value, onChange, placeholder, name }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input className="input" type={show ? "text" : "password"} name={name} value={value} onChange={onChange} placeholder={placeholder} style={{ paddingRight: 40 }} />
      <button type="button" onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function PwStrengthBar({ value }) {
  if (!value) return null;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;
  const levels = [
    { t: "Çok Zayıf", c: "#e74c3c", w: "20%" },
    { t: "Zayıf",     c: "#e67e22", w: "40%" },
    { t: "Orta",      c: "#f1c40f", w: "60%" },
    { t: "İyi",       c: "#2ecc71", w: "80%" },
    { t: "Güçlü",     c: "#27ae60", w: "100%" },
  ];
  const l = levels[Math.min(score, 4)];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ height: 4, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: l.w, background: l.c, borderRadius: 4, transition: "width .3s,background .3s" }} />
      </div>
      <div style={{ fontSize: 11, marginTop: 3, color: l.c }}>{l.t}</div>
    </div>
  );
}

// ── Avatar Panel ──────────────────────────────────────────────────────────────
function AvatarPanel({ user, setUser }) {
  const [avatars, setAvatars] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    profileApi.getAvatars().then(r => setAvatars(r.data.data?.avatars || []));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await profileApi.uploadAvatar(fd);
      const av = res.data.data;
      setAvatars(prev => [av, ...prev]);
      await handleSet(av.url);
    } finally { setUploading(false); e.target.value = ""; }
  };

  const handleSet = async (url) => {
    await profileApi.setAvatar(url);
    setUser(prev => ({ ...prev, avatar: url }));
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await profileApi.deleteAvatar(id);
    setAvatars(prev => prev.filter(a => a.id !== id));
  };

  const profileFields = ["real_name", "bio", "country", "city", "birth_date", "phone", "avatar"];
  const filled = profileFields.filter(k => !!(user || {})[k]);
  const pct = Math.round(filled.length / profileFields.length * 100);
  const pctColor = pct >= 80 ? "#2ecc71" : pct >= 50 ? "#f1c40f" : "#e74c3c";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profil kartı */}
      <div className="card" style={{ textAlign: "center", padding: "28px 20px" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 14 }}>
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=333&color=f5a623&size=128`}
            alt={user?.username}
            style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--accent-border)" }}
          />
          <button onClick={() => fileRef.current.click()} disabled={uploading}
            style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Camera size={13} color="#111" />
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleUpload} />
        </div>
        <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 2 }}>{user?.username}</p>
        {user?.real_name && <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{user.real_name}</p>}
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>{user?.email}</p>
        <span className="badge badge-orange">{user?.role || "Üye"}</span>

        {/* Profil tamamlanma */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".6px" }}>Profil Tamamlanma</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: pctColor }}>{pct}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 5, background: "var(--border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pctColor, borderRadius: 5, transition: "width .4s" }} />
          </div>
        </div>

        {/* Üyelik tarihi */}
        {user?.created_at && (
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
            Üyelik: {new Date(user.created_at).toLocaleDateString("tr-TR")}
          </p>
        )}
      </div>

      {/* Avatar galerisi */}
      {avatars.length > 0 && (
        <div className="card">
          <SectionTitle>Avatarlarım</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {avatars.map(av => (
              <div key={av.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: user?.avatar === av.url ? "2px solid var(--accent)" : "2px solid transparent", cursor: "pointer" }}
                onClick={() => handleSet(av.url)}>
                <img src={av.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={(e) => handleDelete(av.id, e)}
                  style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: 4, background: "rgba(231,76,60,.85)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={10} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Kişisel Bilgiler ──────────────────────────────────────────────────────────
function PersonalInfoPanel({ user }) {
  const [info, setInfo] = useState({ real_name: "", bio: "", country: "", city: "", birth_date: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    profileApi.getInfo().then(r => {
      const d = r.data.data || {};
      setInfo({ real_name: d.real_name || "", bio: d.bio || "", country: d.country || "", city: d.city || "", birth_date: d.birth_date || "", phone: d.phone || "" });
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.saveInfo(info);
      setMsg("Kaydedildi.");
      setTimeout(() => setMsg(""), 2500);
    } finally { setSaving(false); }
  };

  const fields = [
    { key: "real_name",  label: "Ad Soyad",     type: "text", placeholder: "Ad Soyad",          icon: <User size={13} /> },
    { key: "phone",      label: "Telefon",       type: "tel",  placeholder: "+90 5xx xxx xx xx", icon: <Phone size={13} /> },
    { key: "country",    label: "Ülke",          type: "text", placeholder: "Türkiye",            icon: <MapPin size={13} /> },
    { key: "city",       label: "Şehir",         type: "text", placeholder: "İstanbul",           icon: <MapPin size={13} /> },
    { key: "birth_date", label: "Doğum Tarihi",  type: "date", placeholder: "",                   icon: <Calendar size={13} /> },
  ];

  return (
    <div className="card">
      <SectionTitle>Kişisel Bilgiler</SectionTitle>
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {fields.map(({ key, label, type, placeholder }) => (
            <Field key={key} label={label}>
              <input className="input" type={type} placeholder={placeholder} value={info[key]}
                onChange={e => setInfo(p => ({ ...p, [key]: e.target.value }))} style={{ colorScheme: "dark" }} />
            </Field>
          ))}
        </div>
        <Field label="Hakkımda">
          <textarea className="input" rows={3} placeholder="Kendinizden kısaca bahsedin..." value={info.bio}
            onChange={e => setInfo(p => ({ ...p, bio: e.target.value }))} style={{ resize: "vertical" }} />
        </Field>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Save size={14} />{saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          {msg && <span style={{ fontSize: 12, color: "#2ecc71" }}>{msg}</span>}
        </div>
      </form>
    </div>
  );
}

// ── Sosyal Medya ──────────────────────────────────────────────────────────────
function SocialsPanel() {
  const [socials, setSocials] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [selPlatform, setSelPlatform] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileApi.getSocials().then(r => setSocials(r.data.socials || {}));
  }, []);

  const handleSave = async () => {
    if (!selPlatform || !inputVal.trim()) return;
    setSaving(true);
    try {
      await profileApi.saveSocial(selPlatform, inputVal.trim());
      setSocials(p => ({ ...p, [selPlatform]: inputVal.trim() }));
      setSelPlatform(""); setInputVal(""); setShowAdd(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (key) => {
    await profileApi.deleteSocial(key);
    setSocials(p => { const s = { ...p }; delete s[key]; return s; });
  };

  const handleEdit = (key) => {
    setSelPlatform(key);
    setInputVal(socials[key] || "");
    setShowAdd(true);
  };

  const activePlatforms = Object.keys(socials);
  const platform = ALL_PLATFORMS.find(p => p.key === selPlatform);

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <SectionTitle>Sosyal Medya</SectionTitle>
        <button onClick={() => { setShowAdd(s => !s); setSelPlatform(""); setInputVal(""); }}
          className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
          <Plus size={12} /> Ekle
        </button>
      </div>

      {showAdd && (
        <div style={{ marginBottom: 14, padding: 14, background: "var(--bg-elevated)", borderRadius: 10, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: "0 0 160px" }}>
              <select value={selPlatform} onChange={e => { setSelPlatform(e.target.value); setInputVal(""); }}
                style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 28px 8px 10px", color: "var(--text-primary)", fontSize: 13, outline: "none", appearance: "none", cursor: "pointer" }}>
                <option value="">Platform seç...</option>
                {ALL_PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
            </div>
            <input className="input" style={{ flex: 1 }} placeholder={platform?.hint || "Platform seçin..."} disabled={!selPlatform}
              value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} />
            <button onClick={handleSave} disabled={saving || !selPlatform || !inputVal.trim()} className="btn btn-primary" style={{ flexShrink: 0 }}>
              {saving ? "..." : "Kaydet"}
            </button>
            <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0 4px" }}>
              <X size={16} />
            </button>
          </div>
          {platform && <p style={{ fontSize: 11, color: "var(--text-muted)", paddingLeft: 2 }}>{platform.hint}{platform.prefix ? ` — Prefix: ${platform.prefix}` : ""}</p>}
        </div>
      )}

      {activePlatforms.length === 0 && !showAdd && (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Henüz hesap eklenmedi.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {activePlatforms.map(key => {
          const p = ALL_PLATFORMS.find(x => x.key === key);
          if (!p) return null;
          const val = socials[key];
          const url = p.prefix && !val.startsWith("http") ? p.prefix + val : val;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, background: `${p.color}18`, border: `1px solid ${p.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
                {PLATFORM_ICONS[key] || "🔗"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{p.label}</div>
                <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</a>
              </div>
              <button onClick={() => handleEdit(key)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}><Edit2 size={13} /></button>
              <button onClick={() => handleDelete(key)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", padding: 4, opacity: .7 }}><Trash2 size={13} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Hesap Bağlantıları ────────────────────────────────────────────────────────
function AccountLinksPanel({ user }) {
  const BASE = "https://corleoneteam.com.tr/api";
  const links = [
    { linkedKey: "google_linked",  label: "Google",  infoKey: "email",            color: "#EA4335", icon: "G", linkUrl: `${BASE}/auth/google-login.php?link=1` },
    { linkedKey: "discord_linked", label: "Discord", infoKey: "discord_username", color: "#5865f2", icon: "D", linkUrl: `${BASE}/auth/discord-login.php?link=1` },
    { linkedKey: "steam_linked",   label: "Steam",   infoKey: "steam_username",   color: "#1b2838", icon: "S", linkUrl: `${BASE}/auth/steam-login.php?link=1` },
  ];

  return (
    <div className="card">
      <SectionTitle>Hesap Bağlantıları</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map(({ linkedKey, label, infoKey, color, icon, linkUrl }) => {
          const connected = !!(user || {})[linkedKey];
          const info = (user || {})[infoKey] || "";
          return (
            <div key={linkedKey} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg-elevated)", border: `1px solid ${connected ? color + "44" : "var(--border)"}`, borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: connected ? `${color}22` : "var(--border)", border: `1px solid ${connected ? color + "55" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 14, color: connected ? color : "var(--text-muted)" }}>
                {icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: connected ? "var(--text-primary)" : "var(--text-muted)" }}>{label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {connected ? info || "Bağlı" : "Bağlı değil"}
                </div>
              </div>
              {connected
                ? <span style={{ fontSize: 11, color: "#2ecc71", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Bağlı</span>
                : <a href={linkUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: 11, padding: "4px 12px", textDecoration: "none" }}>Bağla</a>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Şifre Değiştir ────────────────────────────────────────────────────────────
function PasswordPanel({ user }) {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });
  const hasPassword = !!(user || {}).password_hash;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) { setMsg({ text: "Şifreler eşleşmiyor.", ok: false }); return; }
    setSaving(true);
    try {
      const res = await profileApi.changePassword(form);
      const ok = res.data.success;
      setMsg({ text: res.data.message || (ok ? "Şifre güncellendi." : "Hata."), ok });
      if (ok) setForm({ current_password: "", new_password: "", confirm_password: "" });
    } finally { setSaving(false); }
  };

  const generatePw = () => {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    const arr = new Uint8Array(14);
    crypto.getRandomValues(arr);
    const pw = Array.from(arr).map(b => chars[b % chars.length]).join("");
    setForm(p => ({ ...p, new_password: pw }));
  };

  return (
    <div className="card">
      <SectionTitle>{hasPassword ? "Şifre Değiştir" : "Şifre Belirle"}</SectionTitle>
      {!hasPassword && (
        <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: "rgba(245,166,35,.07)", border: "1px solid rgba(245,166,35,.2)", borderRadius: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 18 }}>G</span>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>Hesabınız OAuth ile oluşturulmuş. Şifre belirleyerek e-posta ile de giriş yapabilirsiniz.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {hasPassword && (
          <Field label="Mevcut Şifre">
            <PasswordInput value={form.current_password} onChange={e => setForm(p => ({ ...p, current_password: e.target.value }))} placeholder="••••••••" name="current_password" />
          </Field>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Yeni Şifre">
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1 }}>
                <PasswordInput value={form.new_password} onChange={e => setForm(p => ({ ...p, new_password: e.target.value }))} placeholder="••••••••" name="new_password" />
                <PwStrengthBar value={form.new_password} />
              </div>
              <button type="button" onClick={generatePw} title="Güçlü şifre oluştur"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--accent)", borderRadius: 8, padding: "0 10px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center" }}>
                <RefreshCw size={14} />
              </button>
            </div>
          </Field>
          <Field label="Yeni Şifre (Tekrar)">
            <PasswordInput value={form.confirm_password} onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))} placeholder="••••••••" name="confirm_password" />
          </Field>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={14} />{saving ? "Kaydediliyor..." : (hasPassword ? "Şifreyi Güncelle" : "Şifre Belirle")}
          </button>
          {msg.text && <span style={{ fontSize: 12, color: msg.ok ? "#2ecc71" : "#e74c3c" }}>{msg.text}</span>}
        </div>
      </form>
    </div>
  );
}

// ── E-posta Değiştir ──────────────────────────────────────────────────────────
function EmailChangePanel({ user }) {
  const [newEmail, setNewEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });

  const handleSend = async () => {
    if (!newEmail.trim()) return;
    setSending(true);
    try {
      const res = await profileApi.requestEmailChange(newEmail.trim());
      setMsg({ text: res.data.message || "Mail gönderildi.", ok: res.data.success });
      if (res.data.success) setNewEmail("");
    } finally { setSending(false); }
  };

  return (
    <div className="card">
      <SectionTitle>E-posta Değiştir</SectionTitle>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
        Mevcut: <strong style={{ color: "var(--text-primary)" }}>{user?.email}</strong><br />
        Yeni adrese onay maili gönderilecek.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="input" type="email" placeholder="yeni@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()} style={{ flex: 1 }} />
        <button onClick={handleSend} disabled={sending || !newEmail.trim()} className="btn btn-primary" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <Mail size={14} />{sending ? "..." : "Gönder"}
        </button>
      </div>
      {msg.text && <p style={{ fontSize: 12, color: msg.ok ? "#2ecc71" : "#e74c3c", marginTop: 8 }}>{msg.text}</p>}
    </div>
  );
}

// ── Bildirim Tercihleri ───────────────────────────────────────────────────────
function NotificationsPanel({ user }) {
  const [prefs, setPrefs] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    setPrefs({
      notify_events:    user.notify_events    === true || user.notify_events    === 1,
      notify_followers: user.notify_followers === true || user.notify_followers === 1,
      notify_system:    user.notify_system    === true || user.notify_system    === 1,
    });
  }, [user]);

  const handleChange = async (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    await profileApi.saveNotifications({
      notify_events:    next.notify_events    ? 1 : 0,
      notify_followers: next.notify_followers ? 1 : 0,
      notify_system:    next.notify_system    ? 1 : 0,
    });
    setMsg("Kaydedildi.");
    setTimeout(() => setMsg(""), 2000);
  };

  const rows = [
    { key: "notify_events",    label: "Etkinlik bildirimleri",  desc: "Yeni etkinlik, onay ve hatırlatmalar" },
    { key: "notify_followers", label: "Takipçi bildirimleri",   desc: "Biri sizi takip ettiğinde" },
    { key: "notify_system",    label: "Sistem bildirimleri",    desc: "Puan, rozet ve sistem mesajları" },
  ];

  if (!prefs) return <div className="card"><SectionTitle>Bildirim Tercihleri</SectionTitle><p style={{ fontSize: 12, color: "var(--text-muted)" }}>Yükleniyor...</p></div>;

  return (
    <div className="card">
      <SectionTitle>Bildirim Tercihleri</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(r => (
          <ToggleRow key={r.key} label={r.label} desc={r.desc} checked={!!prefs[r.key]} onChange={e => handleChange(r.key, e.target.checked)} />
        ))}
        {msg && <p style={{ fontSize: 11, color: "#2ecc71" }}>{msg}</p>}
      </div>
    </div>
  );
}

// ── Gizlilik Ayarları ─────────────────────────────────────────────────────────
function PrivacyPanel({ user }) {
  const [prefs, setPrefs] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    setPrefs({
      privacy_phone:     user.privacy_phone     || "private",
      privacy_birthdate: user.privacy_birthdate || "members",
      privacy_email:     user.privacy_email     || "private",
    });
  }, [user]);

  const handleChange = async (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    await profileApi.savePrivacy(next);
    setMsg("Kaydedildi.");
    setTimeout(() => setMsg(""), 2000);
  };

  const opts = [{ v: "public", l: "Herkese Açık" }, { v: "members", l: "Sadece Üyeler" }, { v: "private", l: "Gizli" }];
  const rows = [
    { key: "privacy_phone",     label: "Telefon numaram" },
    { key: "privacy_birthdate", label: "Doğum tarihim" },
    { key: "privacy_email",     label: "E-posta adresim" },
  ];

  if (!prefs) return <div className="card"><SectionTitle>Gizlilik Ayarları</SectionTitle><p style={{ fontSize: 12, color: "var(--text-muted)" }}>Yükleniyor...</p></div>;

  return (
    <div className="card">
      <SectionTitle>Gizlilik Ayarları</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(r => (
          <div key={r.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{r.label}</span>
            <select value={prefs[r.key]} onChange={e => handleChange(r.key, e.target.value)}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "5px 10px", borderRadius: 7, fontSize: 12, outline: "none", cursor: "pointer" }}>
              {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        ))}
        {msg && <p style={{ fontSize: 11, color: "#2ecc71" }}>{msg}</p>}
      </div>
    </div>
  );
}

// ── Aktif Oturumlar ───────────────────────────────────────────────────────────
function SessionsPanel() {
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    profileApi.listSessions().then(r => {
      if (r.data.success) {
        setSessions(r.data.data.sessions || []);
        setCurrent(r.data.data.current || "");
      }
    });
  }, []);

  const handleRevoke = async () => {
    if (!confirm("Diğer tüm oturumlar kapatılacak. Emin misiniz?")) return;
    await profileApi.revokeOtherSessions();
    profileApi.listSessions().then(r => {
      if (r.data.success) { setSessions(r.data.data.sessions || []); setCurrent(r.data.data.current || ""); }
    });
  };

  const getDeviceInfo = (ua = "") => {
    const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Tarayıcı";
    const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : ua.includes("Android") ? "Android" : ua.includes("iPhone") ? "iOS" : "Bilinmeyen";
    const mobile = ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone");
    return { browser, os, mobile };
  };

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <SectionTitle>Aktif Oturumlar</SectionTitle>
        <button onClick={handleRevoke} className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
          <LogOut size={12} /> Diğerlerini Kapat
        </button>
      </div>
      {sessions.length === 0
        ? <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Oturum bulunamadı.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.map(s => {
              const isCurrent = s.session_id === current;
              const { browser, os, mobile } = getDeviceInfo(s.user_agent);
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg-elevated)", border: `1px solid ${isCurrent ? "rgba(245,166,35,.3)" : "var(--border)"}`, borderRadius: 8 }}>
                  {mobile ? <Smartphone size={16} color={isCurrent ? "var(--accent)" : "var(--text-muted)"} /> : <Monitor size={16} color={isCurrent ? "var(--accent)" : "var(--text-muted)"} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                      {browser} — {os} {isCurrent && <span style={{ fontSize: 10, color: "var(--accent)" }}>(Bu oturum)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {s.ip_address} · {new Date(s.last_seen).toLocaleString("tr-TR")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ── Tehlikeli Bölge ───────────────────────────────────────────────────────────
function DangerZonePanel() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await profileApi.deleteAccount(confirmText);
      if (res.data.success) {
        localStorage.removeItem("auth_token");
        window.location.reload();
      } else {
        alert(res.data.message || "Hata.");
      }
    } finally { setDeleting(false); }
  };

  return (
    <div className="card" style={{ borderColor: "rgba(231,76,60,.25)" }}>
      <SectionTitle>Tehlikeli Bölge</SectionTitle>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
        Hesabınızı sildiğinizde tüm verileriniz devre dışı bırakılır. Bu işlem geri alınamaz.
      </p>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.3)", color: "#e74c3c", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle size={14} /> Hesabımı Sil
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: "10px 14px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: 8, fontSize: 12, color: "#e74c3c", lineHeight: 1.6 }}>
            Onaylamak için <strong>SİL</strong> yazın
          </div>
          <input className="input" placeholder="SİL" value={confirmText} onChange={e => setConfirmText(e.target.value)}
            style={{ borderColor: "rgba(231,76,60,.3)" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleDelete} disabled={deleting || confirmText !== "SİL"}
              style={{ background: "rgba(231,76,60,.15)", border: "1px solid rgba(231,76,60,.4)", color: "#e74c3c", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, opacity: confirmText !== "SİL" ? .5 : 1 }}>
              {deleting ? "Siliniyor..." : "Hesabımı Kalıcı Olarak Sil"}
            </button>
            <button onClick={() => { setOpen(false); setConfirmText(""); }} className="btn btn-ghost" style={{ fontSize: 12 }}>İptal</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab Navigation ────────────────────────────────────────────────────────────
const TABS = [
  { id: "profile",       label: "Profil",          icon: <User size={14} /> },
  { id: "security",      label: "Güvenlik",         icon: <Lock size={14} /> },
  { id: "notifications", label: "Bildirimler",      icon: <Bell size={14} /> },
  { id: "privacy",       label: "Gizlilik",         icon: <Shield size={14} /> },
  { id: "sessions",      label: "Oturumlar",        icon: <Monitor size={14} /> },
];

// ── Ana Bileşen ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState("profile");

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Profil</h1>
        <p className="page-subtitle">Hesap bilgilerini ve ayarlarını yönet</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>

        {/* Sol kolon — sabit */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AvatarPanel user={user} setUser={setUser} />
          <AccountLinksPanel user={user} />
        </div>

        {/* Sağ kolon — sekmeli */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4, padding: "4px", background: "var(--bg-elevated)", borderRadius: 10, border: "1px solid var(--border)" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: tab === t.id ? "var(--accent)" : "transparent",
                  color: tab === t.id ? "#111" : "var(--text-muted)",
                  transition: "all .15s",
                }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Tab içerikleri */}
          {tab === "profile" && (
            <>
              <PersonalInfoPanel user={user} />
              <SocialsPanel />
            </>
          )}

          {tab === "security" && (
            <>
              <PasswordPanel user={user} />
              <EmailChangePanel user={user} />
              <DangerZonePanel />
            </>
          )}

          {tab === "notifications" && <NotificationsPanel user={user} />}
          {tab === "privacy" && <PrivacyPanel user={user} />}
          {tab === "sessions" && <SessionsPanel />}
        </div>
      </div>
    </>
  );
}
