import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logisticsApi } from "../lib/api";
import { Truck, Package, TrendingUp, Clock, CheckCircle, AlertCircle, ChevronRight, RefreshCw, Zap, Star, MapPin, Fuel } from "lucide-react";

function playSound(name) {
  try { const a = new Audio(`/sounds/${name}`); a.volume = 0.5; a.play().catch(() => {}); } catch {}
}

function fmt(n) {
  if (!n && n !== 0) return "—";
  return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtTime(secs) {
  if (!secs || secs <= 0) return "Tamamlandı";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

const DRIVE_LABELS = { normal: "Normal", fast: "Hızlı", eco: "Ekonomik", risky: "Riskli" };
const WEATHER_LABELS = { clear: "Açık", rain: "Yağmurlu", fog: "Sisli", snow: "Karlı", storm: "Fırtınalı" };
const WEATHER_ICONS = { clear: "☀️", rain: "🌧️", fog: "🌫️", snow: "❄️", storm: "⛈️" };
const CARGO_ICONS = { standard: "📦", fragile: "🔮", hazmat: "☢️", livestock: "🐄", oversized: "🏗️", refrigerated: "🧊", vip: "⭐" };

// ── Küçük bileşenler ──────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon: Icon, accent }) {
  return (
    <div style={{ flex: 1, padding: "14px 16px", background: "rgba(255,255,255,.04)", border: `1px solid ${color}25`, borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.35)", letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color, letterSpacing: -0.5 }}>{value}</div>
    </div>
  );
}

function ProgressBar({ pct, color, height = 4 }) {
  return (
    <div style={{ height, borderRadius: height, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: height, transition: "width .5s ease" }} />
    </div>
  );
}

function SectionTitle({ children, accent }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${accent}20` }}>
      {children}
    </div>
  );
}

// ── Aktif Sefer Kartı ─────────────────────────────────────────────────────────

function ActiveJobCard({ job, accent, onClaim, claiming }) {
  const [remaining, setRemaining] = useState(job.remaining_s);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const canClaim = remaining <= 0;
  const pct = job.progress;
  const barColor = job.is_resting ? "#f59e0b" : canClaim ? "#2ecc71" : accent;

  return (
    <div style={{ padding: "14px 16px", background: "rgba(255,255,255,.04)", border: `1px solid ${canClaim ? "#2ecc7140" : "rgba(255,255,255,.08)"}`, borderRadius: 12, transition: "border-color .3s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>{CARGO_ICONS[job.cargo_type] || "📦"}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{job.origin}</span>
            <ChevronRight size={12} color="rgba(255,255,255,.3)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{job.destination}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>🚛 {job.truck_brand || job.truck_name}</span>
            {job.driver_name && <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>👤 {job.driver_name}</span>}
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>📏 {fmt(job.distance_km)} km</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{WEATHER_ICONS[job.weather]} {WEATHER_LABELS[job.weather] || job.weather}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#2ecc71" }}>₺{fmt(job.base_pay)}</div>
          {job.fuel_cost > 0 && <div style={{ fontSize: 10, color: "#e74c3c", marginTop: 2 }}>-₺{fmt(job.fuel_cost)} yakıt</div>}
        </div>
      </div>

      <ProgressBar pct={pct} color={barColor} height={5} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ fontSize: 11, color: job.is_resting ? "#f59e0b" : "rgba(255,255,255,.4)" }}>
          {job.is_resting ? "⏸ Mola veriliyor..." : canClaim ? "✅ Teslim edilebilir!" : `⏱ ${fmtTime(remaining)} kaldı`}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>%{Math.round(pct)}</span>
          {canClaim && (
            <button onClick={() => onClaim(job.id)} disabled={claiming}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 7, background: "#2ecc71", border: "none", color: "#000", fontSize: 11, fontWeight: 800, cursor: claiming ? "not-allowed" : "pointer", opacity: claiming ? .6 : 1, transition: "all .2s" }}
              onMouseEnter={e => { if (!claiming) e.currentTarget.style.background = "#27ae60"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#2ecc71"; }}
            >
              <CheckCircle size={11} /> TESLİM ET
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── İş İlanı Kartı ────────────────────────────────────────────────────────────

function JobListingCard({ job, accent, onStart, starting }) {
  const driveColors = { normal: "#3b82f6", fast: "#f5a623", eco: "#2ecc71", risky: "#e74c3c" };
  const color = driveColors[job.drive_mode] || accent;

  return (
    <div style={{ padding: "14px 16px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, transition: "all .2s" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = `${accent}30`; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>{CARGO_ICONS[job.cargo_type] || "📦"}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {job.origin_city} → {job.dest_city}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: `${color}18`, color, border: `1px solid ${color}30` }}>
              {DRIVE_LABELS[job.drive_mode] || job.drive_mode}
            </span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>📏 {fmt(job.distance_km)} km</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>{WEATHER_ICONS[job.weather]} {WEATHER_LABELS[job.weather] || job.weather}</span>
            {job.duration_hours && <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>⏱ {job.duration_hours}s</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#2ecc71" }}>₺{fmt(job.effective_pay || job.base_pay)}</div>
          {job.fuel_cost_est > 0 && <div style={{ fontSize: 9, color: "#e74c3c" }}>-₺{fmt(job.fuel_cost_est)} yakıt</div>}
        </div>
      </div>

      {!job.can_take && job.lock_reason && (
        <div style={{ fontSize: 10, color: "#e74c3c", padding: "5px 8px", background: "rgba(231,76,60,.08)", borderRadius: 5, marginBottom: 8 }}>
          🔒 {job.lock_reason}
        </div>
      )}

      <button onClick={() => job.can_take && onStart(job)} disabled={!job.can_take || starting}
        style={{ width: "100%", padding: "8px", borderRadius: 7, border: "none", cursor: job.can_take && !starting ? "pointer" : "not-allowed", background: job.can_take ? `${accent}20` : "rgba(255,255,255,.05)", color: job.can_take ? accent : "rgba(255,255,255,.25)", fontSize: 11, fontWeight: 700, transition: "all .2s", opacity: starting ? .6 : 1 }}
        onMouseEnter={e => { if (job.can_take && !starting) e.currentTarget.style.background = `${accent}35`; }}
        onMouseLeave={e => { if (job.can_take) e.currentTarget.style.background = `${accent}20`; }}
      >
        {starting ? "Başlatılıyor..." : job.can_take ? "SEFERE BAŞLA" : "KİLİTLİ"}
      </button>
    </div>
  );
}

// ── Sefer Sonucu Modal ────────────────────────────────────────────────────────

function JobResultModal({ result, accent, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.88, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{ width: 340, background: "rgba(10,10,18,.98)", border: `1px solid ${accent}30`, borderRadius: 16, overflow: "hidden", boxShadow: `0 0 60px ${accent}20` }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, #7c3aed)` }} />
        <div style={{ padding: "24px 24px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <CheckCircle size={40} color="#2ecc71" style={{ margin: "0 auto 10px" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Sefer Tamamlandı!</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>Kazanç hesaplandı</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {[
              { label: "Brüt Ödeme", value: `₺${fmt(result.gross_pay)}`, color: "#fff" },
              result.driver_wage_cut > 0 && { label: "Şoför Maaşı", value: `-₺${fmt(result.driver_wage_cut)}`, color: "#e74c3c" },
              result.fuel_cost > 0 && { label: "Yakıt Maliyeti", value: `-₺${fmt(result.fuel_cost)}`, color: "#e74c3c" },
              { label: "Net Kazanç", value: `₺${fmt(result.final_pay)}`, color: "#2ecc71", bold: true },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,.04)", borderRadius: 7 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: row.bold ? 800 : 600, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
            <div style={{ textAlign: "center", padding: "8px 16px", background: "rgba(245,166,35,.08)", border: "1px solid rgba(245,166,35,.2)", borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#f5a623" }}>+{result.xp_earned}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 2 }}>XP</div>
            </div>
            <div style={{ textAlign: "center", padding: "8px 16px", background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.2)", borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#7c3aed" }}>+{result.prestige_earned}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 2 }}>Prestij</div>
            </div>
            <div style={{ textAlign: "center", padding: "8px 16px", background: "rgba(46,204,113,.08)", border: "1px solid rgba(46,204,113,.2)", borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#2ecc71" }}>₺{fmt(result.new_balance)}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 2 }}>Bakiye</div>
            </div>
          </div>

          {result.events?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {result.events.map((ev, i) => (
                <div key={i} style={{ fontSize: 11, color: ev.type === "bonus" ? "#2ecc71" : "#e74c3c", padding: "4px 0" }}>
                  {ev.type === "bonus" ? "✅" : "⚠️"} {ev.description}
                </div>
              ))}
            </div>
          )}

          <button onClick={onClose}
            style={{ width: "100%", padding: "11px", borderRadius: 9, border: "none", background: accent, color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
            TAMAM
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Ana Bileşen ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "dashboard", label: "PANEL",   icon: TrendingUp },
  { id: "market",    label: "PAZAR",   icon: Package },
  { id: "garage",    label: "GARAJ",   icon: Truck },
];

const MARKET_CATS = [
  { key: "is_bul",  label: "İş Bul" },
  { key: "express", label: "Ekspres" },
  { key: "vip",     label: "VIP" },
];

export default function COneLogisticsScreen({ onBack, accent = "#f5a623" }) {
  const [tab, setTab] = useState("dashboard");
  const [wallet, setWallet] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [market, setMarket] = useState([]);
  const [marketCat, setMarketCat] = useState("is_bul");
  const [garage, setGarage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(false);
  const [garageLoading, setGarageLoading] = useState(false);
  const [claiming, setClaiming] = useState(null);
  const [starting, setStarting] = useState(false);
  const [jobResult, setJobResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [onboarded, setOnboarded] = useState(true);
  const pollRef = useRef(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadDashboard = useCallback(async () => {
    try {
      const [finRes, jobsRes] = await Promise.all([
        logisticsApi.finance(),
        logisticsApi.activeJobs(),
      ]);
      if (finRes.data.success) {
        setWallet(finRes.data.data.wallet);
        setHistory(finRes.data.data.history || []);
      } else if (finRes.data.message?.includes("kayıt") || finRes.data.message?.includes("bulunamadı")) {
        setOnboarded(false);
      }
      if (jobsRes.data.success) setActiveJobs(jobsRes.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
    pollRef.current = setInterval(() => {
      logisticsApi.activeJobs().then(r => { if (r.data.success) setActiveJobs(r.data.data || []); }).catch(() => {});
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [loadDashboard]);

  const loadMarket = useCallback(async (cat) => {
    setMarketLoading(true);
    try {
      const res = await logisticsApi.market(cat);
      if (res.data.success) setMarket(res.data.data.listings || []);
    } catch {}
    setMarketLoading(false);
  }, []);

  const loadGarage = useCallback(async () => {
    if (garage) return;
    setGarageLoading(true);
    try {
      const res = await logisticsApi.garage();
      if (res.data.success) setGarage(res.data.data);
    } catch {}
    setGarageLoading(false);
  }, [garage]);

  useEffect(() => {
    if (tab === "market") loadMarket(marketCat);
    if (tab === "garage") loadGarage();
  }, [tab]);

  useEffect(() => {
    if (tab === "market") loadMarket(marketCat);
  }, [marketCat]);

  const handleClaim = async (jobId) => {
    setClaiming(jobId);
    try {
      const res = await logisticsApi.claimJob(jobId);
      if (res.data.success) {
        playSound("c-one_onay.wav");
        setJobResult(res.data.data);
        setActiveJobs(p => p.filter(j => j.id !== jobId));
        loadDashboard();
      } else {
        showToast(res.data.message || "Hata.", false);
      }
    } catch { showToast("Bağlantı hatası.", false); }
    setClaiming(null);
  };

  const handleStart = async (job) => {
    setStarting(true);
    try {
      const res = await logisticsApi.startJob({ listing_id: job.id });
      if (res.data.success) {
        playSound("c-one_onay.wav");
        showToast("Sefer başlatıldı!");
        setTab("dashboard");
        loadDashboard();
        loadMarket(marketCat);
      } else {
        showToast(res.data.message || "Hata.", false);
      }
    } catch { showToast("Bağlantı hatası.", false); }
    setStarting(false);
  };

  const handleOnboard = async () => {
    setLoading(true);
    try {
      const res = await logisticsApi.setupSeed();
      if (res.data.success) { setOnboarded(true); loadDashboard(); }
      else showToast(res.data.message || "Hata.", false);
    } catch { showToast("Bağlantı hatası.", false); }
    setLoading(false);
  };

  const xpPct = wallet ? Math.min(100, ((wallet.xp || 0) % 500) / 5) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", inset: 0, zIndex: 40, background: "#0a0a0f", display: "flex", flexDirection: "column", fontFamily: "var(--c1-font, 'LemonMilk', 'Segoe UI', sans-serif)", overflow: "hidden" }}
    >
      {/* Arka plan */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`, top: -150, left: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.08) 0%, transparent 70%)", bottom: -100, right: -100 }} />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)", zIndex: 60, padding: "8px 18px", borderRadius: 8, background: toast.ok ? "rgba(46,204,113,.15)" : "rgba(231,76,60,.15)", border: `1px solid ${toast.ok ? "rgba(46,204,113,.3)" : "rgba(231,76,60,.3)"}`, color: toast.ok ? "#2ecc71" : "#e74c3c", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sefer sonucu modal */}
      <AnimatePresence>
        {jobResult && <JobResultModal result={jobResult} accent={accent} onClose={() => setJobResult(null)} />}
      </AnimatePresence>

      {/* Üst bar */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 16, padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
        <button onClick={() => { playSound("c-one_back.wav"); onBack(); }}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = `${accent}20`; e.currentTarget.style.borderColor = `${accent}50`; e.currentTarget.style.color = accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "rgba(255,255,255,.7)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 9, color: accent, letterSpacing: 2, marginBottom: 2 }}>C-ONE</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1 }}>LOJİSTİK</div>
        </div>
        {wallet && (
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#2ecc71" }}>₺{fmt(wallet.balance)}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 1 }}>Seviye {wallet.level} · {fmt(wallet.prestige)} Prestij</div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 4, padding: "8px 28px", borderBottom: "1px solid rgba(255,255,255,.05)", flexShrink: 0 }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => { playSound("c-one_navigation.wav"); setTab(id); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 1, transition: "all .2s", background: active ? `${accent}20` : "transparent", color: active ? accent : "rgba(255,255,255,.4)", boxShadow: active ? `0 0 12px ${accent}30` : "none" }}>
              <Icon size={12} /> {label}
              {id === "dashboard" && activeJobs.length > 0 && (
                <span style={{ fontSize: 9, fontWeight: 900, padding: "1px 5px", borderRadius: 8, background: accent, color: "#000", marginLeft: 2 }}>{activeJobs.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* İçerik */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", padding: "20px 28px" }}>

        {/* Onboarding */}
        {!onboarded && !loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Truck size={48} color={`${accent}40`} style={{ margin: "0 auto 16px" }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Lojistik Sistemine Hoş Geldin!</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 24, lineHeight: 1.7 }}>
              Sanal nakliyat şirketini kur, tır satın al, şoför işe al ve iş ilanlarından para kazan.
            </div>
            <button onClick={handleOnboard}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 10, background: accent, border: "none", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 20px ${accent}50` }}>
              <Zap size={15} /> BAŞLA
            </button>
          </div>
        )}

        {loading && onboarded && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,.1)", borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Yükleniyor...</span>
          </div>
        )}

        {/* PANEL TAB */}
        {!loading && onboarded && tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Stat kartları */}
            {wallet && (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  <StatCard label="Bakiye" value={`₺${fmt(wallet.balance)}`} color="#2ecc71" icon={TrendingUp} accent={accent} />
                  <StatCard label="Toplam Kazanç" value={`₺${fmt(wallet.total_earned)}`} color={accent} icon={Star} accent={accent} />
                  <StatCard label="Toplam Sefer" value={fmt(wallet.total_jobs)} color="#3b82f6" icon={Truck} accent={accent} />
                  <StatCard label="Toplam KM" value={`${fmt(wallet.total_km)} km`} color="#7c3aed" icon={MapPin} accent={accent} />
                </div>
                {/* XP bar */}
                <div style={{ padding: "12px 16px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Seviye {wallet.level}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>{wallet.xp % 500} / 500 XP</span>
                  </div>
                  <ProgressBar pct={xpPct} color={accent} height={6} />
                </div>
              </>
            )}

            {/* Aktif seferler */}
            <div>
              <SectionTitle accent={accent}>Aktif Seferler ({activeJobs.length})</SectionTitle>
              {activeJobs.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.25)" }}>
                  Aktif sefer yok. Pazardan iş al!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activeJobs.map(job => (
                    <ActiveJobCard key={job.id} job={job} accent={accent} onClaim={handleClaim} claiming={claiming === job.id} />
                  ))}
                </div>
              )}
            </div>

            {/* Son seferler */}
            {history.length > 0 && (
              <div>
                <SectionTitle accent={accent}>Son Seferler</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {history.slice(0, 5).map((j, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8 }}>
                      <CheckCircle size={13} color="#2ecc71" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {j.origin_city} → {j.dest_city}
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>{j.distance_km} km · {j.truck_brand} {j.truck_model}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#2ecc71" }}>₺{fmt(j.final_pay)}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)" }}>+{j.xp_earned} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAZAR TAB */}
        {!loading && onboarded && tab === "market" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Kategori seçici */}
            <div style={{ display: "flex", gap: 6 }}>
              {MARKET_CATS.map(c => (
                <button key={c.key} onClick={() => { playSound("c-one_navigation.wav"); setMarketCat(c.key); }}
                  style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 0.8, transition: "all .2s", background: marketCat === c.key ? `${accent}20` : "rgba(255,255,255,.05)", color: marketCat === c.key ? accent : "rgba(255,255,255,.4)", boxShadow: marketCat === c.key ? `0 0 10px ${accent}25` : "none" }}>
                  {c.label}
                </button>
              ))}
              <button onClick={() => loadMarket(marketCat)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                <RefreshCw size={12} /> Yenile
              </button>
            </div>

            {marketLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 150, gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.1)", borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>İlanlar yükleniyor...</span>
              </div>
            ) : market.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", fontSize: 12, color: "rgba(255,255,255,.25)" }}>İlan bulunamadı.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                {market.map(job => (
                  <JobListingCard key={job.id} job={job} accent={accent} onStart={handleStart} starting={starting} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* GARAJ TAB */}
        {!loading && onboarded && tab === "garage" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {garageLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 150, gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.1)", borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Garaj yükleniyor...</span>
              </div>
            ) : garage ? (
              <>
                {/* Tırlar */}
                <div>
                  <SectionTitle accent={accent}>Tırlarım ({garage.trucks?.length || 0})</SectionTitle>
                  {garage.trucks?.length === 0 ? (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.25)", padding: "12px 0" }}>Henüz tır yok.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                      {garage.trucks.map(t => {
                        const statusColor = t.status === "idle" ? "#2ecc71" : t.status === "driving" ? accent : "#888";
                        const statusLabel = t.status === "idle" ? "Müsait" : t.status === "driving" ? "Seferde" : t.status;
                        return (
                          <div key={t.id} style={{ padding: "12px 14px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10 }}>
                            {t.image && <img src={t.image} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 7, marginBottom: 10 }} />}
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{t.brand} {t.model}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{t.plate} · {fmt(t.total_km || 0)} km</span>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: `${statusColor}18`, color: statusColor }}>{statusLabel}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Şoförler */}
                {garage.drivers?.length > 0 && (
                  <div>
                    <SectionTitle accent={accent}>Şoförlerim ({garage.drivers.length})</SectionTitle>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                      {garage.drivers.map(d => {
                        const statusColor = d.status === "available" ? "#2ecc71" : d.status === "driving" ? accent : "#888";
                        return (
                          <div key={d.id} style={{ padding: "12px 14px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                            {d.image ? <img src={d.image} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>👤</div>}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>Beceri: {d.skill}</div>
                              <span style={{ fontSize: 9, fontWeight: 700, color: statusColor }}>{d.status === "available" ? "Müsait" : d.status === "driving" ? "Seferde" : d.status}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
