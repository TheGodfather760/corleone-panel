import { useState, useEffect, useCallback } from "react";
import { eventsApi } from "../lib/api";
import { X, Clock, Users } from "lucide-react";

const STATUS_LABEL  = { upcoming: "Yaklaşan", active: "Aktif", past: "Tamamlandı" };
const STATUS_COLOR  = { upcoming: "#f5a623", active: "#2ecc71", past: "#888" };
const STATUS_BG     = { upcoming: "rgba(245,166,35,.15)", active: "rgba(46,204,113,.15)", past: "rgba(255,255,255,.08)" };
const STATUS_BORDER = { upcoming: "rgba(245,166,35,.3)", active: "rgba(46,204,113,.3)", past: "rgba(255,255,255,.12)" };

const DIFF_COLOR = { easy: "#2ecc71", medium: "#f5a623", hard: "#e67e22", extreme: "#e74c3c" };
const DIFF_LABEL = { easy: "Kolay", medium: "Orta", hard: "Zor", extreme: "Extreme" };
const MAP_LABEL  = { vanilla: "Ana Harita", promods: "ProMods", dlc: "DLC" };

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
}

function Avatar({ user, size = 24 }) {
  if (user.avatar) return <img src={user.avatar} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(245,166,35,.2)", color: "#f5a623", fontSize: size * 0.4, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{user.username?.[0]?.toUpperCase()}</div>;
}

