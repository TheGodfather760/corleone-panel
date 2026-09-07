import { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/AuthContext";
import { profileApi } from "../lib/api";
import { Camera, Trash2, Plus, Check, X, ExternalLink, Save } from "lucide-react";

const SOCIAL_PLATFORMS = [
  { key: "discord_social", label: "Discord",    placeholder: "kullaniciadi#0000" },
  { key: "steam",          label: "Steam",       placeholder: "Steam profil URL" },
  { key: "twitter",        label: "Twitter/X",   placeholder: "@kullaniciadi" },
  { key: "instagram",      label: "Instagram",   placeholder: "@kullaniciadi" },
  { key: "youtube",        label: "YouTube",     placeholder: "Kanal URL" },
  { key: "twitch",         label: "Twitch",      placeholder: "kullaniciadi" },
  { key: "truckersmp",     label: "TruckersMP",  placeholder: "Profil URL" },
  { key: "tiktok",         label: "TikTok",      placeholder: "@kullaniciadi" },
  { key: "github",         label: "GitHub",      placeholder: "kullaniciadi" },
];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [avatars, setAvatars]   = useState([]);
  const [socials, setSocials]   = useState({});
  const [editSocial, setEditSocial] = useState(null);
  const [info, setInfo]         = useState({ real_name: "", bio: "", country: "", city: "", birth_date: "", phone: "" });
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg, setInfoMsg]   = useState("");
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    profileApi.getAvatars().then(r => setAvatars(r.data.data?.avatars || []));
    profileApi.getSocials().then(r => setSocials(r.data.socials || {}));
    profileApi.getInfo().then(r => {
      const d = r.data.data || {};
      setInfo({
        real_name:  d.real_name  || "",
        bio:        d.bio        || "",
        country:    d.country    || "",
        city:       d.city       || "",
        birth_date: d.birth_date || "",
        phone:      d.phone      || "",
      });
    });
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await profileApi.uploadAvatar(fd);
      const newAvatar = res.data.data;
      setAvatars(prev => [newAvatar, ...prev]);
      await handleSetAvatar(newAvatar.url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSetAvatar = async (url) => {
    await profileApi.setAvatar(url);
    setUser(prev => ({ ...prev, avatar: url }));
  };

  const handleDeleteAvatar = async (id) => {
    await profileApi.deleteAvatar(id);
    setAvatars(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveSocial = async () => {
    if (!editSocial?.value?.trim()) return;
    setSaving(true);
    try {
      await profileApi.saveSocial(editSocial.key, editSocial.value.trim());
      setSocials(prev => ({ ...prev, [editSocial.key]: editSocial.value.trim() }));
      setEditSocial(null);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoSaving(true);
    try {
      await profileApi.saveInfo(info);
      setInfoMsg("Kaydedildi.");
      setTimeout(() => setInfoMsg(""), 2500);
    } finally {
      setInfoSaving(false);
    }
  };

  const handleDeleteSocial = async (key) => {
    await profileApi.deleteSocial(key);
    setSocials(prev => { const s = { ...prev }; delete s[key]; return s; });
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Profil</h1>
        <p className="page-subtitle">Hesap bilgilerini ve sosyal linklerini yönet</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 1fr", gap: 20 }}>

        {/* Sol — Avatar */}
        <div>
          <div className="card" style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=333&color=f5a623&size=128`}
                alt={user?.username}
                style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--accent-border)" }}
              />
              <button
                onClick={() => fileRef.current.click()}
                disabled={uploading}
                style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Camera size={13} color="#111" />
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleAvatarUpload} />
            </div>
            <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{user?.username}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{user?.email}</p>
            <div style={{ marginTop: 8 }}>
              <span className="badge badge-orange">{user?.role || "Üye"}</span>
            </div>
          </div>

          {/* Avatar galerisi */}
          {avatars.length > 0 && (
            <div className="card">
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Yüklenen Avatarlar</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {avatars.map(av => (
                  <div key={av.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: user?.avatar === av.url ? "2px solid var(--accent)" : "2px solid transparent", cursor: "pointer" }}
                    onClick={() => handleSetAvatar(av.url)}>
                    <img src={av.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAvatar(av.id); }}
                      style={{ position: "absolute", top: 3, right: 3, width: 20, height: 20, borderRadius: 4, background: "rgba(231,76,60,0.85)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <Trash2 size={11} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Orta — Kişisel Bilgiler */}
        <div className="card">
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Kişisel Bilgiler</p>
          <form onSubmit={handleSaveInfo} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { key: "real_name",  label: "Ad Soyad",      type: "text",  placeholder: "Ad Soyad" },
              { key: "phone",      label: "Telefon",        type: "tel",   placeholder: "+90 5xx xxx xx xx" },
              { key: "country",    label: "Ülke",           type: "text",  placeholder: "Türkiye" },
              { key: "city",       label: "Şehir",          type: "text",  placeholder: "İstanbul" },
              { key: "birth_date", label: "Doğum Tarihi",   type: "date",  placeholder: "" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</label>
                <input
                  className="input"
                  type={type}
                  placeholder={placeholder}
                  value={info[key]}
                  onChange={e => setInfo(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{ colorScheme: "dark" }}
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>Hakkımda</label>
              <textarea
                className="input"
                rows={4}
                placeholder="Kendinizden kısaca bahsedin..."
                value={info.bio}
                onChange={e => setInfo(prev => ({ ...prev, bio: e.target.value }))}
                style={{ resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={infoSaving} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Save size={14} />{infoSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              {infoMsg && <span style={{ fontSize: 12, color: "#2ecc71" }}>{infoMsg}</span>}
            </div>
          </form>
        </div>

        {/* Sağ — Sosyal Linkler */}
        <div className="card">
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Sosyal Linkler</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => {
              const value = socials[key];
              const isEditing = editSocial?.key === key;

              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", width: 100, flexShrink: 0 }}>{label}</span>

                  {isEditing ? (
                    <>
                      <input
                        className="input"
                        style={{ flex: 1, padding: "6px 10px", fontSize: 13 }}
                        placeholder={placeholder}
                        value={editSocial.value}
                        onChange={e => setEditSocial({ ...editSocial, value: e.target.value })}
                        onKeyDown={e => e.key === "Enter" && handleSaveSocial()}
                        autoFocus
                      />
                      <button onClick={handleSaveSocial} disabled={saving} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 4 }}>
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditSocial(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                        <X size={16} />
                      </button>
                    </>
                  ) : value ? (
                    <>
                      <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
                      <button onClick={() => setEditSocial({ key, value })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                        <ExternalLink size={14} />
                      </button>
                      <button onClick={() => handleDeleteSocial(key)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, fontSize: 13, color: "var(--text-muted)" }}>—</span>
                      <button onClick={() => setEditSocial({ key, value: "" })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 4 }}>
                        <Plus size={16} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
