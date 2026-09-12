import { useState, useEffect, useCallback } from "react";
import { eventsApi } from "../lib/api";
import { X, Clock, Users, ChevronDown } from "lucide-react";

const STATUS_LABEL  = { upcoming: "Yaklaşan", active: "Aktif", past: "Tamamlandı" };
const STATUS_COLOR  = { upcoming: "#f5a623", active: "#2ecc71", past: "#888" };
const STATUS_BG     = { upcoming: "rgba(245,166,35,.15)", active: "rgba(46,204,113,.15)", past: "rgba(255,255,255,.08)" };
const STATUS_BORDER = { upcoming: "rgba(245,166,35,.3)", active: "rgba(46,204,113,.3)", past: "rgba(255,255,255,.12)" };

const BASE = "/images/";

function formatDateParts(str) {
  if (!str) return ["—", ""];
  const d = new Date(str);
  const date = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return [date, time];
}

function formatDate(str) {
  if (!str) return "—";
  const [date, time] = formatDateParts(str);
  return `${date} ${time}`;
}

function Avatar({ user, size = 24 }) {
  if (user.avatar) return <img src={user.avatar} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(245,166,35,.2)", color: "#f5a623", fontSize: size * 0.4, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{user.username?.[0]?.toUpperCase()}</div>;
}

