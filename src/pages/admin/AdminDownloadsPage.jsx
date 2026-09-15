import { useEffect, useState, useRef, useCallback } from "react";
import { adminApi } from "../../lib/api";
import { Upload, Trash2, Pencil, Check, X, FileIcon, ImageIcon, Download, FolderOpen, PlusCircle } from "lucide-react";

const CATEGORIES = ["general", "mod", "skin", "tool", "other", "ets2_profile", "ats_profile"];
const CAT_LABELS  = { general: "Genel", mod: "Mod", skin: "Skin", tool: "Araç", other: "Diğer", ets2_profile: "ETS2 Profili (Corleone ETS2 Profili)", ats_profile: "ATS Profili (Corleone ATS Profili)" };
const CAT_LABELS_SHORT = { ...{ general: "Genel", mod: "Mod", skin: "Skin", tool: "Araç", other: "Diğer" }, ets2_profile: "ETS2 Profili", ats_profile: "ATS Profili" };
const CAT_COLORS  = { general: "#888", mod: "#3498db", skin: "#9b59b6", tool: "#1abc9c", other: "#666", ets2_profile: "#f5a623", ats_profile: "#3498db" };

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function Ets2FilePicker({ value, onChange }) {
  const [open, setOpen]   = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const openPicker = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const r = await adminApi.getEts2ProfileFiles();
      setFiles(r.data.data?.files || []);
    } catch {}
    setLoading(false);
  };

  const select = (url) => { onChange(url); setOpen(false); };

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, fontSize: 11, color: value ? "#2ecc71" : "var(--text-muted)", background: "var(--bg-elevated)", border: `1px solid ${value ? "rgba(39,174,96,.3)" : "var(--border)"}`, borderRadius: 8, padding: "8px 12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value ? value.split("/").pop() : "Dosya seçilmedi"}
        </div>
        <button type="button" onClick={openPicker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(245,166,35,.1)", border: "1px solid rgba(245,166,35,.3)", color: "#f5a623", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          <FolderOpen size={13} /> Dosya Seç
        </button>
        {value && <button type="button" onClick={() => onChange("")} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 4 }}><X size={14} /></button>}
      </div>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a1714", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, width: 460, maxWidth: "90vw", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>ETS2 Profil Dosyaları</span>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><X size={16} /></button>
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>Yükleniyor...</div>
            ) : files.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>Henüz dosya yok.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
                {files.map(f => (
                  <button key={f.url} onClick={() => select(f.url)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: f.url === value ? "rgba(245,166,35,.1)" : "var(--bg-elevated)", border: `1px solid ${f.url === value ? "rgba(245,166,35,.3)" : "var(--border)"}`, cursor: "pointer", textAlign: "left" }}>
                    <FileIcon size={14} color="#f5a623" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{formatSize(f.size)} • {f.date}</div>
                    </div>
                    {f.url === value && <Check size={13} color="#f5a623" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AtsFilePicker({ value, onChange }) {
  const [open, setOpen]   = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const openPicker = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const r = await adminApi.getAtsProfileFiles();
      setFiles(r.data.data?.files || []);
    } catch {}
    setLoading(false);
  };

  const select = (url) => { onChange(url); setOpen(false); };

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, fontSize: 11, color: value ? "#2ecc71" : "var(--text-muted)", background: "var(--bg-elevated)", border: `1px solid ${value ? "rgba(39,174,96,.3)" : "var(--border)"}`, borderRadius: 8, padding: "8px 12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value ? value.split("/").pop() : "Dosya seçilmedi"}
        </div>
        <button type="button" onClick={openPicker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(52,152,219,.1)", border: "1px solid rgba(52,152,219,.3)", color: "#3498db", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          <FolderOpen size={13} /> Dosya Seç
        </button>
        {value && <button type="button" onClick={() => onChange("")} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 4 }}><X size={14} /></button>}
      </div>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a1714", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, width: 460, maxWidth: "90vw", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>ATS Profil Dosyaları</span>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><X size={16} /></button>
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>Yükleniyor...</div>
            ) : files.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>Henüz dosya yok.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
                {files.map(f => (
                  <button key={f.url} onClick={() => select(f.url)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: f.url === value ? "rgba(52,152,219,.1)" : "var(--bg-elevated)", border: `1px solid ${f.url === value ? "rgba(52,152,219,.3)" : "var(--border)"}`, cursor: "pointer", textAlign: "left" }}>
                    <FileIcon size={14} color="#3498db" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{formatSize(f.size)} • {f.date}</div>
                    </div>
                    {f.url === value && <Check size={13} color="#3498db" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function RemoteFilePicker({ value, onChange }) {
  const [open, setOpen]     = useState(false);
  const [files, setFiles]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [deleting, setDeleting]   = useState(null);

  const openPicker = async () => {
    setOpen(true); setLoading(true);
    try { const r = await adminApi.listFiles(); setFiles(r.data.files || []); } catch {}
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true); setProgress(0);
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await adminApi.uploadFile(fd, setProgress);
      if (r.data?.success) {
        setFiles(prev => [{ name: r.data.name, size: r.data.size, date: r.data.date }, ...prev]);
      }
    } catch {}
    setUploading(false);
  };

  const handleDelete = async (name) => {
    setDeleting(name);
    try { await adminApi.deleteFile(name); setFiles(prev => prev.filter(f => f.name !== name)); if (value === name) onChange(''); } catch {}
    setDeleting(null);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, fontSize: 11, color: value ? '#2ecc71' : 'var(--text-muted)', background: 'var(--bg-elevated)', border: `1px solid ${value ? 'rgba(39,174,96,.3)' : 'var(--border)'}`, borderRadius: 8, padding: '8px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || 'Dosya secilmedi'}
        </div>
        <button type="button" onClick={openPicker} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(52,152,219,.1)', border: '1px solid rgba(52,152,219,.3)', color: '#3498db', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <FolderOpen size={13} /> Sunucudan Sec
        </button>
        {value && <button type="button" onClick={() => onChange('')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}><X size={14} /></button>}
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1714', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, width: 520, maxWidth: '90vw', padding: 20, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Sunucu Dosyalari</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.3)', color: '#f5a623', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Upload size={12} />{uploading ? `${progress}%` : 'Dosya Yukle'}
                  <input type="file" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
                </label>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={16} /></button>
              </div>
            </div>
            {uploading && (
              <div style={{ height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#f5a623', borderRadius: 4, transition: 'width .2s' }} />
              </div>
            )}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>Yukleniyor...</div>
              ) : files.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>Dosya yok.</div>
              ) : files.map(f => (
                <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: value === f.name ? 'rgba(39,174,96,.08)' : 'var(--bg-elevated)', border: `1px solid ${value === f.name ? 'rgba(39,174,96,.3)' : 'var(--border)'}` }}>
                  <FileIcon size={14} color="#3498db" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => { onChange(f.name); setOpen(false); }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{formatSize(f.size)} &bull; {f.date}</div>
                  </div>
                  {value === f.name && <Check size={13} color="#2ecc71" />}
                  <button onClick={() => handleDelete(f.name)} disabled={deleting === f.name} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', opacity: deleting === f.name ? 0.4 : 1, padding: 4 }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UploadForm({ onUploaded, onCancel }) {
  const [form, setForm]   = useState({ title: "", description: "", category: "general", version: "", profile_zip_url: "", server_file: "" });
  const isEts2 = form.category === "ets2_profile";
  const [file, setFile]   = useState(null);
  const [thumb, setThumb] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) { setError("Baslik zorunludur."); return; }
    if (!file && !form.server_file) { setError("Dosya secin veya sunucudan dosya secin."); return; }
    setUploading(true); setError("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("file", file);
    if (thumb) fd.append("thumbnail_file", thumb);
    try {
      const r = await adminApi.uploadDownload(fd);
      if (!r.data?.success) { setError(r.data?.message || 'Sunucu hatasi.'); setUploading(false); return; }
      onUploaded();
    }
    catch (e) { setError('Istek hatasi: ' + (e?.message || String(e))); }
    setUploading(false);
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: .6 }}>Yeni Dosya Yükle</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Başlık *" className="admin-input" style={{ width: "100%", boxSizing: "border-box" }} />
        <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Açıklama" rows={2} className="admin-input" style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <select value={form.category} onChange={e => set("category", e.target.value)} className="admin-input" style={{ flex: 1, cursor: "pointer" }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
          <input value={form.version} onChange={e => set("version", e.target.value)} placeholder="Versiyon" className="admin-input" style={{ flex: 1 }} />
        </div>
        {isEts2 && (
          <Ets2FilePicker value={form.profile_zip_url} onChange={v => set("profile_zip_url", v)} />
        )}
        {form.category === "ats_profile" && (
          <AtsFilePicker value={form.profile_zip_url} onChange={v => set("profile_zip_url", v)} />
        )}
        <RemoteFilePicker value={form.server_file} onChange={v => set('server_file', v)} />
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: file ? "rgba(39,174,96,.1)" : "var(--bg-elevated)", border: `1px solid ${file ? "rgba(39,174,96,.3)" : "var(--border)"}`, color: file ? "#2ecc71" : "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
            <FileIcon size={13} />{file ? file.name : "Dosya Seç *"}
            <input type="file" onChange={e => setFile(e.target.files[0])} style={{ display: "none" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: thumb ? "rgba(39,174,96,.1)" : "var(--bg-elevated)", border: `1px solid ${thumb ? "rgba(39,174,96,.3)" : "var(--border)"}`, color: thumb ? "#2ecc71" : "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
            <ImageIcon size={13} />{thumb ? "Görsel Seçildi" : "Kapak Görseli"}
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setThumb(f); setThumbPreview(URL.createObjectURL(f)); } }} style={{ display: "none" }} />
          </label>
          {thumbPreview && (
            <div style={{ position: "relative" }}>
              <img src={thumbPreview} alt="" style={{ height: 40, borderRadius: 6, objectFit: "cover" }} />
              <button onClick={() => { setThumb(null); setThumbPreview(null); }} style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: "#e74c3c", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={9} /></button>
            </div>
          )}
        </div>
        {error && <div style={{ fontSize: 11, color: "#e74c3c" }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>İptal</button>
          <button onClick={submit} disabled={uploading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 8, background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: uploading ? 0.6 : 1 }}>
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
  const [ctxMenu, setCtxMenu]     = useState(null); // { x, y, item }
  const [addVerModal, setAddVerModal] = useState(null); // item
  const [addVerForm, setAddVerForm]   = useState({ version: "", changelog: "", profile_zip_url: "" });
  const [addVerFile, setAddVerFile]   = useState(null);
  const [addVerSaving, setAddVerSaving] = useState(false);
  const [addVerError, setAddVerError]   = useState("");
  const [versionsModal, setVersionsModal] = useState(null); // item
  const [editingVersion, setEditingVersion] = useState(null); // { version_id, version, changelog, profile_zip_url }
  const [verSaving, setVerSaving] = useState(false);
  const ctxRef = useRef(null);

  const load = () => {
    setLoading(true);
    adminApi.getDownloads().then(r => { const data = r.data.data ?? r.data; setDownloads(Array.isArray(data) ? data : data.downloads || []); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Sağ tık menüsünü dışarı tıklayınca kapat
  useEffect(() => {
    const handler = (e) => { if (ctxRef.current && !ctxRef.current.contains(e.target)) setCtxMenu(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openCtxMenu = useCallback((e, item) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, item });
  }, []);

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminApi.updateDownload({ id: editId, ...editData });
      setDownloads(p => p.map(d => d.id === editId ? { ...d, ...editData } : d));
      setEditId(null);
    } catch {}
    setSaving(false);
  };

  const remove = async (id) => {
    setCtxMenu(null);
    setDeleting(id);
    try { await adminApi.deleteDownload(id); setDownloads(p => p.filter(d => d.id !== id)); } catch {}
    setDeleting(null);
  };

  const openAddVersion = (item) => {
    setCtxMenu(null);
    setAddVerModal(item);
    setAddVerForm({ version: "", changelog: "", profile_zip_url: "" });
    setAddVerFile(null);
    setAddVerError("");
  };

  const openVersionsModal = (item) => {
    setCtxMenu(null);
    setVersionsModal(item);
    setEditingVersion(null);
  };

  const saveVersion = async () => {
    if (!editingVersion?.version.trim()) return;
    setVerSaving(true);
    try {
      const r = await adminApi.updateVersion(editingVersion);
      if (r.data?.success) {
        setVersionsModal(prev => ({
          ...prev,
          versions: prev.versions.map(v => v.version_id === editingVersion.version_id ? { ...v, ...editingVersion } : v)
        }));
        setEditingVersion(null);
        load();
      }
    } catch {}
    setVerSaving(false);
  };

  const deleteVersion = async (versionId) => {
    try {
      await adminApi.deleteVersion(versionId);
      setVersionsModal(prev => ({ ...prev, versions: prev.versions.filter(v => v.version_id !== versionId) }));
      load();
    } catch {}
  };

  const submitAddVersion = async () => {
    if (!addVerForm.version.trim() || !addVerFile) { setAddVerError("Versiyon ve dosya zorunludur."); return; }
    setAddVerSaving(true); setAddVerError("");
    try {
      const r = await adminApi.addVersion(
        addVerModal.id,
        addVerForm.version,
        addVerForm.changelog,
        addVerForm.profile_zip_url,
        addVerFile
      );
      if (!r.data?.success) { setAddVerError(r.data?.message || 'Sunucu hatas\u0131 (500).'); setAddVerSaving(false); return; }
      setAddVerModal(null);
      load();
    } catch (e) {
      setAddVerError("Yükleme hatası: " + (e?.message || String(e)));
    }
    setAddVerSaving(false);
  };

  const filtered = downloads.filter(d => d.title?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      {/* Sağ tık menüsü */}
      {ctxMenu && (
        <div ref={ctxRef} style={{
          position: "fixed", top: ctxMenu.y, left: ctxMenu.x, zIndex: 99999,
          background: "#1a1714", border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 10, padding: "4px", minWidth: 180,
          boxShadow: "0 8px 32px rgba(0,0,0,.6)",
        }}>
          {[[
            <><Pencil size={13} /> Düzenle</>,
            () => { setCtxMenu(null); setEditId(ctxMenu.item.id); setEditData({ title: ctxMenu.item.title, description: ctxMenu.item.description || "", category: ctxMenu.item.category || "general", version: ctxMenu.item.version || "", profile_zip_url: ctxMenu.item.profile_zip_url || "" }); },
            "#f5a623"
          ], [
            <><PlusCircle size={13} /> Yeni Versiyon Ekle</>,
            () => openAddVersion(ctxMenu.item),
            "#3498db"
          ], [
            <><Download size={13} /> Versiyonları Görüntüle</>,
            () => openVersionsModal(ctxMenu.item),
            "#1abc9c"
          ], [
            <><Trash2 size={13} /> Sil</>,
            () => remove(ctxMenu.item.id),
            "#e74c3c"
          ]].map(([label, action, color], i) => (
            <button key={i} onClick={action} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 12px", borderRadius: 7, background: "none",
              border: "none", color, fontSize: 12, fontWeight: 600,
              cursor: "pointer", textAlign: "left",
            }}
              onMouseEnter={e => e.currentTarget.style.background = `${color}18`}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >{label}</button>
          ))}
        </div>
      )}

      {/* Versiyonlar Modalı */}
      {versionsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a1714", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, width: 520, maxWidth: "90vw", padding: 22, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Versiyonlar</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{versionsModal.title}</div>
              </div>
              <button onClick={() => setVersionsModal(null)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {(versionsModal.versions || []).length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>Versiyon bulunamadı.</div>
              ) : (versionsModal.versions || []).map(v => (
                <div key={v.version_id} style={{ background: "var(--bg-elevated)", border: `1px solid ${editingVersion?.version_id === v.version_id ? "rgba(245,166,35,.3)" : "var(--border)"}`, borderRadius: 10, padding: "12px 14px" }}>
                  {editingVersion?.version_id === v.version_id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input value={editingVersion.version} onChange={e => setEditingVersion(p => ({ ...p, version: e.target.value }))} placeholder="Versiyon" className="admin-input" style={{ width: "100%", boxSizing: "border-box" }} />
                      <textarea value={editingVersion.changelog || ""} onChange={e => setEditingVersion(p => ({ ...p, changelog: e.target.value }))} placeholder="Değişiklik notları" rows={2} className="admin-input" style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }} />
                      {versionsModal.category === "ets2_profile" && (
                        <Ets2FilePicker value={editingVersion.profile_zip_url || ""} onChange={val => setEditingVersion(p => ({ ...p, profile_zip_url: val }))} />
                      )}
                      {versionsModal.category === "ats_profile" && (
                        <AtsFilePicker value={editingVersion.profile_zip_url || ""} onChange={val => setEditingVersion(p => ({ ...p, profile_zip_url: val }))} />
                      )}
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => setEditingVersion(null)} style={{ padding: "6px 12px", borderRadius: 7, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>İptal</button>
                        <button onClick={saveVersion} disabled={verSaving} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, background: "rgba(39,174,96,.15)", border: "1px solid rgba(39,174,96,.3)", color: "#2ecc71", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: verSaving ? 0.6 : 1 }}>
                          <Check size={12} /> Kaydet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#f5a623" }}>{v.version?.startsWith('v') ? v.version : `v${v.version}`}</span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{v.version_date?.slice(0, 10)}</span>
                          {v.file_size && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatSize(v.file_size)}</span>}
                        </div>
                        {v.original_name && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{v.original_name}</div>}
                        {v.changelog && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>{v.changelog}</div>}
                        {v.profile_zip_url && <div style={{ fontSize: 10, color: "#1abc9c", marginTop: 4 }}>
                          {versionsModal.category === 'ats_profile' ? 'ATS' : 'ETS2'}: {v.profile_zip_url.split('/').pop()}
                        </div>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => setEditingVersion({ version_id: v.version_id, version: v.version, changelog: v.changelog || "", profile_zip_url: v.profile_zip_url || "" })} style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(245,166,35,.2)", background: "rgba(245,166,35,.1)", color: "#f5a623", cursor: "pointer", display: "flex", alignItems: "center" }}><Pencil size={12} /></button>
                        <button onClick={() => deleteVersion(v.version_id)} style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(231,76,60,.2)", background: "rgba(231,76,60,.1)", color: "#e74c3c", cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Yeni Versiyon Modalı */}
      {addVerModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a1714", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, width: 440, maxWidth: "90vw", padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Yeni Versiyon Ekle</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{addVerModal.title}</div>
              </div>
              <button onClick={() => setAddVerModal(null)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={addVerForm.version} onChange={e => setAddVerForm(p => ({ ...p, version: e.target.value }))} placeholder="Versiyon *" className="admin-input" style={{ width: "100%", boxSizing: "border-box" }} />
              <textarea value={addVerForm.changelog} onChange={e => setAddVerForm(p => ({ ...p, changelog: e.target.value }))} placeholder="Değişiklik notları" rows={2} className="admin-input" style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }} />
              {addVerModal.category === "ets2_profile" && (
                <Ets2FilePicker value={addVerForm.profile_zip_url} onChange={v => setAddVerForm(p => ({ ...p, profile_zip_url: v }))} />
              )}
              {addVerModal.category === "ats_profile" && (
                <AtsFilePicker value={addVerForm.profile_zip_url} onChange={v => setAddVerForm(p => ({ ...p, profile_zip_url: v }))} />
              )}
              <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: addVerFile ? "rgba(39,174,96,.1)" : "var(--bg-elevated)", border: `1px solid ${addVerFile ? "rgba(39,174,96,.3)" : "var(--border)"}`, color: addVerFile ? "#2ecc71" : "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
                <FileIcon size={13} />{addVerFile ? addVerFile.name : "Dosya Seç *"}
                <input type="file" onChange={e => setAddVerFile(e.target.files[0])} style={{ display: "none" }} />
              </label>
              {addVerError && <div style={{ fontSize: 11, color: "#e74c3c" }}>{addVerError}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setAddVerModal(null)} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>İptal</button>
                <button onClick={submitAddVersion} disabled={addVerSaving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 8, background: "#3498db", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: addVerSaving ? 0.6 : 1 }}>
                  <PlusCircle size={13} />{addVerSaving ? "Yükleniyor..." : "Ekle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="admin-title">Dosya Yönetimi</div>
          <div className="admin-sub">{downloads.length} dosya • Sağ tık ile işlem yapabilirsiniz</div>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(245,166,35,.15)", border: "1px solid #f5a623", color: "#f5a623", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Upload size={14} /> Dosya Yükle
        </button>
      </div>

      {showForm && <UploadForm onUploaded={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />}

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <FileIcon size={13} color="var(--text-muted)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Dosya ara..."
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit" }} />
      </div>

      {loading ? <div className="admin-empty">Yükleniyor...</div>
      : filtered.length === 0 ? <div className="admin-empty">Dosya bulunamadı.</div>
      : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(d => (
            <div key={d.id}
              onContextMenu={e => openCtxMenu(e, d)}
              style={{ background: "var(--surface)", border: `1px solid ${editId === d.id ? "rgba(245,166,35,.3)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", cursor: "context-menu" }}>
              {editId === d.id ? (
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={editData.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))} placeholder="Başlık" className="admin-input" style={{ width: "100%", boxSizing: "border-box" }} />
                  <textarea value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} placeholder="Açıklama" rows={2} className="admin-input" style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <select value={editData.category} onChange={e => setEditData(p => ({ ...p, category: e.target.value }))} className="admin-input" style={{ flex: 1, cursor: "pointer" }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                    </select>
                    <input value={editData.version} onChange={e => setEditData(p => ({ ...p, version: e.target.value }))} placeholder="Versiyon" className="admin-input" style={{ flex: 1 }} />
                  </div>
                  {editData.category === "ets2_profile" && (
                    <Ets2FilePicker value={editData.profile_zip_url || ""} onChange={v => setEditData(p => ({ ...p, profile_zip_url: v }))} />
                  )}
                  {editData.category === "ats_profile" && (
                    <AtsFilePicker value={editData.profile_zip_url || ""} onChange={v => setEditData(p => ({ ...p, profile_zip_url: v }))} />
                  )}
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => setEditId(null)} style={{ padding: "7px 14px", borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>İptal</button>
                    <button onClick={saveEdit} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 7, background: "rgba(39,174,96,.15)", border: "1px solid rgba(39,174,96,.3)", color: "#2ecc71", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                      <Check size={12} /> Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", opacity: deleting === d.id ? 0.4 : 1 }}>
                  {d.thumbnail
                    ? <img src={d.thumbnail} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 52, height: 52, borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileIcon size={20} color="var(--text-muted)" /></div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{d.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: `${CAT_COLORS[d.category] || "#888"}22`, color: CAT_COLORS[d.category] || "#888" }}>{CAT_LABELS_SHORT[d.category] || d.category}</span>
                      {d.version && <span style={{ fontSize: 10, color: "#f5a623", background: "rgba(245,166,35,.1)", padding: "1px 7px", borderRadius: 20 }}>{d.version.startsWith('v') || d.version.startsWith('V') ? d.version : `v${d.version}`}</span>}
                    </div>
                    {d.description && <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>{d.description}</div>}
                    <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", gap: 10 }}>
                      <span><Download size={9} style={{ marginRight: 3 }} />{d.download_count || 0} indirme</span>
                      {d.file_size && <span>{formatSize(d.file_size)}</span>}
                      <span>{d.created_at?.slice(0, 10)}</span>
                    </div>
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
