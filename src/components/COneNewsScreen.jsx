import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Star, Activity, Newspaper, Clock, ChevronRight, X, MapPin } from "lucide-react";
import { dashboardApi, eventsApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

function playSound(name) {
  try { const a = new Audio(`/sounds/${name}`); a.volume = 0.5; a.play().catch(() => {}); } catch {}
}

function formatRelative(str) {
  if (!str) return "";
  const diff = Date.now() - new Date(str).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}s önce`;
  return `${Math.floor(h / 24)}g önce`;
}

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
}

function useCountdown(targetDate) {
  const [str, setStr] = useState("");
  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setStr("Başladı!"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setStr(d > 0 ? `${d}g ${h}s` : h > 0 ? `${h}s ${m}dk` : `${m}dk ${s}sn`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return str;
}

const ACT_MAP = {
  attend_attending:     { label: "Katılıyorum",     color: "#2ecc71", icon: "✓" },
  attend_not_attending: { label: "Katılmıyorum",    color: "#e74c3c", icon: "✗" },
  attend_pending:       { label: "Belki",           color: "#f5a623", icon: "?" },
};

const BADGE_COLOR = {
  orange: "#f5a623", green: "#2ecc71", teal: "#1abc9c", purple: "#9b59b6", red: "#e74c3c",
};

function NewsModal({ item, onClose, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "absolute", inset: 0, zIndex: 20, background: "rgba(0,0,0,.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "min(560px, 92vw)", background: "rgba(10,10,18,.98)", border: `1px solid ${accent}30`, borderRadius: 16, overflow: "hidden", boxShadow: `0 0 80px ${accent}20` }}
      >
        {item.image_url && (
          <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
            <img src={item.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,18,1) 0%, transparent 60%)" }} />
          </div>
        )}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 4, height: 20, borderRadius: 4, background: BADGE_COLOR[item.badge_type] || accent, flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{item.title}</span>
            </div>
            <button onClick={onClose}
              style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(231,76,60,.2)"; e.currentTarget.style.color = "#e74c3c"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "#aaa"; }}
            ><X size={13} /></button>
          </div>
          {item.body && <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{item.body}</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function COneNewsScreen({ onBack, accent = "#f5a623" }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [attendingMap, setAttendingMap] = useState({});
  const countdown = useCountdown(data?.next_event?.event_date);

  useEffect(() => {
    dashboardApi.get()
      .then(r => {
        const d = r.data.data;
        setData(d);
        const map = {};
        (d?.upcoming || []).forEach(ev => { map[ev.id] = ev.my_status; });
        setAttendingMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAttend = async (eventId, status) => {
    playSound("c-one_onay.wav");
    setAttendingMap(prev => ({ ...prev, [eventId]: status }));
    try { await eventsApi.attend(eventId, status); } catch {}
  };

  const rank = data?.rank;
  const points = data?.points ?? 0;
  const nextRank = data?.next_rank;
  const toNext = nextRank ? nextRank.min_points - points : 0;
  const pct = nextRank
    ? Math.min(100, Math.round((points - (rank?.min_points ?? 0)) / Math.max(1, nextRank.min_points - (rank?.min_points ?? 0)) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", inset: 0, zIndex: 40, background: "#0a0a0f", display: "flex", flexDirection: "column", fontFamily: "var(--c1-font, 'LemonMilk', 'Segoe UI', sans-serif)", fontSize: `calc(14px * var(--c1-scale, 1))`, overflow: "hidden" }}
    >
      {/* Arka plan */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`, top: -200, right: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.1) 0%, transparent 70%)", bottom: -100, left: -100 }} />
      </div>

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
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1 }}>YENİLİKLER</div>
        </div>

        {/* Sonraki etkinlik geri sayım */}
        {data?.next_event && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: `${accent}10`, border: `1px solid ${accent}25`, borderRadius: 8 }}>
            <Clock size={12} color={accent} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>Sonraki:</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.next_event.title}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: accent }}>{countdown}</span>
          </div>
        )}
      </div>

      {/* İçerik */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,.1)", borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Yükleniyor...</span>
          </div>
        ) : (
          <>
            {/* ── KİŞİSEL ÖZET ── */}
            {rank && (
              <div style={{ display: "flex", gap: 12 }}>
                {/* Rank kartı */}
                <div style={{ flex: 1, padding: "14px 16px", background: "rgba(255,255,255,.03)", border: `1px solid ${rank.color}25`, borderRadius: 12, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", bottom: 0, left: 0, height: 3, width: `${pct}%`, background: rank.color, borderRadius: "0 2px 0 0", transition: "width 1s ease" }} />
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, marginBottom: 6 }}>RÜTBE</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: rank.color, marginBottom: 2 }}>{rank.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>
                    <span style={{ color: accent, fontWeight: 700 }}>{points.toLocaleString("tr-TR")}</span> puan
                    {nextRank && <span style={{ marginLeft: 6 }}>· {toNext.toLocaleString("tr-TR")} kaldı</span>}
                  </div>
                </div>
                {/* Hafta/Yıl */}
                <div style={{ padding: "14px 16px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5 }}>CORLEONE</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{data?.year_no}. Yıl</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{data?.week_no}. Hafta</div>
                </div>
                {/* Katılım */}
                <div style={{ padding: "14px 16px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, minWidth: 100 }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5 }}>KATILIM</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#2ecc71" }}>{data?.att_count ?? 0}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>etkinlik</div>
                </div>
              </div>
            )}

            {/* ── AKTİVİTE AKIŞI ── */}
            {data?.activities?.length > 0 && (
              <Section title="Son Aktiviteler" icon={Activity} accent={accent}>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {data.activities.map((a, i) => {
                    const act = ACT_MAP[a.type] || { label: "Güncellendi", color: "rgba(255,255,255,.4)", icon: "·" };
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: i % 2 === 0 ? "rgba(255,255,255,.02)" : "transparent", borderRadius: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${act.color}15`, border: `1px solid ${act.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, color: act.color, fontWeight: 800 }}>
                          {act.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: act.color, fontWeight: 700 }}>{act.label}</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}> — </span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.label}</span>
                        </div>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)", flexShrink: 0 }}>{formatRelative(a.ts)}</span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── DUYURULAR ── */}
            {data?.news?.length > 0 && (
              <Section title="Duyurular" icon={Newspaper} accent={accent}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.news.map((n, i) => {
                    const col = BADGE_COLOR[n.badge_type] || accent;
                    return (
                      <div key={i}
                        onClick={() => { playSound("c-one_onay.wav"); setSelectedNews(n); }}
                        style={{ display: "flex", gap: 0, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "all .2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = `${col}30`; e.currentTarget.style.transform = "translateX(3px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.transform = "translateX(0)"; }}
                      >
                        {/* Sol renk şeridi */}
                        <div style={{ width: 4, background: col, flexShrink: 0 }} />
                        {n.image_url && (
                          <img src={n.image_url} style={{ width: 80, height: "auto", objectFit: "cover", flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, padding: "12px 14px", minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{n.title}</div>
                          {n.body && <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{n.body}</div>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", padding: "0 14px", flexShrink: 0 }}>
                          <ChevronRight size={14} color="rgba(255,255,255,.2)" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── YAKLAŞAN ETKİNLİKLER ── */}
            {data?.upcoming?.length > 0 && (
              <Section title="Yaklaşan Etkinlikler" icon={Calendar} accent={accent}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.upcoming.map(ev => {
                    const myStatus = attendingMap[ev.id] || ev.my_status;
                    const thumb = ev.dr_thumb_url || ev.image_url;
                    return (
                      <div key={ev.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, transition: "all .2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = `${accent}25`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; }}
                      >
                        {/* Thumb */}
                        <div style={{ width: 60, height: 38, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#111" }}>
                          {thumb ? <img src={thumb} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                        </div>
                        {/* Bilgi */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{ev.title}</div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {ev.event_date && (
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)", display: "flex", alignItems: "center", gap: 3 }}>
                                <Clock size={9} />{formatDate(ev.event_date)}
                              </span>
                            )}
                            {ev.dr_origin && (
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)", display: "flex", alignItems: "center", gap: 3 }}>
                                <MapPin size={9} />{ev.dr_origin} → {ev.dr_dest}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Katılım butonları */}
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {[
                            { st: "attending",     color: "#2ecc71", label: "✓" },
                            { st: "not_attending", color: "#e74c3c", label: "✗" },
                            { st: "pending",       color: "#f5a623", label: "?" },
                          ].map(({ st, color, label }) => {
                            const isActive = myStatus === st;
                            return (
                              <button key={st}
                                onClick={() => handleAttend(ev.id, isActive ? "none" : st)}
                                style={{
                                  width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer", transition: "all .15s",
                                  background: isActive ? `${color}25` : "rgba(255,255,255,.06)",
                                  color: isActive ? color : "rgba(255,255,255,.3)",
                                  fontSize: 12, fontWeight: 800,
                                  boxShadow: isActive ? `0 0 8px ${color}40` : "none",
                                }}
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = `${color}15`; e.currentTarget.style.color = color; } }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(255,255,255,.3)"; } }}
                              >{label}</button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Boş durum */}
            {!data?.activities?.length && !data?.news?.length && !data?.upcoming?.length && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Newspaper size={40} color="rgba(255,255,255,.1)" style={{ margin: "0 auto 16px" }} />
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)" }}>Henüz içerik yok</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Duyuru detay modal */}
      <AnimatePresence>
        {selectedNews && (
          <NewsModal item={selectedNews} accent={accent} onClose={() => setSelectedNews(null)} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

function Section({ title, icon: Icon, accent, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: accent }} />
        <Icon size={13} color={accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.5)", letterSpacing: 1.5 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