function EventModal({ ev, onClose, onAttend }) {
  const [attendees, setAttendees] = useState(null);
  const [myStatus, setMyStatus]   = useState(ev.my_status || null);
  const [attOpen, setAttOpen]     = useState(false);
  const isPast = ev.status === "past";

  useEffect(() => {
    eventsApi.attendees(ev.id).then(r => setAttendees(r.data)).catch(() => {});
  }, [ev.id]);

  const handleAttend = async (status) => {
    setMyStatus(status);
    await onAttend(ev.id, status);
    eventsApi.attendees(ev.id).then(r => setAttendees(r.data)).catch(() => {});
  };

  const attending = attendees?.attending || [];

  const gameKey   = ev.dr_game || ev.game || "ets2";
  const gameLabel = gameKey === "ats" ? "ATS" : "ETS2";
  const gameGif   = gameKey === "ats" ? BASE + "ATS.gif" : BASE + "ETS2.gif";
  const isAts     = gameKey === "ats";

  const km = parseInt(ev.dr_km) || 0;
  const hasStats = !!ev.dr_km;
  let timeStr = "—", fuelStr = "—";
  if (km > 0) {
    const tm = km * 0.045, mins = Math.floor(tm), secs = Math.round((tm - mins) * 60);
    timeStr = mins > 0 ? `${mins} dk. ${secs} sn.` : `${secs} sn.`;
    const fr = { easy:[300,350], medium:[300,350], hard:[350,420], extreme:[420,500] };
    const [fMin, fMax] = fr[ev.dr_diff] || [300,350];
    fuelStr = `${Math.round(km/1000*fMin)} - ${Math.round(km/1000*fMax)} lt`;
  }
  const weightStr = isAts ? "15 - 30 ton" : "10 - 25 ton";

  const [evDate, evTime] = formatDateParts(ev.event_date);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box" }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", background: "#141210", border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, width: "100%", maxWidth: 1200, maxHeight: "96vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 40px 100px rgba(0,0,0,.8)" }}>

        {/* Close */}
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, zIndex: 10, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={14} />
        </button>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", flex: 1, minHeight: 0, overflow: "hidden", padding: "20px 20px 16px", gap: 16 }}>

          {/* Sol — Görsel + Overlayler */}
          <div style={{ position: "relative", background: "#0d0b09", overflow: "hidden", borderRadius: 12, border: "1px solid rgba(255,255,255,.07)" }}>
            {(ev.dr_thumb_url || ev.image_url)
              ? <img src={ev.dr_thumb_url || ev.image_url} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", display: "block" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: .12, minHeight: 320 }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span style={{ fontSize: 13 }}>Görsel yok</span>
                </div>
            }
            {/* Gradient overlayler */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom,rgba(0,0,0,.65),transparent)", pointerEvents: "none", zIndex: 1 }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to top,rgba(0,0,0,.88),transparent)", pointerEvents: "none", zIndex: 1 }} />

            {/* Üst overlay: başlık | km | logolar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "14px 16px", pointerEvents: "none", zIndex: 2, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.3, textShadow: "0 1px 8px rgba(0,0,0,.9),0 2px 16px rgba(0,0,0,.7)" }}>{ev.title}</div>
              {ev.dr_km
                ? <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                    <img src={BASE + "mesafe.png"} style={{ width: 32, height: 32, objectFit: "contain", opacity: .8, filter: "drop-shadow(0 1px 3px rgba(0,0,0,.9))" }} />
                    <span style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,.85)", textShadow: "0 1px 6px rgba(0,0,0,.9)", whiteSpace: "nowrap" }}>{Number(ev.dr_km).toLocaleString("tr-TR")} km</span>
                  </div>
                : <div />
              }
              <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
                {ev.has_truckersmp && <img src={BASE + "truckersmp-logo.png"} style={{ height: 30, objectFit: "contain", opacity: .9, filter: "drop-shadow(0 1px 4px rgba(0,0,0,.9))" }} />}
                {ev.has_promods    && <img src={BASE + "Promods LogoType Golden.png"} style={{ height: 26, objectFit: "contain", opacity: .9, filter: "drop-shadow(0 1px 4px rgba(0,0,0,.9))" }} />}
              </div>
            </div>

            {/* Alt overlay: açıklama + istatistikler */}
            <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "stretch", background: "rgba(15,13,11,.85)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, overflow: "hidden", backdropFilter: "blur(8px)" }}>
                <div style={{ flex: 1, minWidth: 0, padding: "10px 14px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(245,166,35,.8)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>ETKİNLİK AÇIKLAMASI</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ev.description || "Açıklama bulunmuyor."}</div>
                </div>
                {hasStats && [
                  { icon: "time.png",   label: "Süre",  val: timeStr },
                  { icon: "fuel.png",   label: "Yakıt", val: fuelStr },
                  { icon: "weight.png", label: "Yük",   val: weightStr },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderLeft: "1px solid rgba(255,255,255,.08)", flexShrink: 0 }}>
                    <img src={BASE + s.icon} style={{ width: 20, height: 20, objectFit: "contain", opacity: .75 }} />
                    <div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: .4 }}>{s.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{s.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ — Bilgiler */}
          <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", gap: 8, minHeight: 0 }}>

            {/* Banner */}
            {ev.image_url && (
              <div style={{ borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,.07)" }}>
                <img src={ev.image_url} style={{ width: "100%", height: "auto", display: "block", opacity: .9 }} />
              </div>
            )}

            {/* Oyun kartı */}
            <div style={{ position: "relative", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "18px 16px", flexShrink: 0, display: "flex", alignItems: "center", gap: 16 }}>
              <img src={gameGif} style={{ width: 80, height: 80, objectFit: "contain", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f5a623", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>OYUN</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{gameLabel}</div>
              </div>
              <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ background: STATUS_BG[ev.status], color: STATUS_COLOR[ev.status], border: `1px solid ${STATUS_BORDER[ev.status]}`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                  {STATUS_LABEL[ev.status] || ev.status}
                </span>
                {ev.is_private == 1 && (
                  <span style={{ background: "rgba(255,255,255,.08)", color: "#aaa", border: "1px solid rgba(255,255,255,.12)", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>🔒 Özel</span>
                )}
              </div>
            </div>

            {/* Tarih + Rota */}
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderBottom: (ev.dr_id || ev.route) ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                <img src={BASE + "time.png"} style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0, opacity: .85 }} />
                <div>
                  <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: .5, marginBottom: 2 }}>TARİH</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{evDate}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginTop: 2 }}>{evTime}</div>
                </div>
              </div>
              {(ev.dr_id || ev.route) && (
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px" }}>
                  <img src={BASE + "route.png"} style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0, opacity: .85 }} />
                  <div>
                    <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: .5, marginBottom: 2 }}>ROTA</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{ev.dr_id ? `${ev.dr_origin} → ${ev.dr_dest}` : ev.route}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Katılım butonları */}
            {!isPast && (
              <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                <div style={{ display: "flex" }}>
                  {[
                    { st: "attending",     color: "#2ecc71", bg: "rgba(39,174,96,.12)",  label: "✓ Katılıyorum" },
                    { st: "not_attending", color: "#e74c3c", bg: "rgba(231,76,60,.12)",  label: "✗ Katılmıyorum" },
                    { st: "pending",       color: "#f5a623", bg: "rgba(245,166,35,.12)", label: "? Bilmiyorum" },
                  ].map(({ st, color, bg, label }, i, arr) => {
                    const isActive = myStatus === st;
                    return (
                      <button key={st} onClick={() => handleAttend(st)}
                        style={{ flex: 1, padding: "11px 8px", border: "none", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.07)" : "none", background: isActive ? bg : "transparent", color: isActive ? color : "#888", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .2s" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TruckersMP butonu */}
            {ev.truckers_url && (
              <a href={ev.truckers_url} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 18px", borderRadius: 9, background: "rgba(255,255,255,.04)", border: "1px solid rgba(245,166,35,.4)", color: "#f5a623", fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
                TruckersMP
              </a>
            )}

            {/* Araç & Dorse */}
            {(ev.fleet_truck || ev.fleet_trailer) && (
              <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: .5, padding: "10px 14px 6px" }}>ETKİNLİK ARACI</div>
                <div style={{ display: "flex", gap: 8, padding: "0 12px 12px" }}>
                  {[ev.fleet_truck && { item: ev.fleet_truck, icon: "🚛" }, ev.fleet_trailer && { item: ev.fleet_trailer, icon: "🚚" }].filter(Boolean).map(({ item, icon }, i) => (
                    <div key={i} style={{ flex: 1, minWidth: 0, borderRadius: 8, border: "1px solid rgba(255,255,255,.08)", overflow: "hidden", background: "rgba(255,255,255,.03)" }}>
                      {item.image
                        ? <img src={`https://corleoneteam.com.tr/${item.image}`} style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }} />
                        : <div style={{ width: "100%", height: 70, background: "rgba(255,255,255,.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{icon}</div>
                      }
                      <div style={{ padding: "6px 8px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: .5, marginBottom: 2 }}>#{item.sort_order}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(item.brand ? item.brand + " " : "") + item.model}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Katılımcılar collapsible */}
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
              <button onClick={() => setAttOpen(v => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: "none", border: "none", color: "#aaa", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Users size={11} /> Katılımcılar
                  {attendees && <span style={{ color: "#2ecc71", fontWeight: 600 }}>({attending.length})</span>}
                </span>
                <ChevronDown size={14} style={{ transition: "transform .2s", transform: attOpen ? "rotate(180deg)" : "" }} />
              </button>
              {attOpen && (
                <div style={{ padding: "0 14px 12px" }}>
                  {attendees === null ? (
                    <span style={{ fontSize: 11, color: "#555" }}>Yükleniyor...</span>
                  ) : attending.length === 0 ? (
                    <span style={{ fontSize: 11, color: "#555" }}>Henüz kimse katılmıyor.</span>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {attending.map(m => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(39,174,96,.08)", border: "1px solid rgba(39,174,96,.2)", borderRadius: 20, padding: "2px 8px 2px 3px" }}>
                          <Avatar user={m} size={18} />
                          <span style={{ fontSize: 11, color: "#2ecc71" }}>{m.confirmed && "★ "}{m.username}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, background: "#0f0d0b" }} />
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("upcoming");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    eventsApi.list()
      .then(r => setEvents(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const handleAttend = useCallback(async (eventId, status) => {
    try {
      await eventsApi.attend(eventId, status);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, my_status: status } : e));
    } catch {}
  }, []);

  const filtered = events
    .filter(e => {
      if (filter === "all") return true;
      if (filter === "upcoming") return e.status === "upcoming" || e.status === "active";
      return e.status === "past";
    })
    .sort((a, b) => {
      const order = { active: 0, upcoming: 1, past: 2 };
      const diff = (order[a.status] ?? 1) - (order[b.status] ?? 1);
      if (diff !== 0) return diff;
      return a.status === "past"
        ? new Date(b.event_date) - new Date(a.event_date)
        : new Date(a.event_date) - new Date(b.event_date);
    });

  if (loading) return <div className="empty-state"><Clock size={32} /><p>Yükleniyor...</p></div>;

  return (
    <>
      {selected && <EventModal ev={selected} onClose={() => setSelected(null)} onAttend={handleAttend} />}

      <div className="page-header">
        <h1 className="page-title">Etkinlikler</h1>
        <p className="page-subtitle">Corleone™ tarafından düzenlenen konvoy ve özel etkinlikler</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[["upcoming","Yaklaşan"],["past","Geçmiş"],["all","Tümü"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ background: filter === val ? "#f5a623" : "rgba(255,255,255,.06)", border: `1px solid ${filter === val ? "#f5a623" : "rgba(255,255,255,.1)"}`, color: filter === val ? "#111" : "#888", padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, letterSpacing: .5, cursor: "pointer", transition: "all .2s" }}>
            {label}
            {val !== "all" && (
              <span style={{ marginLeft: 6, background: filter === val ? "rgba(0,0,0,.15)" : "rgba(255,255,255,.08)", borderRadius: 20, padding: "1px 7px", fontSize: 10 }}>
                {events.filter(e => val === "upcoming" ? (e.status === "upcoming" || e.status === "active") : e.status === val).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", padding: "60px 0" }}>Etkinlik bulunamadı.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(ev => {
            const isPast = ev.status === "past";
            const att = ev.my_status;
            return (
              <div key={ev.id}
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "border-color .2s, transform .2s", opacity: isPast ? .6 : 1 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,166,35,.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = ""; }}
                onClick={() => setSelected(ev)}
              >
                {/* Thumbnail */}
                <div style={{ position: "relative", aspectRatio: "16/5", overflow: "hidden", background: "var(--bg)" }}>
                  {ev.image_url
                    ? <img src={ev.image_url} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 12 }}>Görsel yok</div>
                  }
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, transparent 55%)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", bottom: 8, left: 10, display: "flex", gap: 5 }}>
                    <span style={{ background: STATUS_BG[ev.status], color: STATUS_COLOR[ev.status], border: `1px solid ${STATUS_BORDER[ev.status]}`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                      {STATUS_LABEL[ev.status]}
                    </span>
                    {ev.is_private == 1 && <span style={{ background: "rgba(255,255,255,.08)", color: "#aaa", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>🔒</span>}
                  </div>
                  <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.55)", borderRadius: 7, padding: "4px 9px", fontSize: 11, color: "#fff" }}>
                    👁 Detay
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
                    {formatDate(ev.event_date)}{ev.route ? ` · ${ev.route}` : ""}
                  </div>

                  {/* Katılım butonları */}
                  {!isPast && (
                    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
                      {[
                        { st: "attending",     color: "#27ae60", bg: "#27ae60", label: "✓ Katılıyorum" },
                        { st: "not_attending", color: "#c0392b", bg: "#c0392b", label: "✗ Katılmıyorum" },
                        { st: "pending",       color: "#f5a623", bg: "rgba(245,166,35,.2)", label: "? Bilmiyorum" },
                      ].map(({ st, color, bg, label }, i, arr) => {
                        const isActive = att === st;
                        return (
                          <button key={st} onClick={() => handleAttend(ev.id, st)}
                            style={{ flex: 1, padding: "7px 4px", border: "none", borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none", background: isActive ? (st === "pending" ? bg : color) : "var(--bg)", color: isActive ? (st === "pending" ? "#f5a623" : "#fff") : "#888", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
