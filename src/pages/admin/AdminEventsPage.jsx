import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import { Plus, Trash2, Edit2, Check, X, Image } from "lucide-react";

const EMPTY = { title_tr: "", description_tr: "", event_date: "", route: "", game: "ETS2", truckers_url: "", status: "upcoming", is_private: 0 };

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mediaEventId, setMediaEventId] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    adminApi.getEvents()
      .then(r => setEvents(r.data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title_tr.trim() || !form.event_date) return;
    setSaving(true);
    try {
      if (editId) await adminApi.updateEvent({ id: editId, ...form });
      else await adminApi.createEvent(form);
      setForm(EMPTY); setShowForm(false); setEditId(null); load();
    } catch {}
    setSaving(false);
  };

  const remove = async (id) => {
    try { await adminApi.deleteEvent(id); setEvents(p => p.filter(e => e.id !== id)); } catch {}
  };

  const startEdit = (ev) => {
    setEditId(ev.id);
    setForm({ title_tr: ev.title_tr, description_tr: ev.description_tr || "", event_date: ev.event_date?.slice(0, 16) || "", route: ev.route || "", game: ev.game || "ETS2", truckers_url: ev.truckers_url || "", status: ev.status || "upcoming", is_private: ev.is_private || 0 });
    setShowForm(true);
  };

  const uploadMedia = async () => {
    if (!mediaFile || !mediaEventId) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("event_id", mediaEventId);
    fd.append("media", mediaFile);
    try { await adminApi.uploadEventMedia(fd); setMediaEventId(null); setMediaFile(null); } catch {}
    setUploading(false);
  };

  const STATUS_COLORS = { upcoming: "#f5a623", active: "#2ecc71", past: "#888" };
  const STATUS_LABELS = { upcoming: "Yaklaşan", active: "Aktif", past: "Tamamlandı" };

  return (
    <>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Etkinlik Yönetimi</h1>
          <p className="page-subtitle">{events.length} etkinlik</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(245,166,35,.15)", border: "1px solid #f5a623", color: "#f5a623", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={14} /> Yeni Etkinlik
        </button>
      </div>

      {showForm && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["title_tr", "Başlık", "text"], ["event_date", "Tarih", "datetime-local"], ["route", "Rota", "text"], ["truckers_url", "TruckersMP URL", "url"]].map(([key, label, type]) => (
              <div key={key}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div>
                <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "#ddd", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ gridColumn: "1/-1" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>Açıklama</div>
              <textarea value={form.description_tr} onChange={e => setForm(p => ({ ...p, description_tr: e.target.value }))} rows={3}
                style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "#ddd", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["game", ["ETS2", "ATS", "Diğer"]], ["status", ["upcoming", "active", "past"]]].map(([key, opts]) => (
                <select key={key} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "#ddd", fontSize: 13, outline: "none", cursor: "pointer" }}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => { setShowForm(false); setEditId(null); }}
                style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#888", fontSize: 13, cursor: "pointer" }}>İptal</button>
              <button onClick={submit} disabled={saving}
                style={{ padding: "8px 20px", borderRadius: 8, background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medya yükleme */}
      {mediaEventId && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#ddd", flex: 1 }}>Etkinlik #{mediaEventId} için medya yükle</span>
          <input type="file" accept="image/*,video/*" onChange={e => setMediaFile(e.target.files[0])}
            style={{ fontSize: 12, color: "#888" }} />
          <button onClick={uploadMedia} disabled={!mediaFile || uploading}
            style={{ padding: "7px 16px", borderRadius: 8, background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: (!mediaFile || uploading) ? 0.5 : 1 }}>
            {uploading ? "Yükleniyor..." : "Yükle"}
          </button>
          <button onClick={() => { setMediaEventId(null); setMediaFile(null); }}
            style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}><X size={16} /></button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Yükleniyor...</div>
        ) : events.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Etkinlik yok.</div>
        ) : events.map(ev => (
          <div key={ev.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ddd" }}>{ev.title_tr}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLORS[ev.status], background: `${STATUS_COLORS[ev.status]}22`, padding: "1px 7px", borderRadius: 20 }}>{STATUS_LABELS[ev.status]}</span>
                {ev.is_private ? <span style={{ fontSize: 10, color: "#888", background: "rgba(255,255,255,.06)", padding: "1px 7px", borderRadius: 20 }}>Özel</span> : null}
              </div>
              <div style={{ fontSize: 11, color: "#666" }}>{ev.event_date?.slice(0, 16).replace("T", " ")} {ev.route && `• ${ev.route}`} {ev.game && `• ${ev.game}`}</div>
            </div>
            <button onClick={() => setMediaEventId(ev.id)}
              style={{ background: "rgba(52,152,219,.1)", border: "1px solid rgba(52,152,219,.2)", color: "#3498db", borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }} title="Medya Ekle">
              <Image size={13} />
            </button>
            <button onClick={() => startEdit(ev)}
              style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#888", borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <Edit2 size={13} />
            </button>
            <button onClick={() => remove(ev.id)}
              style={{ background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.2)", color: "#e74c3c", borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
