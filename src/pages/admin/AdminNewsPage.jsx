import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import { Plus, Trash2, Newspaper } from "lucide-react";

export default function AdminNewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", content: "", type: "info" });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    adminApi.getNews()
      .then(r => setNews(r.data.news || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await adminApi.createNews(form);
      setForm({ title: "", content: "", type: "info" });
      setShowForm(false);
      load();
    } catch {}
    setSaving(false);
  };

  const remove = async (id) => {
    try {
      await adminApi.deleteNews(id);
      setNews(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const TYPE_COLORS = { info: "#3498db", warning: "#f5a623", success: "#2ecc71", danger: "#e74c3c" };

  return (
    <>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Haberler</h1>
          <p className="page-subtitle">Panel duyuruları</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(245,166,35,.15)", border: "1px solid #f5a623", color: "#f5a623", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={14} /> Yeni Haber
        </button>
      </div>

      {showForm && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Başlık"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "#ddd", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="İçerik" rows={4}
              style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "#ddd", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "#ddd", fontSize: 13, outline: "none", cursor: "pointer" }}>
                <option value="info">Bilgi</option>
                <option value="warning">Uyarı</option>
                <option value="success">Başarı</option>
                <option value="danger">Tehlike</option>
              </select>
              <button onClick={submit} disabled={saving}
                style={{ marginLeft: "auto", padding: "8px 20px", borderRadius: 8, background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Kaydediliyor..." : "Yayınla"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Yükleniyor...</div>
        ) : news.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Henüz haber yok.</div>
        ) : news.map(n => (
          <div key={n.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 4, borderRadius: 4, alignSelf: "stretch", background: TYPE_COLORS[n.type] || "#888", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ddd", marginBottom: 4 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>{n.content}</div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 6 }}>{n.created_at}</div>
            </div>
            <button onClick={() => remove(n.id)}
              style={{ background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.2)", color: "#e74c3c", borderRadius: 7, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
