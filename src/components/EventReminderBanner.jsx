import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, ChevronUp, ChevronDown } from "lucide-react";

function useCountdown(targetDate) {
  const calc = () => Math.max(0, new Date(targetDate).getTime() - Date.now());
  const [ms, setMs] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setMs(calc()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s, done: ms === 0 };
}

function Pad(n) { return String(n).padStart(2, "0"); }

function TimeUnit({ value, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <span style={{ fontSize: 26, fontWeight: 300, color: "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: -1 }}>
        {Pad(value)}
      </span>
      <span style={{ fontSize: 8, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.12)", alignSelf: "center", marginBottom: 14 }} />;
}

const ToggleBtn = ({ onClick, icon: Icon }) => (
  <button
    onClick={onClick}
    style={{
      width: 24, height: 24, borderRadius: "50%",
      background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
      color: "rgba(255,255,255,.5)", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all .2s",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,166,35,.2)"; e.currentTarget.style.borderColor = "#f5a623"; e.currentTarget.style.color = "#f5a623"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; e.currentTarget.style.color = "rgba(255,255,255,.5)"; }}
  >
    <Icon size={13} />
  </button>
);

export default function EventReminderBanner({ event, onDismiss }) {
  const [mini, setMini] = useState(false);
  const { d, h, m, s, done } = useCountdown(event.event_date);
  const accent = "#f5a623";

  useEffect(() => { if (done) onDismiss(); }, [done]);

  const dateStr = new Date(event.event_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = new Date(event.event_date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const miniCountdown = d > 0 ? `${d}g ${Pad(h)}:${Pad(m)}:${Pad(s)}` : `${Pad(h)}:${Pad(m)}:${Pad(s)}`;

  return (
    <div style={{
      position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, width: mini ? 300 : "min(560px, 88vw)",
      transition: "width .35s cubic-bezier(.16,1,.3,1)",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      <AnimatePresence mode="wait">
        {!mini ? (
          <motion.div key="full"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {/* Kart */}
            <div style={{
              borderRadius: "0 0 14px 14px", overflow: "hidden", position: "relative",
              boxShadow: "0 12px 40px rgba(0,0,0,.8)",
              animation: "borderGlow 2.5s ease-in-out infinite",
            }}>
              {event.image_url && (
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `url(${event.image_url})`,
                  backgroundSize: "cover", backgroundPosition: "center",
                  filter: "blur(3px) brightness(0.18)", transform: "scale(1.05)",
                }} />
              )}
              <div style={{
                position: "absolute", inset: 0,
                background: event.image_url
                  ? "linear-gradient(135deg, rgba(3,2,1,.92) 0%, rgba(6,4,2,.88) 100%)"
                  : "rgba(5,4,2,.97)",
              }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}cc, transparent)` }} />

              <div style={{ position: "relative", padding: "14px 18px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#e74c3c", boxShadow: "0 0 6px #e74c3c", animation: "bannerPulse 1.5s ease-in-out infinite" }} />
                  <span style={{ fontSize: 9, fontWeight: 600, color: accent, letterSpacing: 2, textTransform: "uppercase" }}>Yaklaşan Etkinlik</span>
                </div>

                <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: -0.3, lineHeight: 1.2 }}>
                      {event.title}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,.45)" }}>
                        <Calendar size={10} color={accent} />
                        <span>{dateStr} · {timeStr}</span>
                      </div>
                      {event.dr_origin && event.dr_dest && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,.45)" }}>
                          <MapPin size={10} color={accent} />
                          <span>{event.dr_origin} → {event.dr_dest}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, textTransform: "uppercase" }}>Kalan Süre</span>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      {d > 0 && <><TimeUnit value={d} label="Gün" /><Divider /></>}
                      <TimeUnit value={h} label="Saat" />
                      <Divider />
                      <TimeUnit value={m} label="Dakika" />
                      <Divider />
                      <TimeUnit value={s} label="Saniye" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dış ok — kartın altında ortalı */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
              <ToggleBtn onClick={() => setMini(true)} icon={ChevronUp} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="mini"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mini kart */}
            <div style={{
              borderRadius: "0 0 10px 10px", overflow: "hidden", position: "relative",
              boxShadow: "0 6px 20px rgba(0,0,0,.7)",
              animation: "borderGlow 2.5s ease-in-out infinite",
            }}>
              {event.image_url && (
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `url(${event.image_url})`,
                  backgroundSize: "cover", backgroundPosition: "center",
                  filter: "blur(2px) brightness(0.18)", transform: "scale(1.05)",
                }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: "rgba(5,4,2,.92)" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accent}99, transparent)` }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "7px 14px" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#e74c3c", boxShadow: "0 0 5px #e74c3c", flexShrink: 0, animation: "bannerPulse 1.5s ease-in-out infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,.8)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</span>
                <span style={{ fontSize: 12, fontWeight: 300, color: "#fff", fontVariantNumeric: "tabular-nums", flexShrink: 0, letterSpacing: 0.5 }}>{miniCountdown}</span>
              </div>
            </div>

            {/* Dış ok — kartın altında ortalı */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
              <ToggleBtn onClick={() => setMini(false)} icon={ChevronDown} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes bannerPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.5)} }
        @keyframes borderGlow {
          0%,100% { box-shadow: 0 12px 40px rgba(0,0,0,.8), 0 0 0 1px rgba(245,166,35,.15); }
          50%      { box-shadow: 0 12px 40px rgba(0,0,0,.8), 0 0 0 1px rgba(245,166,35,.5), 0 0 18px rgba(245,166,35,.15); }
        }
      `}</style>
    </div>
  );
}
