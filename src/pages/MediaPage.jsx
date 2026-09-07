import { useState, useEffect, useRef, useCallback } from "react";
import { mediaApi } from "../lib/api";
import { Upload, Trash2, HardDrive, X, Loader, CheckCircle, AlertCircle } from "lucide-react";
import { readFile } from "@tauri-apps/plugin-fs";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

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

export default function MediaPage() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [quota, setQuota]       = useState({ used: 0, total: 200 });
  const [lightbox, setLightbox] = useState(null);
  const [dragging, setDragging] = useState(false);

  // Önizleme kuyruğu: { id, file, preview, status, msg }
  const [preview, setPreview]     = useState([]);
  const [uploading, setUploading]  = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  const fileRef      = useRef();
  const dragCounter  = useRef(0);
  const dropHandled  = useRef(false);

  useEffect(() => { load(); }, []);

  // Tauri drag & drop
  useEffect(() => {
    let unlisten;
    const win = getCurrentWebviewWindow();
    win.onDragDropEvent(e => {
      if (e.payload.type === 'over') {
        setDragging(true);
      } else if (e.payload.type === 'leave' || e.payload.type === 'cancelled') {
        setDragging(false);
      } else if (e.payload.type === 'drop') {
        setDragging(false);
        if (dropHandled.current) return;
        dropHandled.current = true;
        setTimeout(() => { dropHandled.current = false; }, 500);
        const paths = e.payload.paths || [];
        const imageExts = ['jpg','jpeg','png','webp','gif'];
        const imagePaths = paths.filter(p => imageExts.some(ext => p.toLowerCase().endsWith('.' + ext)));
        if (imagePaths.length) addFilesFromPaths(imagePaths);
      }
    }).then(fn => { unlisten = fn; });
    return () => { if (unlisten) unlisten(); };
  }, []);

  // Path'ten File objesi oluştur
  const addFilesFromPaths = useCallback(async (paths) => {
    const entries = await Promise.all(paths.map(async (path) => {
      const name = path.split(/[\\/]/).pop();
      const ext  = name.split('.').pop().toLowerCase();
      const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
      const mime = mimeMap[ext] || 'image/jpeg';
      try {
        const bytes = await readFile(path);
        const blob  = new Blob([bytes], { type: mime });
        const file  = new File([blob], name, { type: mime });
        const preview = await readPreview(file);
        return { id: Math.random(), file, preview, status: 'waiting', msg: '' };
      } catch {
        return null;
      }
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

  // Dosyaları önizleme listesine ekle (yükleme YOK)
  const addToPreview = useCallback(async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;
    const entries = await Promise.all(valid.map(async file => ({
      id: Math.random(),
      file,
      preview: await readPreview(file),
      status: "waiting",
      msg: "",
    })));
    setPreview(prev => [...prev, ...entries]);
  }, []);

  // Önizlemeden kaldır
  const removeFromPreview = (id) => setPreview(prev => prev.filter(i => i.id !== id));

  // Onaylayıp yükle
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
      } catch (err) {
        const msg = err.response?.data?.message || "Hata";
        setPreview(prev => prev.map(i => i.id === item.id ? { ...i, status: "error", msg } : i));
      }
    }
    setUploading(false);
    load();
    const hasErrors = preview.some(i => i.status === 'error');
    if (!hasErrors) {
      setUploadDone(true);
      setPreview([]);
      setTimeout(() => setUploadDone(false), 2500);
    } else {
      setPreview(prev => prev.filter(i => i.status !== 'done'));
    }
  };

  const clearPreview = () => { setPreview([]); setUploadDone(false); };

  // HTML drag eventleri (fallback - web modunda)
  const onDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); if (!window.__TAURI__) { dragCounter.current++; setDragging(true); } };
  const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); if (!window.__TAURI__) { dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setDragging(false); } } };
  const onDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop      = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragging(false);
    if (!window.__TAURI__) addToPreview(e.dataTransfer.files);
  };

  const handleDelete = async (id) => {
    await mediaApi.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const usedMb     = quota.used / 1024 / 1024;
  const usedPct    = Math.min(100, (usedMb / quota.total) * 100);
  const quotaColor = usedPct > 85 ? "#e74c3c" : usedPct > 60 ? "#f5a623" : "#27ae60";
  const waitingCount = preview.filter(i => i.status === "waiting").length;

  return (
    <div style={{ minHeight: "100%", position: "relative", outline: dragging ? "3px dashed var(--accent)" : "3px dashed transparent", borderRadius: 12, transition: "outline 0.15s", background: dragging ? "rgba(245,166,35,0.04)" : "transparent" }}
      onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
    >
      {/* Drag overlay */}
      {dragging && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ textAlign: "center", background: "var(--bg-card)", border: "3px dashed var(--accent)", borderRadius: 16, padding: "40px 60px" }}>
            <Upload size={52} color="var(--accent)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", margin: 0 }}>Dosyaları bırak</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>Yüklemeden önce önizleyeceksin</p>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
            <X size={28} />
          </button>
          <img src={lightbox.url} alt={lightbox.title} style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Medya</h1>
          <p className="page-subtitle">{items.length} dosya</p>
        </div>
        <button className="btn btn-primary" onClick={() => fileRef.current.click()}>
          <Upload size={14} />Dosya Seç
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple style={{ display: "none" }}
          onChange={e => { addToPreview(e.target.files); e.target.value = ""; }} />
      </div>

      {/* Kota */}
      <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <HardDrive size={13} />Depolama
          </span>
          <span style={{ fontSize: 12, color: quotaColor, fontWeight: 700 }}>{usedMb.toFixed(1)} / {quota.total} MB</span>
        </div>
        <div style={{ height: 4, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${usedPct}%`, background: quotaColor, borderRadius: 4, transition: "width 0.4s" }} />
        </div>
      </div>

      {/* Yükleme başarı mesajı */}
      {uploadDone && (
        <div style={{ marginBottom: 20, borderRadius: 12, padding: "32px 20px", background: "rgba(39,174,96,0.12)", border: "2px solid rgba(39,174,96,0.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <CheckCircle size={40} color="#27ae60" />
          <p style={{ fontSize: 15, fontWeight: 700, color: "#27ae60", margin: 0 }}>Dosyalar yüklendi!</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Galeri güncellendi</p>
        </div>
      )}

      {/* Önizleme paneli */}
      {preview.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              Önizleme — {preview.length} dosya
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={clearPreview} className="btn btn-ghost" style={{ fontSize: 12 }} disabled={uploading}>
                Tümünü Kaldır
              </button>
              <button onClick={startUpload} className="btn btn-primary" style={{ fontSize: 12 }} disabled={uploading || waitingCount === 0}>
                {uploading ? <><Loader size={13} style={{ animation: "spin 0.8s linear infinite" }} />Yükleniyor...</> : <><Upload size={13} />{waitingCount} Dosyayı Yükle</>}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
            {preview.map(item => (
              <div key={item.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "1", border: `2px solid ${item.status === "done" ? "#27ae60" : item.status === "error" ? "#e74c3c" : "var(--border)"}` }}>
                <img src={item.preview} alt={item.file.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: item.status === "uploading" ? 0.5 : 1 }} />

                {/* Durum overlay */}
                {item.status === "uploading" && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
                    <Loader size={22} color="var(--accent)" style={{ animation: "spin 0.8s linear infinite" }} />
                  </div>
                )}
                {item.status === "done" && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
                    <CheckCircle size={24} color="#27ae60" />
                  </div>
                )}
                {item.status === "error" && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", flexDirection: "column", gap: 4, padding: 6 }}>
                    <AlertCircle size={20} color="#e74c3c" />
                    <span style={{ fontSize: 9, color: "#e74c3c", textAlign: "center" }}>{item.msg}</span>
                  </div>
                )}

                {/* Kaldır butonu — sadece waiting durumunda */}
                {item.status === "waiting" && (
                  <button onClick={() => removeFromPreview(item.id)}
                    style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 6, background: "rgba(0,0,0,0.7)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={12} color="#fff" />
                  </button>
                )}

                {/* Dosya adı */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", padding: "3px 5px" }}>
                  <p style={{ fontSize: 9, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.file.name}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", margin: 0 }}>{formatSize(item.file.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boş durum */}
      {!loading && items.length === 0 && preview.length === 0 && (
        <div className="empty-state" style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: "60px 20px", cursor: "pointer" }}
          onClick={() => fileRef.current.click()}>
          <Upload size={40} color="var(--accent)" />
          <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Dosyaları buraya sürükle veya tıkla</p>
          <p style={{ fontSize: 12 }}>JPEG, PNG, WebP, GIF — max 10MB</p>
        </div>
      )}

      {/* Galeri */}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {items.map(item => (
            <div key={item.id}
              style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "var(--bg-card)", border: "1px solid var(--border)", aspectRatio: "1", cursor: "pointer" }}
              onClick={() => setLightbox(item)}
            >
              <img src={item.url} alt={item.title || item.filename} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", opacity: 0, transition: "opacity 0.18s", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 8 }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                    style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(231,76,60,0.85)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Trash2 size={12} color="#fff" />
                  </button>
                </div>
                <div>
                  {item.title && <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>}
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                    {formatSize(item.file_size)}{item.img_width ? ` · ${item.img_width}×${item.img_height}` : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
