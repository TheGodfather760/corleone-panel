import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Globe, X, ChevronLeft, ChevronRight, Newspaper, Calendar, Download, Image, LogOut, Users, Settings, Plus, Check, Trash2, Truck } from "lucide-react";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { eventsApi, downloadsApi, steamApi } from "../lib/api";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useSettings } from "../lib/SettingsContext";
import GameDetailPage from "./GameDetailPage";
import { EventDetail } from "./COneEventsScreen";
import COneSettingsScreen from "./COneSettingsScreen";
import COneMediaScreen from "./COneMediaScreen";
import COneEventsScreen from "./COneEventsScreen";
import COneDownloadsScreen from "./COneDownloadsScreen";
import COneNewsScreen from "./COneNewsScreen";
import COneChatScreen from "./COneChatScreen";
import EventReminderBanner from "./EventReminderBanner";
import COneProfileScreen from "./COneProfileScreen";
import COnePromodsScreen from "./COnePromodsScreen";
import COneLogisticsScreen from "./COneLogisticsScreen";

// Bilinen oyunlar kataloğu (Steam'den çekilen listeye ek meta)
const KNOWN_GAMES = {
  227300: { id: "ets2",    subtitle: "Corleone ETS2 Topluluğu",      accent: "#f5a623", screenshotDir: "Euro Truck Simulator 2",          version: "1.60" },
  270880: { id: "ats",     subtitle: "Corleone ATS Topluluğu",       accent: "#3b82f6", screenshotDir: "American Truck Simulator",         version: "1.61" },
  244210: { id: "assetto", subtitle: "Gerçekçi Yarış Simülasyonu",   accent: "#e74c3c", screenshotDir: "Assetto Corsa",                    version: null },
  1551360:{ id: "forza5",  subtitle: "Meksika'da Açık Dünya Yarışı", accent: "#2ecc71", screenshotDir: null,                               version: null },
  2440510:{ id: "forza6",  subtitle: "Pist Yarışı Simülasyonu",      accent: "#3b82f6", screenshotDir: null,                               version: null },
  1209420:{ id: "bus",     subtitle: "Şehir İçi Otobüs Deneyimi",   accent: "#f59e0b", screenshotDir: null,                               version: null },
  730:    { id: "csgo",    subtitle: "Taktiksel Nişancı",            accent: "#f5a623", screenshotDir: "Counter-Strike Global Offensive",   version: null },
  570:    { id: "dota2",   subtitle: "MOBA Klasiği",                 accent: "#e74c3c", screenshotDir: null,                               version: null },
  578080: { id: "pubg",    subtitle: "Battle Royale",                accent: "#f5a623", screenshotDir: null,                               version: null },
  1172470:{ id: "apex",    subtitle: "Battle Royale",                accent: "#e74c3c", screenshotDir: null,                               version: null },
  1091500:{ id: "cp2077",  subtitle: "Açık Dünya RPG",               accent: "#f5a623", screenshotDir: "Cyberpunk 2077",                   version: null },
  1245620:{ id: "elden",   subtitle: "Souls-like RPG",               accent: "#f59e0b", screenshotDir: null,                               version: null },
  1174180:{ id: "rdr2",    subtitle: "Açık Dünya Western",           accent: "#e74c3c", screenshotDir: null,                               version: null },
  271590: { id: "gta5",    subtitle: "Açık Dünya Aksiyon",           accent: "#2ecc71", screenshotDir: null,                               version: null },
};

const PRIORITY_APPIDS = [227300, 270880]; // ETS2, ATS — her zaman önce önerilir

const STORAGE_KEY = "c1_games_v1";

