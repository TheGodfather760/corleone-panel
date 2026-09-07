import { useEffect, useState, useRef } from "react";
import { adminApi } from "../../lib/api";
import { Upload, Trash2, Edit2, Check, X } from "lucide-react";

export default function AdminDownloadsPage() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const fileRef = useRef();

  const load = () => {
    adminApi.getDownloads()
      .then(r => setDownloads(r.data.downloads || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", file.name.replace(/\.[^.]+$/, ""));
    try { await adminApi.uploadDownload(fd); load(); } catch {}
    setUploading(false);
    e.target.value = "";
  };

  const remove = async (id) => {
    try { await adminApi.deleteDownload(id); setDownloads(p => p.filter(d => d.id !== id)); } catch {}
  };

  const saveEdit = async () => {
    try { await adminApi.updateDownload({ id: editId, ...editData }); setDownloads(p => p.map(d => d.id === editId ? { ...d, ...editData } : d)); } catch {}
    setEditId(null);
  };

  return (
    <>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Dosya Yönetimi</h1>
          <p className="page-subtitle">{downloads.length} dosya</p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(245,166,35,.15)", border: "1px solid #f5a623", color: "#f5a623", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: uploading ? 0.6 : 1 }}>
          <Upload size={14} /> {uploading ? "Yükleniyor..." : "Dosya Yükle"}
        </button>
        <input ref={fileRef} type="file" style={{ display: "none" }} onChange={upload} />
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Yükleniyor...</div>
        ) : downloads.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Dosya yok.</div>
        ) : downloads.map((d, i) => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < downloads.length - 1 ? "1px solid var(--border)" : "none" }}>
            {editId === d.id ? (
              <>
                <input value={editData.name || ""} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                  style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 10px", color: "#ddd", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                <input value={editData.version || ""} onChange={e => setEditData(p => ({ ...p, version: e.target.value }))}
                  placeholder="Versiyon"
                  style={{ width: 100, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 10px", color: "#ddd", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                <button onClick={saveEdit} style={{ background: "rgba(39,174,96,.15)", border: "1px solid rgba(39,174,96,.3)", color: "#2ecc71", borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}><Check size={13} /></button>
                <button onClick={() => setEditId(null)} style={{ background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.2)", color: "#e74c3c", borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={13} /></button>
              </>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{d.filename} {d.version && `• v${d.version}`}</div>
                </div>
                <span style={{ fontSize: 11, color: "#888" }}>{d.download_count || 0} indirme</span>
                <button onClick={() => { setEditId(d.id); setEditData({ name: d.name, version: d.version }); }}
                  style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#888", borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}><Edit2 size={12} /></button>
                <button onClick={() => remove(d.id)}
                  style={{ background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.2)", color: "#e74c3c", borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={12} /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
