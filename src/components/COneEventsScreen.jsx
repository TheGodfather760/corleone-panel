import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MapPin, Users, ChevronRight, ExternalLink, Check, Clock, Truck } from "lucide-react";
import { eventsApi } from "../lib/api";
import { openUrl } from "@tauri-apps/plugin-opener";

function playSound(name) {
  try { const a = new Audio(`/sounds/${name}`); a.volume = 0.5; a.play().catch(() => {}); } catch {}
}

const STATUS_MAP = {
  active:   { label: "AKTİF",    color: "#2ecc71", bg: "rgba(46,204,113,.15)" },
  upcoming: { label: "YAKLAŞAN", color: "#f5a623", bg: "rgba(245,166,35,.15)" },
  past:     { label: "GEÇMİŞ",   color: "rgba(255,255,255,.3)", bg: "rgba(255,255,255,.06)" },
  cancelled:{ label: "İPTAL",    color: "#e74c3c", bg: "rgba(231,76,60,.15)" },
};

const ATTEND_MAP = {
  attending:    { label: "KATILIYORUM", color: "#2ecc71", icon: Check },
  not_attending:{ label: "KATILMIYORUM", color: "#e74c3c", icon: X },
  maybe:        { label: "BELKI",        color: "#f5a623", icon: Clock },
  none:         { label: "KATIL",        color: "#7c3aed", icon: null },
};

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

