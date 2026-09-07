import { useEffect, useState, useRef } from "react";
import { adminApi } from "../../lib/api";
import { Upload, Trash2, Pencil, Check, X, FileIcon, ImageIcon, Download } from "lucide-react";

const CATEGORIES = ["general", "mod", "skin", "tool", "other"];
const CAT_LABELS  = { general: "Genel", mod: "Mod", skin: "Skin", tool: "Araç", other: "Diğer" };
const CAT_COLORS  = { general: "#888", mod: "#3498db", skin: "#9b59b6", tool: "#1abc9c", other: "#666" };

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

const inputStyle = {
  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
  padding: "8px 12px", color: "#ddd", fontSize: 13, outline: "none", fontFamily: "inherit",
};

function UploadForm({ onUploaded, onCancel }) {
  const [form, setForm]         = useState({ title: "", description: "", category: "general", version: "" });
  const [file, setFile]         = useState(null);
  const [thumb, setThumb]       = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState("");
  const fileRef  = useRef();
  const thumbRef = useRef();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const pickThumb = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setThumb(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!form.title.trim() || !file) { setError("Başlık ve dosya zorunludur."); return; }
    setUploading(true); setError("");
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("category", form.category);
    fd.append("version", form.version);
    fd.append("file", file);
    if (thumb) fd.append("thumbnail_file", thumb);
    try {
      await adminApi.uploadDownload(fd);
      onUploaded();
    } catch (e) {
      setError(e.response?.data?.message || "Yükleme hatası.");
    }
    setUploading(false);
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 14, textTransform: "uppercase", letterSpacing: .6 }}>Yeni Dosya Yükle</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Başlık *" style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
        <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Açıklama" rows={2}
          style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <select value={form.category} onChange={e => set("category", e.target.value)}
            style={{ ...inputStyle, flex: 1, cursor: "pointer" }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
          <input value={form.version} onChange={e => set("version", e.target.value)} placeholder="Versiyon (ör: 1.0.0)"
            style={{ ...inputStyle, flex: 1 }} />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Dosya seç */}
          <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
            background: file ? "rgba(39,174,96,.1)" : "rgba(255,255,255,.06)",
            border: `1px solid ${file ? "rgba(39,174,96,.3)" : "rgba(255,255,255,.12)"}`,
            color: file ? "#2ecc71" : "#ccc", fontSize: 12, cursor: "pointer" }}>
            <FileIcon size={13} />{file ? file.name : "Dosya Seç *"}
            <input ref={fileRef} type="file" onChange={e => setFile(e.target.files[0])} style={{ display: "none" }} />
          </label>

          {/* Thumbnail seç */}
          <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
            background: thumb ? "rgba(39,174,96,.1)" : "rgba(255,255,255,.06)",
            border: `1px solid ${thumb ? "rgba(39,174,96,.3)" : "rgba(255,255,255,.12)"}`,
            color: thumb ? "#2ecc71" : "#ccc", fontSize: 12, cursor: "pointer" }}>
            <ImageIcon size={13} />{thumb ? "Görsel Seçildi" : "Kapak Görseli"}
            <input ref={thumbRef} type="file" accept="image/*" onChange={pickThumb} style={{ display: "none" }} />
          </label>

          {thumbPreview && (
            <div style={{ position: "relative" }}>
              <img src={thumbPreview} alt="" style={{ height: 40, borderRadius: 6, objectFit: "cover" }} />
              <button onClick={() => { setThumb(null); setThumbPreview(null); }}
                style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%",
                  background: "#e74c3c", border: "none", color: "#fff", cursor: "pointer", fontSize: 9,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={9} />
              </button>
            </div>
          )}
        </div>

        {error && <div style={{ fontSize: 11, color: "#e74c3c" }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel}
            style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.12)", color: "#888", fontSize: 13, cursor: "pointer" }}>
            İptal
          </button>
          <button onClick={submit} disabled={uploading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 8,
              background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 13,
              cursor: "pointer", opacity: uploading ? 0.6 : 1 }}>
            <Upload size={13} />{uploading ? "Yükleniyor..." : "Yükle"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDownloadsPage() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [editData, setEditData]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [search, setSearch]       = useState("");

  const load = () => {
    setLoading(true);
    adminApi.getDownloads()
      .then(r => {
        const data = r.data.data ?? r.data;
        setDownloads(Array.isArray(data) ? data : data.downloads || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startEdit = (d) => {
    setEditId(d.id);
    setEditData({ title: d.title, description: d.description || "", category: d.category || "general", version: d.version || "" });
  };

  const saveEdit = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append("id", editId);
    fd.append("title", editData.title);
    fd.append("description", editData.description);
    fd.append("category", editData.category);
    fd.append("version", editData.version);
    try {
      await adminApi.updateDownload(fd);
      setDownloads(p => p.map(d => d.id === editId ? { ...d, ...editData } : d));
      setEditId(null);
    } catch {}
    setSaving(false);
  };

  const remove = async (id) => {
    setDeleting(id);
    try {
      await adminApi.deleteDownload(id);
      setDownloads(p => p.filter(d => d.id !== id));
    } catch {}
    setDeleting(null);
  };

  const filtered = downloads.filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>Dosya Yönetimi</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{downloads.length} dosya</div>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9,
            background: "rgba(245,166,35,.15)", border: "1px solid #f5a623", color: "#f5a623",
            fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Upload size={14} /> Dosya Yükle
        </button>
      </div>

      {showForm && <UploadForm onUploaded={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />}

      {/* Arama */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
        padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <FileIcon size={13} color="#888" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Dosya ara..."
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#ddd", fontSize: 13, fontFamily: "inherit" }} />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Dosya bulunamadı.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(d => (
            <div key={d.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {editId === d.id ? (
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={editData.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
                    placeholder="Başlık" style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
                  <textarea value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Açıklama" rows={2}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <select value={editData.category} onChange={e => setEditData(p => ({ ...p, category: e.target.value }))}
                      style={{ ...inputStyle, flex: 1, cursor: "pointer" }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                    </select>
                    <input value={editData.version} onChange={e => setEditData(p => ({ ...p, version: e.target.value }))}
                      placeholder="Versiyon" style={{ ...inputStyle, flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => setEditId(null)}
                      style={{ padding: "7px 14px", borderRadius: 7, background: "rgba(255,255,255,.06)",
                        border: "1px solid rgba(255,255,255,.12)", color: "#888", fontSize: 12, cursor: "pointer" }}>
                      İptal
                    </button>
                    <button onClick={saveEdit} disabled={saving}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 7,
                        background: "rgba(39,174,96,.15)", border: "1px solid rgba(39,174,96,.3)",
                        color: "#2ecc71", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                      <Check size={12} /> Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                  {/* Thumbnail */}
                  {d.thumbnail ? (
                    <img src={d.thumbnail} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 8, background: "rgba(255,255,255,.04)",
                      border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileIcon size={20} color="#555" />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#ddd" }}>{d.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20,
                        background: `${CAT_COLORS[d.category] || "#888"}22`, color: CAT_COLORS[d.category] || "#888" }}>
                        {CAT_LABELS[d.category] || d.category}
                      </span>
                      {d.version && (
                        <span style={{ fontSize: 10, color: "#f5a623", background: "rgba(245,166,35,.1)",
                          padding: "1px 7px", borderRadius: 20 }}>v{d.version}</span>
                      )}
                    </div>
                    {d.description && <div style={{ fontSize: 11, color: "#666", marginBottom: 3 }}>{d.description}</div>}
                    <div style={{ fontSize: 10, color: "#555", display: "flex", gap: 10 }}>
                      <span><Download size={9} style={{ marginRight: 3 }} />{d.download_count || 0} indirme</span>
                      {d.file_size && <span>{formatSize(d.file_size)}</span>}
                      <span>{d.created_at?.slice(0, 10)}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => startEdit(d)} title="Düzenle"
                      style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,.1)",
                        background: "rgba(255,255,255,.04)", color: "#f5a623", cursor: "pointer",
                        display: "flex", alignItems: "center" }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(d.id)} disabled={deleting === d.id} title="Sil"
                      style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(231,76,60,.2)",
                        background: "rgba(231,76,60,.1)", color: "#e74c3c", cursor: "pointer",
                        display: "flex", alignItems: "center", opacity: deleting === d.id ? 0.5 : 1 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
