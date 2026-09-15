import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ChevronDown, ChevronUp, Search, Package, Clock } from "lucide-react";
import { downloadsApi } from "../lib/api";
import { openUrl } from "@tauri-apps/plugin-opener";

function playSound(name) {
  try { const a = new Audio(`/sounds/${name}`); a.volume = 0.5; a.play().catch(() => {}); } catch {}
}

function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

const CATEGORY_LABELS = {
  ets2_profile: "ETS2 Profil",
  ats_profile:  "ATS Profil",
  mod:          "Mod",
  tool:         "Araç",
  other:        "Diğer",
};

function DownloadDetail({ item, onClose, accent }) {
  const [selVersion, setSelVersion] = useState(item.versions?.[0] || null);
  const [versionsOpen, setVersionsOpen] = useState(false);

  const handleDownload = () => {
    playSound("c-one_onay.wav");
    const url = downloadsApi.download(item.id, selVersion?.version_id);
    openUrl(url).catch(() => {});
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "absolute", inset: 0, zIndex: 20, background: "rgba(0,0,0,.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "min(620px, 92vw)", maxHeight: "85vh", background: "rgba(10,10,18,.98)", border: `1px solid ${accent}30`, borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: `0 0 80px ${accent}20` }}
      >
        {/* Üst */}
        <div style={{ position: "relative", padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(231,76,60,.2)"; e.currentTarget.style.color = "#e74c3c"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(255,255,255,.5)"; }}
          ><X size={13} /></button>

          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {/* Thumbnail */}
            <div style={{ width: 72, height: 72, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: `${accent}10`, border: `1px solid ${accent}20` }}>
              {item.thumbnail
                ? <img src={item.thumbnail} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Package size={28} color={`${accent}50`} />
                  </div>
              }
            </div>
            <div style={{ flex: 1, paddingRight: 36 }}>
              {item.category && (
                <div style={{ fontSize: 9, color: accent, letterSpacing: 1.5, marginBottom: 4, fontWeight: 700 }}>
                  {CATEGORY_LABELS[item.category] || item.category.toUpperCase()}
                </div>
              )}
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 4 }}>{item.title}</div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>{item.download_count || 0} indirme</span>
                {selVersion?.version && <span style={{ fontSize: 10, color: accent }}>v{selVersion.version}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* İçerik */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Açıklama */}
          {item.description && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.7, marginBottom: 16 }}>{item.description}</p>
          )}

          {/* Versiyon seçici */}
          {item.versions?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, marginBottom: 8, fontWeight: 700 }}>VERSİYON</div>

              {/* Seçili versiyon */}
              <button
                onClick={() => setVersionsOpen(v => !v)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: `${accent}10`, border: `1px solid ${accent}25`, cursor: "pointer", transition: "all .2s" }}
              >
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>v{selVersion?.version}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 1 }}>
                    {formatDate(selVersion?.version_date)} · {formatSize(selVersion?.file_size)}
                  </div>
                </div>
                {versionsOpen ? <ChevronUp size={14} color="rgba(255,255,255,.4)" /> : <ChevronDown size={14} color="rgba(255,255,255,.4)" />}
              </button>

              {/* Versiyon listesi */}
              <AnimatePresence>
                {versionsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ border: "1px solid rgba(255,255,255,.08)", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
                      {item.versions.map((v, i) => (
                        <div key={v.version_id}
                          onClick={() => { setSelVersion(v); setVersionsOpen(false); playSound("c-one_navigation.wav"); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", transition: "background .15s",
                            background: selVersion?.version_id === v.version_id ? `${accent}10` : "rgba(255,255,255,.02)",
                            borderTop: i > 0 ? "1px solid rgba(255,255,255,.05)" : "none",
                          }}
                          onMouseEnter={e => { if (selVersion?.version_id !== v.version_id) e.currentTarget.style.background = "rgba(255,255,255,.05)"; }}
                          onMouseLeave={e => { if (selVersion?.version_id !== v.version_id) e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: selVersion?.version_id === v.version_id ? accent : "rgba(255,255,255,.7)" }}>v{v.version}</div>
                            <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginTop: 1 }}>{formatDate(v.version_date)} · {formatSize(v.file_size)}</div>
                          </div>
                          {i === 0 && <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: `${accent}20`, color: accent }}>SON</span>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Changelog */}
          {selVersion?.changelog && (
            <div style={{ padding: "12px 14px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, marginBottom: 8, fontWeight: 700 }}>DEĞİŞİKLİKLER</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selVersion.changelog}</p>
            </div>
          )}
        </div>

        {/* İndir butonu */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,.07)", flexShrink: 0 }}>
          <button
            onClick={handleDownload}
            disabled={!selVersion}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "13px", borderRadius: 10, border: "none", cursor: selVersion ? "pointer" : "not-allowed",
              background: selVersion ? accent : "rgba(255,255,255,.08)",
              color: selVersion ? "#000" : "rgba(255,255,255,.3)",
              fontSize: 13, fontWeight: 800, letterSpacing: 0.5, transition: "all .2s",
              boxShadow: selVersion ? `0 4px 20px ${accent}50` : "none",
            }}
            onMouseEnter={e => { if (selVersion) e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; }}
          >
            <Download size={16} />
            {selVersion ? `İNDİR — v${selVersion.version}` : "VERSİYON YOK"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function COneDownloadsScreen({ onBack, accent = "#f5a623" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    downloadsApi.list()
      .then(r => setItems(r.data.data || r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...new Set(items.map(i => i.category).filter(Boolean))];

  const filtered = items.filter(item => {
    const matchCat = category === "all" || item.category === category;
    const matchSearch = search === "" || item.title?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", inset: 0, zIndex: 40, background: "#0a0a0f", display: "flex", flexDirection: "column", fontFamily: "var(--c1-font, 'LemonMilk', 'Segoe UI', sans-serif)", fontSize: `calc(14px * var(--c1-scale, 1))`, overflow: "hidden" }}
    >
      {/* Arka plan */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`, top: -150, left: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.1) 0%, transparent 70%)", bottom: -100, right: -100 }} />
      </div>

      {/* Üst bar */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 16, padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <button onClick={() => { playSound("c-one_back.wav"); onBack(); }}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = `${accent}20`; e.currentTarget.style.borderColor = `${accent}50`; e.currentTarget.style.color = accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "rgba(255,255,255,.7)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 9, color: accent, letterSpacing: 2, marginBottom: 2 }}>C-ONE</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1 }}>İNDİRMELER</div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Arama */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, width: 200 }}>
          <Search size={12} color="rgba(255,255,255,.35)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ara..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 11, fontFamily: "inherit" }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,.3)", cursor: "pointer", display: "flex", padding: 0 }}><X size={11} /></button>}
        </div>
      </div>

      {/* Kategori filtreleri */}
      {categories.length > 1 && (
        <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 6, padding: "10px 28px", borderBottom: "1px solid rgba(255,255,255,.05)", flexShrink: 0, overflowX: "auto" }}>
          {categories.map(cat => {
            const active = category === cat;
            return (
              <button key={cat}
                onClick={() => { playSound("c-one_navigation.wav"); setCategory(cat); }}
                style={{
                  padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap",
                  background: active ? `${accent}20` : "rgba(255,255,255,.05)",
                  color: active ? accent : "rgba(255,255,255,.4)",
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                  boxShadow: active ? `0 0 10px ${accent}25` : "none",
                }}
              >
                {cat === "all" ? "TÜMÜ" : (CATEGORY_LABELS[cat] || cat).toUpperCase()}
              </button>
            );
          })}
        </div>
      )}

      {/* İçerik */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", padding: "20px 28px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,.1)", borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>İndirmeler yükleniyor...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Download size={40} color="rgba(255,255,255,.1)" style={{ margin: "0 auto 16px" }} />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)" }}>İndirme bulunamadı</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 40vw), 1fr))", gap: 12 }}>
            {filtered.map(item => {
              const latestVer = item.versions?.[0];
              return (
                <div key={item.id}
                  onClick={() => { playSound("c-one_onay.wav"); setSelected(item); }}
                  style={{ borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", cursor: "pointer", transition: "all .2s", display: "flex", flexDirection: "column" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = `${accent}30`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,.4)`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: "relative", height: 120, overflow: "hidden", flexShrink: 0 }}>
                    {item.thumbnail
                      ? <img src={item.thumbnail} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${accent}12, #0a0a0f)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Package size={32} color={`${accent}30`} />
                        </div>
                    }
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,18,.85) 0%, transparent 60%)" }} />
                    {/* Kategori badge */}
                    {item.category && (
                      <div style={{ position: "absolute", top: 10, left: 10, fontSize: 8, fontWeight: 800, padding: "2px 7px", borderRadius: 4, background: `${accent}20`, color: accent, letterSpacing: 1 }}>
                        {(CATEGORY_LABELS[item.category] || item.category).toUpperCase()}
                      </div>
                    )}
                    {/* Versiyon */}
                    {latestVer?.version && (
                      <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.5)" }}>v{latestVer.version}</div>
                    )}
                  </div>

                  {/* Bilgi */}
                  <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>{item.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Download size={10} color="rgba(255,255,255,.3)" />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>{item.download_count || 0}</span>
                      </div>
                      {latestVer?.version_date && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={10} color="rgba(255,255,255,.3)" />
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>{formatDate(latestVer.version_date)}</span>
                        </div>
                      )}
                      {item.versions?.length > 1 && (
                        <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,.25)" }}>{item.versions.length} versiyon</span>
                      )}
                    </div>
                  </div>

                  {/* İndir butonu */}
                  <div style={{ padding: "0 14px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 7, background: `${accent}15`, border: `1px solid ${accent}25`, color: accent, fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>
                      <Download size={11} />
                      İNDİR
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detay modal */}
      <AnimatePresence>
        {selected && (
          <DownloadDetail item={selected} accent={accent} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
