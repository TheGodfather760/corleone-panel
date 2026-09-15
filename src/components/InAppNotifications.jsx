import { useEffect, useRef } from "react";
import { useNotif } from "../lib/NotifContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCircle, AlertTriangle, Info, AlertCircle, Zap, Trophy, Download, Calendar } from "lucide-react";

const TYPES = {
  info: {
    icon: Info,
    color: "#3b82f6",
    glow: "rgba(59,130,246,.35)",
    bg: "rgba(59,130,246,.08)",
    border: "rgba(59,130,246,.3)",
    label: "BİLGİ",
  },
  success: {
    icon: CheckCircle,
    color: "#2ecc71",
    glow: "rgba(46,204,113,.35)",
    bg: "rgba(46,204,113,.08)",
    border: "rgba(46,204,113,.3)",
    label: "BAŞARILI",
  },
  warning: {
    icon: AlertTriangle,
    color: "#f5a623",
    glow: "rgba(245,166,35,.35)",
    bg: "rgba(245,166,35,.08)",
    border: "rgba(245,166,35,.3)",
    label: "UYARI",
  },
  danger: {
    icon: AlertCircle,
    color: "#e74c3c",
    glow: "rgba(231,76,60,.35)",
    bg: "rgba(231,76,60,.08)",
    border: "rgba(231,76,60,.3)",
    label: "HATA",
  },
  event: {
    icon: Calendar,
    color: "#9b59b6",
    glow: "rgba(155,89,182,.35)",
    bg: "rgba(155,89,182,.08)",
    border: "rgba(155,89,182,.3)",
    label: "ETKİNLİK",
  },
  achievement: {
    icon: Trophy,
    color: "#f5a623",
    glow: "rgba(245,166,35,.5)",
    bg: "linear-gradient(135deg, rgba(245,166,35,.15), rgba(124,58,237,.1))",
    border: "rgba(245,166,35,.4)",
    label: "BAŞARIM",
  },
  download: {
    icon: Download,
    color: "#06b6d4",
    glow: "rgba(6,182,212,.35)",
    bg: "rgba(6,182,212,.08)",
    border: "rgba(6,182,212,.3)",
    label: "İNDİRME",
  },
  system: {
    icon: Zap,
    color: "#7c3aed",
    glow: "rgba(124,58,237,.4)",
    bg: "rgba(124,58,237,.1)",
    border: "rgba(124,58,237,.35)",
    label: "SİSTEM",
  },
};

// ── Demo bildirimleri (5'er saniyede bir) ──
const DEMO_QUEUE = [
  { type: "success",     title: "Profil güncellendi",        body: "Bilgilerin başarıyla kaydedildi." },
  { type: "event",       title: "Etkinlik Başlıyor!",        body: "Corleone Konvoyu 30 dakika sonra başlıyor." },
  { type: "achievement", title: "Yeni Başarım!",             body: "\"İlk Konvoy\" başarımını kazandın 🏆" },
  { type: "download",    title: "İndirme Tamamlandı",        body: "ETS2 Profil v2.4.1 başarıyla indirildi." },
  { type: "warning",     title: "Bağlantı Yavaş",            body: "Sunucuya bağlantı normalden yavaş." },
  { type: "danger",      title: "Oturum Süresi Doldu",       body: "Güvenlik için yeniden giriş yapman gerekiyor." },
  { type: "info",        title: "Yeni Güncelleme Mevcut",    body: "v1.2.0 sürümü indirilebilir." },
  { type: "system",      title: "C-ONE Aktif",               body: "Oyun modu başarıyla başlatıldı." },
];

function NotifToast({ toast, onDismiss }) {
  const cfg = TYPES[toast.type] || TYPES.info;
  const Icon = cfg.icon;
  const isAchievement = toast.type === "achievement";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.88, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "relative", overflow: "hidden", borderRadius: 12, minWidth: 300, maxWidth: 360, cursor: toast.onClick ? "pointer" : "default" }}
      onClick={() => { if (toast.onClick) { toast.onClick(); dismiss(toast.id); } }}
    >
      {/* Arka plan */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 12,
        background: isAchievement ? cfg.bg : `rgba(12,12,20,.96)`,
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04), inset 0 1px 0 rgba(255,255,255,.06)`,
        backdropFilter: "blur(20px)",
      }} />

      {/* Sol renkli şerit */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "12px 0 0 12px",
        background: cfg.color,
        boxShadow: `0 0 12px ${cfg.glow}`,
      }} />

      {/* Glow efekti (achievement için daha belirgin) */}
      {isAchievement && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 12,
          background: `radial-gradient(ellipse at 20% 50%, ${cfg.glow} 0%, transparent 60%)`,
          pointerEvents: "none",
        }} />
      )}

      {/* İçerik */}
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 14px 13px 16px" }}>

        {/* İkon kutusu */}
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: `${cfg.color}18`,
          border: `1px solid ${cfg.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: isAchievement ? `0 0 16px ${cfg.glow}` : "none",
        }}>
          {isAchievement ? (
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Icon size={16} color={cfg.color} />
            </motion.div>
          ) : (
            <Icon size={16} color={cfg.color} />
          )}
        </div>

        {/* Metin */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 8, fontWeight: 800, color: cfg.color, letterSpacing: 1.5, opacity: 0.8 }}>{cfg.label}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: toast.body ? 4 : 0 }}>{toast.title}</div>
          {toast.body && <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>{toast.body}</div>}
        </div>

        {/* Kapat */}
        <button onClick={() => onDismiss(toast.id)}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,.25)", cursor: "pointer", padding: 2, flexShrink: 0, display: "flex", alignItems: "center", transition: "color .15s", marginTop: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.7)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.25)"}
        >
          <X size={13} />
        </button>
      </div>

      {/* Alt progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 5, ease: "linear" }}
        style={{
          position: "absolute", bottom: 0, left: 3, right: 0, height: 2,
          background: cfg.color, opacity: 0.5,
          transformOrigin: "left",
          borderRadius: "0 0 12px 0",
        }}
      />
    </motion.div>
  );
}

export default function InAppNotifications({ demo = false }) {
  const { toasts, push, dismiss } = useNotif();
  const demoIdx = useRef(0);

  // Demo modu: 5 saniyede bir bildirim
  useEffect(() => {
    if (!demo) return;
    const interval = setInterval(() => {
      const item = DEMO_QUEUE[demoIdx.current % DEMO_QUEUE.length];
      push(item.title, item.body, item.type);
      demoIdx.current++;
    }, 5000);
    // İlk bildirimi hemen göster
    const first = DEMO_QUEUE[0];
    push(first.title, first.body, first.type);
    demoIdx.current = 1;
    return () => clearInterval(interval);
  }, [demo]);

  return (
    <div style={{
      position: "fixed", top: 64, right: 16, zIndex: 99999,
      display: "flex", flexDirection: "column", gap: 8,
      pointerEvents: "none",
    }}>
      <AnimatePresence mode="sync">
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: "all" }}>
            <NotifToast toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
