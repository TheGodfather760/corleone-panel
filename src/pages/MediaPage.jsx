import { useState, useEffect, useRef, useCallback } from "react";
import { mediaApi } from "../lib/api";
import { Upload, Trash2, HardDrive, X, Loader, CheckCircle, AlertCircle, Image, ZoomIn, Calendar, Maximize2 } from "lucide-react";
import { readFile } from "@tauri-apps/plugin-fs";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { motion, AnimatePresence } from "framer-motion";

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function readPreview(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function StorageBar({ usedBytes, quotaMb }) {
  const usedMb  = usedBytes / 1024 / 1024;
  const freeMb  = Math.max(0, quotaMb - usedMb);
  const usedPct = Math.min(100, (usedMb / quotaMb) * 100);
  const color   = usedPct > 85 ? "#e74c3c" : usedPct > 60 ? "#f5a623" : "#2ecc71";

  return (
    <div className="card" style={{ marginBottom: 20, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <HardDrive size={15} color={color} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Depolama Alanı</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Medya kotası</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color }}>{usedMb.toFixed(1)} MB</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>/ {quotaMb} MB</div>
        </div>
      </div>

      {/* Bar */}
      <div style={{ height: 8, borderRadius: 8, background: "var(--border)", overflow: "hidden", marginBottom: 10 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${usedPct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: "100%", borderRadius: 8, background: `linear-gradient(90deg, ${color}cc, ${color})`, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>

      {/* Segmentler */}
      <div style={{ display: "flex", gap: 16 }}>
        {[
          { label: "Kullanılan", value: formatSize(usedBytes), color },
          { label: "Boş",        value: formatSize(freeMb * 1024 * 1024), color: "var(--text-muted)" },
          { label: "Toplam",     value: `${quotaMb} MB`, color: "var(--text-secondary)" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}:</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
          %{usedPct.toFixed(1)} dolu
        </div>
      </div>
    </div>
  );
}

function Lightbox({ item, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.94)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}
      >
        <img src={item.url} alt={item.title}
          style={{ maxWidth: "90vw", maxHeight: "82vh", objectFit: "contain", borderRadius: 10, boxShadow: "0 0 80px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.06)" }} />

        {/* Alt bilgi */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            {item.title && <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{item.title}</div>}
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2, display: "flex", gap: 12 }}>
              {item.img_width && <span>{item.img_width}×{item.img_height}</span>}
              <span>{formatSize(item.file_size)}</span>
              {item.created_at && <span>{new Date(item.created_at).toLocaleDateString("tr-TR")}</span>}
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MediaPage() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [quota, setQuota]         = useState({ used: 0, total: 200 });
  const [lightbox, setLightbox]   = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [preview, setPreview]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [deleteId, setDeleteId]   = useState(null);
  const [view, setView]           = useState("grid"); // grid | list

  const fileRef     = useRef();
  const dragCounter = useRef(0);
  const dropHandled = useRef(false);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let unlisten;
    const win = getCurrentWebviewWindow();
    win.onDragDropEvent(e => {
      if (e.payload.type === "over") setDragging(true);
      else if (e.payload.type === "leave" || e.payload.type === "cancelled") setDragging(false);
      else if (e.payload.type === "drop") {
        setDragging(false);
        if (dropHandled.current) return;
        dropHandled.current = true;
        setTimeout(() => { dropHandled.current = false; }, 500);
        const paths = (e.payload.paths || []).filter(p => /\.(jpg|jpeg|png|webp|gif)$/i.test(p));
        if (paths.length) addFilesFromPaths(paths);
      }
    }).then(fn => { unlisten = fn; });
    return () => { if (unlisten) unlisten(); };
  }, []);

  const addFilesFromPaths = useCallback(async (paths) => {
    const entries = await Promise.all(paths.map(async path => {
      const name = path.split(/[\\/]/).pop();
      const ext  = name.split(".").pop().toLowerCase();
      const mime = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" }[ext] || "image/jpeg";
      try {
        const bytes = await readFile(path);
        const file  = new File([new Blob([bytes], { type: mime })], name, { type: mime });
        return { id: Math.random(), file, preview: await readPreview(file), status: "waiting", msg: "" };
      } catch { return null; }
    }));
    setPreview(prev => [...prev, ...entries.filter(Boolean)]);
  }, []);

  const load = () => {
    setLoading(true);
    mediaApi.list().then(r => {
      const d = r.data.data || {};
      setItems(d.items || []);
      setQuota({ used: d.used_bytes || 0, total: d.quota_mb || 200 });
    }).finally(() => setLoading(false));
  };

  const addToPreview = useCallback(async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;
    const entries = await Promise.all(valid.map(async file => ({
      id: Math.random(), file, preview: await readPreview(file), status: "waiting", msg: "",
    })));
    setPreview(prev => [...prev, ...entries]);
  }, []);

  const startUpload = async () => {
    const pending = preview.filter(i => i.status === "waiting");
    if (!pending.length) return;
    setUploading(true);
    for (const item of pending) {
      setPreview(prev => prev.map(i => i.id === item.id ? { ...i, status: "uploading" } : i));
      try {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("title", item.file.name.replace(/\.[^.]+$/, ""));
        await mediaApi.upload(fd);
        setPreview(prev => prev.map(i => i.id === item.id ? { ...i, status: "done" } : i));
      } catch {
        setPreview(prev => prev.map(i => i.id === item.id ? { ...i, status: "error", msg: "Hata" } : i));
      }
    }
    setUploading(false);
    load();
    const hasErrors = preview.some(i => i.status === "error");
    if (!hasErrors) { setUploadDone(true); setPreview([]); setTimeout(() => setUploadDone(false), 2500); }
    else setPreview(prev => prev.filter(i => i.status !== "done"));
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    await mediaApi.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleteId(null);
  };

  const onDragEnter = e => { e.preventDefault(); if (!window.__TAURI__) { dragCounter.current++; setDragging(true); } };
  const onDragLeave = e => { e.preventDefault(); if (!window.__TAURI__) { dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setDragging(false); } } };
  const onDragOver  = e => e.preventDefault();
  const onDrop      = e => { e.preventDefault(); dragCounter.current = 0; setDragging(false); if (!window.__TAURI__) addToPreview(e.dataTransfer.files); };

  const waitingCount = preview.filter(i => i.status === "waiting").length;

  return (
    <div style={{ minHeight: "100%", position: "relative" }}
      onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {dragging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", pointerEvents: "none" }}>
            <div style={{ textAlign: "center", background: "var(--bg-card)", border: "2px dashed var(--accent)", borderRadius: 16, padding: "40px 60px" }}>
              <Upload size={48} color="var(--accent)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>Dosyaları bırak</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Yüklemeden önce önizleyeceksin</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && <Lightbox item={lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Medya</h1>
          <p className="page-subtitle">{items.length} dosya · {formatSize(quota.used)}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Grid/List toggle */}
          <div style={{ display: "flex", background: "var(--bg-elevated)", borderRadius: 8, padding: 3, gap: 2 }}>
            {[{ v: "grid", icon: "⊞" }, { v: "list", icon: "☰" }].map(({ v, icon }) => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: view === v ? "rgba(245,166,35,.2)" : "transparent", color: view === v ? "#f5a623" : "var(--text-muted)", fontSize: 14, cursor: "pointer", transition: "all .2s" }}>
                {icon}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => fileRef.current.click()}>
            <Upload size={14} /> Yükle
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple style={{ display: "none" }}
            onChange={e => { addToPreview(e.target.files); e.target.value = ""; }} />
        </div>
      </div>

      {/* Depolama barı */}
      <StorageBar usedBytes={quota.used} quotaMb={quota.total} />

      {/* Yükleme başarı */}
      <AnimatePresence>
        {uploadDone && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ marginBottom: 16, borderRadius: 12, padding: "16px 20px", background: "rgba(46,204,113,.1)", border: "1px solid rgba(46,204,113,.3)", display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={18} color="#2ecc71" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#2ecc71" }}>Dosyalar başarıyla yüklendi!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Önizleme paneli */}
      {preview.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Önizleme — {preview.length} dosya</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPreview([])} className="btn btn-ghost" style={{ fontSize: 12 }} disabled={uploading}>Temizle</button>
              <button onClick={startUpload} className="btn btn-primary" style={{ fontSize: 12 }} disabled={uploading || waitingCount === 0}>
                {uploading
                  ? <><Loader size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Yükleniyor...</>
                  : <><Upload size={13} /> {waitingCount} Dosyayı Yükle</>}
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
            {preview.map(item => (
              <div key={item.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "1", border: `2px solid ${item.status === "done" ? "#2ecc71" : item.status === "error" ? "#e74c3c" : "var(--border)"}` }}>
                <img src={item.preview} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: item.status === "uploading" ? 0.5 : 1 }} />
                {item.status === "uploading" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.4)" }}><Loader size={20} color="#f5a623" style={{ animation: "spin 0.8s linear infinite" }} /></div>}
                {item.status === "done" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.4)" }}><CheckCircle size={22} color="#2ecc71" /></div>}
                {item.status === "error" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.5)" }}><AlertCircle size={20} color="#e74c3c" /></div>}
                {item.status === "waiting" && (
                  <button onClick={() => setPreview(p => p.filter(i => i.id !== item.id))}
                    style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 5, background: "rgba(0,0,0,.7)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={11} color="#fff" />
                  </button>
                )}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,.6)", padding: "3px 5px" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.6)" }}>{formatSize(item.file.size)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
          <Loader size={20} color="var(--accent)" style={{ animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Yükleniyor...</span>
        </div>
      )}

      {/* Boş durum */}
      {!loading && items.length === 0 && preview.length === 0 && (
        <div style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: "60px 20px", textAlign: "center", cursor: "pointer", transition: "border-color .2s" }}
          onClick={() => fileRef.current.click()}
          onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
          <Image size={40} color="var(--accent)" style={{ marginBottom: 12, opacity: 0.6 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Henüz medya yok</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Dosyaları buraya sürükle veya tıkla · JPEG, PNG, WebP, GIF</div>
        </div>
      )}

      {/* Grid görünümü */}
      {!loading && items.length > 0 && view === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
          {items.map(item => (
            <motion.div key={item.id} layout
              style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "var(--bg-card)", border: "1px solid var(--border)", aspectRatio: "1", cursor: "pointer" }}
              whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}
              onClick={() => setLightbox(item)}
            >
              <img src={item.url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div className="media-overlay"
                style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.8) 0%, rgba(0,0,0,.2) 50%, transparent 100%)", opacity: 0, transition: "opacity .2s", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 10 }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Maximize2 size={13} color="#fff" />
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                    style={{ width: 28, height: 28, borderRadius: 7, background: deleteId === item.id ? "rgba(231,76,60,.9)" : "rgba(231,76,60,.7)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .15s" }}>
                    {deleteId === item.id ? <Loader size={12} color="#fff" style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={12} color="#fff" />}
                  </button>
                </div>
                <div>
                  {item.title && <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>}
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", marginTop: 2, display: "flex", gap: 8 }}>
                    <span>{formatSize(item.file_size)}</span>
                    {item.img_width && <span>{item.img_width}×{item.img_height}</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Liste görünümü */}
      {!loading && items.length > 0 && view === "list" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {items.map((item, i) => (
            <div key={item.id}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 16px", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none", transition: "background .15s", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              onClick={() => setLightbox(item)}
            >
              <img src={item.url} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title || item.filename}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "flex", gap: 10 }}>
                  <span>{formatSize(item.file_size)}</span>
                  {item.img_width && <span>{item.img_width}×{item.img_height}</span>}
                  {item.created_at && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={10} />{new Date(item.created_at).toLocaleDateString("tr-TR")}</span>}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(231,76,60,.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(231,76,60,.1)"; }}
              >
                {deleteId === item.id ? <Loader size={12} color="#e74c3c" style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={12} color="#e74c3c" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
