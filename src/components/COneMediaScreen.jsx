import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { mediaApi } from "../lib/api";
import { ChevronLeft, HardDrive, Image, Monitor, X, Trash2, Upload } from "lucide-react";
import { readFile } from "@tauri-apps/plugin-fs";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const GAMES_WITH_SCREENSHOTS = [
  { id: "ets2",    title: "Euro Truck Simulator 2",   dir: "Euro Truck Simulator 2" },
  { id: "ats",     title: "American Truck Simulator", dir: "American Truck Simulator" },
  { id: "assetto", title: "Assetto Corsa",            dir: "Assetto Corsa" },
  { id: "cp2077",  title: "Cyberpunk 2077",           dir: "Cyberpunk 2077" },
  { id: "csgo",    title: "CS:GO",                    dir: "Counter-Strike Global Offensive" },
];

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function StorageBar({ usedBytes, quotaMb, accent }) {
  const usedMb  = usedBytes / 1024 / 1024;
  const freeMb  = Math.max(0, quotaMb - usedMb);
  const usedPct = Math.min(100, (usedMb / quotaMb) * 100);
  const color   = usedPct > 85 ? "#e74c3c" : usedPct > 60 ? "#f5a623" : "#2ecc71";
  return (
    <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HardDrive size={13} color={color} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: 0.5 }}>WEB DEPOLAMA</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{usedMb.toFixed(1)} / {quotaMb} MB</span>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,.08)", overflow: "hidden", marginBottom: 8 }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${usedPct}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: "100%", borderRadius: 6, background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 8px ${color}60` }} />
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        {[
          { label: "Kullanılan", value: formatSize(usedBytes), color },
          { label: "Boş",        value: formatSize(freeMb * 1024 * 1024), color: "rgba(255,255,255,.4)" },
          { label: "Toplam",     value: `${quotaMb} MB`, color: "rgba(255,255,255,.3)" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>{s.label}:</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,.3)" }}>%{usedPct.toFixed(1)} dolu</span>
      </div>
    </div>
  );
}

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,.95)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>
      <motion.img src={src} initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: 10, boxShadow: "0 0 80px rgba(0,0,0,.9)" }} />
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <X size={16} />
      </button>
    </motion.div>
  );
}

function PCScreenshots({ accent }) {
  const [selectedGame, setSelectedGame] = useState(GAMES_WITH_SCREENSHOTS[0]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [page, setPage] = useState(0);
  const PER_PAGE = 28;

  useEffect(() => {
    setLoading(true);
    setFiles([]);
    setPage(0);
    invoke("get_game_screenshots", { gameDir: selectedGame.dir })
      .then(r => setFiles(r.files || []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [selectedGame.id]);

  const totalPages = Math.ceil(files.length / PER_PAGE);
  const pageFiles  = files.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Oyun seçici */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", flexShrink: 0 }}>
        {GAMES_WITH_SCREENSHOTS.map(g => (
          <button key={g.id} onClick={() => setSelectedGame(g)}
            style={{
              padding: "5px 14px", borderRadius: 20, border: `1px solid ${selectedGame.id === g.id ? accent : "rgba(255,255,255,.12)"}`,
              background: selectedGame.id === g.id ? `${accent}20` : "rgba(255,255,255,.04)",
              color: selectedGame.id === g.id ? accent : "rgba(255,255,255,.5)",
              fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
            }}>
            {g.title}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid rgba(255,255,255,.15)`, borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Yükleniyor...</span>
        </div>
      ) : files.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 8 }}>
          <Monitor size={32} color="rgba(255,255,255,.1)" />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.2)" }}>Ekran görüntüsü bulunamadı.</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.12)" }}>Oyunu oynayıp F12 ile screenshot al</div>
        </div>
      ) : (
        <>
          {/* Bilgi + sayfalama üst */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>
              {files.length} ekran görüntüsü · Sayfa {page + 1} / {totalPages}
            </span>
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${page === 0 ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.2)"}`, background: "rgba(255,255,255,.04)", color: page === 0 ? "rgba(255,255,255,.2)" : "#fff", cursor: page === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${p === page ? accent : "rgba(255,255,255,.1)"}`, background: p === page ? `${accent}25` : "rgba(255,255,255,.04)", color: p === page ? accent : "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "inherit" }}>
                      {p + 1}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                  style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${page === totalPages - 1 ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.2)"}`, background: "rgba(255,255,255,.04)", color: page === totalPages - 1 ? "rgba(255,255,255,.2)" : "#fff", cursor: page === totalPages - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                  ›
                </button>
              </div>
            )}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, flex: 1, alignContent: "start", overflowY: "auto" }}>
            {pageFiles.map((f) => {
              const src = convertFileSrc(f.path);
              return (
                <div key={f.path}
                  onClick={() => setLightbox(src)}
                  style={{ aspectRatio: "16/9", borderRadius: 8, overflow: "hidden", cursor: "zoom-in", border: "1px solid rgba(255,255,255,.08)", position: "relative", transition: "transform .15s, border-color .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.borderColor = `${accent}60`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; }}
                >
                  <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" decoding="async" />
                </div>
              );
            })}
          </div>

          {/* Alt sayfalama */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 14, flexShrink: 0 }}>
              <button onClick={() => setPage(0)} disabled={page === 0}
                style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${page === 0 ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.15)"}`, background: "rgba(255,255,255,.04)", color: page === 0 ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.6)", cursor: page === 0 ? "not-allowed" : "pointer", fontSize: 10, fontFamily: "inherit" }}>
                İlk
              </button>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${page === 0 ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.2)"}`, background: "rgba(255,255,255,.04)", color: page === 0 ? "rgba(255,255,255,.2)" : "#fff", cursor: page === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                ‹
              </button>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)", padding: "0 8px" }}>{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${page === totalPages - 1 ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.2)"}`, background: "rgba(255,255,255,.04)", color: page === totalPages - 1 ? "rgba(255,255,255,.2)" : "#fff", cursor: page === totalPages - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                ›
              </button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}
                style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${page === totalPages - 1 ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.15)"}`, background: "rgba(255,255,255,.04)", color: page === totalPages - 1 ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.6)", cursor: page === totalPages - 1 ? "not-allowed" : "pointer", fontSize: 10, fontFamily: "inherit" }}>
                Son
              </button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </div>
  );
}