function EventModal({ ev, onClose, onAttend }) {
  const [attendees, setAttendees] = useState(null);
  const [myStatus, setMyStatus]   = useState(ev.my_status || null);
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

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#141210", border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, width: "100%", maxWidth: 1100, maxHeight: "96vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 40px 100px rgba(0,0,0,.8)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 14px", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {ev.title}
            <span style={{ background: STATUS_BG[ev.status], color: STATUS_COLOR[ev.status], border: `1px solid ${STATUS_BORDER[ev.status]}`, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
              {STATUS_LABEL[ev.status] || ev.status}
            </span>
            {ev.is_private == 1 && (
              <span style={{ background: "rgba(255,255,255,.08)", color: "#aaa", border: "1px solid rgba(255,255,255,.12)", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>🔒 Özel</span>
            )}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#aaa", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", flex: 1, minHeight: 0, overflow: "hidden", padding: "0 20px 16px", gap: 16 }}>

          {/* Sol — Görsel + Açıklama + İstatistikler */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
            {/* Harita görseli */}
            <div style={{ position: "relative", background: "#0d0b09", overflow: "hidden", borderRadius: 12, border: "1px solid rgba(255,255,255,.07)", flex: 1, minHeight: 200 }}>
              {(ev.dr_thumb_url || ev.image_url)
                ? <img src={ev.dr_thumb_url || ev.image_url} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: .12 }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span style={{ fontSize: 13 }}>Görsel yok</span>
                  </div>
              }
            </div>
            {/* Açıklama + istatistikler */}
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
              <div style={{ padding: "10px 14px", borderBottom: ev.dr_km ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f5a623", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>ETKİNLİK AÇIKLAMASI</div>
                <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>{ev.description || "Açıklama bulunmuyor."}</div>
              </div>
              {ev.dr_km && (() => {
                const km = parseInt(ev.dr_km) || 0;
                const totalMins = km * 0.045;
                const mins = Math.floor(totalMins), secs = Math.round((totalMins - mins) * 60);
                const timeStr = mins > 0 ? `${mins} dk. ${secs} sn.` : `${secs} sn.`;
                const fuelRanges = { easy:[300,350], medium:[300,350], hard:[350,420], extreme:[420,500] };
                const [fMin, fMax] = fuelRanges[ev.dr_diff] || [300,350];
                const fuelStr = `${Math.round(km/1000*fMin)} - ${Math.round(km/1000*fMax)} lt`;
                const weightStr = ev.dr_game === 'ats' ? '15 - 30 ton' : '10 - 25 ton';
                const BASE = 'https://corleoneteam.com.tr/panel/assets/images/';
                return (
                  <div style={{ display: "flex" }}>
                    {[
                      { icon: 'time.png',   label: 'TAHMİNİ SÜRE', val: timeStr },
                      { icon: 'fuel.png',   label: 'YAKIT',         val: fuelStr },
                      { icon: 'weight.png', label: 'YÜK',           val: weightStr },
                    ].map((s, i, arr) => (
                      <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                        <img src={BASE + s.icon} style={{ width: 22, height: 22, objectFit: "contain", opacity: .8, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: .4, marginBottom: 1 }}>{s.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{s.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Sağ — Bilgiler */}
          <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", gap: 8, minHeight: 0 }}>

            {/* Oyun kartı */}
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "10px 14px", flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
              <img src={ev.game?.toLowerCase().includes("ats") ? "https://corleoneteam.com.tr/panel/assets/images/ATS.gif" : "https://corleoneteam.com.tr/panel/assets/images/ETS2.gif"}
                style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f5a623", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>OYUN</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{ev.game?.toLowerCase().includes("ats") ? "ATS" : "ETS2"}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                  <img src="https://corleoneteam.com.tr/panel/assets/images/truckersmp-logo.png" style={{ height: 12, objectFit: "contain", opacity: .9 }} />
                  {ev.game?.toLowerCase().includes("promods") && (
                    <img src="https://corleoneteam.com.tr/panel/assets/images/Promods LogoType Golden.png" style={{ height: 11, objectFit: "contain", opacity: .9 }} />
                  )}
                </div>
              </div>
              {ev.truckers_url && (
                <a href={ev.truckers_url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: "rgba(245,166,35,.1)", border: "1px solid rgba(245,166,35,.3)", color: "#f5a623", textDecoration: "none", flexShrink: 0 }}>
                  TruckersMP
                </a>
              )}
            </div>

            {/* Info satırları */}
            {(() => {
              const BASE = 'https://corleoneteam.com.tr/panel/assets/images/';
              const rows = [
                { icon: 'time.png',        label: 'TARİH',    val: formatDate(ev.event_date) },
                ev.dr_id && { icon: 'route.png',       label: 'ROTA',     val: `${ev.dr_origin} → ${ev.dr_dest}` },
                ev.dr_km  && { icon: 'mesafe.png',     label: 'MESAFE',   val: `${Number(ev.dr_km).toLocaleString('tr-TR')} km` },
                ev.dr_diff && { icon: 'informaiton.png', label: 'ZORLUK', val: DIFF_LABEL[ev.dr_diff] || ev.dr_diff, color: DIFF_COLOR[ev.dr_diff] },
                ev.dr_map  && { icon: 'map.png',        label: 'HARİTA',  val: MAP_LABEL[ev.dr_map] || ev.dr_map },
                { icon: 'durum.png', label: 'DURUM', val: ev.is_private == 1 ? 'Özel Etkinlik' : 'Herkese Açık' },
              ].filter(Boolean);
              return (
                <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  {rows.map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                      <img src={BASE + row.icon} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0, opacity: .85 }} />
                      <div>
                        <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 1 }}>{row.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: row.color || '#fff' }}>{row.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Banner */}
            {ev.image_url && (
              <div style={{ borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,.08)" }}>
                <img src={ev.image_url} style={{ width: "100%", height: 60, objectFit: "cover", display: "block", opacity: .8 }} />
              </div>
            )}

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
                        style={{ flex: 1, padding: "9px 4px", border: "none", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.07)" : "none", background: isActive ? bg : "transparent", color: isActive ? color : "#666", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all .2s" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Katılımcılar */}
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "10px 14px", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={11} /> KATILIMCILAR
                {attendees && <span style={{ color: "#2ecc71", marginLeft: "auto" }}>{attending.length} kişi</span>}
              </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
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

  const filtered = events.filter(e => {
    if (filter === "all") return true;
    if (filter === "upcoming") return e.status === "upcoming" || e.status === "active";
    return e.status === "past";
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
        {[["all","Tümü"],["upcoming","Yaklaşan"],["past","Geçmiş"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ background: filter === val ? "#f5a623" : "rgba(255,255,255,.06)", border: `1px solid ${filter === val ? "#f5a623" : "rgba(255,255,255,.1)"}`, color: filter === val ? "#111" : "#888", padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, letterSpacing: .5, cursor: "pointer", transition: "all .2s" }}>
            {label}
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
