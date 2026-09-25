import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ChevronDown, ChevronUp, ExternalLink, Package, CheckCircle, AlertCircle } from "lucide-react";
import { promodsApi } from "../lib/api";
import { openUrl } from "@tauri-apps/plugin-opener";

function playSound(name) {
  try { const a = new Audio(`/sounds/${name}`); a.volume = 0.5; a.play().catch(() => {}); } catch {}
}

const GAME_META = {
  ets2: { label: "Euro Truck Simulator 2", short: "ETS2", color: "#f5a623", flag: "🇪🇺" },
  ats:  { label: "American Truck Simulator", short: "ATS",  color: "#3b82f6", flag: "🇺🇸" },
};

const DLC_LABELS = {
  going_east: "Going East!", scandinavia: "Scandinavia", france: "France",
  italia: "Italia", beyond_the_baltic_sea: "Beyond the Baltic Sea",
  road_to_the_black_sea: "Road to the Black Sea", iberia: "Iberia",
  west_balkans: "West Balkans", greece: "Greece", heart_of_russia: "Heart of Russia",
  montana: "Montana", texas: "Texas", washington: "Washington",
  wyoming: "Wyoming", colorado: "Colorado", kansas: "Kansas",
  oklahoma: "Oklahoma", utah: "Utah",
};

function formatSize(s) {
  if (!s) return "";
  return s.includes("MB") || s.includes("GB") ? s : `${s} MB`;
}

function FileRow({ file, accent }) {
  const [copying, setCopying] = useState(false);

  const handleOpen = () => {
    playSound("c-one_onay.wav");
    if (file.download_url) openUrl(file.download_url).catch(() => {});
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${accent}15`, border: `1px solid ${accent}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Package size={13} color={accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.file_name}</div>
        {file.file_size && <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 1 }}>{formatSize(file.file_size)}</div>}
      </div>
      {file.download_url ? (
        <button onClick={handleOpen}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: `${accent}18`, border: `1px solid ${accent}35`, color: accent, fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, transition: "all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = `${accent}30`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${accent}18`; }}
        >
          <Download size={11} /> İNDİR
        </button>
      ) : (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)", padding: "5px 10px" }}>Yakında</span>
      )}
    </div>
  );
}

