import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { eventsApi, downloadsApi, steamApi, eventMediaApi } from "../lib/api";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ChevronLeft, Play, Clock, Trophy, Package, Info, Activity, Image, Newspaper } from "lucide-react";

const DETAIL_TABS = ["AKTİVİTE", "BİLGİLERİNİZ", "OYUN BİLGİLERİ"];

// Bölüm sabitleri — navigasyon için
const SECTION_TABS = "tabs";
const SECTION_SHOTS = "shots";
const SECTION_NEWS = "news";

function extractNewsImage(item, appId) {
  const c = item.contents || "";
  const clanMatch = c.match(/\{STEAM_CLAN_IMAGE\}\/([^\s"'<\]]+)/i);
  if (clanMatch) return `https://clan.akamai.steamstatic.com/images/${clanMatch[1]}`;
  const clanUrl = c.match(/https:\/\/clan\.akamai\.steamstatic\.com\/images\/[^\s"'<\]]+/i);
  if (clanUrl) return clanUrl[0];
  const imgs = [...c.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  for (const m of imgs) { if (!m[1].match(/avatar|logo|icon|badge/i)) return m[1]; }
  if (appId) return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
  return null;
}

function SectionTitle({ icon: Icon, title, accent, focused }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 10,
      borderBottom: `1px solid ${focused ? accent : accent + "25"}`,
      transition: "border-color .2s",
    }}>
      <Icon size={14} color={accent} />
      <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 1.5, textTransform: "uppercase" }}>{title}</span>
      {focused && <span style={{ marginLeft: 6, fontSize: 9, color: accent, opacity: 0.7, letterSpacing: 1 }}>← →</span>}
    </div>
  );
}

function TabActivity({ game, section, focusedIdx, shotsCount, newsCount }) {
  const [screenshots, setScreenshots] = useState([]);
  const [news, setNews] = useState([]);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (game.screenshotDir) {
      invoke("get_game_screenshots", { gameDir: game.screenshotDir })
        .then(r => setScreenshots((r.files || []).slice(0, 8)))
        .catch(() => {});
    }
    if (game.steamAppId) {
      tauriFetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${game.steamAppId}&count=4&maxlength=0&format=json`, { method: "GET", headers: { Accept: "application/json" } })
        .then(r => r.json())
        .then(d => setNews(d?.appnews?.newsitems || []))
        .catch(() => {});
    }
  }, [game.id]);

  // ESC ile preview kapat
  useEffect(() => {
    if (!preview) return;
    const h = (e) => { if (e.key === "Escape") setPreview(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [preview]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Ekran görüntüleri */}
      <div>
        <SectionTitle icon={Image} title="Son Ekran Görüntüleri" accent={game.accent} focused={section === SECTION_SHOTS} />
        {screenshots.length === 0 ? (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", padding: "16px 0" }}>Ekran görüntüsü bulunamadı.</div>
        ) : (
          <>
            <AnimatePresence>
              {preview && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setPreview(null)}
                  style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
                  <motion.img src={preview} initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 10, boxShadow: "0 0 80px rgba(0,0,0,.9)" }} />
                </motion.div>
              )}
            </AnimatePresence>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {screenshots.map((f, i) => {
                const focused = section === SECTION_SHOTS && focusedIdx === i;
                return (
                  <div key={f.path}
                    onClick={() => setPreview(convertFileSrc(f.path))}
                    onMouseEnter={() => {}}
                    style={{
                      aspectRatio: "16/9", borderRadius: 8, overflow: "hidden", cursor: "zoom-in",
                      border: `${focused ? 3 : 1}px solid ${focused ? game.accent : "rgba(255,255,255,.08)"}`,
                      transition: "all .2s",
                      boxShadow: focused ? `0 0 24px ${game.accent}70, 0 0 8px ${game.accent}40` : "none",
                      transform: focused ? "scale(1.06)" : "scale(1)",
                      zIndex: focused ? 2 : 1, position: "relative",
                    }}>
                    <img src={convertFileSrc(f.path)} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Haberler */}
      <div>
        <SectionTitle icon={Newspaper} title="Haberler" accent={game.accent} focused={section === SECTION_NEWS} />
        {news.length === 0 ? (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", padding: "16px 0" }}>Haber bulunamadı.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {news.map((n, i) => {
              const img = extractNewsImage(n, game.steamAppId);
              const focused = section === SECTION_NEWS && focusedIdx === i;
              return (
                <div key={n.gid} onClick={() => openUrl(n.url).catch(() => {})}
                  style={{
                    display: "flex", gap: 12, padding: "12px", borderRadius: 10,
                    background: focused ? `${game.accent}18` : "rgba(255,255,255,.04)",
                    border: `${focused ? 2 : 1}px solid ${focused ? game.accent : "rgba(255,255,255,.07)"}`,
                    cursor: "pointer", transition: "all .2s",
                    boxShadow: focused ? `0 0 22px ${game.accent}55, 0 0 6px ${game.accent}30` : "none",
                    transform: focused ? "translateY(-3px) scale(1.01)" : "translateY(0) scale(1)",
                  }}>
                  {img && <img src={img} style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} onError={e => e.currentTarget.style.display = "none"} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: focused ? "#fff" : "rgba(255,255,255,.85)", marginBottom: 4, lineHeight: 1.4 }}>{n.title}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>{n.feedlabel} · {new Date(n.date * 1000).toLocaleDateString("tr-TR")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TabMyInfo({ game }) {
  const [events, setEvents] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [achievements, setAchievements] = useState(null);
  const [achLoading, setAchLoading] = useState(false);
  const [achError, setAchError] = useState(null);
  const [dlcs, setDlcs] = useState([]);
  const [dlcLoading, setDlcLoading] = useState(false);

  useEffect(() => {
    eventsApi.list().then(r => {
      const all = r.data.data || r.data || [];
      setEvents(all.filter(e =>
        e.title?.toLowerCase().includes(game.id === "ets2" ? "ets" : game.id === "ats" ? "ats" : game.id) ||
        e.game?.toLowerCase().includes(game.id)
      ).slice(0, 6));
    }).catch(() => {});

    downloadsApi.list().then(r => {
      const all = r.data.data || [];
      setDownloads(all.filter(d =>
        d.category === `${game.id}_profile` ||
        d.title?.toLowerCase().includes(game.id === "ets2" ? "ets" : game.id === "ats" ? "ats" : game.id)
      ).slice(0, 4));
    }).catch(() => {});

    if (game.steamAppId) {
      setAchLoading(true);
      steamApi.getAchievements(game.steamAppId)
        .then(r => {
          if (r.data.success) setAchievements(r.data);
          else setAchError(r.data.message);
        })
        .catch(() => setAchError('Bağlantı hatası.'))
        .finally(() => setAchLoading(false));

      // DLC listesini appdetails'dan çek
      setDlcLoading(true);
      tauriFetch(`https://store.steampowered.com/api/appdetails?appids=${game.steamAppId}&filters=dlc&l=turkish`, { method: "GET", headers: { Accept: "application/json" } })
        .then(r => r.json())
        .then(async d => {
          const dlcIds = d?.[game.steamAppId]?.data?.dlc || [];
          if (!dlcIds.length) { setDlcLoading(false); return; }
          // İlk 10 DLC'nin detaylarını çek
          const results = await Promise.allSettled(
            dlcIds.slice(0, 10).map(id =>
              tauriFetch(`https://store.steampowered.com/api/appdetails?appids=${id}&filters=basic&l=turkish`, { method: "GET", headers: { Accept: "application/json" } })
                .then(r => r.json())
                .then(d => d?.[id]?.data || null)
            )
          );
          setDlcs(results.filter(r => r.status === "fulfilled" && r.value).map(r => r.value));
        })
        .catch(() => {})
        .finally(() => setDlcLoading(false));
    }
  }, [game.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <SectionTitle icon={Trophy} title={achievements ? `Başarımlar (${achievements.unlocked}/${achievements.total})` : "Başarımlar"} accent={game.accent} />
        {achLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.3)", fontSize: 11, padding: "16px 0" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.2)", borderTopColor: game.accent, animation: "spin 0.8s linear infinite" }} />
            Yükleniyor...
          </div>
        ) : achError ? (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", padding: "16px 0" }}>{achError}</div>
        ) : !achievements ? (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", padding: "16px 0" }}>Bu oyun için başarım bilgisi mevcut değil.</div>
        ) : (
          <>
            {/* Progress bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{achievements.unlocked} kazanıldı</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{Math.round(achievements.unlocked / achievements.total * 100)}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, background: game.accent, width: `${achievements.unlocked / achievements.total * 100}%`, transition: "width .6s ease" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, maxHeight: 320, overflowY: "auto" }}>
              {achievements.achievements.slice(0, 30).map(a => (
                <div key={a.apiname} style={{ display: "flex", gap: 10, padding: "8px 10px", borderRadius: 8, background: a.achieved ? `${game.accent}0d` : "rgba(255,255,255,.03)", border: `1px solid ${a.achieved ? game.accent + "25" : "rgba(255,255,255,.06)"}`, opacity: a.achieved ? 1 : 0.5 }}>
                  {a.icon
                    ? <img src={a.icon} style={{ width: 32, height: 32, borderRadius: 6, flexShrink: 0, filter: a.achieved ? "none" : "grayscale(1)" }} />
                    : <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(255,255,255,.06)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Trophy size={14} color={a.achieved ? game.accent : "rgba(255,255,255,.2)"} /></div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: a.achieved ? "#fff" : "rgba(255,255,255,.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                    {a.description && <div style={{ fontSize: 9, color: "rgba(255,255,255,.25)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.description}</div>}
                    {a.achieved && a.unlocktime > 0 && <div style={{ fontSize: 8, color: game.accent, marginTop: 2 }}>{new Date(a.unlocktime * 1000).toLocaleDateString("tr-TR")}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div>
        <SectionTitle icon={Package} title="DLC" accent={game.accent} />
        {dlcLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.3)", fontSize: 11, padding: "16px 0" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.2)", borderTopColor: game.accent, animation: "spin 0.8s linear infinite" }} />
            Yükleniyor...
          </div>
        ) : dlcs.length === 0 ? (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", padding: "16px 0" }}>DLC bulunamadı.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
            {dlcs.map(d => (
              <div key={d.steam_appid} style={{ borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", cursor: "pointer", transition: "all .2s" }}
                onClick={() => openUrl(`https://store.steampowered.com/app/${d.steam_appid}`).catch(() => {})}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${game.accent}40`; e.currentTarget.style.background = "rgba(255,255,255,.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
              >
                <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", background: "#111" }}>
                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${d.steam_appid}/header.jpg`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => e.currentTarget.style.display = "none"}
                  />
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginTop: 2 }}>
                    {d.is_free ? "Ücretsiz" : d.price_overview?.final_formatted || ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {events.length > 0 && (
        <div>
          <SectionTitle icon={Activity} title="Etkinliklerim" accent={game.accent} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
            {events.map(ev => (
              <div key={ev.id} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)" }}>
                {ev.image_url && <img src={ev.image_url} style={{ width: 48, height: 32, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 2 }}>
                    {ev.event_date ? new Date(ev.event_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function parseVersion(title) {
  if (!title) return null;
  const m = title.match(/v?(\d+\.\d+[\d.]*)/);
  return m ? m[1] : null;
}

// Steam'den release versiyon çek
async function fetchReleaseVersion(appId) {
  try {
    // UpToDateCheck — mevcut yüklenen versiyonu 0 vererek en güncel release'i al
    const r = await tauriFetch(
      `https://api.steampowered.com/ISteamApps/UpToDateCheck/v1/?appid=${appId}&version=0&format=json`,
      { method: "GET", headers: { Accept: "application/json" } }
    );
    const d = await r.json();
    const v = d?.response?.required_version;
    if (v && v > 0) return String(v);
  } catch {}

  // Fallback: news feed'inden parse et (beta içermeyenleri filtrele)
  try {
    const r = await tauriFetch(
      `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appId}&count=20&maxlength=0&format=json&feeds=steam_community_announcements`,
      { method: "GET", headers: { Accept: "application/json" } }
    );
    const d = await r.json();
    const items = d?.appnews?.newsitems || [];
    // Beta/open beta içeren haberleri atla
    const release = items.find(n => {
      const t = n.title?.toLowerCase() || "";
      return t.match(/\d+\.\d+/) && !t.match(/beta|preview|experimental|opt.in/);
    });
    if (release) {
      const m = release.title.match(/v?(\d+\.\d+[\d.]*)/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

function TabGameInfo({ game, latestPatch }) {
  const [steamData, setSteamData] = useState(null);

  useEffect(() => {
    if (!game.steamAppId) return;
    tauriFetch(`https://store.steampowered.com/api/appdetails?appids=${game.steamAppId}&l=turkish`, { method: "GET", headers: { Accept: "application/json" } })
      .then(r => r.json())
      .then(d => setSteamData(d?.[game.steamAppId]?.data || null))
      .catch(() => {});
  }, [game.steamAppId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle icon={Info} title="Oyun Bilgileri" accent={game.accent} />
      {!game.steamAppId ? (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>Bu oyun için Steam bilgisi mevcut değil.</div>
      ) : !steamData ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.3)", fontSize: 11 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.2)", borderTopColor: game.accent, animation: "spin 0.8s linear infinite" }} />
          Yükleniyor...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Güncel versiyon */}
          {latestPatch && (
            <div
              onClick={() => openUrl(latestPatch.url).catch(() => {})}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, background: `${game.accent}10`, border: `1px solid ${game.accent}30`, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = `${game.accent}18`; e.currentTarget.style.borderColor = `${game.accent}55`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${game.accent}10`; e.currentTarget.style.borderColor = `${game.accent}30`; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${game.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Activity size={16} color={game.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: game.accent, letterSpacing: 1.5, fontWeight: 700, marginBottom: 3, textTransform: "uppercase" }}>Güncel Güncelleme</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{latestPatch.title}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 2 }}>{new Date(latestPatch.date * 1000).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}</div>
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", flexShrink: 0 }}>Steam ›</div>
            </div>
          )}
          {steamData.short_description && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>{steamData.short_description}</p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Geliştirici", value: steamData.developers?.join(", ") },
              { label: "Yayıncı", value: steamData.publishers?.join(", ") },
              { label: "Çıkış Tarihi", value: steamData.release_date?.date },
              { label: "Tür", value: steamData.genres?.slice(0, 3).map(g => g.description).join(", ") },
              { label: "Platform", value: [steamData.platforms?.windows && "Windows", steamData.platforms?.mac && "Mac", steamData.platforms?.linux && "Linux"].filter(Boolean).join(", ") },
              { label: "Metacritic", value: steamData.metacritic?.score ? `${steamData.metacritic.score}/100` : null },
            ].filter(r => r.value).map(row => (
              <div key={row.label} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{row.label}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{row.value}</div>
              </div>
            ))}
          </div>
          {steamData.categories && (
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Özellikler</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {steamData.categories.slice(0, 8).map(c => (
                  <span key={c.id} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 20, background: `${game.accent}15`, color: game.accent, border: `1px solid ${game.accent}30` }}>{c.description}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Oyun sonrası screenshot yükleme modalı
function PostGameModal({ game, launchTime, onClose }) {
  const [shots, setShots] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});   // { idx: pct }
  const [done, setDone] = useState([]);            // başarılı idx'ler
  const [errors, setErrors] = useState({});        // { idx: msg }

  // Yeni screenshot'ları bul (launchTime'dan sonra değiştirilmiş)
  useEffect(() => {
    if (!game.screenshotDir) return;
    invoke("get_game_screenshots", { gameDir: game.screenshotDir })
      .then(r => {
        const newShots = (r.files || []).filter(f => f.modified * 1000 >= launchTime);
        setShots(newShots);
        setSelected(new Set(newShots.map((_, i) => i))); // hepsini seçili başlat
      })
      .catch(() => {});
  }, []);

  // Aktif etkinlikleri çek
  useEffect(() => {
    eventsApi.list()
      .then(r => {
        const all = r.data.data || r.data || [];
        const active = all.filter(e => e.status === "active" || e.status === "upcoming");
        setEvents(active);
        if (active.length === 1) setEventId(String(active[0].id));
      })
      .catch(() => {});
  }, []);

  const toggle = (i) => setSelected(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const handleUpload = async () => {
    if (!eventId || selected.size === 0) return;
    setUploading(true);
    const toUpload = [...selected];

    for (const idx of toUpload) {
      const f = shots[idx];
      try {
        // Dosyayı Tauri fs ile oku → Blob oluştur
        const { readFile } = await import("@tauri-apps/plugin-fs");
        const bytes = await readFile(f.path);
        const ext = f.name.split(".").pop().toLowerCase();
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        const blob = new Blob([bytes], { type: mime });

        const fd = new FormData();
        fd.append("file", blob, f.name);
        fd.append("event_id", eventId);
        if (caption.trim()) fd.append("caption", caption.trim());

        await eventMediaApi.upload(fd, (pct) =>
          setProgress(p => ({ ...p, [idx]: pct }))
        );
        setDone(p => [...p, idx]);
      } catch (e) {
        setErrors(p => ({ ...p, [idx]: "Yükleme başarısız" }));
      }
    }
    setUploading(false);
  };

  const allDone = done.length === selected.size && selected.size > 0 && !uploading;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,.88)", backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget && !uploading) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 560, maxHeight: "85vh",
          background: "rgba(10,10,18,.99)",
          border: `1px solid ${game.accent}30`,
          borderRadius: 16, display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: `0 0 60px ${game.accent}20`,
        }}
      >
        {/* Başlık */}
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: game.accent, letterSpacing: 2, marginBottom: 4 }}>OYUN SONU</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
            {shots.length > 0 ? `${shots.length} Yeni Screenshot` : "Yeni Screenshot Yok"}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 3 }}>
            {shots.length > 0
              ? "Etkinliğe medya olarak eklemek istediklerini seç"
              : "Bu oturumda screenshot çekilmedi."}
          </div>
        </div>

        {shots.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 32 }}>
            <div style={{ fontSize: 32, opacity: 0.3 }}>📷</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Oyun sırasında F12 ile screenshot alabilirsin.</div>
            <button onClick={onClose} style={{ marginTop: 8, padding: "8px 24px", borderRadius: 8, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.6)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Kapat</button>
          </div>
        ) : (
          <>
            {/* Screenshot grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 22px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
                {shots.map((f, i) => {
                  const isSel = selected.has(i);
                  const isDone = done.includes(i);
                  const isErr = !!errors[i];
                  const pct = progress[i] ?? 0;
                  return (
                    <div key={f.path}
                      onClick={() => { if (!uploading && !isDone) toggle(i); }}
                      style={{
                        position: "relative", aspectRatio: "16/9", borderRadius: 8, overflow: "hidden",
                        cursor: uploading || isDone ? "default" : "pointer",
                        border: `2px solid ${
                          isDone ? "#22c55e" : isErr ? "#e74c3c" : isSel ? game.accent : "rgba(255,255,255,.1)"
                        }`,
                        transition: "border-color .15s",
                        boxShadow: isSel && !isDone ? `0 0 12px ${game.accent}40` : "none",
                      }}
                    >
                      <img src={convertFileSrc(f.path)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {/* Seçim overlay */}
                      {!isDone && !isErr && (
                        <div style={{
                          position: "absolute", inset: 0,
                          background: isSel ? "transparent" : "rgba(0,0,0,.55)",
                          transition: "background .15s",
                        }} />
                      )}
                      {/* Progress bar */}
                      {uploading && isSel && !isDone && !isErr && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(0,0,0,.4)" }}>
                          <div style={{ height: "100%", background: game.accent, width: `${pct}%`, transition: "width .2s" }} />
                        </div>
                      )}
                      {/* Done badge */}
                      {isDone && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(34,197,94,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        </div>
                      )}
                      {/* Error badge */}
                      {isErr && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(231,76,60,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ fontSize: 9, color: "#e74c3c", fontWeight: 700, background: "rgba(0,0,0,.7)", padding: "2px 6px", borderRadius: 4 }}>HATA</div>
                        </div>
                      )}
                      {/* Seçim işareti */}
                      {isSel && !isDone && !isErr && (
                        <div style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%", background: game.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Etkinlik seç */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>Etkinlik</div>
                <select
                  value={eventId}
                  onChange={e => setEventId(e.target.value)}
                  disabled={uploading}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    background: "rgba(255,255,255,.06)", border: `1px solid ${eventId ? game.accent + "50" : "rgba(255,255,255,.12)"}`,
                    color: eventId ? "#fff" : "rgba(255,255,255,.4)",
                    fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer",
                  }}
                >
                  <option value="">Etkinlik seç...</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id} style={{ background: "#111" }}>{ev.title}</option>
                  ))}
                </select>
              </div>

              {/* Açıklama */}
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>Açıklama (isteğe bağlı)</div>
                <input
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Kısa bir açıklama..."
                  disabled={uploading}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8, boxSizing: "border-box",
                    background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
                    color: "#fff", fontSize: 12, fontFamily: "inherit", outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Alt butonlar */}
            <div style={{ padding: "12px 22px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>
                {allDone ? `${done.length} görsel yüklendi ✓` : `${selected.size} seçili`}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={onClose}
                  disabled={uploading}
                  style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer" }}
                >
                  {allDone ? "Kapat" : "Atla"}
                </button>
                {!allDone && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !eventId || selected.size === 0}
                    style={{
                      padding: "8px 22px", borderRadius: 8, border: "none",
                      background: (!eventId || selected.size === 0) ? "rgba(255,255,255,.1)" : game.accent,
                      color: (!eventId || selected.size === 0) ? "rgba(255,255,255,.3)" : "#000",
                      fontSize: 11, fontWeight: 800, cursor: (!eventId || selected.size === 0 || uploading) ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {uploading && <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(0,0,0,.3)", borderTopColor: "#000", animation: "spin 0.7s linear infinite" }} />}
                    {uploading ? "Yükleniyor..." : "Etkinliğe Ekle"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// "launching" → 3sn → "inGame" → kullanıcı "Oyundan Çık" diyene kadar
function LaunchingOverlay({ game, onDone }) {
  const [phase, setPhase] = useState("launching"); // "launching" | "ready"

  useEffect(() => {
    const t = setTimeout(() => setPhase("ready"), 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,.88)",
        backdropFilter: "blur(18px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28,
      }}
    >
      {/* Oyun kapağı */}
      {game.cover && (
        <motion.img
          src={game.cover}
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: 100, height: 140, objectFit: "cover", borderRadius: 12, border: `2px solid ${game.accent}60`, boxShadow: `0 0 40px ${game.accent}50` }}
        />
      )}

      {/* Spinner + yazı */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <AnimatePresence mode="wait">
          {phase === "launching" ? (
            <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "relative", width: 52, height: 52 }}
            >
              {/* Dış halka */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: `3px solid transparent`,
                  borderTopColor: game.accent,
                  borderRightColor: game.accent + "60",
                }}
              />
              {/* İç halka — ters */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
                style={{
                  position: "absolute", inset: 8, borderRadius: "50%",
                  border: `2px solid transparent`,
                  borderTopColor: game.accent + "80",
                }}
              />
              {/* Merkez nokta */}
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: game.accent }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                width: 52, height: 52, borderRadius: "50%",
                background: `${game.accent}20`, border: `2px solid ${game.accent}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 24px ${game.accent}60`,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={game.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {phase === "launching" ? (
            <motion.div key="txt-launch" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              style={{ textAlign: "center" }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>{game.title}</div>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{ fontSize: 11, color: game.accent, marginTop: 6, letterSpacing: 2, textTransform: "uppercase" }}
              >
                Oyun başlatılıyor...
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="txt-ready" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              style={{ textAlign: "center" }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>{game.title}</div>
              <div style={{ fontSize: 11, color: game.accent, marginTop: 6, letterSpacing: 2, textTransform: "uppercase" }}>Steam'e gönderildi ✓</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Kapat butonu — sadece ready aşamasında */}
      <AnimatePresence>
        {phase === "ready" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
            onClick={onDone}
            style={{
              padding: "9px 28px", borderRadius: 9,
              background: game.accent, border: "none",
              color: "#000", fontSize: 11, fontWeight: 800,
              cursor: "pointer", letterSpacing: 1,
              boxShadow: `0 4px 20px ${game.accent}50`,
            }}
          >
            TAMAM
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function GameDetailPage({ game, onBack, onRemove }) {
  const [activeTab, setActiveTab] = useState(0);
  // section: "tabs" | "shots" | "news"
  const [section, setSection] = useState(SECTION_TABS);
  const [focusedTab, setFocusedTab] = useState(0);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [playtime, setPlaytime] = useState(null);
  const [gameVersion, setGameVersion] = useState(null);
  const [latestPatch, setLatestPatch] = useState(null);
  const [launching, setLaunching] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [launchTime, setLaunchTime] = useState(null);
  const [postGame, setPostGame] = useState(false);
  const scrollRef = useRef(null);

  // ref'ler — handler'da stale closure olmadan güncel değer okumak için
  const sectionRef = useRef(SECTION_TABS);
  const focusedTabRef = useRef(0);
  const focusedIdxRef = useRef(0);
  const activeTabRef = useRef(0);

  const setAll = (sec, tab, idx) => {
    sectionRef.current = sec;
    focusedTabRef.current = tab;
    focusedIdxRef.current = idx;
    activeTabRef.current = tab;
    setSection(sec);
    setFocusedTab(tab);
    setFocusedIdx(idx);
    if (sec === SECTION_TABS) setActiveTab(tab);
  };

  const bannerUrl = game.steamAppId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/library_hero.jpg`
    : null;

  useEffect(() => {
    if (game.version) setGameVersion(game.version);
    else if (game.steamAppId) fetchReleaseVersion(game.steamAppId).then(v => { if (v) setGameVersion(v); });

    if (game.steamAppId) {
      steamApi.getPlaytime(game.steamAppId)
        .then(r => { if (r.data.success) setPlaytime(r.data); })
        .catch(() => {});

      tauriFetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${game.steamAppId}&count=20&maxlength=0&format=json&feeds=steam_community_announcements`, { method: "GET", headers: { Accept: "application/json" } })
        .then(r => r.json())
        .then(d => {
          const items = d?.appnews?.newsitems || [];
          const patch = items.find(n => {
            const t = n.title?.toLowerCase() || "";
            return t.match(/update|patch|hotfix|fix|güncelleme|yama|v\d|\d+\.\d+/) && !t.match(/beta|preview|experimental|opt.in/);
          });
          if (patch) setLatestPatch(patch);
        })
        .catch(() => {});
    }
  }, [game.steamAppId]);

  useEffect(() => {
    const SHOTS_MAX = 7; // 0-7 arası (8 kart)
    const NEWS_MAX = 3;  // 0-3 arası (4 haber)

    const handler = (e) => {
      const sec = sectionRef.current;
      const tab = focusedTabRef.current;
      const idx = focusedIdxRef.current;

      if (e.key === "Escape") { onBack(); return; }

      // Tab tuşu — sekmeler arası geçiş her zaman
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        const next = e.shiftKey
          ? Math.max(tab - 1, 0)
          : Math.min(tab + 1, DETAIL_TABS.length - 1);
        setAll(SECTION_TABS, next, 0);
        return;
      }

      e.stopPropagation();

      if (e.key === "ArrowLeft") {
        if (sec === SECTION_TABS) {
          setAll(SECTION_TABS, Math.max(tab - 1, 0), 0);
        } else {
          setFocusedIdx(p => { const n = Math.max(p - 1, 0); focusedIdxRef.current = n; return n; });
        }
      }

      if (e.key === "ArrowRight") {
        if (sec === SECTION_TABS) {
          setAll(SECTION_TABS, Math.min(tab + 1, DETAIL_TABS.length - 1), 0);
        } else if (sec === SECTION_SHOTS) {
          setFocusedIdx(p => { const n = Math.min(p + 1, SHOTS_MAX); focusedIdxRef.current = n; return n; });
        } else if (sec === SECTION_NEWS) {
          setFocusedIdx(p => { const n = Math.min(p + 1, NEWS_MAX); focusedIdxRef.current = n; return n; });
        }
      }

      if (e.key === "ArrowDown") {
        if (sec === SECTION_TABS) {
          // Tabs'tan shots'a in
          setSection(SECTION_SHOTS); sectionRef.current = SECTION_SHOTS;
          setFocusedIdx(0); focusedIdxRef.current = 0;
          scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        } else if (sec === SECTION_SHOTS) {
          // Shots'tan news'e in
          setSection(SECTION_NEWS); sectionRef.current = SECTION_NEWS;
          setFocusedIdx(0); focusedIdxRef.current = 0;
          scrollRef.current?.scrollBy({ top: 200, behavior: "smooth" });
        } else {
          scrollRef.current?.scrollBy({ top: 80, behavior: "smooth" });
        }
      }

      if (e.key === "ArrowUp") {
        if (sec === SECTION_NEWS) {
          setSection(SECTION_SHOTS); sectionRef.current = SECTION_SHOTS;
          setFocusedIdx(0); focusedIdxRef.current = 0;
          scrollRef.current?.scrollBy({ top: -200, behavior: "smooth" });
        } else if (sec === SECTION_SHOTS) {
          setSection(SECTION_TABS); sectionRef.current = SECTION_TABS;
          setFocusedIdx(0); focusedIdxRef.current = 0;
        } else {
          scrollRef.current?.scrollBy({ top: -80, behavior: "smooth" });
        }
      }

      if (e.key === "Enter") {
        // Enter ile seçili item'ı aç — TabActivity içinde handle ediliyor
        // shots ve news için burada da tetikleyebiliriz ama TabActivity kendi onClick'ini kullanıyor
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack]);

  // Sekme değişince section'ı tabs'a sıfırla
  useEffect(() => {
    setSection(SECTION_TABS);
    sectionRef.current = SECTION_TABS;
    setFocusedIdx(0);
    focusedIdxRef.current = 0;
  }, [activeTab]);

  const formatPlaytime = (mins) => {
    if (!mins) return null;
    return parseFloat((mins / 60).toFixed(1)).toLocaleString("tr-TR") + " saat";
  };

  const formatLastPlayed = (ts) => {
    if (!ts) return null;
    return new Date(ts * 1000).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", inset: 0, zIndex: 20, background: "#0a0a0f", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'LemonMilk', 'Segoe UI', sans-serif" }}
    >
      {/* PostGame screenshot modal */}
      <AnimatePresence>
        {postGame && (
          <PostGameModal
            game={game}
            launchTime={launchTime}
            onClose={() => setPostGame(false)}
          />
        )}
      </AnimatePresence>

      {/* Launching overlay */}
      <AnimatePresence>
        {launching && (
          <LaunchingOverlay
            game={game}
            onDone={() => { setLaunching(false); setInGame(true); }}
          />
        )}
      </AnimatePresence>

      {/* Banner */}
      <div style={{ position: "relative", height: 200, flexShrink: 0, overflow: "hidden" }}>
        {bannerUrl ? (
          <img src={bannerUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${game.accent}20, #0a0a0f)` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.2) 0%, rgba(10,10,15,1) 100%)" }} />
        <button onClick={onBack}
          style={{ position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(8px)", transition: "all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${game.accent}60`; e.currentTarget.style.color = game.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; e.currentTarget.style.color = "#fff"; }}>
          <ChevronLeft size={14} /> GERİ
        </button>
        <div style={{ position: "absolute", bottom: 16, left: 24, display: "flex", alignItems: "flex-end", gap: 16 }}>
          {game.cover && (
            <img src={game.cover} style={{ width: 70, height: 100, objectFit: "cover", borderRadius: 8, border: `2px solid ${game.accent}60`, boxShadow: `0 0 20px ${game.accent}40`, flexShrink: 0 }} />
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.1, textShadow: "0 2px 8px rgba(0,0,0,.8)" }}>{game.title}</div>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{game.subtitle}</div>
          </div>
        </div>
      </div>

      {/* Aksiyon butonları */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
        <button
          onClick={() => {
            if (game.steamAppId) {
              openUrl(`steam://rungameid/${game.steamAppId}`).catch(() => {});
              setLaunchTime(Date.now());
              setLaunching(true);
              setInGame(false);
            }
          }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 24px", borderRadius: 9, border: "none",
            background: inGame ? "#22c55e" : game.accent,
            color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer",
            boxShadow: inGame ? "0 4px 20px rgba(34,197,94,.5)" : `0 4px 20px ${game.accent}50`,
            transition: "background .3s, box-shadow .3s",
            position: "relative", overflow: "hidden",
          }}
        >
          {inGame && (
            <motion.div
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(255,255,255,.25)",
                borderRadius: 9,
              }}
            />
          )}
          {inGame ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "#000", flexShrink: 0 }}
              />
              OYUNDA
            </>
          ) : (
            <><Play size={14} fill="#000" /> OYNA</>
          )}
        </button>
        {inGame && (
          <button
            onClick={() => { setInGame(false); if (game.screenshotDir) setPostGame(true); }}
            style={{
              padding: "10px 16px", borderRadius: 9,
              background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
              color: "rgba(255,255,255,.5)", fontSize: 10, fontWeight: 700,
              cursor: "pointer", transition: "all .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(231,76,60,.4)"; e.currentTarget.style.color = "#e74c3c"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "rgba(255,255,255,.5)"; }}
          >
            Oyundan Çıktım
          </button>
        )}
        <div style={{ display: "flex", gap: 16, marginLeft: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={12} color="rgba(255,255,255,.4)" />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>Son Oynama: {playtime ? (formatLastPlayed(playtime.rtime_last_played) || "—") : "—"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={12} color="rgba(255,255,255,.4)" />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>Oynama Süresi: {playtime ? (formatPlaytime(playtime.playtime_forever) || "—") : "—"}</span>
          </div>
        </div>
        {onRemove && (
          <button onClick={onRemove}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.3)", color: "rgba(231,76,60,.8)", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(231,76,60,.25)"; e.currentTarget.style.borderColor = "#e74c3c"; e.currentTarget.style.color = "#e74c3c"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(231,76,60,.1)"; e.currentTarget.style.borderColor = "rgba(231,76,60,.3)"; e.currentTarget.style.color = "rgba(231,76,60,.8)"; }}
          >
            🗑 KÜTÜPHANEDEN KALDIR
          </button>
        )}
      </div>

      {/* Tab menüsü */}
      <div style={{ display: "flex", gap: 2, padding: "8px 24px 0", flexShrink: 0 }}>
        {DETAIL_TABS.map((tab, i) => {
          const isActive = activeTab === i;
          const isFocused = section === SECTION_TABS && focusedTab === i;
          return (
            <button key={tab}
              onClick={() => setAll(SECTION_TABS, i, 0)}
              onMouseEnter={() => { setFocusedTab(i); setSection(SECTION_TABS); sectionRef.current = SECTION_TABS; focusedTabRef.current = i; }}
              style={{
                padding: "8px 20px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
                fontSize: 10, fontWeight: 700, letterSpacing: 0.8, transition: "all .2s",
                background: isActive ? `${game.accent}25` : isFocused ? `${game.accent}15` : "transparent",
                color: isActive ? game.accent : isFocused ? "#fff" : "rgba(255,255,255,.35)",
                borderBottom: isActive ? `2px solid ${game.accent}` : isFocused ? `2px solid ${game.accent}90` : "2px solid transparent",
                boxShadow: isActive ? `0 0 20px ${game.accent}50` : isFocused ? `0 0 12px ${game.accent}35` : "none",
                transform: isFocused ? "scale(1.07) translateY(-1px)" : "scale(1)",
              }}>{tab}</button>
          );
        })}
        {/* Navigasyon ipucu */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, paddingRight: 4 }}>
          {[
            { key: "TAB", label: "Sekme" },
            { key: "↑↓", label: "Bölüm" },
            { key: "←→", label: "Gezin" },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#000", background: "rgba(255,255,255,.7)", borderRadius: 4, padding: "1px 5px" }}>{key}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,.3)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab içeriği */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {activeTab === 0 && <TabActivity game={game} section={section} focusedIdx={focusedIdx} />}
            {activeTab === 1 && <TabMyInfo game={game} />}
            {activeTab === 2 && <TabGameInfo game={game} latestPatch={latestPatch} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
