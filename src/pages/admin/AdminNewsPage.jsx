import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import { Plus, Trash2, Pencil, Eye, EyeOff, X, Check, ImageIcon } from "lucide-react";

const BADGE_OPTIONS = [
  { value: "orange", label: "Turuncu", color: "#f5a623" },
  { value: "green",  label: "Yeşil",   color: "#2ecc71" },
  { value: "teal",   label: "Teal",    color: "#1abc9c" },
  { value: "purple", label: "Mor",     color: "#9b59b6" },
  { value: "red",    label: "Kırmızı", color: "#e74c3c" },
];

const BADGE_COLORS = Object.fromEntries(BADGE_OPTIONS.map(b => [b.value, b.color]));

const EMPTY_FORM = { title: "", body: "", badge_type: "orange", sort_order: 0, image: null };

function NewsForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const [preview, setPreview] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const pickImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set("image", file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("body", form.body);
    fd.append("badge_type", form.badge_type);
    fd.append("sort_order", form.sort_order);
    if (form.image instanceof File) fd.append("image", form.image);
    onSave(fd, form);
  };

  const inputStyle = {
    background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
    padding: "9px 12px", color: "#ddd", fontSize: 13, outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input value={form.title} onChange={e => set("title", e.target.value)}
          placeholder="Başlık *" style={inputStyle} />
        <textarea value={form.body} onChange={e => set("body", e.target.value)}
          placeholder="İçerik" rows={4}
          style={{ ...inputStyle, resize: "vertical" }} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Badge rengi */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#888" }}>Renk:</span>
            {BADGE_OPTIONS.map(b => (
              <div key={b.value} onClick={() => set("badge_type", b.value)}
                title={b.label}
                style={{ width: 20, height: 20, borderRadius: "50%", background: b.color, cursor: "pointer",
                  border: form.badge_type === b.value ? "2px solid #fff" : "2px solid transparent",
                  boxShadow: form.badge_type === b.value ? `0 0 0 2px ${b.color}` : "none",
                  transition: "all .15s" }} />
            ))}
          </div>

          {/* Sıra */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#888" }}>Sıra:</span>
            <input type="number" value={form.sort_order} onChange={e => set("sort_order", e.target.value)}
              style={{ ...inputStyle, width: 60, padding: "6px 8px" }} />
          </div>

          {/* Görsel */}
          <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7,
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
            color: "#ccc", fontSize: 12, cursor: "pointer" }}>
            <ImageIcon size={13} /> Görsel Seç
            <input type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
          </label>
        </div>

        {/* Görsel önizleme */}
        {(preview || (initial.image_url && !(form.image instanceof File))) && (
          <div style={{ position: "relative", display: "inline-block" }}>
            <img src={preview || initial.image_url} alt=""
              style={{ height: 80, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
            <button onClick={() => { set("image", null); setPreview(null); }}
              style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%",
                background: "#e74c3c", border: "none", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={10} />
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel}
            style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.12)", color: "#888", fontSize: 13, cursor: "pointer" }}>
            İptal
          </button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()}
            style={{ padding: "8px 20px", borderRadius: 8, background: "#f5a623", border: "none",
              color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminNewsPage() {
  const [news, setNews]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.getNews()
      .then(r => setNews(r.data.data?.news || r.data.news || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (fd) => {
    setSaving(true);
    try {
      await adminApi.createNews(fd);
      setShowForm(false);
      load();
    } catch {}
    setSaving(false);
  };

  const handleUpdate = async (fd, form) => {
    setSaving(true);
    try {
      await adminApi.updateNews({ id: editItem.id, title: form.title, body: form.body, badge_type: form.badge_type, sort_order: form.sort_order });
      setEditItem(null);
      load();
    } catch {}
    setSaving(false);
  };

  const handleToggle = async (id) => {
    try {
      const r = await adminApi.toggleNews(id);
      setNews(prev => prev.map(n => n.id === id ? { ...n, is_active: r.data.is_active ? 1 : 0 } : n));
    } catch {}
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await adminApi.deleteNews(id);
      setNews(prev => prev.filter(n => n.id !== id));
    } catch {}
    setDeleting(null);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>Haberler</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{news.length} haber</div>
        </div>
        <button onClick={() => { setShowForm(true); setEditItem(null); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9,
            background: "rgba(245,166,35,.15)", border: "1px solid #f5a623", color: "#f5a623",
            fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={14} /> Yeni Haber
        </button>
      </div>

      {showForm && !editItem && (
        <NewsForm initial={EMPTY_FORM} onSave={handleCreate} onCancel={() => setShowForm(false)} saving={saving} />
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Yükleniyor...</div>
      ) : news.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Henüz haber yok.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {news.map(n => (
            <div key={n.id}>
              {editItem?.id === n.id ? (
                <NewsForm
                  initial={{ title: n.title, body: n.body || "", badge_type: n.badge_type || "orange", sort_order: n.sort_order || 0, image: null, image_url: n.image_url }}
                  onSave={handleUpdate}
                  onCancel={() => setEditItem(null)}
                  saving={saving}
                />
              ) : (
                <div style={{ background: "var(--surface)", border: `1px solid ${n.is_active ? "var(--border)" : "rgba(255,255,255,.05)"}`,
                  borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "flex-start",
                  opacity: n.is_active ? 1 : 0.5, transition: "opacity .2s" }}>

                  {/* Renk çubuğu */}
                  <div style={{ width: 4, borderRadius: 4, alignSelf: "stretch", flexShrink: 0,
                    background: BADGE_COLORS[n.badge_type] || "#888" }} />

                  {/* Görsel */}
                  {n.image_url && (
                    <img src={n.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  )}

                  {/* İçerik */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#ddd" }}>{n.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                        background: `${BADGE_COLORS[n.badge_type]}22`, color: BADGE_COLORS[n.badge_type] }}>
                        {BADGE_OPTIONS.find(b => b.value === n.badge_type)?.label}
                      </span>
                      {!n.is_active && (
                        <span style={{ fontSize: 10, color: "#666", fontStyle: "italic" }}>Pasif</span>
                      )}
                    </div>
                    {n.body && <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>{n.body}</div>}
                    <div style={{ fontSize: 10, color: "#555", marginTop: 6 }}>
                      Sıra: {n.sort_order} · {n.created_at?.slice(0, 10)}
                    </div>
                  </div>

                  {/* Aksiyonlar */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleToggle(n.id)} title={n.is_active ? "Pasife al" : "Aktife al"}
                      style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,.1)",
                        background: "rgba(255,255,255,.04)", color: n.is_active ? "#2ecc71" : "#666", cursor: "pointer",
                        display: "flex", alignItems: "center" }}>
                      {n.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button onClick={() => { setEditItem(n); setShowForm(false); }} title="Düzenle"
                      style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,.1)",
                        background: "rgba(255,255,255,.04)", color: "#f5a623", cursor: "pointer",
                        display: "flex", alignItems: "center" }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(n.id)} disabled={deleting === n.id} title="Sil"
                      style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(231,76,60,.2)",
                        background: "rgba(231,76,60,.1)", color: "#e74c3c", cursor: "pointer",
                        display: "flex", alignItems: "center", opacity: deleting === n.id ? 0.5 : 1 }}>
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