function PkgVersionCard({ pv, accent, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const allReady = pv.files?.length > 0 && pv.files.every(f => f.download_url);

  return (
    <div style={{ border: `1px solid ${open ? accent + "30" : "rgba(255,255,255,.08)"}`, borderRadius: 10, overflow: "hidden", transition: "border-color .2s" }}>
      <button onClick={() => { playSound("c-one_navigation.wav"); setOpen(o => !o); }}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: open ? `${accent}08` : "rgba(255,255,255,.03)", border: "none", cursor: "pointer", transition: "background .2s" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: allReady ? "#2ecc71" : "rgba(255,255,255,.2)", flexShrink: 0, boxShadow: allReady ? "0 0 6px #2ecc71" : "none" }} />
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            {pv.map_name} <span style={{ color: accent, fontSize: 11 }}>v{pv.pm_version}</span>
          </div>
          {pv.total_size && <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 2 }}>Toplam: {formatSize(pv.total_size)}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: allReady ? "rgba(46,204,113,.15)" : "rgba(255,255,255,.06)", color: allReady ? "#2ecc71" : "rgba(255,255,255,.35)" }}>
            {pv.files?.length || 0} dosya
          </span>
          {open ? <ChevronUp size={14} color="rgba(255,255,255,.4)" /> : <ChevronDown size={14} color="rgba(255,255,255,.4)" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
              {pv.note && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", padding: "8px 10px", background: "rgba(255,255,255,.03)", borderRadius: 6, marginBottom: 4 }}>{pv.note}</div>
              )}
              {pv.files?.length > 0
                ? pv.files.map(f => <FileRow key={f.id} file={f} accent={accent} />)
                : <div style={{ fontSize: 12, color: "rgba(255,255,255,.25)", padding: "8px 0" }}>Henüz dosya eklenmemiş.</div>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GameVersionTab({ gv, accent }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Oyun versiyonu başlığı */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "rgba(255,255,255,.04)", border: `1px solid ${accent}25`, borderRadius: 10, cursor: "pointer", marginBottom: open ? 10 : 0, transition: "all .2s" }}>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{gv.label}</span>
            {gv.is_current ? (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, background: `${accent}20`, color: accent, letterSpacing: 1 }}>GÜNCEL</span>
            ) : null}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 3 }}>
            Oyun: v{gv.game_version} · {gv.pkg_versions?.length || 0} paket
          </div>
        </div>
        {open ? <ChevronUp size={15} color="rgba(255,255,255,.4)" /> : <ChevronDown size={15} color="rgba(255,255,255,.4)" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
            {/* Gerekli DLC'ler */}
            {gv.required_dlcs?.length > 0 && (
              <div style={{ padding: "10px 14px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, marginBottom: 8, fontWeight: 700 }}>GEREKLİ DLC'LER</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {gv.required_dlcs.map(dlc => (
                    <span key={dlc} style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.1)" }}>
                      {DLC_LABELS[dlc] || dlc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* DEF dosyası */}
            {gv.def_file_name && (
              <div style={{ padding: "10px 14px", background: "rgba(245,166,35,.04)", border: "1px solid rgba(245,166,35,.15)", borderRadius: 8, marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f5a623" }}>DEF Dosyası</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{gv.def_file_name}{gv.def_file_size ? ` · ${formatSize(gv.def_file_size)}` : ""}</div>
                </div>
                {gv.def_download_url && (
                  <button onClick={() => { playSound("c-one_onay.wav"); openUrl(gv.def_download_url).catch(() => {}); }}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: "rgba(245,166,35,.15)", border: "1px solid rgba(245,166,35,.3)", color: "#f5a623", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    <Download size={11} /> İNDİR
                  </button>
                )}
              </div>
            )}

            {/* Paket versiyonları */}
            {gv.pkg_versions?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gv.pkg_versions.map((pv, i) => (
                  <PkgVersionCard key={pv.id} pv={pv} accent={accent} defaultOpen={i === 0} />
                ))}
              </div>
            ) : (
              <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.25)" }}>Bu versiyon için henüz paket yayınlanmamış.</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function COnePromodsScreen({ onBack, accent = "#f5a623" }) {
  const [game, setGame] = useState("ets2");
  const [data, setData] = useState({ ets2: null, ats: null });
  const [loading, setLoading] = useState({ ets2: false, ats: false });

  const load = async (g) => {
    if (data[g] || loading[g]) return;
    setLoading(p => ({ ...p, [g]: true }));
    try {
      const res = await promodsApi.load(g);
      setData(p => ({ ...p, [g]: res.data.data?.game_versions || [] }));
    } catch {
      setData(p => ({ ...p, [g]: [] }));
    } finally {
      setLoading(p => ({ ...p, [g]: false }));
    }
  };

  useEffect(() => { load("ets2"); }, []);

  const handleGameSwitch = (g) => {
    playSound("c-one_navigation.wav");
    setGame(g);
    load(g);
  };

  const currentData = data[game];
  const isLoading = loading[game];
  const meta = GAME_META[game];

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", inset: 0, zIndex: 40, background: "#0a0a0f", display: "flex", flexDirection: "column", fontFamily: "var(--c1-font, 'LemonMilk', 'Segoe UI', sans-serif)", overflow: "hidden" }}
    >
      {/* Arka plan */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${meta.color}12 0%, transparent 70%)`, top: -150, right: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.08) 0%, transparent 70%)", bottom: -100, left: -100 }} />
      </div>

      {/* Üst bar */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 16, padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
        <button onClick={() => { playSound("c-one_back.wav"); onBack(); }}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = `${meta.color}20`; e.currentTarget.style.borderColor = `${meta.color}50`; e.currentTarget.style.color = meta.color; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "rgba(255,255,255,.7)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 9, color: meta.color, letterSpacing: 2, marginBottom: 2 }}>C-ONE</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1 }}>PROMODS</div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Oyun seçici */}
        <div style={{ display: "flex", gap: 4, padding: "3px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10 }}>
          {["ets2", "ats"].map(g => {
            const m = GAME_META[g];
            const active = game === g;
            return (
              <button key={g} onClick={() => handleGameSwitch(g)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, transition: "all .2s", background: active ? m.color : "transparent", color: active ? "#000" : "rgba(255,255,255,.4)" }}>
                <span>{m.flag}</span> {m.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* İçerik */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", padding: "20px 28px" }}>
        {/* Başlık */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: meta.color, marginBottom: 4 }}>{meta.flag} {meta.label}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", lineHeight: 1.6 }}>
            ProMods harita genişletme modu için indirme dosyaları. Her oyun versiyonu için ayrı paketler mevcuttur.
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,.1)", borderTopColor: meta.color, animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Yükleniyor...</span>
          </div>
        ) : !currentData || currentData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Package size={40} color="rgba(255,255,255,.1)" style={{ margin: "0 auto 16px" }} />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)" }}>Henüz yayınlanmış ProMods paketi yok.</div>
          </div>
        ) : (
          currentData.map(gv => (
            <GameVersionTab key={gv.id} gv={gv} accent={meta.color} />
          ))
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
