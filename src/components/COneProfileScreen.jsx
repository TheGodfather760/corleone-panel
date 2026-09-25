import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../lib/SettingsContext";
import { useAuth } from "../lib/AuthContext";
import { useUpdate } from "../lib/UpdateContext";
import { profileApi, authApi } from "../lib/api";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  ChevronLeft, ChevronDown, Music, Palette, Settings,
  Volume2, VolumeX, LogOut, RefreshCw, Download,
  User, Bell, Shield, Lock, Monitor, Trash2, Camera,
  Plus, X, Edit2, Check, Eye, EyeOff, Globe, Truck
} from "lucide-react";
import {
  FaXTwitter, FaInstagram, FaYoutube, FaTwitch, FaTiktok,
  FaFacebook, FaLinkedin, FaGithub, FaReddit, FaTelegram,
  FaDiscord, FaSpotify, FaSnapchat, FaBluesky
} from "react-icons/fa6";
import { SiKick } from "react-icons/si";

const ACCENT_COLORS = [
  { label: "Turuncu", value: "#f5a623" },
  { label: "Mor",     value: "#7c3aed" },
  { label: "Mavi",    value: "#3b82f6" },
  { label: "Yesil",   value: "#2ecc71" },
  { label: "Kirmizi", value: "#e74c3c" },
  { label: "Pembe",   value: "#ec4899" },
  { label: "Cyan",    value: "#06b6d4" },
];

const FONTS = [
  { key: "LemonMilk",     label: "LemonMilk",      family: "'LemonMilk', sans-serif",                                      weight: 700 },
  { key: "Orbitron",      label: "Orbitron",        family: "'Orbitron', sans-serif",                                       weight: 700 },
  { key: "Rajdhani",      label: "Rajdhani",        family: "'Rajdhani', sans-serif",                                       weight: 700 },
  { key: "Exo2",          label: "Exo 2",           family: "'Exo 2', sans-serif",                                          weight: 700 },
  { key: "ShareTechMono", label: "Share Tech Mono", family: "'Share Tech Mono', monospace",                                 weight: 400 },
  { key: "SegoeUI",       label: "Segoe UI",        family: "'Segoe UI', sans-serif",                                       weight: 700 },
  { key: "Ubuntu",        label: "Ubuntu",          family: "'Ubuntu', sans-serif",                                         weight: 700 },
  { key: "CenturyGothic", label: "Century Gothic",  family: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif", weight: 700 },
];

const PLATFORMS = {
  twitter:       { label: "X (Twitter)",  Icon: FaXTwitter,   color: "#e7e7e7", hint: "Kullanici adi",      prefix: "https://x.com/" },
  instagram:     { label: "Instagram",    Icon: FaInstagram,  color: "#e1306c", hint: "Kullanici adi",      prefix: "https://instagram.com/" },
  youtube:       { label: "YouTube",      Icon: FaYoutube,    color: "#ff0000", hint: "Kanal URL / @kanal",  prefix: "" },
  twitch:        { label: "Twitch",       Icon: FaTwitch,     color: "#9146ff", hint: "Kullanici adi",      prefix: "https://twitch.tv/" },
  tiktok:        { label: "TikTok",       Icon: FaTiktok,     color: "#e7e7e7", hint: "Kullanici adi",      prefix: "https://tiktok.com/@" },
  kick:          { label: "Kick",         Icon: SiKick,       color: "#53fc18", hint: "Kullanici adi",      prefix: "https://kick.com/" },
  facebook:      { label: "Facebook",     Icon: FaFacebook,   color: "#1877f2", hint: "Kullanici adi",      prefix: "https://facebook.com/" },
  linkedin:      { label: "LinkedIn",     Icon: FaLinkedin,   color: "#0a66c2", hint: "Profil URL",         prefix: "" },
  github:        { label: "GitHub",       Icon: FaGithub,     color: "#e7e7e7", hint: "Kullanici adi",      prefix: "https://github.com/" },
  reddit:        { label: "Reddit",       Icon: FaReddit,     color: "#ff4500", hint: "Kullanici adi",      prefix: "https://reddit.com/u/" },
  bluesky:       { label: "Bluesky",      Icon: FaBluesky,    color: "#0085ff", hint: "handle.bsky.social",  prefix: "https://bsky.app/profile/" },
  telegram:      { label: "Telegram",     Icon: FaTelegram,   color: "#26a5e4", hint: "Kullanici adi",      prefix: "https://t.me/" },
  discord_social:{ label: "Discord",      Icon: FaDiscord,    color: "#5865f2", hint: "Kullanici adi",      prefix: "" },
  spotify:       { label: "Spotify",      Icon: FaSpotify,    color: "#1db954", hint: "Profil URL",         prefix: "" },
  snapchat:      { label: "Snapchat",     Icon: FaSnapchat,   color: "#fffc00", hint: "Kullanici adi",      prefix: "https://snapchat.com/add/" },
  truckersmp:    { label: "TruckersMP",   Icon: Truck,        color: "#f5a623", hint: "Profil URL",         prefix: "" },
  website:       { label: "Web Sitesi",   Icon: Globe,        color: "#3498db", hint: "https://...",        prefix: "" },
};

// ── Yardimci bilesen ──────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, label, accent }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${accent}25`, display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={14} color={accent} /> {label}
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 3 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange, accent }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 42, height: 24, borderRadius: 12, background: value ? accent : "rgba(255,255,255,.1)", border: `1px solid ${value ? accent : "rgba(255,255,255,.15)"}`, cursor: "pointer", position: "relative", transition: "all .2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.4)" }} />
    </div>
  );
}