function WebMedia({ accent, onQuotaLoad }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [quota, setQuota]       = useState({ used: 0, total: 200 });
  const [lightbox, setLightbox] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview]   = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const fileRef = useRef();
  const dropHandled = useRef(false);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let unlisten;
    getCurrentWebviewWindow().onDragDropEvent(e => {
      if (e.payload.type === "over") setDragging(true);
      else if (e.payload.type === "leave" || e.payload.type === "cancelled") setDragging(false);
      else if (e.payload.type === "drop") {
        setDragging(false);
        if (dropHandled.current) return;
        dropHandled.current = true;
        setTimeout(() => { dropHandled.current = false; }, 500);
        const paths = (e.payload.paths || []).filter(p => /\.(jpg|jpeg|png|webp|gif)$/i.test(p));
        if (paths.length) addFromPaths(paths);
      }
    }).then(fn => { unlisten = fn; });
    return () => { if (unlisten) unlisten(); };
  }, []);

  const load = () => {
    setLoading(true);
    mediaApi.list().then(r => {
      const d = r.data.data || {};
      setItems(d.items || []);
      const q = { used: d.used_bytes || 0, total: d.quota_mb || 200 };
      setQuota(q);
      onQuotaLoad?.(q);
    }).finally(() => setLoading(false));
  };

  const addFromPaths = async (paths) => {
    const entries = await Promise.all(paths.map(async path => {
      const name = path.split(/[\\/]/).pop();
      const ext  = name.split(".").pop().toLowerCase();
      const mime = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" }[ext] || "image/jpeg";
      try {
        const bytes = await readFile(path);
        const file  = new File([new Blob([bytes], { type: mime })], name, { type: mime });
        const prev  = await new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
        return { id: Math.random(), file, preview: prev, status: "waiting" };
      } catch { return null; }
    }));
    setPreview(p => [...p, ...entries.filter(Boolean)]);
  };

  const addFromFiles = async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    const entries = await Promise.all(valid.map(async file => {
      const prev = await new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
      return { id: Math.random(), file, preview: prev, status: "waiting" };
    }));
    setPreview(p => [...p, ...entries]);
  };

  const startUpload = async () => {
    const pending = preview.filter(i => i.status === "waiting");
    if (!pending.length) return;
    setUploading(true);
    for (const item of pending) {
      setPreview(p => p.map(i => i.id === item.id ? { ...i, status: "uploading" } : i));
      try {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("title", item.file.name.replace(/\.[^.]+$/, ""));
        await mediaApi.upload(fd);
        setPreview(p => p.map(i => i.id === item.id ? { ...i, status: "done" } : i));
      } catch {
        setPreview(p => p.map(i => i.id === item.id ? { ...i, status: "error" } : i));
      }
    }
    setUploading(false);
    setPreview([]);
    load();
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    await mediaApi.delete(id);
    setItems(p => p.filter(i => i.id !== id));
    setDeleteId(null);
  };

  return (
    <div>
      {/* Depolama barı */}
      <div style={{ marginBottom: 16 }}>
        <StorageBar usedBytes={quota.used} quotaMb={quota.total} accent={accent} />
      </div>

      {/* Upload alanı */}
      <div
        onClick={() => fileRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFromFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragging ? accent : "rgba(255,255,255,.12)"}`,
          borderRadius: 10, padding: "16px", textAlign: "center", cursor: "pointer",
          background: dragging ? `${accent}08` : "rgba(255,255,255,.02)",
          transition: "all .2s", marginBottom: 14,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = `${accent}60`}
        onMouseLeave={e => e.currentTarget.style.borderColor = dragging ? accent : "rgba(255,255,255,.12)"}
      >
        <Upload size={18} color={`${accent}80`} style={{ marginBottom: 6 }} />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 600 }}>Dosya sürükle veya tıkla</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,.2)", marginTop: 3 }}>JPEG, PNG, WebP, GIF</div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={e => { addFromFiles(e.target.files); e.target.value = ""; }} />

      {/* Önizleme */}
      {preview.length > 0 && (
        <div style={{ marginBottom: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>{preview.length} dosya seçildi</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPreview([])} style={{ fontSize: 10, color: "rgba(255,255,255,.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Temizle</button>
              <button onClick={startUpload} disabled={uploading}
                style={{ fontSize: 10, fontWeight: 700, color: "#000", background: accent, border: "none", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontFamily: "inherit", opacity: uploading ? 0.6 : 1 }}>
                {uploading ? "Yükleniyor..." : "Yükle"}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {preview.map(item => (
              <div key={item.id} style={{ position: "relative", width: 60, height: 60, borderRadius: 6, overflow: "hidden", border: `1px solid ${item.status === "done" ? "#2ecc71" : item.status === "error" ? "#e74c3c" : "rgba(255,255,255,.1)"}` }}>
                <img src={item.preview} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: item.status === "uploading" ? 0.5 : 1 }} />
                {item.status === "waiting" && (
                  <button onClick={() => setPreview(p => p.filter(i => i.id !== item.id))}
                    style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: 4, background: "rgba(0,0,0,.7)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={9} color="#fff" />
                  </button>
                )}
                {item.status === "uploading" && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid rgba(255,255,255,.2)`, borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Galeri */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80, gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid rgba(255,255,255,.15)`, borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Yükleniyor...</span>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0", fontSize: 11, color: "rgba(255,255,255,.2)" }}>
          <Image size={24} color="rgba(255,255,255,.1)" style={{ marginBottom: 8 }} />
          <div>Henüz medya yok</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginBottom: 10 }}>{items.length} dosya</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, maxHeight: 300, overflowY: "auto" }}>
            {items.map(item => (
              <motion.div key={item.id} whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}
                style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", cursor: "pointer", border: "1px solid rgba(255,255,255,.08)" }}
                onClick={() => setLightbox(item.url)}>
                <img src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", opacity: 0, transition: "opacity .15s", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 8 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                      style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(231,76,60,.8)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      {deleteId === item.id
                        ? <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
                        : <Trash2 size={11} color="#fff" />}
                    </button>
                  </div>
                  <div>
                    {item.title && <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>}
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{formatSize(item.file_size)}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </div>
  );
}

export default function COneMediaScreen({ onBack, accent = "#f5a623" }) {
  const [tab, setTab] = useState("pc"); // "pc" | "web"

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onBack(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onBack]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", inset: 0, zIndex: 20, background: "#0a0a0f", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "var(--c1-font, 'LemonMilk', 'Segoe UI', sans-serif)", fontSize: `calc(14px * var(--c1-scale, 1))` }}
    >
      {/* Arka plan orb */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`, top: -150, right: -100 }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.1) 0%, transparent 70%)", bottom: -50, left: -50 }} />
      </div>

      {/* Üst bar */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 14, padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.12)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s", fontFamily: "inherit" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}60`; e.currentTarget.style.color = accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "#fff"; }}>
          <ChevronLeft size={14} /> GERİ
        </button>
        <div>
          <div style={{ fontSize: 9, color: accent, letterSpacing: 2, marginBottom: 2 }}>C-ONE</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1 }}>Medya</div>
        </div>

        {/* Tab seçici */}
        <div style={{ marginLeft: "auto", display: "flex", background: "rgba(255,255,255,.05)", borderRadius: 10, padding: 4, gap: 3 }}>
          {[
            { key: "pc",  label: "PC Ekran Görüntüleri", icon: Monitor },
            { key: "web", label: "Web Medyası",          icon: Image },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "inherit",
                background: tab === key ? `${accent}20` : "transparent",
                color: tab === key ? accent : "rgba(255,255,255,.4)",
                fontSize: 10, fontWeight: 700, letterSpacing: 0.5, transition: "all .2s",
                boxShadow: tab === key ? `0 0 10px ${accent}30` : "none",
              }}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* İçerik */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, overflow: "hidden", padding: "20px 28px", display: "flex", flexDirection: "column" }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {tab === "pc"  && <PCScreenshots accent={accent} />}
            {tab === "web" && <WebMedia accent={accent} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
