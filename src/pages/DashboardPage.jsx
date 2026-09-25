import { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useSettings } from "../lib/SettingsContext";
import { dashboardApi } from "../lib/api";
import { Calendar, Image, Star, Clock, ChevronRight, CheckCircle, Newspaper, Activity, X } from "lucide-react";

const DIFF_COLOR  = { easy: "#2ecc71", medium: "#f5a623", hard: "#e67e22", extreme: "#e74c3c" };
const DIFF_LABEL  = { easy: "Kolay", medium: "Orta", hard: "Zor", extreme: "Extreme" };
const STATUS_COLOR = { upcoming: "#f5a623", active: "#2ecc71", past: "#888" };
const STATUS_LABEL = { upcoming: "Yaklaşan", active: "Aktif", past: "Geçmiş" };
const BADGE_COLOR  = { orange: "#f5a623", green: "#2ecc71", teal: "#1abc9c", purple: "#9b59b6", red: "#e74c3c" };
const ACT_LABEL    = { attend_attending: { label: "Katılıyorum", color: "#2ecc71" }, attend_not_attending: { label: "Katılmıyorum", color: "#e74c3c" }, attend_pending: { label: "Belki", color: "#f5a623" } };

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value == null) return;
    const dur = 1200, start = performance.now();
    const ease = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      setDisplay(Math.round(ease(p) * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{display.toLocaleString("tr-TR")}</>;
}

function SectionCard({ title, icon: Icon, children, action, onAction, c }) {
  const tc = c || { muted: "#888" };
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: tc.muted, textTransform: "uppercase", letterSpacing: .8, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon size={13} />{title}
        </span>
        {action && <button onClick={onAction} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#f5a623", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{action}<ChevronRight size={13} /></button>}
      </div>
      {children}
    </div>
  );
}

function NewsModal({ news, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#141210", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, width: "100%", maxWidth: 560, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.8)" }}>
        {news.image_url && <img src={news.image_url} style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 4, height: 20, borderRadius: 4, background: BADGE_COLOR[news.badge_type] || "#f5a623", flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{news.title}</span>
            </div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>
          {news.body && <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{news.body}</p>}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage({ onNavigate }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const isLight = settings.theme === "light";
  const c = {
    text:    isLight ? "#1a1a1a" : "#fff",
    sub:     isLight ? "#444"    : "#ccc",
    muted:   isLight ? "#666"    : "#888",
    faint:   isLight ? "#888"    : "#555",
    cardBg:  isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,.04)",
    border:  isLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,.08)",
  };
  const [data, setData] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const countdown = useCountdown(data?.next_event?.event_date);

  useEffect(() => {
    dashboardApi.get()
      .then(r => { setData(r.data.data); })
      .catch(() => {});
  }, []);

  const rank     = data?.rank;
  const nextRank = data?.next_rank;
  const points   = data?.points ?? 0;
  const pct      = nextRank
    ? Math.min(100, Math.round((points - (rank?.min_points ?? 0)) / Math.max(1, nextRank.min_points - (rank?.min_points ?? 0)) * 100))
    : 100;
  const toNext = nextRank ? nextRank.min_points - points : 0;

  const today  = new Date();
  const months = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  const days   = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
  const dateStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}, ${days[today.getDay()]}`;

  return (
    <>
      {selectedNews && <NewsModal news={selectedNews} onClose={() => setSelectedNews(null)} />}
      {/* Üst bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: c.muted }}>
            <Calendar size={13} />{dateStr}
          </div>
          {data?.next_event && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: c.muted }}>
              <Clock size={13} />
              <span>Sonraki:</span>
              <span style={{ color: c.text, fontWeight: 600, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.next_event.title}</span>
              <span style={{ color: "#f5a623", fontWeight: 700 }}>{countdown}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {rank && (
            <div style={{ position: "relative", background: "var(--bg-card)", borderRadius: 8, padding: "10px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 8, border: "1px solid var(--border)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 8, border: `2px solid ${rank.color}`, pointerEvents: "none", clipPath: `inset(0 ${100 - pct}% 0 0 round 8px)`, transition: "clip-path 1s ease" }} />
              {nextRank && (
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translate(-50%,-50%)", background: "var(--bg-card)", border: `1px solid ${nextRank.color}`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, color: nextRank.color, whiteSpace: "nowrap", zIndex: 1 }}>
                  {nextRank.name} için {toNext.toLocaleString("tr-TR")} puan
                </div>
              )}
              <span style={{ color: rank.color, fontWeight: 700, position: "relative" }}>{rank.name}</span>
              <span style={{ color: c.faint, position: "relative" }}>·</span>
              <span style={{ color: "#f5a623", fontWeight: 700, position: "relative" }}><AnimatedNumber value={points} /></span>
              <span style={{ color: c.faint, position: "relative" }}>puan</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px" }}>
            <img src="https://corleoneteam.com.tr/assets/logo/logo.png" style={{ width: 22, height: 22, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#f5a623", letterSpacing: .3 }}>Corleone™ Logistic</div>
              <div style={{ fontSize: 10, color: "#f5a623", opacity: .8, fontWeight: 700 }}>{data?.year_no}. Yıl · {data?.week_no}. Hafta</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hoş geldin */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Hoş geldin, {user?.username} 👋</h1>
        <p className="page-subtitle">Corleone Panel</p>
      </div>

      {/* Stat kartları */}
      <div className="card-grid card-grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Star size={13} />PUAN</div>
          <div className="stat-value">{data ? <AnimatedNumber value={points} /> : "—"}</div>
          {rank && <div style={{ fontSize: 11, color: rank.color, fontWeight: 700, marginTop: 4 }}>{rank.name}</div>}
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={13} />KATILIM</div>
          <div className="stat-value">{data ? <AnimatedNumber value={data.att_count} /> : "—"}</div>
          <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>etkinlik</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Image size={13} />MEDYA</div>
          <div className="stat-value">{data ? <AnimatedNumber value={data.media_count} /> : "—"}</div>
          <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>yükleme</div>
        </div>
      </div>

      {/* 2 kolonlu ana içerik */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>

        {/* Sol kolon */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Yaklaşan etkinlikler */}
          {data?.upcoming?.length > 0 && (
            <SectionCard title="Yaklaşan Etkinlikler" icon={Calendar} action="Tümü" onAction={() => onNavigate("events")} c={c}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.upcoming.map(ev => {
                  const thumb = ev.dr_thumb_url || ev.image_url;
                  return (
                    <div key={ev.id} onClick={() => onNavigate("events")}
                      style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 12px", background: "var(--bg-elevated)", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer", transition: "border-color .2s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(245,166,35,.4)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                    >
                      <div style={{ width: 64, height: 40, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#1a1a1a" }}>
                        {thumb ? <img src={thumb} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                        <div style={{ fontSize: 11, color: c.muted, display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{formatDate(ev.event_date)}</span>
                          {ev.dr_origin && <span>{ev.dr_origin} → {ev.dr_dest}</span>}
                          {ev.dr_diff && <span style={{ color: DIFF_COLOR[ev.dr_diff] }}>{DIFF_LABEL[ev.dr_diff]}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(245,166,35,.12)", color: "#f5a623", border: "1px solid rgba(245,166,35,.3)", flexShrink: 0 }}>
                        {STATUS_LABEL[ev.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Haberler */}
          {data?.news?.length > 0 && (
            <SectionCard title="Duyurular" icon={Newspaper} c={c}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.news.map((n, i) => (
                  <div key={i} onClick={() => setSelectedNews(n)}
                    style={{ display: "flex", gap: 0, background: "var(--bg-elevated)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden", cursor: "pointer", transition: "border-color .2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(245,166,35,.4)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                    {n.image_url && (
                      <img src={n.image_url} style={{ width: 90, height: "auto", objectFit: "cover", flexShrink: 0 }} />
                    )}
                    <div style={{ display: "flex", gap: 10, padding: "10px 12px", alignItems: "flex-start" }}>
                      <div style={{ width: 4, borderRadius: 4, background: BADGE_COLOR[n.badge_type] || "#f5a623", flexShrink: 0, alignSelf: "stretch" }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 3 }}>{n.title}</div>
                        {n.body && <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.5 }}>{n.body}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Sağ kolon */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Bekleyen görevler */}
          {data?.pending_tasks?.length > 0 && (
            <SectionCard title="Görevler" icon={CheckCircle} c={c}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.pending_tasks.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(245,166,35,.1)", border: "1px solid rgba(245,166,35,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Star size={13} color="#f5a623" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title || t.key_name}</div>
                      <div style={{ fontSize: 11, color: "#f5a623", fontWeight: 700 }}>+{t.points} puan</div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Son aktiviteler */}
          {data?.activities?.length > 0 && (
            <SectionCard title="Son Aktiviteler" icon={Activity} c={c}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.activities.map((a, i) => {
                  const act = ACT_LABEL[a.type] || { label: "Güncellendi", color: "#888" };
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: act.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: act.color, fontWeight: 700 }}>{act.label}</span>
                        <span style={{ fontSize: 11, color: "#888" }}> — </span>
                        <span style={{ fontSize: 11, color: c.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.label}</span>
                      </div>
                      <span style={{ fontSize: 10, color: c.faint, flexShrink: 0 }}>{formatRelative(a.ts)}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Profil tamamlama */}
          <SectionCard title="Hızlı Erişim" icon={Star} c={c}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Etkinliklere Katıl", page: "events",    icon: Calendar },
                { label: "Medya Yükle",        page: "media",     icon: Image },
                { label: "Profili Düzenle",    page: "profile",   icon: Star },
                { label: "İndirmeler",         page: "downloads", icon: ChevronRight },
              ].map(({ label, page, icon: Icon }) => (
                <button key={page} onClick={() => onNavigate(page)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", transition: "border-color .2s", width: "100%", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(245,166,35,.4)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <Icon size={14} color="#f5a623" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.sub }}>{label}</span>
                  <ChevronRight size={12} color={c.faint} style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
