import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../lib/SettingsContext";
import { useAuth } from "../lib/AuthContext";
import { useUpdate } from "../lib/UpdateContext";
import { ChevronLeft, ChevronDown, Music, Palette, Settings, Volume2, VolumeX, LogOut, RefreshCw, Download } from "lucide-react";

const ACCENT_COLORS = [
  { label: "Turuncu",  value: "#f5a623" },
  { label: "Mor",      value: "#7c3aed" },
  { label: "Mavi",     value: "#3b82f6" },
  { label: "Yeşil",    value: "#2ecc71" },
  { label: "Kırmızı",  value: "#e74c3c" },
  { label: "Pembe",    value: "#ec4899" },
  { label: "Cyan",     value: "#06b6d4" },
];

const FONTS = [
  { key: "LemonMilk",     label: "LemonMilk",       family: "'LemonMilk', sans-serif",                                          weight: 700 },
  { key: "Orbitron",      label: "Orbitron",         family: "'Orbitron', sans-serif",                                           weight: 700 },
  { key: "Rajdhani",      label: "Rajdhani",         family: "'Rajdhani', sans-serif",                                           weight: 700 },
  { key: "Exo2",          label: "Exo 2",            family: "'Exo 2', sans-serif",                                              weight: 700 },
  { key: "ShareTechMono", label: "Share Tech Mono",  family: "'Share Tech Mono', monospace",                                     weight: 400 },
  { key: "SegoeUI",       label: "Segoe UI",         family: "'Segoe UI', sans-serif",                                           weight: 700 },
  { key: "Ubuntu",        label: "Ubuntu",           family: "'Ubuntu', sans-serif",                                             weight: 700 },
  { key: "CenturyGothic", label: "Century Gothic",   family: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",     weight: 700 },
];

function SectionTitle({ icon: Icon, title, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${accent}25` }}>
      <Icon size={14} color={accent} />
      <span style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: "uppercase" }}>{title}</span>
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{label}</div>
        {desc && <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 3 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange, accent }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 40, height: 22, borderRadius: 11, background: value ? accent : "rgba(255,255,255,.1)", border: `1px solid ${value ? accent : "rgba(255,255,255,.15)"}`, cursor: "pointer", position: "relative", transition: "all .2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: value ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.4)" }} />
    </div>
  );
}

function FontDropdown({ value, onChange, accent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = FONTS.find(f => f.key === value) || FONTS[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "clamp(160px, 18vw, 240px)" }}>
      {/* Seçili değer */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          padding: "9px 14px", borderRadius: 9, cursor: "pointer", transition: "all .2s",
          background: open ? `${accent}15` : "rgba(255,255,255,.05)",
          border: `1px solid ${open ? accent + "50" : "rgba(255,255,255,.12)"}`,
        }}
      >
        <span style={{ fontFamily: current.family, fontWeight: current.weight, fontSize: 14, color: "#fff" }}>
          {current.label}
        </span>
        <ChevronDown size={13} color="rgba(255,255,255,.4)" style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }} />
      </button>

      {/* Dropdown listesi */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.92 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.92 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100,
              background: "rgba(12,12,20,.98)", border: `1px solid ${accent}30`,
              borderRadius: 10, overflow: "hidden",
              boxShadow: `0 8px 32px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04)`,
              transformOrigin: "top",
            }}
          >
            {FONTS.map((f, i) => {
              const isActive = f.key === value;
              return (
                <div key={f.key}
                  onClick={() => { onChange(f.key); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", cursor: "pointer", transition: "background .12s",
                    background: isActive ? `${accent}15` : "transparent",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,.05)" : "none",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontFamily: f.family, fontWeight: f.weight, fontSize: 14, color: isActive ? "#fff" : "rgba(255,255,255,.7)" }}>
                    {f.label}
                  </span>
                  {isActive && (
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function COneSettingsScreen({ onBack, bgMusicRef, isPlaying, onTogglePlay, onVolumeChange }) {
  const { settings, update } = useSettings();
  const { logout } = useAuth();
  const { updateInfo, status: updateStatus, checkUpdate, installUpdate, downloadProgress } = useUpdate();
  const [activeSection, setActiveSection] = useState(0);

  const accent = settings.c1_accentColor || "#f5a623";

  const SECTIONS = [
    { label: "GENEL",         icon: Settings  },
    { label: "C-ONE GÖRÜNÜM", icon: Palette   },
    { label: "MÜZİK",         icon: Music     },
    { label: "GÜNCELLEME",    icon: RefreshCw },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", inset: 0, zIndex: 20, background: "#0a0a0f", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "var(--c1-font, 'LemonMilk', 'Segoe UI', sans-serif)", fontSize: `calc(14px * var(--c1-scale, 1))` }}
    >
      {/* Arka plan orb */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`, top: -150, right: -100 }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.12) 0%, transparent 70%)", bottom: -50, left: -50 }} />
      </div>

      {/* Üst bar */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.12)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}60`; e.currentTarget.style.color = accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "#fff"; }}
          >
            <ChevronLeft size={14} /> GERİ
          </button>
          <div>
            <div style={{ fontSize: 9, color: accent, letterSpacing: 2, marginBottom: 2 }}>C-ONE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1 }}>Ayarlar</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "rgba(255,255,255,.3)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ecc71", boxShadow: "0 0 6px #2ecc71" }} />
          Otomatik kaydediliyor
        </div>
      </div>

      {/* İçerik */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Sol — bölüm seçici */}
        <div style={{ width: "clamp(140px, 16vw, 220px)", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,.06)", padding: "20px 0", display: "flex", flexDirection: "column", gap: 2 }}>
          {SECTIONS.map(({ label, icon: Icon }, i) => (
            <button key={label} onClick={() => setActiveSection(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", border: "none", background: "transparent", cursor: "pointer", position: "relative", transition: "background .15s", textAlign: "left" }}
            >
              {activeSection === i && (
                <motion.div layoutId="sectionIndicator"
                  style={{ position: "absolute", left: 0, top: "15%", bottom: "15%", width: 3, borderRadius: 2, background: accent, boxShadow: `0 0 8px ${accent}` }}
                />
              )}
              <Icon size={15} color={activeSection === i ? accent : "rgba(255,255,255,.4)"} style={{ transition: "color .15s" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: activeSection === i ? "#fff" : "rgba(255,255,255,.4)", transition: "color .15s", fontFamily: "inherit" }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Sağ — içerik */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>

              {/* ── GENEL ── */}
              {activeSection === 0 && (
                <div>
                  <SectionTitle icon={Settings} title="Genel Ayarlar" accent={accent} />

                  <Row label="Bildirimler" desc="Etkinlik ve duyuru bildirimleri">
                    <Toggle value={settings.announcementNotif} onChange={v => update("announcementNotif", v)} accent={accent} />
                  </Row>

                  <Row label="Etkinlik Hatırlatıcısı" desc="Etkinlikten önce bildirim al">
                    <Toggle value={settings.eventReminder} onChange={v => update("eventReminder", v)} accent={accent} />
                  </Row>

                  <Row label="Ses Efektleri" desc="Geçiş, onay ve geri ses efektleri">
                    <Toggle value={settings.c1_soundEnabled !== false} onChange={v => update("c1_soundEnabled", v)} accent={accent} />
                  </Row>

                  <Row label="Animasyonlar" desc="Geçiş ve hover animasyonları">
                    <Toggle value={settings.animationsEnabled} onChange={v => update("animationsEnabled", v)} accent={accent} />
                  </Row>

                  <Row label="Açılış Animasyonu" desc="Uygulama açılırken Corleone intro videosu">
                    <Toggle value={!settings.skipIntro} onChange={v => update("skipIntro", !v)} accent={accent} />
                  </Row>

                  <Row label="Başlangıç Sayfası" desc="Uygulama açılınca hangi sayfa gösterilsin">
                    <select value={settings.startPage} onChange={e => update("startPage", e.target.value)}
                      style={{ background: "rgba(20,20,30,.95)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 7, color: "#fff", fontSize: 11, padding: "7px 10px", cursor: "pointer", outline: "none", fontFamily: "inherit" }}>
                      <option value="dashboard">Dashboard</option>
                      <option value="events">Etkinlikler</option>
                      <option value="downloads">İndirmeler</option>
                      <option value="media">Medya</option>
                      <option value="profile">Profil</option>
                    </select>
                  </Row>

                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>Hesap</div>
                    <button onClick={logout}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 9, background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.3)", color: "#e74c3c", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(231,76,60,.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(231,76,60,.1)"; }}
                    >
                      <LogOut size={14} /> OTURUMU KAPAT
                    </button>
                  </div>
                </div>
              )}

              {/* ── C-ONE GÖRÜNÜM ── */}
              {activeSection === 1 && (
                <div>
                  <SectionTitle icon={Palette} title="C-ONE Görünüm" accent={accent} />

                  <Row label="Başlangıçta C-ONE Aç" desc="Uygulama açılınca direkt C-ONE moduna geç">
                    <Toggle value={settings.c1_startWithBigMode} onChange={v => update("c1_startWithBigMode", v)} accent={accent} />
                  </Row>

                  <Row label="Açılış Introsu" desc="C-ONE açılırken intro videoyu göster">
                    <Toggle value={settings.c1_showIntro} onChange={v => update("c1_showIntro", v)} accent={accent} />
                  </Row>

                  <Row label="C-ONE Fontu" desc="Tüm C-ONE ekranlarında kullanılacak yazı tipi">
                    <FontDropdown value={settings.c1_font || "LemonMilk"} onChange={v => update("c1_font", v)} accent={accent} />
                  </Row>

                  <Row label="Yazı Boyutu" desc="C-ONE ekranlarındaki genel metin boyutu">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)", minWidth: 14, textAlign: "center" }}>A</span>
                      <input type="range" min="0.8" max="1.4" step="0.1" value={settings.c1_fontSize ?? 1}
                        onChange={e => update("c1_fontSize", parseFloat(e.target.value))}
                        style={{ width: 120, accentColor: accent, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 16, color: "rgba(255,255,255,.35)", minWidth: 14, textAlign: "center" }}>A</span>
                      <span style={{ fontSize: 10, color: accent, fontWeight: 700, minWidth: 32, textAlign: "right" }}>
                        {Math.round((settings.c1_fontSize ?? 1) * 100)}%
                      </span>
                    </div>
                  </Row>

                  <div style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Vurgu Rengi</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginBottom: 14 }}>Kart border, buton ve glow rengi</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {ACCENT_COLORS.map(c => (
                        <div key={c.value} onClick={() => update("c1_accentColor", c.value)}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%", background: c.value,
                            border: `3px solid ${settings.c1_accentColor === c.value ? "#fff" : "transparent"}`,
                            boxShadow: settings.c1_accentColor === c.value ? `0 0 12px ${c.value}` : "none",
                            transition: "all .2s",
                          }} />
                          <span style={{ fontSize: 8, color: settings.c1_accentColor === c.value ? "#fff" : "rgba(255,255,255,.35)", fontWeight: 600 }}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── MÜZİK ── */}
              {activeSection === 2 && (
                <div>
                  <SectionTitle icon={Music} title="Müzik Ayarları" accent={accent} />

                  <Row label="Arka Plan Müziği" desc="C-ONE açıkken müzik çalsın">
                    <Toggle value={settings.c1_musicEnabled} onChange={v => { update("c1_musicEnabled", v); if (bgMusicRef?.current) { if (v) bgMusicRef.current.play().catch(() => {}); else bgMusicRef.current.pause(); } }} accent={accent} />
                  </Row>

                  <Row label="Ses Seviyesi" desc={`%${settings.c1_musicVolume}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <VolumeX size={13} color="rgba(255,255,255,.4)" />
                      <input type="range" min="0" max="100" value={settings.c1_musicVolume}
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          update("c1_musicVolume", v);
                          if (bgMusicRef?.current) bgMusicRef.current.volume = v / 100;
                          onVolumeChange?.(v);
                        }}
                        style={{ width: 140, accentColor: accent, cursor: "pointer" }}
                      />
                      <Volume2 size={13} color="rgba(255,255,255,.4)" />
                    </div>
                  </Row>

                  <Row label="Şu An Çalıyor" desc="Aktif parça">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: isPlaying ? "#2ecc71" : "rgba(255,255,255,.2)", boxShadow: isPlaying ? "0 0 6px #2ecc71" : "none", transition: "all .3s" }} />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>
                        {isPlaying ? "Çalıyor" : "Duraklatıldı"}
                      </span>
                    </div>
                  </Row>

                  <Row label="Oynat / Duraklat" desc="Müziği kontrol et">
                    <button onClick={onTogglePlay}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 8, border: `1px solid ${accent}40`, background: `${accent}15`, color: accent, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {isPlaying ? "⏸ DURAKLAT" : "▶ OYNAT"}
                    </button>
                  </Row>
                </div>
              )}

              {/* ── GÜNCELLEME ── */}
              {activeSection === 3 && (
                <div>
                  <SectionTitle icon={RefreshCw} title="Güncelleme" accent={accent} />

                  <div style={{ padding: "20px", borderRadius: 12, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Uygulama Güncellemesi</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>
                          {updateStatus === "available"
                            ? <span style={{ color: accent }}>&#8595; {updateInfo?.version} sürümü mevcut!</span>
                            : updateStatus === "latest" ? <span style={{ color: "#2ecc71" }}>✓ Güncel sürümü kullanıyorsunuz</span>
                            : updateStatus === "checking" ? "Kontrol ediliyor..."
                            : updateStatus === "downloading" ? `İndiriliyor... %${downloadProgress}`
                            : updateStatus === "error" ? <span style={{ color: "#e74c3c" }}>Kontrol edilemedi</span>
                            : "Güncelleme kontrolü yapılmadı"}
                        </div>
                      </div>
                      <button onClick={checkUpdate}
                        disabled={updateStatus === "checking" || updateStatus === "downloading"}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}40`, background: `${accent}15`, color: accent, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: (updateStatus === "checking" || updateStatus === "downloading") ? .5 : 1 }}
                      >
                        <RefreshCw size={12} style={{ animation: updateStatus === "checking" ? "spin 1s linear infinite" : "none" }} />
                        KONTROL ET
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
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 10, border: `1px solid ${accent}60`, background: `${accent}20`, color: accent, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = `${accent}35`}
                        onMouseLeave={e => e.currentTarget.style.background = `${accent}20`}
                      >
                        <Download size={15} /> GÜNCELLEMEYİ YÜKLE VE YENDEN BAŞlAT
                      </button>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