function loadGames() {
  try { return sortGames(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); } catch { return []; }
}
function saveGames(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function sortGames(games) {
  return [...games].sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
}

function buildGameEntry(appId, name, playtime = 0) {
  const meta = KNOWN_GAMES[appId] || {};
  return {
    id:            meta.id || `app_${appId}`,
    title:         name,
    subtitle:      meta.subtitle || "",
    cover:         `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
    accent:        meta.accent || "#f5a623",
    steamAppId:    appId,
    screenshotDir: meta.screenshotDir || null,
    version:       meta.version || null,
    tag:           null,
    tagColor:      null,
    favorite:      false,
  };
}

// ── OYUN EKLE EKRANI ──
function AddGameScreen({ onAdd, onClose, existingIds }) {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noSteam, setNoSteam] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    steamApi.getLibrary()
      .then(r => {
        if (!r.data.success) { setNoSteam(true); setLoading(false); return; }
        const games = r.data.games || [];
        setLibrary(games);
        // ETS2/ATS varsa otomatik seç
        const autoSelect = new Set();
        games.forEach(g => { if (PRIORITY_APPIDS.includes(g.appid) && !existingIds.has(g.appid)) autoSelect.add(g.appid); });
        setSelected(autoSelect);
      })
      .catch(() => setNoSteam(true))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (appid) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(appid)) next.delete(appid); else next.add(appid);
      return next;
    });
  };

  const handleAdd = () => {
    const toAdd = library
      .filter(g => selected.has(g.appid) && !existingIds.has(g.appid))
      .map(g => buildGameEntry(g.appid, g.name, g.playtime_forever));
    if (toAdd.length) onAdd(toAdd);
  };

  const selectableCount = selected.size;

  const filtered = library.filter(g =>
    search === "" || g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "var(--c1-modal-w)", maxHeight: "80vh", background: "rgba(12,12,20,.98)", border: "1px solid rgba(245,166,35,.2)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 80px rgba(245,166,35,.15)" }}
      >
        {/* Başlık */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, color: "#f5a623", letterSpacing: 2, marginBottom: 4 }}>C-ONE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Oyun Ekle</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 4 }}>Steam kütüphanenden oyun seç veya manuel ekle</div>
          </div>
          <button onClick={() => onClose?.()}
            style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(231,76,60,.2)"; e.currentTarget.style.borderColor = "rgba(231,76,60,.4)"; e.currentTarget.style.color = "#e74c3c"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "rgba(255,255,255,.5)"; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* İçerik */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,.15)", borderTopColor: "#f5a623", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Steam kütüphanesi yükleniyor...</span>
            </div>
          ) : noSteam ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎮</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.6)", marginBottom: 6 }}>Steam hesabı bağlı değil</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Profil ayarlarından Steam hesabını bağla veya profilini herkese açık yap.</div>
            </div>
          ) : (
            <>
              {/* Arama */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, marginBottom: 14 }}>
                <Search size={13} color="rgba(255,255,255,.4)" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Oyun ara..."
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 12, fontFamily: "inherit" }} />
              </div>

              {/* ETS2/ATS öneri banner */}
              {library.some(g => PRIORITY_APPIDS.includes(g.appid) && !existingIds.has(g.appid)) && search === "" && (
                <div style={{ padding: "10px 14px", background: "rgba(245,166,35,.08)", border: "1px solid rgba(245,166,35,.2)", borderRadius: 8, marginBottom: 12, fontSize: 11, color: "rgba(255,255,255,.6)" }}>
                  ⭐ <span style={{ color: "#f5a623", fontWeight: 700 }}>ETS2 ve ATS</span> kütüphanende bulundu, otomatik seçildi.
                </div>
              )}

              {/* Oyun listesi */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                {filtered.map(g => {
                  const isSel = selected.has(g.appid);
                  const isPriority = PRIORITY_APPIDS.includes(g.appid);
                  const isAdded = existingIds.has(g.appid);
                  return (
                    <div key={g.appid}
                      onClick={() => { if (!isAdded) toggle(g.appid); }}
                      style={{
                        borderRadius: 8, overflow: "hidden", cursor: isAdded ? "default" : "pointer", position: "relative",
                        border: `2px solid ${isAdded ? "rgba(124,58,237,.5)" : isSel ? (isPriority ? "#f5a623" : "#7c3aed") : "rgba(255,255,255,.08)"}`,
                        transition: "border-color .15s",
                        boxShadow: isAdded ? "0 0 12px rgba(124,58,237,.3)" : isSel ? `0 0 12px ${isPriority ? "#f5a62340" : "#7c3aed40"}` : "none",
                        opacity: isAdded ? 0.7 : 1,
                      }}
                    >
                      <img
                        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/library_600x900.jpg`}
                        style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", display: "block" }}
                        onError={e => { e.currentTarget.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`; e.currentTarget.style.aspectRatio = "16/9"; }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.8) 0%, transparent 50%)" }} />
                      <div style={{ position: "absolute", bottom: 6, left: 6, right: 6, fontSize: 9, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{g.name}</div>
                      {isAdded && (
                        <div style={{ position: "absolute", top: 6, right: 6, fontSize: 7, fontWeight: 900, color: "#fff", background: "#7c3aed", padding: "2px 6px", borderRadius: 3, letterSpacing: 0.5 }}>KÜTÜPHANEde</div>
                      )}
                      {!isAdded && isSel && (
                        <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: isPriority ? "#f5a623" : "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check size={11} color="#000" strokeWidth={3} />
                        </div>
                      )}
                      {isPriority && (
                        <div style={{ position: "absolute", top: 6, left: 6, fontSize: 7, fontWeight: 900, color: "#000", background: "#f5a623", padding: "2px 5px", borderRadius: 3 }}>CORLEONE</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Alt butonlar */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>
            {selected.size > 0 ? `${selected.size} oyun seçildi` : "Oyun seç"}
          </span>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 22px", borderRadius: 8, border: "none", cursor: selected.size > 0 ? "pointer" : "not-allowed",
              background: selected.size > 0 ? "#f5a623" : "rgba(255,255,255,.1)",
              color: selected.size > 0 ? "#000" : "rgba(255,255,255,.3)",
              fontSize: 12, fontWeight: 800, transition: "all .2s",
            }}
          >
            <Plus size={14} /> EKLE
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}


const TABS = ["YENİLİKLER", "HABERLER", "ETKİNLİKLER", "İNDİRMELER", "MEDYA"];

const sounds = {};
function getSound(name) {
  if (!sounds[name]) {
    sounds[name] = new Audio(`/sounds/${name}`);
    sounds[name].volume = 0.5;
  }
  return sounds[name];
}
// Global flag — BigModeScreen mount olunca settings'ten set edilir
let _soundEnabled = true;
function playSound(name) {
  if (!_soundEnabled) return;
  try {
    const s = getSound(name);
    s.currentTime = 0;
    s.play().catch(() => {});
  } catch {}
}

function playTickSound() { playSound("c-one_navigation.wav"); }
function playHoverSound() { playSound("c-one-hover.wav"); }
function playSelectSound() { playSound("c-one_onay.wav"); }
function playBackSound() { playSound("c-one_back.wav"); }

function Clock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })), 10000);
    return () => clearInterval(t);
  }, []);
  return <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>{time}</span>;
}

function SearchOverlay({ onClose, games, onSelectGame, onOpenEvents, onOpenDownloads, onOpenSettings, onOpenNews }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  // Statik kategoriler — ayarlar
  const SETTINGS_ITEMS = [
    { label: "Müzik Ses Seviyesi", sub: "Ayarlar › Müzik" },
    { label: "Ses Efektleri", sub: "Ayarlar › Genel" },
    { label: "Font Seçimi", sub: "Ayarlar › Görünüm" },
    { label: "Yazı Boyutu", sub: "Ayarlar › Görünüm" },
    { label: "Müzik Aç/Kapat", sub: "Ayarlar › Müzik" },
  ];

  useEffect(() => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) { setResults([]); return; }

    const found = [];

    // Oyunlar
    games.forEach(g => {
      if (g.title.toLowerCase().includes(trimmed)) {
        found.push({ type: "game", icon: "🎮", label: g.title, sub: "Oyun Kütüphanesi", accent: g.accent, data: g });
      }
    });

    // Ayarlar
    SETTINGS_ITEMS.forEach(s => {
      if (s.label.toLowerCase().includes(trimmed)) {
        found.push({ type: "settings", icon: "⚙️", label: s.label, sub: s.sub, data: s });
      }
    });

    // API aramaları — etkinlik + indirme
    setLoading(true);
    Promise.allSettled([
      eventsApi.list(),
      downloadsApi.list(),
    ]).then(([evRes, dlRes]) => {
      if (evRes.status === "fulfilled") {
        const all = evRes.value.data.data || evRes.value.data || [];
        all.forEach(e => {
          if (e.title?.toLowerCase().includes(trimmed)) {
            found.push({ type: "event", icon: "📅", label: e.title, sub: "Etkinlikler", accent: "#2ecc71", data: e });
          }
        });
      }
      if (dlRes.status === "fulfilled") {
        const all = dlRes.value.data.data || [];
        all.forEach(d => {
          if (d.title?.toLowerCase().includes(trimmed)) {
            found.push({ type: "download", icon: "⬇️", label: d.title, sub: "İndirmeler", accent: "#3b82f6", data: d });
          }
        });
      }
      setResults([...found]);
      setLoading(false);
    });

    // Statik sonuçları hemen göster, API gelince güncelle
    setResults([...found]);
  }, [q, games]);

  const handleSelect = (item) => {
    playSelectSound();
    if (item.type === "game") {
      onSelectGame(item.data);
    } else if (item.type === "event") {
      onOpenEvents();
    } else if (item.type === "download") {
      onOpenDownloads();
    } else if (item.type === "settings") {
      onOpenSettings();
    } else if (item.type === "news") {
      onOpenNews();
    }
    onClose();
  };

  const CATEGORY_COLORS = {
    game: "#f5a623", event: "#2ecc71", download: "#3b82f6", settings: "#7c3aed", news: "#e74c3c",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "absolute", inset: 0, zIndex: 100, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "var(--c1-search-w)", background: "rgba(20,20,20,.95)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, overflow: "hidden" }}
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <Search size={16} color="#888" />
          <input
            ref={ref}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Oyun, etkinlik, indirme, ayar ara…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 15, fontFamily: "inherit" }}
          />
          {loading && <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.15)", borderTopColor: "#f5a623", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />}
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={14} /></button>
        </div>

        {/* Sonuçlar */}
        {q.trim() === "" ? (
          <div style={{ padding: "14px 18px", fontSize: 12, color: "#444", display: "flex", gap: 16, flexWrap: "wrap" }}>
            {["🎮 Oyunlar", "📅 Etkinlikler", "⬇️ İndirmeler", "⚙️ Ayarlar"].map(c => (
              <span key={c} style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>{c}</span>
            ))}
          </div>
        ) : results.length === 0 && !loading ? (
          <div style={{ padding: "14px 18px", fontSize: 12, color: "#555" }}>"{q}" için sonuç bulunamadı.</div>
        ) : (
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {results.map((item, i) => (
              <div key={`${item.type}-${i}`}
                onClick={() => handleSelect(item)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.04)", transition: "background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Tip ikonu */}
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${CATEGORY_COLORS[item.type] || "#888"}18`, border: `1px solid ${CATEGORY_COLORS[item.type] || "#888"}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                  {item.type === "game" && item.data.cover
                    ? <img src={item.data.cover} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 7 }} onError={e => e.currentTarget.style.display="none"} />
                    : item.icon
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: `${CATEGORY_COLORS[item.type] || "#888"}cc`, marginTop: 2 }}>{item.sub}</div>
                </div>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Steam haberleri hook — type: "news" | "updates"
function useSteamNews(appId, type = "news") {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!appId) { setNews([]); return; }
    setLoading(true);
    setNews([]);
    // Güncellemeler için sadece steam_community_announcements feed'i
    const feedsParam = type === "updates" ? "&feeds=steam_community_announcements" : "";
    const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appId}&count=8&maxlength=0&format=json${feedsParam}`;
    tauriFetch(url, { method: "GET", headers: { "Accept": "application/json" } })
      .then(r => r.json())
      .then(d => {
        let items = d?.appnews?.newsitems || [];
        if (type === "updates") {
          // Patch note / update içeriklerini filtrele
          items = items.filter(n =>
            n.title?.toLowerCase().match(/update|patch|hotfix|fix|güncelleme|yama|v\d|\d+\.\d+/) ||
            n.feedlabel?.toLowerCase().includes("update") ||
            n.tags?.includes("patchnotes")
          );
        }
        setNews(items);
      })
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, [appId, type]);
  return { news, loading };
}

// Steam haber içeriğinden en iyi görseli çek
function extractNewsImage(item, appId) {
  const c = item.contents || "";

  // 1. {STEAM_CLAN_IMAGE}/hash/file.jpg formatı
  const clanMatch = c.match(/\{STEAM_CLAN_IMAGE\}\/([^\s"'<\]]+)/i);
  if (clanMatch) return `https://clan.akamai.steamstatic.com/images/${clanMatch[1]}`;

  // 2. clan.akamai.steamstatic.com direkt URL
  const clanUrl = c.match(/https:\/\/clan\.akamai\.steamstatic\.com\/images\/[^\s"'<\]]+/i);
  if (clanUrl) return clanUrl[0];

  // 3. steamcdn-a.akamaihd.net
  const cdnUrl = c.match(/https:\/\/steamcdn-a\.akamaihd\.net\/[^\s"'<\]]+\.(jpg|jpeg|png|gif|webp)/i);
  if (cdnUrl) return cdnUrl[0];

  // 4. img tag src (logo/avatar içermeyenler)
  const imgs = [...c.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  for (const m of imgs) {
    const src = m[1];
    if (!src.match(/avatar|logo|icon|badge/i)) return src;
  }

  // 5. Herhangi bir .jpg/.png URL
  const anyImg = c.match(/https?:\/\/[^\s"'<\]]+\.(jpg|jpeg|png|webp)/i);
  if (anyImg) return anyImg[0];

  // 6. Fallback: oyunun header görseli
  if (appId) return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
  return null;
}

function NewsGrid({ items, accent, appId, onOpen, expanded }) {
  if (!items.length) return <TabEmpty text="İçerik bulunamadı." />;
  const maxH = expanded ? 340 : 200;
  const cols = Math.max(1, Math.floor((window.innerWidth - 48) / 210));
  const { idx, setIdx } = useGridNav({ count: items.length, cols, active: expanded, onEnter: (i) => openUrl(items[i].url).catch(() => {}) });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, overflowY: "auto", maxHeight: maxH, transition: "max-height .35s ease" }}>
      {items.map((n, i) => {
        const img = extractNewsImage(n, appId);
        const focused = expanded && idx === i;
        return (
          <div key={n.gid}
            onClick={() => { setIdx(i); openUrl(n.url).catch(() => {}); }}
            onMouseEnter={() => { playHoverSound(); setIdx(i); }}
            style={{
              borderRadius: 10, overflow: "hidden",
              background: focused ? `${accent}20` : "rgba(255,255,255,.04)",
              border: `${focused ? 2 : 1}px solid ${focused ? accent : "rgba(255,255,255,.08)"}`,
              cursor: "pointer", transition: "all .2s", display: "flex", flexDirection: "column",
              boxShadow: focused ? `0 0 24px ${accent}60, 0 0 8px ${accent}30` : "none",
              transform: focused ? "translateY(-5px) scale(1.03)" : "translateY(0) scale(1)",
            }}
          >
            <div style={{ width: "100%", aspectRatio: "16/9", background: "#111", flexShrink: 0, overflow: "hidden" }}>
              {img
                ? <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`; }} />
                : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${accent}15, #111)` }} />
              }
            </div>
            <div style={{ padding: "8px 10px", flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: focused ? "#fff" : "rgba(255,255,255,.85)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 4, lineHeight: 1.4 }}>{n.title}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>{n.feedlabel} · {new Date(n.date * 1000).toLocaleDateString("tr-TR")}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabNews({ game, accent, expanded }) {
  const { news, loading } = useSteamNews(game.steamAppId, "news");
  if (!game.steamAppId) return <TabEmpty text="Bu oyun için Steam haberleri mevcut değil." />;
  if (loading) return <TabLoading />;
  if (!news.length) return <TabEmpty text="Haber bulunamadı." />;
  return <NewsGrid items={news} accent={accent} appId={game.steamAppId} expanded={expanded} />;
}

function TabUpdates({ game, accent, expanded }) {
  const { news, loading } = useSteamNews(game.steamAppId, "updates");
  if (!game.steamAppId) return <TabEmpty text="Bu oyun için güncelleme bilgisi mevcut değil." />;
  if (loading) return <TabLoading />;
  if (!news.length) return <TabEmpty text="Güncelleme bulunamadı." />;
  return <NewsGrid items={news} accent={accent} appId={game.steamAppId} expanded={expanded} />;
}

function TabEvents({ game, accent, expanded }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const maxH = expanded ? 340 : 200;
  const cols = Math.max(1, Math.floor((window.innerWidth - 48) / 210));
  const { idx, setIdx } = useGridNav({ count: events.length, cols, active: expanded });
  useEffect(() => {
    eventsApi.list()
      .then(r => {
        const all = r.data.data || r.data || [];
        const filtered = game.id === "future" ? [] : all.filter(e =>
          e.title?.toLowerCase().includes(game.id === "ets2" ? "ets" : game.id === "ats" ? "ats" : game.id) ||
          e.game?.toLowerCase().includes(game.id)
        );
        setEvents(filtered.length ? filtered : all.slice(0, 6));
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [game.id]);
  if (loading) return <TabLoading />;
  if (!events.length) return <TabEmpty text="Bu oyun için etkinlik bulunamadı." />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, overflowY: "auto", maxHeight: maxH, transition: "max-height .35s ease" }}>
      {events.slice(0, 6).map((ev, i) => {
        const focused = expanded && idx === i;
        return (
        <div key={ev.id}
          onMouseEnter={() => { playHoverSound(); setIdx(i); }}
          style={{
            borderRadius: 10, overflow: "hidden",
            background: focused ? `${accent}18` : "rgba(255,255,255,.04)",
            border: `${focused ? 2 : 1}px solid ${focused ? accent : "rgba(255,255,255,.08)"}`,
            cursor: "default", transition: "all .15s", display: "flex", flexDirection: "column",
            boxShadow: focused ? `0 0 16px ${accent}40` : "none",
            transform: focused ? "translateY(-3px)" : "translateY(0)",
          }}
        >
          <div style={{ width: "100%", aspectRatio: "16/9", background: "#111", flexShrink: 0, overflow: "hidden" }}>
            {ev.image_url
              ? <img src={ev.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${accent}15, #111)` }} />
            }
          </div>
          <div style={{ padding: "8px 10px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{ev.title}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>{ev.event_date ? new Date(ev.event_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }) : ""}</div>
              <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: `${accent}20`, color: accent }}>
                {ev.status === "active" ? "AKTİF" : ev.status === "upcoming" ? "YAKLAŞAN" : "GEÇMİŞ"}
              </span>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

function TabDownloads({ game, accent, expanded }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const maxH = expanded ? 340 : 200;
  const cols = Math.max(1, Math.floor((window.innerWidth - 48) / 210));
  const { idx, setIdx } = useGridNav({ count: items.length, cols, active: expanded });
  useEffect(() => {
    downloadsApi.list()
      .then(r => {
        const all = r.data.data || [];
        const filtered = all.filter(d =>
          d.category === `${game.id}_profile` ||
          d.title?.toLowerCase().includes(game.id === "ets2" ? "ets" : game.id === "ats" ? "ats" : game.id)
        );
        setItems(filtered.length ? filtered : all.slice(0, 6));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [game.id]);
  if (loading) return <TabLoading />;
  if (!items.length) return <TabEmpty text="Bu oyun için indirme bulunamadı." />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, overflowY: "auto", maxHeight: maxH, transition: "max-height .35s ease" }}>
      {items.slice(0, 6).map((d, i) => {
        const focused = expanded && idx === i;
        return (
        <div key={d.id}
          onMouseEnter={() => { playHoverSound(); setIdx(i); }}
          style={{
            borderRadius: 10, overflow: "hidden",
            background: focused ? `${accent}18` : "rgba(255,255,255,.04)",
            border: `${focused ? 2 : 1}px solid ${focused ? accent : "rgba(255,255,255,.08)"}`,
            cursor: "default", transition: "all .15s", display: "flex", flexDirection: "column",
            boxShadow: focused ? `0 0 16px ${accent}40` : "none",
            transform: focused ? "translateY(-3px)" : "translateY(0)",
          }}
        >
          <div style={{ width: "100%", aspectRatio: "16/9", background: "#111", flexShrink: 0, overflow: "hidden" }}>
            {d.thumbnail
              ? <img src={d.thumbnail} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${accent}15, #111)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Download size={24} color={`${accent}40`} />
                </div>
            }
          </div>
          <div style={{ padding: "8px 10px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{d.title}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>{d.versions?.[0]?.version ? `v${d.versions[0].version}` : ""} · {d.download_count || 0} indirme</div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

function TabMedia({ game, accent, expanded }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const maxH = expanded ? 340 : 200;
  const cols = Math.max(1, Math.floor((window.innerWidth - 48) / 210));
  const { idx, setIdx } = useGridNav({ count: files.length, cols, active: expanded, onEnter: (i) => { if (files[i]) setPreview(convertFileSrc(files[i].path)); } });

  useEffect(() => {
    if (!game.screenshotDir) { setLoading(false); setFiles([]); return; }
    setLoading(true);
    invoke("get_game_screenshots", { gameDir: game.screenshotDir })
      .then(r => setFiles(r.files || []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [game.id]);

  if (!game.screenshotDir) return <TabEmpty text="Bu oyun için medya klasörü tanımlı değil." />;
  if (loading) return <TabLoading />;
  if (!files.length) return <TabEmpty text="Ekran görüntüsü bulunamadı. Oyunu oynayıp screenshot al!" />;

  return (
    <>
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setPreview(null)}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}
          >
            <motion.img
              src={preview}
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 10, boxShadow: "0 0 80px rgba(0,0,0,.9)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, maxHeight: maxH, overflowY: "auto", transition: "max-height .35s ease" }}>
        {files.map((f, i) => {
          const focused = expanded && idx === i;
          return (
          <div key={f.path}
            onClick={() => { setIdx(i); setPreview(convertFileSrc(f.path)); }}
            onMouseEnter={() => { setIdx(i); }}
            style={{
              aspectRatio: "16/9", borderRadius: 6, overflow: "hidden", cursor: "zoom-in",
              border: `${focused ? 3 : 1}px solid ${focused ? accent : "rgba(255,255,255,.08)"}`,
              transition: "all .2s",
              boxShadow: focused ? `0 0 24px ${accent}70, 0 0 8px ${accent}40` : "none",
              transform: focused ? "scale(1.06)" : "scale(1)",
              zIndex: focused ? 2 : 1, position: "relative",
            }}
          >
            <img src={convertFileSrc(f.path)} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          </div>
          );
        })}
      </div>
    </>
  );
}

function TabLoading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80, gap: 8 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.2)", borderTopColor: "#f5a623", animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Yükleniyor...</span>
    </div>
  );
}

function TabEmpty({ text }) {
  return <div style={{ padding: "24px 0", textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.25)" }}>{text}</div>;
}

// Grid navigasyon hook'u
function useGridNav({ count, cols, active: isActive, onEnter }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => { if (!isActive) setIdx(0); }, [isActive]);

  useEffect(() => {
    if (!isActive || count === 0) return;
    const handler = (e) => {
      if (e.key === "ArrowRight") { e.stopPropagation(); setIdx(p => Math.min(p + 1, count - 1)); playTickSound(); }
      if (e.key === "ArrowLeft")  { e.stopPropagation(); setIdx(p => Math.max(p - 1, 0)); playTickSound(); }
      if (e.key === "ArrowDown")  { e.stopPropagation(); setIdx(p => Math.min(p + cols, count - 1)); playTickSound(); }
      if (e.key === "ArrowUp") {
        if (idx < cols) return;
        e.stopPropagation();
        setIdx(p => Math.max(p - cols, 0));
        playTickSound();
      }
      if (e.key === "Enter" && onEnter) { e.stopPropagation(); playSelectSound(); onEnter(idx); }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [isActive, count, cols, idx, onEnter]);

  return { idx, setIdx };
}

// Gamepad hook
function useGamepad({ onLeft, onRight, onUp, onDown, onA, onB, enabled }) {
  const lastRef = useRef({});
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const DEADZONE = 0.4;
    const REPEAT_DELAY = 180; // ms
    const now = () => performance.now();

    const poll = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const pad of pads) {
        if (!pad) continue;
        const id = pad.index;
        if (!lastRef.current[id]) lastRef.current[id] = {};
        const last = lastRef.current[id];

        const check = (key, pressed, cb) => {
          if (pressed) {
            if (!last[key] || now() - last[key] > REPEAT_DELAY) {
              last[key] = now();
              cb();
            }
          } else {
            last[key] = 0;
          }
        };

        // D-pad
        check("left",  pad.buttons[14]?.pressed || pad.axes[0] < -DEADZONE, onLeft);
        check("right", pad.buttons[15]?.pressed || pad.axes[0] >  DEADZONE, onRight);
        check("up",    pad.buttons[12]?.pressed || pad.axes[1] < -DEADZONE, onUp);
        check("down",  pad.buttons[13]?.pressed || pad.axes[1] >  DEADZONE, onDown);
        // A butonu (Xbox: 0, PS: Cross)
        check("a", pad.buttons[0]?.pressed, onA);
        // B butonu (Xbox: 1, PS: Circle) — geri
        check("b", pad.buttons[1]?.pressed, onB);
      }
      rafRef.current = requestAnimationFrame(poll);
    };

    rafRef.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, onLeft, onRight, onUp, onDown, onA, onB]);
}

const PLAYLIST = [
  { title: "The Last of Us",   file: "/Musics/c-one_the-last-of-us.mp3" },
  { title: "GTA IV Theme",     file: "/Musics/c-one-grtaIV.mp3" },
  { title: "Make It Bun Dem",  file: "/Musics/Far Cry 3 Soundtrack - Make It Bun Dem [1aXrLt9a6eE].mp3" },
];

function BigBg({ accent }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "#0a0a0f" }} />

      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          {/* Turuncu gradientler */}
          <linearGradient id="og1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="30%" stopColor={accent} stopOpacity="0.6" />
            <stop offset="70%" stopColor={accent} stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="og2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="40%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="60%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          {/* Mor gradientler */}
          <linearGradient id="pg1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="30%" stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="pg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="40%" stopColor="#a855f7" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#a855f7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Turuncu çizgiler — kıvrımlı */}
        <path d="M-100,200 C200,100 400,350 700,180 S1100,80 1400,220" fill="none" stroke="url(#og1)" strokeWidth="2.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-60; 0,30; 0,0" dur="12s" repeatCount="indefinite" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" />
          <animate attributeName="opacity" values="0;1;1;0" dur="12s" repeatCount="indefinite" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" />
        </path>
        <path d="M-100,420 C150,300 450,500 750,350 S1050,250 1400,400" fill="none" stroke="url(#og2)" strokeWidth="1.8" strokeLinecap="round">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-80; 0,20; 0,0" dur="15s" repeatCount="indefinite" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" begin="2s" />
          <animate attributeName="opacity" values="0;0.8;0.8;0" dur="15s" repeatCount="indefinite" begin="2s" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" />
        </path>
        <path d="M-100,600 C300,480 500,680 800,520 S1100,420 1400,580" fill="none" stroke="url(#og1)" strokeWidth="1.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-50; 0,40; 0,0" dur="18s" repeatCount="indefinite" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" begin="4s" />
          <animate attributeName="opacity" values="0;0.6;0.6;0" dur="18s" repeatCount="indefinite" begin="4s" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" />
        </path>

        {/* Mor çizgiler — kıvrımlı */}
        <path d="M-100,150 C250,280 450,100 750,260 S1100,180 1400,120" fill="none" stroke="url(#pg1)" strokeWidth="2.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,70; 0,-30; 0,0" dur="13s" repeatCount="indefinite" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" begin="1s" />
          <animate attributeName="opacity" values="0;1;1;0" dur="13s" repeatCount="indefinite" begin="1s" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" />
        </path>
        <path d="M-100,350 C200,480 500,280 800,440 S1100,340 1400,300" fill="none" stroke="url(#pg2)" strokeWidth="1.8" strokeLinecap="round">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,60; 0,-40; 0,0" dur="16s" repeatCount="indefinite" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" begin="3s" />
          <animate attributeName="opacity" values="0;0.8;0.8;0" dur="16s" repeatCount="indefinite" begin="3s" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" />
        </path>
        <path d="M-100,520 C300,380 600,560 900,400 S1200,480 1400,460" fill="none" stroke="url(#pg1)" strokeWidth="1.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,80; 0,-20; 0,0" dur="20s" repeatCount="indefinite" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" begin="5s" />
          <animate attributeName="opacity" values="0;0.5;0.5;0" dur="20s" repeatCount="indefinite" begin="5s" calcMode="spline" keySplines=".4,0,.2,1; .4,0,.2,1; .4,0,.2,1" />
        </path>
      </svg>

      {/* Orb'lar */}
      <div style={{
        position: "absolute", width: 700, height: 700, borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}14 0%, transparent 70%)`,
        top: -200, left: -150,
        animation: "bgOrb1 16s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,.12) 0%, transparent 70%)",
        bottom: -100, right: -100,
        animation: "bgOrb2 20s ease-in-out infinite",
      }} />

      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)" }} />

      <style>{`
        @keyframes bgOrb1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(70px,50px)} }
        @keyframes bgOrb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-60px,-50px)} }
      `}</style>
    </div>
  );
}

export default function BigModeScreen({ onExit, initialChat = null }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [games, setGames] = useState(() => loadGames());
  const [active, setActive] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [promodsOpen, setPromodsOpen] = useState(false);
  const [logisticsOpen, setLogisticsOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(!!initialChat);
  const [chatInitUser, setChatInitUser] = useState(initialChat);
  const [reminderEvent, setReminderEvent] = useState(null);
  const [reminderDetailOpen, setReminderDetailOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [direction, setDirection] = useState(1);
  const [focusZone, setFocusZone] = useState("cards");
  const [detailGame, setDetailGame] = useState(null);
  const game = games[active] || null;
  const bgMusicRef = useRef(null);
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicTime, setMusicTime] = useState({ current: 0, duration: 0 });
  const isPlayingRef = useRef(false);

  // Yaklaşan etkinlik banner
  useEffect(() => {
    const check = () => {
      eventsApi.list()
        .then(r => {
          const all = r.data.data || r.data || [];
          const now = Date.now();
          const upcoming = all
            .filter(e => e.status === "upcoming" && e.event_date && new Date(e.event_date).getTime() > now)
            .filter(e => new Date(e.event_date).getTime() - now <= 24 * 60 * 60 * 1000)
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
          if (upcoming.length > 0) setReminderEvent(prev => prev ? prev : upcoming[0]);
        })
        .catch(() => {});
    };
    check();
    const t = setInterval(check, 60 * 1000); // her 1 dakikada bir
    return () => clearInterval(t);
  }, []);

  // Avatar menü dışına tıklayınca kapat
  const avatarMenuOpenRef = useRef(false);
  useEffect(() => { avatarMenuOpenRef.current = avatarMenuOpen; }, [avatarMenuOpen]);
  useEffect(() => {
    const h = (e) => {
      if (!avatarMenuOpenRef.current) return;
      const menu = document.getElementById('avatar-dropdown-portal');
      const btn  = avatarMenuRef.current;
      if (menu && menu.contains(e.target)) return;
      if (btn  && btn.contains(e.target))  return;
      setAvatarMenuOpen(false);
    };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, []);

  // Ayarlardan müzik durumunu başlat
  useEffect(() => {
    isPlayingRef.current = settings.c1_musicEnabled;
    setIsPlaying(settings.c1_musicEnabled);
  }, []);

  // Ses efektleri flag'ini settings ile sync et
  useEffect(() => {
    _soundEnabled = settings.c1_soundEnabled !== false;
  }, [settings.c1_soundEnabled]);

  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.src = "";
    }
    const audio = new Audio(PLAYLIST[trackIdx].file);
    audio.volume = (settings.c1_musicVolume ?? 12) / 100;
    bgMusicRef.current = audio;

    const onTimeUpdate = () => setMusicTime({ current: audio.currentTime, duration: audio.duration || 0 });
    const onEnded = () => setTrackIdx(p => (p + 1) % PLAYLIST.length);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    if (isPlayingRef.current) audio.play().catch(() => {});

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
    };
  }, [trackIdx]);

  const prevTrack = () => { playTickSound(); setTrackIdx(p => (p - 1 + PLAYLIST.length) % PLAYLIST.length); };
  const nextTrack = () => { playTickSound(); setTrackIdx(p => (p + 1) % PLAYLIST.length); };
  const togglePlay = () => {
    playSelectSound();
    const audio = bgMusicRef.current;
    if (!audio) return;
    if (isPlayingRef.current) { audio.pause(); isPlayingRef.current = false; setIsPlaying(false); }
    else { audio.play().catch(() => {}); isPlayingRef.current = true; setIsPlaying(true); }
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const go = useCallback((dir) => {
    if (games.length === 0) return;
    setActive(prev => {
      const next = prev + dir;
      if (next < 0 || next >= games.length) return prev;
      playTickSound();
      setDirection(dir);
      return next;
    });
  }, [games.length]);

  const toggleFavorite = useCallback((gameId) => {
    setGames(prev => {
      const updated = sortGames(prev.map(g => g.id === gameId ? { ...g, favorite: !g.favorite } : g));
      saveGames(updated);
      // Aktif index'i koru — aynı oyunu takip et
      const newIdx = updated.findIndex(g => g.id === gameId);
      if (newIdx !== -1) setActive(newIdx);
      return updated;
    });
    playSelectSound();
  }, []);

  // Klavye
  useEffect(() => {
    const handler = (e) => {
      if (searchOpen) return;
      if (exitConfirm) {
        if (e.key === "Escape") { playBackSound(); setExitConfirm(false); }
        return;
      }
      if (menuOpen) {
        if (e.key === "Escape") { playBackSound(); setMenuOpen(false); }
        if (e.key === "ArrowDown")  { playTickSound(); setMenuFocus(p => Math.min(p + 1, MENU_ITEMS.length)); }
        if (e.key === "ArrowUp")    { playTickSound(); setMenuFocus(p => Math.max(p - 1, 0)); }
        return;
      }
      if (e.key === "Escape") {
        playBackSound();
        if (detailGame) { setDetailGame(null); return; }
        if (addOpen) { setAddOpen(false); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
        if (mediaOpen) { setMediaOpen(false); return; }
        if (eventsOpen) { setEventsOpen(false); return; }
        if (downloadsOpen) { setDownloadsOpen(false); return; }
        if (newsOpen) { setNewsOpen(false); return; }
        if (logisticsOpen) { setLogisticsOpen(false); return; }
        if (promodsOpen) { setPromodsOpen(false); return; }
        if (chatOpen) { setChatOpen(false); return; }
        setExitConfirm(true); return;
      }
      if (e.key === "f" || e.key === "F") { setSearchOpen(true); return; }

      if (e.key === "Enter") {
        if (focusZone === "cards") { playSelectSound(); if (game) setDetailGame(game); return; }
        if (focusZone === "tabs") { playSelectSound(); setFocusZone("content"); return; }
        // content zone'da her tab kendi enter handler'ını kullanıyor
        return;
      }

      if (e.key === "ArrowLeft") {
        if (focusZone === "cards") go(-1);
        else if (focusZone === "tabs") { playTickSound(); setActiveTab(p => Math.max(p - 1, 0)); }
        // content zone'da useGridNav kendi handler'ını kullanıyor
      }
      if (e.key === "ArrowRight") {
        if (focusZone === "cards") go(1);
        else if (focusZone === "tabs") { playTickSound(); setActiveTab(p => Math.min(p + 1, TABS.length - 1)); }
        // content zone'da useGridNav kendi handler'ını kullanıyor
      }
      if (e.key === "ArrowDown") {
        playTickSound();
        if (focusZone === "cards") setFocusZone("tabs");
        else if (focusZone === "tabs") setFocusZone("content");
      }
      if (e.key === "ArrowUp") {
        if (focusZone === "content") { playTickSound(); setFocusZone("tabs"); }
        else if (focusZone === "tabs") { playTickSound(); setFocusZone("cards"); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go, searchOpen, menuOpen, focusZone, onExit]);

  const MENU_ITEMS = [
    { icon: Newspaper, label: "YENİLİKLER" },
    { icon: Calendar,  label: "ETKİNLİKLER" },
    { icon: Download,  label: "İNDİRMELER" },
    { icon: Image,     label: "MEDYA" },
    { icon: Users,     label: "ARKADAŞLAR & SOHBET" },
    { icon: Settings,  label: "AYARLAR" },
  ];

  const [menuFocus, setMenuFocus] = useState(0);

  // Gamepad
  useGamepad({
    enabled: true,
    onLeft:  useCallback(() => {
      if (menuOpen) return;
      if (focusZone === "cards") go(-1);
      else if (focusZone === "tabs") { playTickSound(); setActiveTab(p => Math.max(p - 1, 0)); }
    }, [menuOpen, focusZone, go]),
    onRight: useCallback(() => {
      if (menuOpen) return;
      if (focusZone === "cards") go(1);
      else if (focusZone === "tabs") { playTickSound(); setActiveTab(p => Math.min(p + 1, TABS.length - 1)); }
    }, [menuOpen, focusZone, go]),
    onUp: useCallback(() => {
      if (menuOpen) { playTickSound(); setMenuFocus(p => Math.max(p - 1, 0)); return; }
      if (focusZone === "content") { playTickSound(); setFocusZone("tabs"); }
      else if (focusZone === "tabs") { playTickSound(); setFocusZone("cards"); }
    }, [menuOpen, focusZone]),
    onDown: useCallback(() => {
      if (menuOpen) { playTickSound(); setMenuFocus(p => Math.min(p + 1, MENU_ITEMS.length)); return; }
      playTickSound();
      if (focusZone === "cards") setFocusZone("tabs");
      else if (focusZone === "tabs") setFocusZone("content");
    }, [menuOpen, focusZone]),
    onA: useCallback(() => {
      if (menuOpen) {
        playSelectSound();
        if (menuFocus === MENU_ITEMS.length) { setMenuOpen(false); onExit(); }
        else setMenuOpen(false);
      } else if (focusZone === "cards") {
        playSelectSound();
        if (game) setDetailGame(game);
      } else playSelectSound();
    }, [menuOpen, menuFocus, focusZone, game, onExit]),
    onB: useCallback(() => {
      playBackSound();
      if (exitConfirm) { setExitConfirm(false); return; }
      if (menuOpen) { setMenuOpen(false); return; }
      if (detailGame) { setDetailGame(null); return; }
      if (addOpen) { setAddOpen(false); return; }
      if (eventsOpen) { setEventsOpen(false); return; }
      if (downloadsOpen) { setDownloadsOpen(false); return; }
      if (newsOpen) { setNewsOpen(false); return; }
      if (chatOpen) { setChatOpen(false); return; }
      setExitConfirm(true);
    }, [menuOpen, detailGame, addOpen, eventsOpen, downloadsOpen]),
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99998, display: "flex", flexDirection: "column", fontFamily: "var(--c1-font, 'Segoe UI', sans-serif)", fontSize: `calc(14px * var(--c1-scale, 1))`, overflow: "hidden", background: "#0a0a0f" }}>

      {/* Çıkış onay modalı */}
      <AnimatePresence>
        {exitConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, zIndex: 200, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: 360, background: "rgba(10,10,18,.98)", border: "1px solid rgba(231,76,60,.25)", borderRadius: 16, overflow: "hidden", boxShadow: "0 0 60px rgba(231,76,60,.15)" }}
            >
              {/* Üst kırmızı şerit */}
              <div style={{ height: 3, background: "linear-gradient(90deg, #e74c3c, #7c3aed)" }} />
              <div style={{ padding: "28px 28px 24px" }}>
                <div style={{ fontSize: 9, color: "#f5a623", letterSpacing: 2, marginBottom: 10 }}>C-ONE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>C-ONE'dan çıkmak istiyor musun?</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", lineHeight: 1.6, marginBottom: 24 }}>
                  Müzik duracak ve oyun galerisinden çıkılacak. Oyun verilerini kaybetmezsin.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => { playBackSound(); setExitConfirm(false); }}
                    style={{ flex: 1, padding: "11px", borderRadius: 9, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.7)", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .2s", fontFamily: "inherit" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
                  >
                    HAYIR, KAL
                  </button>
                  <button
                    onClick={() => { playSelectSound(); setExitConfirm(false); onExit(); }}
                    style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: "#e74c3c", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", transition: "all .2s", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(231,76,60,.4)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#c0392b"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#e74c3c"; }}
                  >
                    EVET, ÇIK
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sohbet ekranı */}
      <AnimatePresence>
        {chatOpen && (
          <COneChatScreen
            onBack={() => { playBackSound(); setChatOpen(false); setChatInitUser(null); }}
            accent={game?.accent || "#f5a623"}
            initialChatUser={chatInitUser}
          />
        )}
      </AnimatePresence>

      {/* Yenilikler ekranı */}
      <AnimatePresence>
        {newsOpen && (
          <COneNewsScreen
            onBack={() => { playBackSound(); setNewsOpen(false); }}
            accent={game?.accent || "#f5a623"}
          />
        )}
      </AnimatePresence>

      {/* Etkinlikler ekranı */}
      <AnimatePresence>
        {eventsOpen && (
          <COneEventsScreen
            onBack={() => { playBackSound(); setEventsOpen(false); }}
            accent={game?.accent || "#f5a623"}
          />
        )}
      </AnimatePresence>

      {/* İndirmeler ekranı */}
      <AnimatePresence>
        {downloadsOpen && (
          <COneDownloadsScreen
            onBack={() => { playBackSound(); setDownloadsOpen(false); }}
            accent={game?.accent || "#f5a623"}
          />
        )}
      </AnimatePresence>

      {/* Medya ekranı */}
      <AnimatePresence>
        {mediaOpen && (
          <COneMediaScreen
            onBack={() => { playBackSound(); setMediaOpen(false); }}
            accent={game?.accent || "#f5a623"}
          />
        )}
      </AnimatePresence>

      {/* Lojistik ekranı */}
      <AnimatePresence>
        {logisticsOpen && (
          <COneLogisticsScreen
            onBack={() => { playBackSound(); setLogisticsOpen(false); }}
            accent={game?.accent || "#f5a623"}
          />
        )}
      </AnimatePresence>

      {/* ProMods ekranı */}
      <AnimatePresence>
        {promodsOpen && (
          <COnePromodsScreen
            onBack={() => { playBackSound(); setPromodsOpen(false); }}
            accent={game?.accent || "#f5a623"}
          />
        )}
      </AnimatePresence>

      {/* Profil ekranı */}
      <AnimatePresence>
        {profileOpen && (
          <COneProfileScreen
            onBack={() => { playBackSound(); setProfileOpen(false); }}
            bgMusicRef={bgMusicRef}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onVolumeChange={(v) => { if (bgMusicRef.current) bgMusicRef.current.volume = v / 100; }}
          />
        )}
      </AnimatePresence>

      {/* Ayarlar ekranı */}
      <AnimatePresence>
        {settingsOpen && (
          <COneSettingsScreen
            onBack={() => { playBackSound(); setSettingsOpen(false); }}
            bgMusicRef={bgMusicRef}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onVolumeChange={(v) => { if (bgMusicRef.current) bgMusicRef.current.volume = v / 100; }}
          />
        )}
      </AnimatePresence>

      {/* Oyun detay sayfası */}
      <AnimatePresence>
        {detailGame && (
          <GameDetailPage
            game={detailGame}
            onBack={() => { playBackSound(); setDetailGame(null); }}
            onRemove={() => {
              playBackSound();
              setGames(prev => {
                const updated = prev.filter(g => g.id !== detailGame.id);
                saveGames(updated);
                setActive(p => Math.min(p, Math.max(updated.length - 1, 0)));
                return updated;
              });
              setDetailGame(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Oyun ekle ekranı */}
      <AnimatePresence>
        {addOpen && (
          <AddGameScreen
            existingIds={new Set(games.map(g => g.steamAppId).filter(Boolean))}
            onClose={() => { playBackSound(); setAddOpen(false); }}
            onAdd={(newGames) => {
              const updated = sortGames([...games, ...newGames]);
              saveGames(updated);
              setGames(updated);
              setActive(games.length);
              setAddOpen(false);
              playSelectSound();
            }}
          />
        )}
      </AnimatePresence>

      {/* Yaklaşan etkinlik banner */}
      {reminderEvent && (
        <EventReminderBanner
          event={reminderEvent}
          onDismiss={() => setReminderEvent(null)}
          onClick={() => setReminderDetailOpen(true)}
        />
      )}

      {/* Etkinlik detay modal — banner'dan açılan */}
      <AnimatePresence>
        {reminderDetailOpen && reminderEvent && (
          <EventDetail
            event={reminderEvent}
            accent={game?.accent || "#f5a623"}
            onClose={() => setReminderDetailOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Animasyonlu arka plan */}
      <AnimatePresence mode="sync">
        <motion.div key={`bg-${active}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={{ position: "absolute", inset: 0 }}>
          <BigBg accent={game?.accent || "#f5a623"} />
        </motion.div>
      </AnimatePresence>

      {/* Arama overlay */}
      <AnimatePresence>
        {searchOpen && <SearchOverlay
          onClose={() => setSearchOpen(false)}
          games={games}
          onSelectGame={(g) => {
            const idx = games.findIndex(x => x.id === g.id);
            if (idx !== -1) { setDirection(idx > active ? 1 : -1); setActive(idx); }
          }}
          onOpenEvents={() => setEventsOpen(true)}
          onOpenDownloads={() => setDownloadsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenNews={() => setNewsOpen(true)}
        />}
      </AnimatePresence>

      {/* ── C-ONE MENÜ SLIDE PANEL ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => { playBackSound(); setMenuOpen(false); }}
              style={{
                position: "absolute", inset: 0, zIndex: 50,
                background: "rgba(0,0,0,.65)",
              }}
            />
            {/* Slide panel */}
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 51,
                width: "var(--c1-menu-w)",
                background: "rgba(8,8,15,.99)",
                borderRight: "1px solid rgba(245,166,35,.15)",
                display: "flex", flexDirection: "column", justifyContent: "center",
                boxShadow: "8px 0 40px rgba(0,0,0,.6)",
              }}
            >
              {/* Panel üst */}
              <div style={{ padding: "28px 28px 20px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: "#f5a623", background: "rgba(245,166,35,.1)", border: "1px solid #7c3aed", padding: "3px 10px", borderRadius: 5, letterSpacing: 2 }}>C-ONE</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.5)", letterSpacing: 1 }}>MENÜ</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=333&color=f5a623`}
                    style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(245,166,35,.3)", objectFit: "cover" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{user?.username}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: 1 }}>{user?.role || "Üye"}</div>
                  </div>
                </div>
              </div>

              {/* Menü öğeleri */}
              <div style={{ flex: 1, padding: "16px 0", paddingTop: "15%" }}>
                {MENU_ITEMS.map(({ icon: Icon, label }, i) => {
                  const focused = menuFocus === i;
                  return (
                    <motion.button
                      key={label}
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 + i * 0.04, duration: 0.2 }}
                      onMouseEnter={() => { playHoverSound(); setMenuFocus(i); }}
                      onClick={() => {
                      playSelectSound(); setMenuOpen(false);
                      if (label === "AYARLAR")            setSettingsOpen(true);
                      if (label === "MEDYA")              setMediaOpen(true);
                      if (label === "ETKİNLİKLER")        setEventsOpen(true);
                      if (label === "İNDİRMELER")         setDownloadsOpen(true);
                      if (label === "YENİLİKLER")         setNewsOpen(true);
                      if (label === "ARKADAŞLAR & SOHBET") setChatOpen(true);
                      if (label === "LOJİSTİK")            setLogisticsOpen(true);
                      if (label === "PROMODS")            setPromodsOpen(true);
                    }}
                      style={{
                        display: "flex", alignItems: "center", gap: 16,
                        width: "100%", padding: "20px 24px", borderRadius: 0,
                        background: "transparent",
                        border: "none", cursor: "pointer", textAlign: "left",
                        position: "relative", transition: "background .15s",
                      }}
                    >
                      {/* Sol mor çubuk */}
                      <motion.div
                        animate={{ opacity: focused ? 1 : 0, scaleY: focused ? 1 : 0.4 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: "absolute", left: 0, top: "20%", bottom: "20%",
                          width: 3, borderRadius: 2, background: "#7c3aed",
                          boxShadow: "0 0 8px #7c3aed",
                        }}
                      />
                      <Icon size={menuFocus === i ? 26 : 22} color={focused ? "#f5a623" : "rgba(255,255,255,.6)"} style={{ flexShrink: 0, transition: "all .15s" }} />
                      <div style={{ overflow: "hidden", flex: 1 }}>
                        {focused ? (
                          <div style={{ display: "flex", overflow: "hidden" }}>
                            <motion.span
                              key={`marquee-${label}`}
                              animate={{ x: ["-0%", "-50%"] }}
                              transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                              style={{
                                display: "flex", gap: 48, whiteSpace: "nowrap",
                                fontWeight: 700, color: "#f5a623",
                                fontSize: 16, letterSpacing: 1.5,
                                fontFamily: "'LemonMilk', 'Segoe UI', sans-serif",
                              }}
                            >
                              <span>{label}</span>
                              <span>{label}</span>
                            </motion.span>
                          </div>
                        ) : (
                          <span style={{
                            fontWeight: 700, color: "rgba(255,255,255,.6)",
                            fontSize: 14, letterSpacing: 1.5, whiteSpace: "nowrap",
                            fontFamily: "'LemonMilk', 'Segoe UI', sans-serif",
                          }}>{label}</span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Müzik kontrolleri */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: "16px 24px" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" }}>Müzik</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.7)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {PLAYLIST[trackIdx].title}
                </div>
                {/* Progress bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)", minWidth: 28 }}>{formatTime(musicTime.current)}</span>
                  <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,.1)", borderRadius: 2, overflow: "hidden", cursor: "pointer" }}
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - rect.left) / rect.width;
                      if (bgMusicRef.current) bgMusicRef.current.currentTime = pct * musicTime.duration;
                    }}
                  >
                    <div style={{
                      height: "100%", borderRadius: 2, background: "#f5a623",
                      width: `${musicTime.duration ? (musicTime.current / musicTime.duration) * 100 : 0}%`,
                      transition: "width .5s linear",
                    }} />
                  </div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)", minWidth: 28, textAlign: "right" }}>{formatTime(musicTime.duration)}</span>
                </div>
                {/* Kontroller */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={prevTrack} style={{ background: "none", border: "none", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4, transition: "color .15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f5a623"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                  </button>
                  <button onClick={togglePlay} style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: isPlaying ? "rgba(245,166,35,.2)" : "rgba(255,255,255,.08)",
                    border: `1px solid ${isPlaying ? "rgba(245,166,35,.4)" : "rgba(255,255,255,.15)"}`,
                    color: isPlaying ? "#f5a623" : "rgba(255,255,255,.7)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .2s", flexShrink: 0,
                  }}>
                    {isPlaying
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    }
                  </button>
                  <button onClick={nextTrack} style={{ background: "none", border: "none", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4, transition: "color .15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f5a623"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14 4.5 3.14L8 16.14V9.86zM16 6h2v12h-2z"/></svg>
                  </button>
                  <input type="range" min="0" max="100" defaultValue="12"
                    onChange={e => { if (bgMusicRef.current) bgMusicRef.current.volume = e.target.value / 100; }}
                    style={{ flex: 1, accentColor: "#f5a623", cursor: "pointer", height: 3 }}
                  />
                </div>
              </div>

              {/* Çıkış */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                <motion.button
                  onMouseEnter={() => { playHoverSound(); setMenuFocus(MENU_ITEMS.length); }}
                  onClick={() => { playBackSound(); setMenuOpen(false); setExitConfirm(true); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    width: "100%", padding: "20px 24px",
                    background: "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                    position: "relative", transition: "background .15s",
                  }}
                >
                  <motion.div
                    animate={{ opacity: menuFocus === MENU_ITEMS.length ? 1 : 0, scaleY: menuFocus === MENU_ITEMS.length ? 1 : 0.4 }}
                    transition={{ duration: 0.15 }}
                    style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: 2, background: "#e74c3c", boxShadow: "0 0 8px #e74c3c" }}
                  />
                  <LogOut size={menuFocus === MENU_ITEMS.length ? 26 : 22} color="rgba(231,76,60,.85)" style={{ flexShrink: 0, transition: "all .15s" }} />
                  <div style={{ overflow: "hidden", flex: 1 }}>
                    {menuFocus === MENU_ITEMS.length ? (
                      <div style={{ display: "flex", overflow: "hidden" }}>
                        <motion.span
                          key="marquee-exit"
                          animate={{ x: ["-0%", "-50%"] }}
                          transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                          style={{
                            display: "flex", gap: 48, whiteSpace: "nowrap",
                            fontWeight: 700, color: "rgba(231,76,60,.95)",
                            fontSize: 16, letterSpacing: 1.5,
                            fontFamily: "'LemonMilk', 'Segoe UI', sans-serif",
                          }}
                        >
                          <span>C-ONE'DAN ÇIK</span>
                          <span>C-ONE'DAN ÇIK</span>
                        </motion.span>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 700, color: "rgba(231,76,60,.85)", fontSize: 14, letterSpacing: 1.5, whiteSpace: "nowrap", fontFamily: "'LemonMilk', 'Segoe UI', sans-serif" }}>C-ONE'DAN ÇIK</span>
                    )}
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ÜST BAR ── */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 28px", gap: 18 }}>
        {/* Ortalanmış dots navigasyon */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, alignItems: "center", zIndex: 1 }}>
          {games.map((g, i) => (
            g.favorite ? (
              <div key={i}
                onClick={() => { playSelectSound(); setDirection(i > active ? 1 : -1); setActive(i); }}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: i === active ? 1 : 0.5, transition: "all .3s ease", filter: i === active ? `drop-shadow(0 0 4px #f5a623)` : "none" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill={i === active ? "#f5a623" : "rgba(255,255,255,.6)"} stroke={i === active ? "#f5a623" : "rgba(255,255,255,.4)"} strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            ) : (
              <div key={i}
                onClick={() => { playSelectSound(); setDirection(i > active ? 1 : -1); setActive(i); }}
                style={{
                  width: i === active ? 24 : 6, height: 6, borderRadius: 3, cursor: "pointer",
                  background: i === active ? (game?.accent || "#f5a623") : "rgba(255,255,255,.2)",
                  transition: "all .3s ease",
                  boxShadow: i === active ? `0 0 8px ${game?.accent || "#f5a623"}80` : "none",
                }}
              />
            )
          ))}
          <button onClick={() => { playSelectSound(); setAddOpen(true); }}
            style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2, transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,166,35,.2)"; e.currentTarget.style.borderColor = "#f5a623"; e.currentTarget.style.color = "#f5a623"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; e.currentTarget.style.color = "rgba(255,255,255,.5)"; }}
          >
            <Plus size={9} />
          </button>
        </div>
        {/* Sol — C-ONE + Oyunlar */}
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 1.5 }}>C-ONE</span>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginTop: 2, lineHeight: 1 }}>Oyunlar</h2>
        </div>
        {/* Sağ — ikonlar */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* Arama */}
        <button onClick={() => setSearchOpen(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", transition: "color .2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}
        >
          <Search size={18} />
        </button>
        {/* Website */}
        <button onClick={() => { playSelectSound(); openUrl("https://corleoneteam.com.tr").catch(() => {}); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", transition: "color .2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}
        >
          <Globe size={18} />
        </button>
        {/* Saat */}
        <Clock />
        {/* Avatar + dropdown */}
        <div ref={avatarMenuRef} style={{ position: "relative" }} onPointerDown={e => e.stopPropagation()}>
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=333&color=f5a623`}
            onPointerDown={e => { e.stopPropagation(); setAvatarMenuOpen(o => !o); }}
            style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${avatarMenuOpen ? (game?.accent || "#f5a623") : "rgba(255,255,255,.2)"}`, objectFit: "cover", cursor: "pointer", transition: "border-color .2s", boxShadow: avatarMenuOpen ? `0 0 12px ${game?.accent || "#f5a623"}60` : "none" }}
          />
          {avatarMenuOpen && createPortal(
            <div
              id="avatar-dropdown-portal"
              onPointerDown={e => e.stopPropagation()}
              style={{ position: "fixed", top: 54, right: 28, zIndex: 99999, width: 210, background: "rgba(10,10,18,.98)", border: `1px solid rgba(245,166,35,.3)`, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.9)" }}
            >
              {/* Kullanıcı özeti */}
              <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10 }}>
                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=333&color=f5a623`}
                  style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(245,166,35,.5)", objectFit: "cover", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.username}</div>
                  <div style={{ fontSize: 9, color: "#f5a623", fontWeight: 700, letterSpacing: 1 }}>{(user?.role || "ÜYE").toUpperCase()}</div>
                </div>
              </div>
              {[
                { icon: "👤", label: "Profil & Ayarlar", action: () => { setAvatarMenuOpen(false); setProfileOpen(true); } },
                { icon: "💬", label: "Sohbet",           action: () => { setAvatarMenuOpen(false); setChatOpen(true); } },
                { icon: "🌐", label: "Website",          action: () => { setAvatarMenuOpen(false); openUrl("https://corleoneteam.com.tr").catch(() => {}); } },
              ].map(item => (
                <div key={item.label}
                  onPointerDown={e => { e.stopPropagation(); item.action(); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", color: "rgba(255,255,255,.8)", fontSize: 12, fontWeight: 600, cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.05)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.07)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span>{item.icon}</span> {item.label}
                </div>
              ))}
              <div
                onPointerDown={e => { e.stopPropagation(); setAvatarMenuOpen(false); logout(); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", color: "rgba(231,76,60,.8)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(231,76,60,.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span>🚪</span> Çıkış Yap
              </div>
            </div>
          , document.body)}
        </div>
        </div>
      </div>

      {/* ── ANA İÇERİK ── */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Oyun adı — üst bara sabitli, kartlardan bağımsız */}
        {game && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${active}`}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              style={{ position: "absolute", top: 10, left: 0, right: 0, textAlign: "center", zIndex: 5, pointerEvents: "none" }}
            >
              <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: 0.5, lineHeight: 1.2, textShadow: "0 2px 20px rgba(0,0,0,.9)" }}>{game.title}</div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Kartlar + Alt menü — tek kaydırılabilir blok */}
        <motion.div
          animate={{ y: focusZone === "cards" ? 0 : 0 }}
          style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}
        >
          {/* Kartlar alanı */}
          <motion.div
            animate={{
              flex: focusZone === "cards" ? "1 1 auto" : "0 0 auto",
              paddingTop: focusZone === "cards" ? 0 : 4,
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", overflow: "hidden", position: "relative" }}
          >
            {/* Kartlar satırı */}
            <motion.div
              animate={{
                scale: focusZone === "content" ? 0.55 : focusZone === "cards" ? 1.0 : 0.62,
                opacity: focusZone === "content" ? 0.2 : 1,
                filter: focusZone === "content" ? "blur(6px)" : "blur(0px)",
                y: focusZone === "cards" ? 0 : -10,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "center", width: "100%", flexShrink: 0, transformOrigin: "center center", pointerEvents: focusZone === "content" ? "none" : "auto" }}
            onWheel={e => { if (focusZone !== "content" && Math.abs(e.deltaX) + Math.abs(e.deltaY) > 10) { e.preventDefault(); go(e.deltaY > 0 || e.deltaX > 0 ? 1 : -1); } }}
            >

          {games.length === 0 ? (
            /* Boş durum */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "40px 0" }}
            >
              <div style={{ width: 80, height: 110, borderRadius: 10, border: "2px dashed rgba(245,166,35,.3)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,166,35,.04)" }}>
                <Plus size={28} color="rgba(245,166,35,.4)" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.6)", marginBottom: 6 }}>Henüz oyun eklenmedi</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginBottom: 16 }}>Steam kütüphanenden oyun ekleyerek başla</div>
                <button onClick={() => { playSelectSound(); setAddOpen(true); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 9, background: "#f5a623", border: "none", color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(245,166,35,.4)" }}
                >
                  <Plus size={14} /> OYUN EKLE
                </button>
              </div>
            </motion.div>
          ) : (
          <>
          {/* Büyük aktif kart */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`hero-${active}`}
                custom={direction}
                variants={{
                  enter: d => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
                  center: { opacity: 1, x: 0 },
                  exit: d => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
                }}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: focusZone === "cards" ? "var(--c1-hero-w)" : "var(--c1-hero-w-sm)",
                  height: focusZone === "cards" ? "var(--c1-hero-h)" : "var(--c1-hero-h-sm)",
                  borderRadius: 12, overflow: "hidden",
                  border: `2px solid ${focusZone === "cards" ? (game?.accent || "#f5a623") : (game?.accent || "#f5a623") + "60"}`,
                  boxShadow: focusZone === "cards"
                    ? `0 0 0 3px ${game?.accent || "#f5a623"}40, 0 0 80px ${game?.accent || "#f5a623"}70, 0 30px 80px rgba(0,0,0,.8)`
                    : `0 0 40px ${game?.accent || "#f5a623"}30, 0 20px 60px rgba(0,0,0,.7)`,
                  background: "#111", position: "relative", cursor: "pointer",
                  transition: "width .4s cubic-bezier(0.16,1,0.3,1), height .4s cubic-bezier(0.16,1,0.3,1), box-shadow .3s, border-color .3s",
                }}
                onClick={() => { playSelectSound(); setDetailGame(game); }}
              >
                {game.cover
                  ? <img src={game.cover} style={{ width: "100%", height: "100%", objectFit: game.id === "truckersmp" ? "contain" : "cover", background: game.id === "truckersmp" ? "#1a1a2e" : undefined }} />
                  : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, #1a0030, #0d0d0d)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 48, opacity: 0.2 }}>?</span>
                    </div>
                }
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 50%)" }} />
                {/* Favori rozet */}
                <AnimatePresence>
                  {game.favorite && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        position: "absolute", top: 0, left: 0, right: 0,
                        background: "linear-gradient(180deg, rgba(245,166,35,.55) 0%, transparent 100%)",
                        padding: "10px 12px 18px",
                        display: "flex", alignItems: "center", gap: 5,
                        pointerEvents: "none",
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#f5a623" stroke="#f5a623" strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span style={{ fontSize: 8, fontWeight: 900, color: "#f5a623", letterSpacing: 1.5 }}>FAVORİ</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {game.tag && (
                  <span style={{ position: "absolute", top: 12, left: 12, fontSize: 9, fontWeight: 900, letterSpacing: 1.2, color: "#fff", background: game.tagColor, padding: "3px 10px", borderRadius: 4 }}>
                    {game.tag}
                  </span>
                )}
                {/* Favori yıldız */}
                <button
                  onClick={e => { e.stopPropagation(); toggleFavorite(game.id); }}
                  style={{
                    position: "absolute", top: 10, right: 10,
                    width: 28, height: 28, borderRadius: "50%",
                    background: game.favorite ? "rgba(245,166,35,.25)" : "rgba(0,0,0,.55)",
                    border: `1px solid ${game.favorite ? "rgba(245,166,35,.6)" : "rgba(255,255,255,.15)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all .2s",
                    boxShadow: game.favorite ? "0 0 10px rgba(245,166,35,.5)" : "none",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,166,35,.3)"; e.currentTarget.style.borderColor = "rgba(245,166,35,.8)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = game.favorite ? "rgba(245,166,35,.25)" : "rgba(0,0,0,.55)"; e.currentTarget.style.borderColor = game.favorite ? "rgba(245,166,35,.6)" : "rgba(255,255,255,.15)"; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={game.favorite ? "#f5a623" : "none"} stroke={game.favorite ? "#f5a623" : "rgba(255,255,255,.7)"} strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
                <button onClick={() => go(-1)} onMouseEnter={() => playHoverSound()} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => go(1)} onMouseEnter={() => playHoverSound()} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            </AnimatePresence>
            {/* Kart altı — boş, butonlar kaldırıldı */}
          </div>

          {/* Küçük kartlar + oyun ekle kartı */}
          {[-3, -2, -1, 1, 2, 3].map(offset => {
            const idx = active + offset;
            const g = (idx >= 0 && idx < games.length) ? games[idx] : null;
            const dist = Math.abs(offset);
            const cardH = dist === 1 ? "var(--c1-card1-h)" : dist === 2 ? "var(--c1-card2-h)" : "var(--c1-card3-h)";
            const cardW = dist === 1 ? "var(--c1-card1-w)" : dist === 2 ? "var(--c1-card2-w)" : "var(--c1-card3-w)";
            const op = focusZone === "cards" ? (dist === 1 ? 1 : dist === 2 ? 0.7 : 0.45) : (dist === 1 ? 0.35 : dist === 2 ? 0.25 : 0.15);
            // Sınır dışı slot — sağ tarafsa oyun ekle kartı, sol tarafsa boşluk
            if (!g) {
              if (offset > 0 && active + offset === games.length) {
                return (
                  <motion.div
                    key="add-game"
                    onClick={() => { playSelectSound(); setAddOpen(true); }}
                    onMouseEnter={() => playHoverSound()}
                    whileHover={{ scale: 1.04, y: -4 }}
                    animate={{ opacity: focusZone === "cards" ? (dist === 1 ? 0.85 : 0.55) : 0.25, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: cardW, height: cardH, borderRadius: 10, flexShrink: 0,
                      border: "2px dashed rgba(245,166,35,.4)", background: "rgba(245,166,35,.05)",
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                      order: offset + 10,
                    }}
                  >
                    <Plus size={dist === 1 ? 22 : 16} color="rgba(245,166,35,.7)" />
                    {dist === 1 && <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(245,166,35,.7)", letterSpacing: 1.5 }}>OYUN EKLE</span>}
                  </motion.div>
                );
              }
              return (
                <div
                  key={`empty-${offset}`}
                  style={{
                    width: cardW, height: cardH, borderRadius: 10, flexShrink: 0,
                    order: offset < 0 ? offset : offset + 10,
                    border: "1px dashed rgba(255,255,255,.06)",
                    background: "rgba(255,255,255,.02)",
                    opacity: dist === 1 ? 0.4 : dist === 2 ? 0.25 : 0.12,
                  }}
                />
              );
            }
            return (
              <motion.div
                key={`${g.id}-${offset}`}
                onClick={() => { playSelectSound(); setDirection(offset > 0 ? 1 : -1); setActive(idx); }}
                onMouseEnter={() => playHoverSound()}
                whileHover={{ scale: 1.04, y: -4 }}
                animate={{ opacity: op, scale: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: cardW, height: cardH, borderRadius: 10, overflow: "hidden",
                  border: "1px solid rgba(255,255,255,.1)",
                  background: "#111", cursor: "pointer", position: "relative", flexShrink: 0,
                  boxShadow: "0 8px 32px rgba(0,0,0,.5)",
                  order: offset < 0 ? offset : offset + 10,
                }}
              >
                {g.cover
                  ? <img src={g.cover} style={{ width: "100%", height: "100%", objectFit: g.id === "truckersmp" ? "contain" : "cover", background: g.id === "truckersmp" ? "#1a1a2e" : undefined }} />
                  : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, #1a0030, #0d0d0d)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 28, opacity: 0.2 }}>?</span>
                    </div>
                }
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.5) 0%, transparent 60%)" }} />
                {g.tag && (
                  <span style={{ position: "absolute", top: 8, left: 8, fontSize: 8, fontWeight: 900, letterSpacing: 1, color: "#fff", background: g.tagColor, padding: "2px 7px", borderRadius: 3 }}>
                    {g.tag}
                  </span>
                )}
                {g.favorite && (
                  <div style={{ position: "absolute", top: 6, right: 6 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#f5a623" stroke="#f5a623" strokeWidth="1">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                )}
              </motion.div>
            );
          })}
          </>
          )}
            </motion.div>
          </motion.div>

          {/* Tab menüsü + İçerik — cards zone'da aşağıda gizli, tabs/content'te yukarı kayar */}
          <motion.div
            animate={{
              opacity: 1,
              y: 0,
              pointerEvents: focusZone === "cards" ? "none" : "auto",
              marginTop: focusZone === "cards" ? 0 : -20,
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden", flex: focusZone === "cards" ? "0 0 auto" : "1 1 auto" }}
          >
            {/* Tab menüsü */}
            <motion.div
              animate={{ opacity: focusZone === "cards" ? 0.3 : 1, height: "auto", marginTop: 10, overflow: "hidden" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", gap: 4, flexShrink: 0, justifyContent: "center", padding: "4px 8px", borderRadius: 24, background: focusZone === "tabs" ? "rgba(255,255,255,.06)" : "transparent", border: focusZone === "tabs" ? "1px solid rgba(255,255,255,.12)" : "1px solid transparent", transition: "background .25s, border .25s", pointerEvents: focusZone === "cards" ? "none" : "auto" }}
            >
              {TABS.map((tab, i) => (
                <button key={tab}
                  onClick={() => { playSelectSound(); setActiveTab(i); setFocusZone("tabs"); }}
                  onMouseEnter={() => { playHoverSound(); setFocusZone("tabs"); }}
                  style={{
                    padding: "6px 18px", borderRadius: 20, border: "none", cursor: "pointer",
                    background: activeTab === i
                      ? focusZone === "tabs" ? (game?.accent || "#f5a623") : "rgba(255,255,255,.15)"
                      : "transparent",
                    color: activeTab === i
                      ? focusZone === "tabs" ? "#000" : "#fff"
                      : "rgba(255,255,255,.4)",
                    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                    transition: "all .2s",
                    boxShadow: activeTab === i && focusZone === "tabs" ? `0 0 12px ${game?.accent || "#f5a623"}60` : "none",
                  }}
                >{tab}</button>
              ))}
            </motion.div>

            {/* Tab içeriği */}
            {focusZone !== "cards" && <AnimatePresence mode="wait">
              <motion.div
                key={`tab-${activeTab}-${active}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                style={{ width: "100%", marginTop: 10, flex: 1, overflow: "hidden", padding: "0 24px" }}
              >
                {activeTab === 0 && game && <TabUpdates game={game} accent={game.accent} expanded={focusZone === "content"} />}
                {activeTab === 1 && game && <TabNews game={game} accent={game.accent} expanded={focusZone === "content"} />}
                {activeTab === 2 && game && <TabEvents game={game} accent={game.accent} expanded={focusZone === "content"} />}
                {activeTab === 3 && game && <TabDownloads game={game} accent={game.accent} expanded={focusZone === "content"} />}
                {activeTab === 4 && game && <TabMedia game={game} accent={game.accent} expanded={focusZone === "content"} />}
              </motion.div>
            </AnimatePresence>}
          </motion.div>

        </motion.div>
      </div>

      {/* ── ALT BAR ── */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 24px",
          background: "rgba(0,0,0,.6)",
          borderTop: "1px solid rgba(255,255,255,.06)",
          backdropFilter: "blur(12px)",
          pointerEvents: "auto",
        }}>
        {/* Sol — C-ONE MENÜ */}
        <button onClick={() => { playSelectSound(); setMenuOpen(true); }} style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 8, padding: "6px 16px", cursor: "pointer", transition: "all .2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,166,35,.15)"; e.currentTarget.style.borderColor = "rgba(245,166,35,.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; }}
        >
          <span style={{ fontSize: 10, fontWeight: 900, color: "#f5a623", background: "rgba(245,166,35,.15)", border: "1px solid #7c3aed", padding: "2px 8px", borderRadius: 4, letterSpacing: 2 }}>C-ONE</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: 0.5 }}>MENÜ</span>
        </button>
        {/* Sağ — kontrol ipuçları */}
        <motion.div animate={{ opacity: focusZone === "cards" ? 0.3 : 1 }} transition={{ duration: 0.3 }} style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {[
            { key: "←→", label: "GEZİN" },
            { key: "↑↓", label: "TAB" },
            { key: "A",  label: "SEÇ" },
            { key: "B / ESC", label: "GERİ" },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: "#000",
                background: "rgba(255,255,255,.85)", borderRadius: 5,
                padding: "2px 7px", letterSpacing: 0.3,
              }}>{key}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.45)", letterSpacing: 0.5 }}>{label}</span>
            </div>
          ))}
 </motion.div>
      </motion.div>
    </div>
  );
}