function FieldInput({ label, value, onChange, type, placeholder, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", letterSpacing: 1, textTransform: "uppercase" }}>{label}</label>}
      <input
        type={type || "text"} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", color: disabled ? "rgba(255,255,255,.3)" : "#fff", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", cursor: disabled ? "not-allowed" : "text", transition: "border-color .2s" }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = "rgba(245,166,35,.5)"; }}
        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,.1)"; }}
      />
    </div>
  );
}

function PasswordInput({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", letterSpacing: 1, textTransform: "uppercase" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 38px 9px 12px", color: "#fff", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color .2s" }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,166,35,.5)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,.1)"; }}
        />
        <button type="button" onClick={() => setShow(s => !s)}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.35)", display: "flex", alignItems: "center" }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

function SaveBtn({ onClick, loading, label, accent }) {
  const lbl = label || "Kaydet";
  return (
    <button onClick={onClick} disabled={loading}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: `1px solid ${accent}50`, background: `${accent}18`, color: accent, fontSize: 11, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .6 : 1, transition: "all .2s" }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = `${accent}30`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${accent}18`; }}>
      {loading ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={12} />}
      {loading ? "Kaydediliyor..." : lbl}
    </button>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const color = type === "error" ? "#e74c3c" : "#2ecc71";
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ padding: "8px 14px", borderRadius: 8, background: `${color}18`, border: `1px solid ${color}40`, color, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
      {msg}
    </motion.div>
  );
}

function FontDropdown({ value, onChange, accent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = FONTS.find(f => f.key === value) || FONTS[0];
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: 200 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 14px", borderRadius: 9, cursor: "pointer", transition: "all .2s", background: open ? `${accent}15` : "rgba(255,255,255,.05)", border: `1px solid ${open ? accent + "50" : "rgba(255,255,255,.12)"}` }}>
        <span style={{ fontFamily: current.family, fontWeight: current.weight, fontSize: 14, color: "#fff" }}>{current.label}</span>
        <ChevronDown size={13} color="rgba(255,255,255,.4)" style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100, background: "rgba(12,12,20,.98)", border: `1px solid ${accent}30`, borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.6)" }}>
            {FONTS.map((f, i) => {
              const isActive = f.key === value;
              return (
                <div key={f.key} onClick={() => { onChange(f.key); setOpen(false); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", cursor: "pointer", background: isActive ? `${accent}15` : "transparent", borderTop: i > 0 ? "1px solid rgba(255,255,255,.05)" : "none", transition: "background .12s" }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ fontFamily: f.family, fontWeight: f.weight, fontSize: 14, color: isActive ? "#fff" : "rgba(255,255,255,.7)" }}>{f.label}</span>
                  {isActive && <div style={{ width: 16, height: 16, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function AvatarSection({ user, setUser, accent }) {
  const [avatars, setAvatars] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    profileApi.getAvatars().then(res => {
      if (res.data.success) setAvatars(res.data.data?.avatars || []);
    });
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setProgress(20);
    const fd = new FormData();
    fd.append("file", file);
    const res = await profileApi.uploadAvatar(fd);
    setProgress(100);
    if (res.data.success) {
      const av = { id: res.data.data.id, url: res.data.data.url };
      setAvatars(prev => [av, ...prev]);
      await handleSet(res.data.data.url);
    }
    setTimeout(() => { setUploading(false); setProgress(0); }, 800);
    e.target.value = "";
  };

  const handleSet = async (url) => {
    const res = await profileApi.setAvatar(url);
    if (res.data.success) setUser(prev => ({ ...prev, avatar: url }));
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const res = await profileApi.deleteAvatar(id);
    if (res.data.success) setAvatars(prev => prev.filter(a => a.id !== id));
  };

  const cur = user?.avatar;

  return (
    <div style={{ padding: 20, background: "rgba(255,255,255,.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: avatars.length > 0 ? 20 : 0 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          {cur
            ? <img src={cur} style={{ width: 72, height: 72, borderRadius: "50%", border: `3px solid ${accent}60`, objectFit: "cover" }} />
            : <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${accent}20`, color: accent, fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${accent}40` }}>{(user?.username || "U")[0].toUpperCase()}</div>
          }
          <button onClick={() => fileRef.current?.click()}
            style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: accent, border: "2px solid #0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Camera size={11} color="#000" />
          </button>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{user?.username}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginBottom: 8 }}>{user?.email}</div>
          <button onClick={() => fileRef.current?.click()}
            style={{ fontSize: 11, fontWeight: 700, color: accent, background: `${accent}15`, border: `1px solid ${accent}40`, borderRadius: 7, padding: "5px 12px", cursor: "pointer" }}>
            Fotograf Yukle
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleUpload} />
        </div>
      </div>
      {uploading && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: accent, borderRadius: 3, transition: "width .3s" }} />
          </div>
        </div>
      )}
      {avatars.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Fotograflarim</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 8 }}>
            {avatars.map(av => {
              const isActive = av.url === cur;
              return (
                <div key={av.id} style={{ position: "relative" }}
                  onMouseEnter={e => { const b = e.currentTarget.querySelector(".av-del"); if (b) b.style.display = "flex"; }}
                  onMouseLeave={e => { const b = e.currentTarget.querySelector(".av-del"); if (b) b.style.display = "none"; }}>
                  <img src={av.url} onClick={() => handleSet(av.url)}
                    style={{ width: "100%", aspectRatio: "1", borderRadius: 8, objectFit: "cover", border: `2px solid ${isActive ? accent : "transparent"}`, cursor: "pointer", boxSizing: "border-box", transition: "border-color .2s" }} />
                  {!isActive && (
                    <button className="av-del" onClick={(e) => handleDelete(av.id, e)}
                      style={{ display: "none", position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "#e74c3c", border: "none", cursor: "pointer", alignItems: "center", justifyContent: "center" }}>
                      <X size={9} color="#fff" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profil Bilgileri ──────────────────────────────────────────────────────────

function ProfileInfoSection({ user, setUser, accent }) {
  const [form, setForm] = useState({ real_name: "", bio: "", country: "", city: "", birth_date: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    profileApi.getInfo().then(res => {
      const d = res.data?.data || res.data;
      if (d && typeof d === "object") {
        setForm({
          real_name:  d.real_name  || "",
          bio:        d.bio        || "",
          country:    d.country    || "",
          city:       d.city       || "",
          birth_date: d.birth_date ? d.birth_date.split("T")[0] : "",
          phone:      d.phone      || "",
        });
      }
    });
  }, []);

  const showToast = (msg, type) => { setToast({ msg, type: type || "success" }); setTimeout(() => setToast(null), 3000); };

  const save = async () => {
    setLoading(true);
    const res = await profileApi.saveInfo(form);
    setLoading(false);
    if (res.data.success !== false) {
      showToast("Profil guncellendi.");
      setUser(prev => ({ ...prev, ...form }));
    } else {
      showToast(res.data.message || "Hata olustu.", "error");
    }
  };

  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <FieldInput label="Gercek Ad Soyad" value={form.real_name} onChange={f("real_name")} placeholder="Ad Soyad" />
        <FieldInput label="Telefon" value={form.phone} onChange={f("phone")} placeholder="+90 5xx xxx xx xx" />
        <FieldInput label="Ulke" value={form.country} onChange={f("country")} placeholder="Turkiye" />
        <FieldInput label="Sehir" value={form.city} onChange={f("city")} placeholder="Istanbul" />
        <FieldInput label="Dogum Tarihi" value={form.birth_date} onChange={f("birth_date")} type="date" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Hakkimda</label>
        <textarea value={form.bio} onChange={e => f("bio")(e.target.value)} placeholder="Kendinizden kisaca bahsedin..." rows={3}
          style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,166,35,.5)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,.1)"; }} />
      </div>
      <SaveBtn onClick={save} loading={loading} accent={accent} />
    </div>
  );
}

// ── Sosyal Medya ──────────────────────────────────────────────────────────────

function SocialsSection({ accent }) {
  const [socials, setSocials] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [selPlatform, setSelPlatform] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileApi.getSocials().then(res => { if (res.data.success) setSocials(res.data.socials || {}); });
  }, []);

  const save = async () => {
    if (!selPlatform || !inputVal.trim()) return;
    setSaving(true);
    const res = await profileApi.saveSocial(selPlatform, inputVal.trim());
    setSaving(false);
    if (res.data.success) {
      setSocials(p => ({ ...p, [selPlatform]: inputVal.trim() }));
      setSelPlatform(""); setInputVal(""); setShowAdd(false);
    }
  };

  const del = async (platform) => {
    const res = await profileApi.deleteSocial(platform);
    if (res.data.success) setSocials(p => { const n = { ...p }; delete n[platform]; return n; });
  };

  const edit = (platform) => {
    setSelPlatform(platform);
    setInputVal(socials[platform] || "");
    setShowAdd(true);
  };

  const keys = Object.keys(socials);

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", letterSpacing: 1, textTransform: "uppercase" }}>Sosyal Medya</div>
        <button onClick={() => { setShowAdd(s => !s); setSelPlatform(""); setInputVal(""); }}
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: accent, background: `${accent}15`, border: `1px solid ${accent}35`, borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>
          <Plus size={11} /> Hesap Ekle
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: 12, padding: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: selPlatform && PLATFORMS[selPlatform]?.prefix ? 6 : 0 }}>
              <select value={selPlatform} onChange={e => { setSelPlatform(e.target.value); setInputVal(socials[e.target.value] || ""); }}
                style={{ flex: "0 0 150px", background: "#111118", border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 13, outline: "none", cursor: "pointer" }}>
                <option value="" style={{ background: "#111118" }}>Platform sec...</option>
                {Object.entries(PLATFORMS).map(([k, p]) => (
                  <option key={k} value={k} style={{ background: "#111118" }}>{p.label}</option>
                ))}
              </select>
              <input value={inputVal} onChange={e => setInputVal(e.target.value)}
                placeholder={selPlatform ? PLATFORMS[selPlatform]?.hint : "Platform secin..."}
                disabled={!selPlatform}
                onKeyDown={e => e.key === "Enter" && save()}
                style={{ flex: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", cursor: selPlatform ? "text" : "not-allowed" }} />
              <button onClick={save} disabled={saving || !selPlatform || !inputVal.trim()}
                style={{ padding: "8px 14px", borderRadius: 8, background: accent, color: "#000", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", flexShrink: 0, opacity: (!selPlatform || !inputVal.trim()) ? .5 : 1 }}>
                {saving ? "..." : "Ekle"}
              </button>
              <button onClick={() => setShowAdd(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.4)", padding: "0 4px", display: "flex", alignItems: "center" }}>
                <X size={16} />
              </button>
            </div>
            {selPlatform && PLATFORMS[selPlatform]?.prefix && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.25)" }}>Prefix: {PLATFORMS[selPlatform].prefix}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {keys.length === 0 && !showAdd && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.25)", padding: "4px 0" }}>Henuz hesap eklenmedi.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {keys.map(k => {
          const p = PLATFORMS[k];
          if (!p) return null;
          const val = socials[k];
          const url = p.prefix && !val.startsWith("http") ? p.prefix + val : val.startsWith("http") ? val : "https://" + val;
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${p.color}18`, border: `1px solid ${p.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <p.Icon size={13} color={p.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{p.label}</div>
                <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "rgba(255,255,255,.35)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</a>
              </div>
              <button onClick={() => edit(k)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.35)", padding: 4, display: "flex" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.35)"; }}>
                <Edit2 size={13} />
              </button>
              <button onClick={() => del(k)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(231,76,60,.5)", padding: 4, display: "flex" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#e74c3c"; }} onMouseLeave={e => { e.currentTarget.style.color = "rgba(231,76,60,.5)"; }}>
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Hesap Baglantilari ───────────────────────────────────────────────────────

function AccountLinksSection({ user, setUser, accent }) {
  // user objesi eski bir cache'den gelebilir, guncel baglanti durumunu cek
  const [links, setLinks] = useState(null);

  useEffect(() => {
    authApi.me().then(res => {
      if (res.data?.authenticated) {
        const u = res.data.user;
        setLinks({
          google:  { linked: !!u.google_linked,  info: u.google_linked  ? u.email           : null },
          discord: { linked: !!u.discord_linked, info: u.discord_linked ? u.discord_username : null },
          steam:   { linked: !!u.steam_linked,   info: u.steam_linked   ? u.steam_username   : null },
        });
        // setUser ile de guncelle
        setUser(prev => ({ ...prev, ...u }));
      }
    });
  }, []);

  const accounts = [
    {
      key: "google",
      label: "Google",
      linked: links ? links.google.linked  : !!user?.google_linked,
      info:   links ? links.google.info    : (user?.google_linked  ? user?.email            : null),
      color: "#EA4335",
      Icon: () => (
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 19.07 12c0 .68-.06 1.34-.17 1.97H12v-3.73h7.6A7.1 7.1 0 0 0 12 4.93a7.08 7.08 0 0 0-6.73 4.83z"/>
          <path fill="#34A853" d="M12 19.07a7.07 7.07 0 0 1-6.73-4.84l-3.27 2.52A11.97 11.97 0 0 0 12 24c3.24 0 5.95-1.17 7.94-3.07l-3.1-2.4A7.07 7.07 0 0 1 12 19.07z"/>
          <path fill="#FBBC05" d="M5.27 14.23A7.1 7.1 0 0 1 4.93 12c0-.77.13-1.52.34-2.24L1.99 7.24A11.97 11.97 0 0 0 0 12c0 1.93.46 3.75 1.28 5.36l3.99-3.13z"/>
          <path fill="#4285F4" d="M12 4.93c1.73 0 3.29.63 4.51 1.67l3.37-3.37A11.95 11.95 0 0 0 12 0C7.37 0 3.4 2.7 1.99 7.24l3.28 2.52A7.08 7.08 0 0 1 12 4.93z"/>
        </svg>
      ),
      getLinkUrl: () => authApi.linkGoogle(),
    },
    {
      key: "discord",
      label: "Discord",
      linked: links ? links.discord.linked : !!user?.discord_linked,
      info:   links ? links.discord.info   : (user?.discord_linked ? user?.discord_username : null),
      color: "#5865F2",
      Icon: () => (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#5865F2">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      ),
      getLinkUrl: () => authApi.linkDiscord(),
    },
    {
      key: "steam",
      label: "Steam",
      linked: links ? links.steam.linked   : !!user?.steam_linked,
      info:   links ? links.steam.info     : (user?.steam_linked   ? user?.steam_username   : null),
      color: "#1b2838",
      Icon: () => (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#c7d5e0">
          <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
        </svg>
      ),
      getLinkUrl: () => authApi.linkSteam(),
    },
  ];

  const handleLink = async (getLinkUrl) => {
    try {
      await openUrl(getLinkUrl());
    } catch {
      window.open(getLinkUrl(), "_blank");
    }
  };

  return (
    <div style={{ padding: 20, background: "rgba(255,255,255,.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Hesap Baglantilari</div>
      {!links ? (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Yukleniyor...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {accounts.map(({ key, label, linked, info, color, Icon, getLinkUrl }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,.03)", border: `1px solid ${linked ? color + "40" : "rgba(255,255,255,.07)"}`, borderRadius: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: linked ? color + "20" : "rgba(255,255,255,.05)", border: `1px solid ${linked ? color + "40" : "rgba(255,255,255,.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: linked ? "#fff" : "rgba(255,255,255,.5)" }}>{label}</div>
                <div style={{ fontSize: 11, color: linked ? color : "rgba(255,255,255,.25)", marginTop: 2 }}>
                  {linked ? (info || "Bagli") : "Bagli degil"}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {linked ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#2ecc71" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ecc71", boxShadow: "0 0 6px #2ecc71" }} />
                    Bagli
                  </div>
                ) : (
                  <button onClick={() => handleLink(getLinkUrl)}
                    style={{ fontSize: 11, fontWeight: 700, color: accent, background: `${accent}15`, border: `1px solid ${accent}40`, borderRadius: 7, padding: "5px 12px", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${accent}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${accent}15`; }}>
                    Bagla
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)", marginTop: 12, lineHeight: 1.6 }}>
        Hesap baglamak icin tarayici acilacak. Islem tamamlandiktan sonra uygulamaya donun.
      </div>
    </div>
  );
}

// ── Guvenlik ──────────────────────────────────────────────────────────────────

function SecuritySection({ user, accent }) {
  const { logout } = useAuth();
  const [pw, setPw] = useState({ current: "", new: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwToast, setPwToast] = useState(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailVal, setEmailVal] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailToast, setEmailToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const showPwToast = (msg, type) => { setPwToast({ msg, type: type || "success" }); setTimeout(() => setPwToast(null), 3500); };
  const showEmailToast = (msg, type) => { setEmailToast({ msg, type: type || "success" }); setTimeout(() => setEmailToast(null), 3500); };

  const changePw = async () => {
    if (pw.new.length < 8) { showPwToast("Sifre en az 8 karakter olmali.", "error"); return; }
    if (pw.new !== pw.confirm) { showPwToast("Sifreler eslesmiyor.", "error"); return; }
    setPwLoading(true);
    const res = await profileApi.changePassword({ current_password: pw.current, new_password: pw.new, confirm_password: pw.confirm });
    setPwLoading(false);
    if (res.data.success !== false) { showPwToast("Sifre guncellendi."); setPw({ current: "", new: "", confirm: "" }); }
    else showPwToast(res.data.message || "Hata olustu.", "error");
  };

  const requestEmail = async () => {
    if (!emailVal.trim()) return;
    setEmailLoading(true);
    const res = await profileApi.requestEmailChange(emailVal.trim());
    setEmailLoading(false);
    const ok = res.data.success !== false;
    showEmailToast(res.data.message || (ok ? "Onay maili gonderildi." : "Hata."), ok ? "success" : "error");
    if (ok) { setEmailOpen(false); setEmailVal(""); }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "SIL") return;
    const res = await profileApi.deleteAccount("SIL");
    if (res.data.success !== false) logout();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <div style={{ padding: 20, background: "rgba(255,255,255,.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Sifre Degistir</div>
        <AnimatePresence>{pwToast && <Toast msg={pwToast.msg} type={pwToast.type} />}</AnimatePresence>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
          {user?.password_hash && <PasswordInput label="Mevcut Sifre" value={pw.current} onChange={v => setPw(p => ({ ...p, current: v }))} />}
          <PasswordInput label="Yeni Sifre" value={pw.new} onChange={v => setPw(p => ({ ...p, new: v }))} />
          <PasswordInput label="Yeni Sifre (Tekrar)" value={pw.confirm} onChange={v => setPw(p => ({ ...p, confirm: v }))} />
        </div>
        <SaveBtn onClick={changePw} loading={pwLoading} label="Sifreyi Guncelle" accent={accent} />
      </div>

      <div style={{ padding: 20, background: "rgba(255,255,255,.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 10 }}>E-posta Adresi</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, marginBottom: emailOpen ? 12 : 0 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.7)" }}>{user?.email}</span>
          <button onClick={() => { setEmailOpen(o => !o); setEmailVal(""); }}
            style={{ fontSize: 11, fontWeight: 700, color: accent, background: `${accent}15`, border: `1px solid ${accent}35`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
            Degistir
          </button>
        </div>
        <AnimatePresence>
          {emailOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginBottom: 10 }}>Yeni adrese onay maili gonderilir, onaylayana kadar mevcut adres gecerli kalir.</div>
              <AnimatePresence>{emailToast && <Toast msg={emailToast.msg} type={emailToast.type} />}</AnimatePresence>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={emailVal} onChange={e => setEmailVal(e.target.value)} placeholder="yeni@email.com" type="email"
                  style={{ flex: 1, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(245,166,35,.5)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,.1)"; }}
                  onKeyDown={e => e.key === "Enter" && requestEmail()} />
                <SaveBtn onClick={requestEmail} loading={emailLoading} label="Onay Gonder" accent={accent} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ padding: 20, background: "rgba(231,76,60,.05)", borderRadius: 14, border: "1px solid rgba(231,76,60,.2)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#e74c3c", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Trash2 size={13} /> Tehlikeli Bolge
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginBottom: 14, lineHeight: 1.6 }}>
          Hesabinizi sildiginizdde tum verileriniz devre disi birakilir. Bu islem geri alinamaz.
        </div>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.3)", color: "#e74c3c", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Hesabimi Sil
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, color: "#e74c3c" }}>Onaylamak icin <strong>SIL</strong> yazin:</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="SIL"
                style={{ flex: 1, background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.3)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
              <button onClick={deleteAccount} disabled={deleteConfirm !== "SIL"}
                style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(231,76,60,.15)", border: "1px solid rgba(231,76,60,.4)", color: "#e74c3c", fontSize: 11, fontWeight: 700, cursor: deleteConfirm !== "SIL" ? "not-allowed" : "pointer", opacity: deleteConfirm !== "SIL" ? .5 : 1 }}>
                Sil
              </button>
              <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)", fontSize: 11, cursor: "pointer" }}>
                Iptal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Gizlilik ──────────────────────────────────────────────────────────────────

function PrivacySection({ user, accent }) {
  const [privacy, setPrivacy] = useState({ privacy_phone: "private", privacy_birthdate: "members", privacy_email: "private" });
  const [notif, setNotif] = useState({ notify_events: true, notify_followers: true, notify_system: true });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user) {
      setPrivacy({ privacy_phone: user.privacy_phone || "private", privacy_birthdate: user.privacy_birthdate || "members", privacy_email: user.privacy_email || "private" });
      setNotif({ notify_events: !!user.notify_events, notify_followers: !!user.notify_followers, notify_system: !!user.notify_system });
    }
  }, [user]);

  const showToast = (msg) => { setToast({ msg, type: "success" }); setTimeout(() => setToast(null), 2500); };

  const savePrivacy = async (n) => {
    const res = await profileApi.savePrivacy(n);
    if (res.data.success !== false) showToast("Gizlilik ayarlari kaydedildi.");
  };

  const saveNotif = async (n) => {
    const res = await profileApi.saveNotifications({ notify_events: n.notify_events ? 1 : 0, notify_followers: n.notify_followers ? 1 : 0, notify_system: n.notify_system ? 1 : 0 });
    if (res.data.success !== false) showToast("Bildirim tercihleri kaydedildi.");
  };

  const opts = [{ v: "public", l: "Herkese Acik" }, { v: "members", l: "Sadece Uyeler" }, { v: "private", l: "Gizli" }];
  const selStyle = { background: "#111118", border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, padding: "7px 10px", color: "#fff", fontSize: 12, outline: "none", cursor: "pointer" };

  const updatePrivacy = (k, v) => { const n = { ...privacy, [k]: v }; setPrivacy(n); savePrivacy(n); };
  const updateNotif = (k, v) => { const n = { ...notif, [k]: v }; setNotif(n); saveNotif(n); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>

      <div style={{ padding: 20, background: "rgba(255,255,255,.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Gizlilik Ayarlari</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { k: "privacy_phone", l: "Telefon numaram" },
            { k: "privacy_birthdate", l: "Dogum tarihim" },
            { k: "privacy_email", l: "E-posta adresim" },
          ].map(({ k, l }) => (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: "#fff" }}>{l}</span>
              <select value={privacy[k]} onChange={e => updatePrivacy(k, e.target.value)} style={selStyle}>
                {opts.map(o => <option key={o.v} value={o.v} style={{ background: "#111118" }}>{o.l}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 20, background: "rgba(255,255,255,.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Bildirim Tercihleri</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { k: "notify_events", l: "Etkinlik bildirimleri", d: "Yeni etkinlik, onay ve hatirlatmalar" },
            { k: "notify_followers", l: "Takipci bildirimleri", d: "Biri sizi takip ettiginde" },
            { k: "notify_system", l: "Sistem bildirimleri", d: "Puan, rozet ve sistem mesajlari" },
          ].map(({ k, l, d }) => (
            <label key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 2 }}>{d}</div>
              </div>
              <Toggle value={notif[k]} onChange={v => updateNotif(k, v)} accent={accent} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Oturumlar ─────────────────────────────────────────────────────────────────

function SessionsSection({ accent }) {
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await profileApi.listSessions();
      setSessions(res.data?.data?.sessions || []);
      setCurrent(res.data?.data?.current || "");
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const revokeOthers = async () => {
    const res = await profileApi.revokeOtherSessions();
    if (res.data?.success) {
      setToast({ msg: "Diger oturumlar kapatildi.", type: "success" });
      setTimeout(() => setToast(null), 2500);
      load();
    }
  };

  const getInfo = (ua) => {
    const s = ua || "";
    const browser = s.includes("Chrome") ? "Chrome" : s.includes("Firefox") ? "Firefox" : s.includes("Safari") ? "Safari" : "Tarayici";
    const os = s.includes("Windows") ? "Windows" : s.includes("Mac") ? "macOS" : s.includes("Linux") ? "Linux" : s.includes("Android") ? "Android" : s.includes("iPhone") ? "iOS" : "Bilinmeyen";
    return { browser, os };
  };

  return (
    <div>
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Aktif Oturumlar</div>
        <button onClick={revokeOthers}
          style={{ fontSize: 11, fontWeight: 700, color: "#e74c3c", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: 7, padding: "5px 12px", cursor: "pointer" }}>
          Digerlerini Kapat
        </button>
      </div>
      {loading ? (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", padding: 12 }}>Yukleniyor...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sessions.length === 0 && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>Oturum bulunamadi.</div>
          )}
          {sessions.map(s => {
            const isCur = s.session_id === current;
            const { browser, os } = getInfo(s.user_agent);
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,.03)", border: `1px solid ${isCur ? accent + "40" : "rgba(255,255,255,.07)"}`, borderRadius: 10 }}>
                <Monitor size={18} color={isCur ? accent : "rgba(255,255,255,.3)"} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                    {browser} - {os}
                    {isCur && <span style={{ fontSize: 10, color: accent, fontWeight: 700 }}>(Bu oturum)</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 2 }}>
                    {s.ip_address} - {new Date(s.last_seen).toLocaleString("tr-TR")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Ana Bilesen ───────────────────────────────────────────────────────────────

export default function COneProfileScreen({ onBack, bgMusicRef, isPlaying, onTogglePlay, onVolumeChange }) {
  const { settings, update } = useSettings();
  const { user, setUser, logout } = useAuth();
  const { updateInfo, status: updateStatus, checkUpdate, installUpdate, downloadProgress } = useUpdate();
  const [activeSection, setActiveSection] = useState(0);

  const accent = settings.c1_accentColor || "#f5a623";

  const SECTIONS = [
    { label: "PROFIL",    icon: User      },
    { label: "GUVENLIK",  icon: Lock      },
    { label: "GIZLILIK",  icon: Shield    },
    { label: "OTURUMLAR", icon: Monitor   },
    { label: "GENEL",     icon: Settings  },
    { label: "GORUNUM",   icon: Palette   },
    { label: "MUZIK",     icon: Music     },
    { label: "BILDIRIM",  icon: Bell      },
    { label: "GUNCELLE",  icon: RefreshCw },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 20 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", inset: 0, zIndex: 20, background: "#0a0a0f", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "var(--c1-font, 'LemonMilk', 'Segoe UI', sans-serif)" }}
    >
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`, top: -200, right: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.1) 0%, transparent 70%)", bottom: -100, left: -100 }} />
      </div>

      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.12)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}60`; e.currentTarget.style.color = accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "#fff"; }}>
            <ChevronLeft size={14} /> GERI
          </button>
          <div>
            <div style={{ fontSize: 9, color: accent, letterSpacing: 2, marginBottom: 2 }}>C-ONE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1 }}>Profil & Ayarlar</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "rgba(255,255,255,.3)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ecc71", boxShadow: "0 0 6px #2ecc71" }} />
          Otomatik kaydediliyor
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", overflow: "hidden" }}>

        <div style={{ width: 200, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {user?.avatar
                ? <img src={user.avatar} style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${accent}60`, objectFit: "cover" }} />
                : <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${accent}20`, color: accent, fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${accent}40` }}>{(user?.username || "U")[0].toUpperCase()}</div>
              }
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: "#2ecc71", border: "2px solid #0a0a0f" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.username}</div>
              <div style={{ fontSize: 9, color: accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{user?.role || "Uye"}</div>
            </div>
          </div>

          <div style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
            {SECTIONS.map(({ label, icon: Icon }, i) => (
              <button key={label} onClick={() => setActiveSection(i)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: "none", background: activeSection === i ? `${accent}12` : "transparent", cursor: "pointer", position: "relative", transition: "background .15s", textAlign: "left", width: "100%" }}>
                {activeSection === i && (
                  <motion.div layoutId="profileSectionIndicator"
                    style={{ position: "absolute", left: 0, top: "15%", bottom: "15%", width: 3, borderRadius: 2, background: accent, boxShadow: `0 0 8px ${accent}` }} />
                )}
                <Icon size={14} color={activeSection === i ? accent : "rgba(255,255,255,.4)"} style={{ transition: "color .15s", flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: activeSection === i ? "#fff" : "rgba(255,255,255,.4)", transition: "color .15s" }}>{label}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
            <button onClick={logout}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", color: "rgba(231,76,60,.8)", fontSize: 11, fontWeight: 700, cursor: "pointer", width: "100%", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(231,76,60,.18)"; e.currentTarget.style.color = "#e74c3c"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(231,76,60,.08)"; e.currentTarget.style.color = "rgba(231,76,60,.8)"; }}>
              <LogOut size={13} /> CIKIS YAP
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>

              {activeSection === 0 && (
                <div>
                  <SectionTitle icon={User} label="Profil Bilgileri" accent={accent} />
                  <AvatarSection user={user} setUser={setUser} accent={accent} />
                  <ProfileInfoSection user={user} setUser={setUser} accent={accent} />
                  <SocialsSection accent={accent} />
                </div>
              )}

              {activeSection === 1 && (
                <div>
                  <SectionTitle icon={Lock} label="Guvenlik" accent={accent} />
                  <AccountLinksSection user={user} setUser={setUser} accent={accent} />
                  <SecuritySection user={user} accent={accent} />
                </div>
              )}

              {activeSection === 2 && (
                <div>
                  <SectionTitle icon={Shield} label="Gizlilik & Bildirimler" accent={accent} />
                  <PrivacySection user={user} accent={accent} />
                </div>
              )}

              {activeSection === 3 && (
                <div>
                  <SectionTitle icon={Monitor} label="Aktif Oturumlar" accent={accent} />
                  <SessionsSection accent={accent} />
                </div>
              )}

              {activeSection === 4 && (
                <div>
                  <SectionTitle icon={Settings} label="Genel Ayarlar" accent={accent} />
                  <Row label="Ses Efektleri" desc="Gecis, onay ve geri ses efektleri">
                    <Toggle value={settings.c1_soundEnabled !== false} onChange={v => update("c1_soundEnabled", v)} accent={accent} />
                  </Row>
                  <Row label="Animasyonlar" desc="Gecis ve hover animasyonlari">
                    <Toggle value={settings.animationsEnabled} onChange={v => update("animationsEnabled", v)} accent={accent} />
                  </Row>
                  <Row label="Acilis Animasyonu" desc="Uygulama acilirken Corleone intro videosu">
                    <Toggle value={!settings.skipIntro} onChange={v => update("skipIntro", !v)} accent={accent} />
                  </Row>
                  <Row label="C-ONE ile Basla" desc="Uygulama acilinca direkt C-ONE moduna gec">
                    <Toggle value={settings.c1_startWithBigMode} onChange={v => update("c1_startWithBigMode", v)} accent={accent} />
                  </Row>
                  <Row label="C-ONE Introsu" desc="C-ONE acilirken intro videoyu goster">
                    <Toggle value={settings.c1_showIntro} onChange={v => update("c1_showIntro", v)} accent={accent} />
                  </Row>
                </div>
              )}

              {activeSection === 5 && (
                <div>
                  <SectionTitle icon={Palette} label="Gorunum" accent={accent} />
                  <Row label="C-ONE Fontu" desc="Tum C-ONE ekranlarinda kullanilacak yazi tipi">
                    <FontDropdown value={settings.c1_font || "LemonMilk"} onChange={v => update("c1_font", v)} accent={accent} />
                  </Row>
                  <Row label="Yazi Boyutu" desc="C-ONE ekranlarindaki genel metin boyutu">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>A</span>
                      <input type="range" min="0.8" max="1.4" step="0.1" value={settings.c1_fontSize ?? 1}
                        onChange={e => update("c1_fontSize", parseFloat(e.target.value))}
                        style={{ width: 120, accentColor: accent, cursor: "pointer" }} />
                      <span style={{ fontSize: 16, color: "rgba(255,255,255,.35)" }}>A</span>
                      <span style={{ fontSize: 10, color: accent, fontWeight: 700, minWidth: 32 }}>{Math.round((settings.c1_fontSize ?? 1) * 100)}%</span>
                    </div>
                  </Row>
                  <div style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Vurgu Rengi</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginBottom: 14 }}>Kart border, buton ve glow rengi</div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {ACCENT_COLORS.map(c => (
                        <div key={c.value} onClick={() => update("c1_accentColor", c.value)}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                          <div style={{ width: 38, height: 38, borderRadius: "50%", background: c.value, border: `3px solid ${settings.c1_accentColor === c.value ? "#fff" : "transparent"}`, boxShadow: settings.c1_accentColor === c.value ? `0 0 14px ${c.value}` : "none", transition: "all .2s" }} />
                          <span style={{ fontSize: 9, color: settings.c1_accentColor === c.value ? "#fff" : "rgba(255,255,255,.35)", fontWeight: 600 }}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 6 && (
                <div>
                  <SectionTitle icon={Music} label="Muzik Ayarlari" accent={accent} />
                  <Row label="Arka Plan Muzigi" desc="C-ONE acikken muzik calsin">
                    <Toggle value={settings.c1_musicEnabled} onChange={v => { update("c1_musicEnabled", v); if (bgMusicRef?.current) { if (v) bgMusicRef.current.play().catch(() => {}); else bgMusicRef.current.pause(); } }} accent={accent} />
                  </Row>
                  <Row label="Ses Seviyesi" desc={`%${settings.c1_musicVolume}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <VolumeX size={13} color="rgba(255,255,255,.4)" />
                      <input type="range" min="0" max="100" value={settings.c1_musicVolume}
                        onChange={e => { const v = parseInt(e.target.value); update("c1_musicVolume", v); if (bgMusicRef?.current) bgMusicRef.current.volume = v / 100; onVolumeChange?.(v); }}
                        style={{ width: 140, accentColor: accent, cursor: "pointer" }} />
                      <Volume2 size={13} color="rgba(255,255,255,.4)" />
                    </div>
                  </Row>
                  <Row label="Oynat / Duraklat" desc={isPlaying ? "Su an caliyor" : "Duraklatildi"}>
                    <button onClick={onTogglePlay}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 8, border: `1px solid ${accent}40`, background: `${accent}15`, color: accent, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      {isPlaying ? "DURAKLAT" : "OYNAT"}
                    </button>
                  </Row>
                </div>
              )}

              {activeSection === 7 && (
                <div>
                  <SectionTitle icon={Bell} label="Bildirimler" accent={accent} />
                  <Row label="Bildirimler" desc="Etkinlik ve duyuru bildirimleri">
                    <Toggle value={settings.announcementNotif} onChange={v => update("announcementNotif", v)} accent={accent} />
                  </Row>
                  <Row label="Etkinlik Hatirlatici" desc="Etkinlikten once bildirim al">
                    <Toggle value={settings.eventReminder} onChange={v => update("eventReminder", v)} accent={accent} />
                  </Row>
                  <Row label="Mesaj Bildirimleri" desc="Yeni mesaj gelince bildirim al">
                    <Toggle value={settings.messageNotif !== false} onChange={v => update("messageNotif", v)} accent={accent} />
                  </Row>
                </div>
              )}

              {activeSection === 8 && (
                <div>
                  <SectionTitle icon={RefreshCw} label="Guncelleme" accent={accent} />
                  <div style={{ padding: 20, borderRadius: 12, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Uygulama Guncellemesi</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>
                          {updateStatus === "available" ? <span style={{ color: accent }}>{updateInfo?.version} surumu mevcut!</span>
                            : updateStatus === "latest" ? <span style={{ color: "#2ecc71" }}>Guncel surumu kullaniyorsunuz</span>
                            : updateStatus === "checking" ? "Kontrol ediliyor..."
                            : updateStatus === "downloading" ? `Indiriliyor... %${downloadProgress}`
                            : updateStatus === "error" ? <span style={{ color: "#e74c3c" }}>Kontrol edilemedi</span>
                            : "Guncelleme kontrolu yapilmadi"}
                        </div>
                      </div>
                      <button onClick={checkUpdate} disabled={updateStatus === "checking" || updateStatus === "downloading"}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}40`, background: `${accent}15`, color: accent, fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: (updateStatus === "checking" || updateStatus === "downloading") ? .5 : 1 }}>
                        <RefreshCw size={12} style={{ animation: updateStatus === "checking" ? "spin 1s linear infinite" : "none" }} /> KONTROL ET
                      </button>
                    </div>
                    {updateStatus === "downloading" && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${downloadProgress}%`, background: accent, borderRadius: 4, transition: "width .3s" }} />
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 6 }}>%{downloadProgress} indirildi...</div>
                      </div>
                    )}
                    {updateStatus === "available" && (
                      <button onClick={installUpdate}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 10, border: `1px solid ${accent}60`, background: `${accent}20`, color: accent, fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all .2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${accent}35`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${accent}20`; }}>
                        <Download size={15} /> GUNCELLEMEYI YUKLE
                      </button>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
