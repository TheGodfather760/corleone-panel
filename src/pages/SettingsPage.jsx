import { useState, useEffect } from "react";
import { useSettings } from "../lib/SettingsContext";
import { useAuth } from "../lib/AuthContext";
import { useUpdate } from "../lib/UpdateContext";
import { open } from "@tauri-apps/plugin-dialog";
import { getVersion } from "@tauri-apps/api/app";
import { Sun, Moon, Bell, Download, AppWindow, LogOut, FolderOpen, RefreshCw, Info } from "lucide-react";

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
        <Icon size={14} color="#f5a623" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#f5a623", textTransform: "uppercase", letterSpacing: .8 }}>{title}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 40, height: 22, borderRadius: 11, background: value ? "#f5a623" : "var(--bg-elevated)", border: `1px solid ${value ? "#f5a623" : "var(--border)"}`, cursor: "pointer", position: "relative", transition: "all .2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: value ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.4)" }} />
    </div>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", background: "var(--bg-elevated)", borderRadius: 8, padding: 3, gap: 2 }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: value === opt.value ? "rgba(245,166,35,.2)" : "transparent", color: value === opt.value ? "#f5a623" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 5 }}>
          {opt.icon && <opt.icon size={12} />}{opt.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const { logout } = useAuth();
  const { updateInfo, status: updateStatus, lastChecked, checkUpdate, installUpdate } = useUpdate();
  const [saved, setSaved] = useState(false);
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion("0.5.0"));
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const pickDownloadPath = async () => {
    try {
      const selected = await open({ directory: true, title: "İndirme Klasörü Seç" });
      if (selected) update("downloadPath", selected);
    } catch {}
  };

  return (
    <>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Ayarlar</h1>
          <p className="page-subtitle">Uygulama tercihlerini özelleştir</p>
        </div>
        <button onClick={handleSave}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 9, background: saved ? "rgba(46,204,113,.15)" : "rgba(245,166,35,.15)", border: `1px solid ${saved ? "#2ecc71" : "#f5a623"}`, color: saved ? "#2ecc71" : "#f5a623", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .3s" }}>
          {saved ? "✓ Kaydedildi" : "Kaydet"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

        {/* Sol kolon */}
        <div>
          <Section title="Görünüm" icon={Sun}>
            <Row label="Logo" desc="Üst bar logo seçimi">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {[
                  { value: "logotype2025", src: "/Corleone-Logotype-2025.png" },
                  { value: "logotype",     src: "/logotype.png" },
                  { value: "logo",         src: "/logo-square.png" },
                ].map(opt => (
                  <div key={opt.value} onClick={() => update("sidebarLogo", opt.value)}
                    style={{ padding: 6, borderRadius: 8,
                      border: `1px solid ${settings.sidebarLogo === opt.value ? "#f5a623" : "rgba(255,255,255,.1)"}`,
                      background: settings.sidebarLogo === opt.value ? "rgba(245,166,35,.15)" : "#3a3a3a",
                      cursor: "pointer", transition: "all .2s" }}>
                    <img src={opt.src} alt={opt.value} style={{ height: 22, display: "block" }} />
                  </div>
                ))}
              </div>
            </Row>
            <Row label="Tema" desc="Arayüz renk teması">
              <SegmentedControl
                value={settings.theme}
                onChange={v => update("theme", v)}
                options={[
                  { value: "dark",     label: "Koyu",     icon: Moon },
                  { value: "light",    label: "Açık",     icon: Sun  },
                  { value: "corleone", label: "Corleone" },
                ]}
              />
            </Row>
            <Row label="Yazı Boyutu" desc="Arayüz metin boyutu">
              <SegmentedControl
                value={settings.fontSize}
                onChange={v => update("fontSize", v)}
                options={[
                  { value: "small",  label: "Küçük"  },
                  { value: "normal", label: "Normal" },
                  { value: "large",  label: "Büyük"  },
                ]}
              />
            </Row>
            <Row label="Animasyonlar" desc="Geçiş ve hover animasyonları">
              <Toggle value={settings.animationsEnabled} onChange={v => update("animationsEnabled", v)} />
            </Row>
          </Section>

          <Section title="Bildirimler" icon={Bell}>
            <Row label="Etkinlik Hatırlatıcısı" desc="Etkinlikten önce bildirim al">
              <Toggle value={settings.eventReminder} onChange={v => update("eventReminder", v)} />
            </Row>
            <Row label="Yeni Duyurular" desc="Panel duyuruları için bildirim">
              <Toggle value={settings.announcementNotif} onChange={v => update("announcementNotif", v)} />
            </Row>
            <Row label="İndirme Tamamlandı" desc="İndirme bitince bildirim">
              <Toggle value={settings.downloadNotif} onChange={v => update("downloadNotif", v)} />
            </Row>
          </Section>

          <Section title="Hesap" icon={LogOut}>
            <Row label="Oturumu Kapat" desc="Mevcut oturumu sonlandır">
              <button onClick={logout}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.3)", color: "#e74c3c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <LogOut size={13} /> Çıkış Yap
              </button>
            </Row>
          </Section>
        </div>

        {/* Sağ kolon */}
        <div>
          <Section title="İndirmeler" icon={Download}>
            <Row label="Varsayılan Klasör" desc={settings.downloadPath || "Seçilmedi — her seferinde sorulur"}>
              <button onClick={pickDownloadPath}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <FolderOpen size={13} /> Seç
              </button>
            </Row>
            {settings.downloadPath && (
              <Row label="" desc="">
                <button onClick={() => update("downloadPath", "")}
                  style={{ fontSize: 11, color: "#e74c3c", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Klasörü temizle
                </button>
              </Row>
            )}
          </Section>

          <Section title="Uygulama" icon={AppWindow}>
            <Row label="Başlangıç Sayfası" desc="Uygulama açılınca hangi sayfa gösterilsin">
              <select value={settings.startPage} onChange={e => update("startPage", e.target.value)}
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", fontSize: 12, padding: "6px 10px", cursor: "pointer", outline: "none" }}>
                <option value="dashboard">Dashboard</option>
                <option value="events">Etkinlikler</option>
                <option value="downloads">İndirmeler</option>
                <option value="media">Medya</option>
                <option value="profile">Profil</option>
              </select>
            </Row>
            <Row label="Açılış Animasyonu" desc="Uygulama açılırken intro videoyu göster">
              <Toggle value={!settings.skipIntro} onChange={v => update("skipIntro", !v)} />
            </Row>
            <Row label="Güncelleme Kontrolü" desc={`Güncel sürüm: v${version || "0.5.0"}${lastChecked ? " · Son kontrol: " + lastChecked.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) + " " + lastChecked.toLocaleDateString("tr-TR") : ""}`}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {updateStatus === "available" && (
                  <button onClick={installUpdate}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, background: "rgba(46,204,113,.15)", border: "1px solid rgba(46,204,113,.4)", color: "#2ecc71", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    ↓ {updateInfo?.version} Yükle
                  </button>
                )}
                <button onClick={checkUpdate} disabled={updateStatus === "checking" || updateStatus === "downloading"}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, background: "var(--bg-elevated)", border: `1px solid ${updateStatus === "latest" ? "rgba(46,204,113,.4)" : updateStatus === "error" ? "rgba(231,76,60,.4)" : "var(--border)"}`, color: updateStatus === "latest" ? "#2ecc71" : updateStatus === "error" ? "#e74c3c" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: (updateStatus === "checking" || updateStatus === "downloading") ? .6 : 1 }}>
                  <RefreshCw size={13} style={{ animation: (updateStatus === "checking" || updateStatus === "downloading") ? "spin 1s linear infinite" : "none" }} />
                  {updateStatus === "checking" ? "Kontrol ediliyor..." : updateStatus === "latest" ? "✓ Güncel" : updateStatus === "error" ? "Hata" : updateStatus === "downloading" ? "İndiriliyor..." : "Kontrol Et"}
                </button>
              </div>
            </Row>
          </Section>

          <Section title="Hakkında" icon={Info}>
            <Row label="Sürüm" desc="Corleone Panel">
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f5a623", background: "rgba(245,166,35,.1)", border: "1px solid rgba(245,166,35,.2)", padding: "4px 12px", borderRadius: 7 }}>
                v{version || "0.5.0"}
              </span>
            </Row>
            <Row label="Geliştirici" desc="Corleone™ Team">
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>corleoneteam.com.tr</span>
            </Row>
          </Section>
        </div>

      </div>
    </>
  );
}