export function EventDetail({ event, onClose, accent }) {
  const [attending, setAttending] = useState(event.my_status || "none");
  const [loading, setLoading] = useState(false);
  const [routeExpanded, setRouteExpanded] = useState(false);

  const handleAttend = async (status) => {
    if (loading) return;
    setLoading(true);
    playSound("c-one_onay.wav");
    try {
      await eventsApi.attend(event.id, status);
      setAttending(status);
    } catch {}
    setLoading(false);
  };

  const st = STATUS_MAP[event.status] || STATUS_MAP.past;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "absolute", inset: 0, zIndex: 20, background: "rgba(0,0,0,.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "min(680px, 92vw)", maxHeight: "85vh", background: "rgba(10,10,18,.98)", border: `1px solid ${accent}30`, borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: `0 0 80px ${accent}20` }}
      >
        {/* Kapak */}
        <div style={{ position: "relative", height: 200, flexShrink: 0, overflow: "hidden" }}>
          {event.image_url
            ? <img src={event.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${accent}20, #0a0a0f)` }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,18,1) 0%, rgba(10,10,18,.3) 60%, transparent 100%)" }} />
          <button onClick={onClose}
            style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(231,76,60,.3)"; e.currentTarget.style.color = "#e74c3c"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,.6)"; e.currentTarget.style.color = "rgba(255,255,255,.7)"; }}
          ><X size={14} /></button>
          <div style={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: st.bg, color: st.color, letterSpacing: 1 }}>{st.label}</span>
              {event.game && <span style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 1 }}>{event.game.toUpperCase()}</span>}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{event.title}</div>
          </div>
        </div>

        {/* İçerik */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Meta bilgiler */}
          <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
            {event.event_date && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={13} color={accent} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>{formatDate(event.event_date)}</span>
              </div>
            )}
            {event.attending_count > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={13} color={accent} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>{event.attending_count} katılımcı</span>
              </div>
            )}
          </div>

          {/* Rota bilgisi */}
          {(event.dr_origin || event.dr_dest) && (
            <div style={{ padding: "12px 14px", background: `${accent}0d`, border: `1px solid ${accent}20`, borderRadius: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: accent, letterSpacing: 1.5, marginBottom: 8, fontWeight: 700 }}>KONVOY ROTASI</div>
              {/* Rota thumbnail */}
              {event.dr_thumb_url && (
                <>
                  <AnimatePresence>
                    {routeExpanded && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setRouteExpanded(false)}
                        style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}
                      >
                        <motion.img src={event.dr_thumb_url}
                          initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 10, boxShadow: "0 0 80px rgba(0,0,0,.9)" }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div style={{ position: "relative", marginBottom: 10, cursor: "zoom-in" }} onClick={() => setRouteExpanded(true)}>
                    <img src={event.dr_thumb_url} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 7, display: "block" }}
                      onError={e => e.currentTarget.parentElement.style.display = "none"} />
                    <div style={{ position: "absolute", inset: 0, borderRadius: 7, background: "rgba(0,0,0,.2)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,.6)", padding: "4px 10px", borderRadius: 6 }}>BÜ YÜT</span>
                    </div>
                  </div>
                </>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 2 }}>BAŞLANGIÇ</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{event.dr_origin || "—"}</div>
                </div>
                <ChevronRight size={16} color={accent} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 2 }}>BİTİŞ</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{event.dr_dest || "—"}</div>
                </div>
                {event.dr_km && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 2 }}>MESAFE</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: accent }}>{event.dr_km} km</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Araç/Dorse */}
          {(event.fleet_truck || event.fleet_trailer) && (
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {event.fleet_truck && (
                <div style={{ flex: 1, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                  {event.fleet_truck.image_url
                    ? <div style={{ width: "100%", aspectRatio: "16/9", background: "#0d0d14", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <img src={event.fleet_truck.image_url}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          onError={e => { e.currentTarget.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;">🚛</div>'; }} />
                      </div>
                    : <div style={{ width: "100%", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🚛</div>
                  }
                  <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1, marginBottom: 2 }}>ÇEKİCİ</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{event.fleet_truck.brand} {event.fleet_truck.model}</div>
                  </div>
                </div>
              )}
              {event.fleet_trailer && (
                <div style={{ flex: 1, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                  {event.fleet_trailer.image_url
                    ? <div style={{ width: "100%", aspectRatio: "16/9", background: "#0d0d14", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <img src={event.fleet_trailer.image_url}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          onError={e => { e.currentTarget.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;">🚚</div>'; }} />
                      </div>
                    : <div style={{ width: "100%", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🚚</div>
                  }
                  <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1, marginBottom: 2 }}>DORSE</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{event.fleet_trailer.name || `${event.fleet_trailer.brand || ''} ${event.fleet_trailer.model || ''}`.trim()}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Açıklama */}
          {event.description && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.7, marginBottom: 16 }}>{event.description}</p>
          )}
        </div>

        {/* Alt butonlar */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", gap: 8, flexShrink: 0 }}>
          {event.truckers_url && (
            <button
              onClick={() => openUrl(event.truckers_url).catch(() => {})}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; }}
            >
              <ExternalLink size={12} /> TruckersMP
            </button>
          )}
          <div style={{ flex: 1 }} />
          {["attending", "maybe", "not_attending"].map(s => {
            const a = ATTEND_MAP[s];
            const isActive = attending === s;
            return (
              <button key={s}
                onClick={() => handleAttend(isActive ? "none" : s)}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s",
                  background: isActive ? `${a.color}20` : "rgba(255,255,255,.05)",
                  border: `1px solid ${isActive ? a.color + "60" : "rgba(255,255,255,.1)"}`,
                  color: isActive ? a.color : "rgba(255,255,255,.4)",
                  boxShadow: isActive ? `0 0 12px ${a.color}30` : "none",
                }}
              >
                {isActive && <Check size={11} />}
                {a.label}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function COneEventsScreen({ onBack, accent = "#f5a623" }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    eventsApi.list()
      .then(r => {
        const data = r.data.data || r.data || [];
        setEvents(data);
        // Aktif veya yaklaşan varsa o filtreyi aç, yoksa tümü
        const hasActive = data.some(e => e.status === "active");
        const hasUpcoming = data.some(e => e.status === "upcoming");
        if (hasActive) setFilter("active");
        else if (hasUpcoming) setFilter("upcoming");
        else setFilter("all");
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    if (filter === "all") return true;
    return e.status === filter;
  });

  const counts = {
    all: events.length,
    active: events.filter(e => e.status === "active").length,
    upcoming: events.filter(e => e.status === "upcoming").length,
    past: events.filter(e => e.status === "past").length,
  };

  const FILTERS = [
    { key: "all",      label: "TÜMÜ" },
    { key: "active",   label: "AKTİF" },
    { key: "upcoming", label: "YAKLAŞAN" },
    { key: "past",     label: "GEÇMİŞ" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", inset: 0, zIndex: 40, background: "#0a0a0f", display: "flex", flexDirection: "column", fontFamily: "var(--c1-font, 'LemonMilk', 'Segoe UI', sans-serif)", fontSize: `calc(14px * var(--c1-scale, 1))`, overflow: "hidden" }}
    >
      {/* Arka plan */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`, top: -200, right: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.12) 0%, transparent 70%)", bottom: -100, left: -100 }} />
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
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1 }}>ETKİNLİKLER</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{events.length} etkinlik</div>
      </div>

      {/* Filtreler */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 6, padding: "12px 28px", borderBottom: "1px solid rgba(255,255,255,.05)", flexShrink: 0 }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const st = STATUS_MAP[f.key];
          const col = st?.color || accent;
          return (
            <button key={f.key}
              onClick={() => { playSound("c-one_navigation.wav"); setFilter(f.key); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", transition: "all .2s",
                background: active ? `${col}20` : "rgba(255,255,255,.05)",
                color: active ? col : "rgba(255,255,255,.4)",
                fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                boxShadow: active ? `0 0 12px ${col}30` : "none",
              }}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span style={{ fontSize: 9, background: active ? `${col}30` : "rgba(255,255,255,.08)", color: active ? col : "rgba(255,255,255,.3)", padding: "1px 6px", borderRadius: 8, fontWeight: 800 }}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* İçerik */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", padding: "20px 28px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,.1)", borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Etkinlikler yükleniyor...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Calendar size={40} color="rgba(255,255,255,.1)" style={{ margin: "0 auto 16px" }} />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)" }}>Etkinlik bulunamadı</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 42vw), 1fr))", gap: 14 }}>
            {filtered.map(ev => {
              const st = STATUS_MAP[ev.status] || STATUS_MAP.past;
              const att = ATTEND_MAP[ev.my_status] || ATTEND_MAP.none;
              const isAttending = ev.my_status === "attending";
              return (
                <div key={ev.id}
                  onClick={() => { playSound("c-one_onay.wav"); setSelected(ev); }}
                  style={{ borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", cursor: "pointer", transition: "all .2s", display: "flex", flexDirection: "column" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = `${accent}30`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,.4)`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Görsel */}
                  <div style={{ position: "relative", height: 140, overflow: "hidden", flexShrink: 0 }}>
                    {ev.image_url
                      ? <img src={ev.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${accent}15, #0a0a0f)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Calendar size={32} color={`${accent}30`} />
                        </div>
                    }
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,18,.9) 0%, transparent 60%)" }} />
                    {/* Status badge */}
                    <div style={{ position: "absolute", top: 10, left: 10, fontSize: 8, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: st.bg, color: st.color, letterSpacing: 1 }}>{st.label}</div>
                    {/* Katılım badge */}
                    {isAttending && (
                      <div style={{ position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: "50%", background: "rgba(46,204,113,.2)", border: "1px solid rgba(46,204,113,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={11} color="#2ecc71" />
                      </div>
                    )}
                    {/* Tarih */}
                    {ev.event_date && (
                      <div style={{ position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={10} color="rgba(255,255,255,.5)" />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 600 }}>{formatDateShort(ev.event_date)}</span>
                      </div>
                    )}
                    {/* Katılımcı sayısı */}
                    {ev.attending_count > 0 && (
                      <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={10} color="rgba(255,255,255,.4)" />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{ev.attending_count}</span>
                      </div>
                    )}
                  </div>

                  {/* Bilgi */}
                  <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>{ev.title}</div>
                    {(ev.dr_origin || ev.dr_dest) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={10} color={accent} />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{ev.dr_origin} → {ev.dr_dest}</span>
                        {ev.dr_km && <span style={{ fontSize: 9, color: accent, marginLeft: "auto" }}>{ev.dr_km} km</span>}
                      </div>
                    )}
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {ev.game && <span style={{ fontSize: 9, color: "rgba(255,255,255,.25)", letterSpacing: 1 }}>{ev.game.toUpperCase()}</span>}
                      <span style={{ fontSize: 9, fontWeight: 700, color: att.color, marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                        {ev.my_status !== "none" && ev.my_status && <Check size={9} />}
                        {att.label}
                      </span>
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
          <EventDetail event={selected} accent={accent} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
