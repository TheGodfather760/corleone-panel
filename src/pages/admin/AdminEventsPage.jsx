import { useEffect, useState, useRef } from "react";
import { adminApi } from "../../lib/api";
import { Plus, Trash2, Pencil, X, Users, Image, Check, ChevronDown, ChevronUp, Upload, Calendar } from "lucide-react";

const GAMES   = ["ETS2", "ATS", "Diğer"];
const STATUSES = ["upcoming", "active", "past"];
const STATUS_COLORS = { upcoming: "#f5a623", active: "#2ecc71", past: "#888" };
const STATUS_LABELS = { upcoming: "Yaklaşan", active: "Aktif", past: "Tamamlandı" };
const ATT_COLORS    = { attending: "#2ecc71", maybe: "#f5a623", not_attending: "#e74c3c" };
const ATT_LABELS    = { attending: "Katılıyor", maybe: "Belki", not_attending: "Katılmıyor" };

const EMPTY = { title_tr: "", description_tr: "", event_date: "", game: "ETS2", route: "", truckers_url: "", status: "upcoming", is_private: "0", is_active: "1" };

const inputStyle = {
  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
  padding: "8px 12px", color: "#ddd", fontSize: 13, outline: "none", fontFamily: "inherit",
  width: "100%", boxSizing: "border-box",
};

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>{children}</div>;
}

function EventForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm]       = useState(initial);
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(initial.image_url || null);
  const imgRef = useRef();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const pickImage = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setImage(f); setPreview(URL.createObjectURL(f));
  };

  const submit = () => {
    if (!form.title_tr.trim() || !form.event_date) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
    if (image) fd.append("image", image);
    onSave(fd);
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Label>Başlık *</Label>
          <input value={form.title_tr} onChange={e => set("title_tr", e.target.value)} style={inputStyle} placeholder="Etkinlik başlığı" />
        </div>

        <div>
          <Label>Tarih & Saat *</Label>
          <input type="datetime-local" value={form.event_date} onChange={e => set("event_date", e.target.value)} style={inputStyle} />
        </div>

        <div>
          <Label>Oyun</Label>
          <select value={form.game} onChange={e => set("game", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <Label>Rota</Label>
          <input value={form.route} onChange={e => set("route", e.target.value)} style={inputStyle} placeholder="Başlangıç → Bitiş" />
        </div>

        <div>
          <Label>TruckersMP URL</Label>
          <input value={form.truckers_url} onChange={e => set("truckers_url", e.target.value)} style={inputStyle} placeholder="https://truckersmp.com/events/..." />
        </div>

        <div>
          <Label>Durum</Label>
          <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Label>Özel Etkinlik</Label>
          <div onClick={() => set("is_private", form.is_private === "1" ? "0" : "1")}
            style={{ width: 36, height: 20, borderRadius: 10, background: form.is_private === "1" ? "#f5a623" : "rgba(255,255,255,.1)",
              border: `1px solid ${form.is_private === "1" ? "#f5a623" : "rgba(255,255,255,.15)"}`,
              cursor: "pointer", position: "relative", transition: "all .2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 2, left: form.is_private === "1" ? 17 : 2, width: 14, height: 14,
              borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Label>Aktif (Yayında)</Label>
          <div onClick={() => set("is_active", form.is_active === "1" ? "0" : "1")}
            style={{ width: 36, height: 20, borderRadius: 10, background: form.is_active === "1" ? "#2ecc71" : "rgba(255,255,255,.1)",
              border: `1px solid ${form.is_active === "1" ? "#2ecc71" : "rgba(255,255,255,.15)"}`,
              cursor: "pointer", position: "relative", transition: "all .2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 2, left: form.is_active === "1" ? 17 : 2, width: 14, height: 14,
              borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
          </div>
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <Label>Açıklama</Label>
          <textarea value={form.description_tr} onChange={e => set("description_tr", e.target.value)} rows={3}
            style={{ ...inputStyle, resize: "vertical" }} placeholder="Etkinlik açıklaması..." />
        </div>

        {/* Kapak görseli */}
        <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
            color: "#ccc", fontSize: 12, cursor: "pointer" }}>
            <Image size={13} /> Kapak Görseli
            <input ref={imgRef} type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
          </label>
          {preview && (
            <div style={{ position: "relative" }}>
              <img src={preview} alt="" style={{ height: 50, borderRadius: 8, objectFit: "cover" }} />
              <button onClick={() => { setImage(null); setPreview(null); }}
                style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%",
                  background: "#e74c3c", border: "none", color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={9} />
              </button>
            </div>
          )}
        </div>

        <div style={{ gridColumn: "1/-1", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel}
            style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.12)", color: "#888", fontSize: 13, cursor: "pointer" }}>
            İptal
          </button>
          <button onClick={submit} disabled={saving || !form.title_tr.trim() || !form.event_date}
            style={{ padding: "8px 20px", borderRadius: 8, background: "#f5a623", border: "none",
              color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Kaydediliyor..." : initial.id ? "Güncelle" : "Oluştur"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AttendeesPanel({ eventId, onClose }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    adminApi.getEventAttendees(eventId)
      .then(r => setAttendees(r.data.data?.attendees || r.data.attendees || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  const grouped = STATUSES.reduce((acc, _) => acc, {});
  const attending     = attendees.filter(a => a.status === "attending");
  const maybe         = attendees.filter(a => a.status === "maybe");
  const not_attending = attendees.filter(a => a.status === "not_attending");

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#ddd" }}>Katılımcılar ({attendees.length})</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}><X size={14} /></button>
      </div>
      {loading ? <div style={{ color: "#666", fontSize: 12 }}>Yükleniyor...</div> : (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[["attending", attending], ["maybe", maybe], ["not_attending", not_attending]].map(([status, list]) => (
            <div key={status} style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ATT_COLORS[status], marginBottom: 6,
                textTransform: "uppercase", letterSpacing: .5 }}>
                {ATT_LABELS[status]} ({list.length})
              </div>
              {list.length === 0 ? <div style={{ fontSize: 11, color: "#555" }}>—</div> : list.map(u => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  {u.avatar
                    ? <img src={u.avatar} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} />
                    : <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(245,166,35,.15)",
                        color: "#f5a623", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                  }
                  <span style={{ fontSize: 12, color: "#ccc" }}>{u.username}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MediaPanel({ eventId, onClose }) {
  const [media, setMedia]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => {
    adminApi.getEventMedia(eventId)
      .then(r => setMedia(r.data.data?.media || r.data.media || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [eventId]);

  const upload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("event_id", eventId);
    fd.append("file", file);
    try { await adminApi.uploadEventMedia(fd); load(); } catch {}
    setUploading(false);
    e.target.value = "";
  };

  const approve = async (id) => {
    try { await adminApi.approveMedia(id); setMedia(p => p.map(m => m.id === id ? { ...m, is_approved: 1 } : m)); } catch {}
  };

  const remove = async (id) => {
    try { await adminApi.deleteMedia(id); setMedia(p => p.filter(m => m.id !== id)); } catch {}
  };

  const pending = media.filter(m => !m.is_approved);
  const approved = media.filter(m => m.is_approved);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#ddd" }}>Medya ({media.length})</span>
        <div style={{ display: "flex", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7,
            background: "rgba(245,166,35,.1)", border: "1px solid rgba(245,166,35,.3)",
            color: "#f5a623", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            <Upload size={11} />{uploading ? "Yükleniyor..." : "Yükle"}
            <input ref={fileRef} type="file" accept="image/*" onChange={upload} style={{ display: "none" }} />
          </label>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}><X size={14} /></button>
        </div>
      </div>

      {loading ? <div style={{ color: "#666", fontSize: 12 }}>Yükleniyor...</div> : media.length === 0 ? (
        <div style={{ color: "#555", fontSize: 12 }}>Henüz medya yok.</div>
      ) : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#f5a623", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: .5 }}>
                Onay Bekliyor ({pending.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {pending.map(m => (
                  <div key={m.id} style={{ position: "relative" }}>
                    <img src={m.url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8,
                      border: "2px solid rgba(245,166,35,.4)", opacity: 0.7 }} />
                    <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
                      <button onClick={() => approve(m.id)}
                        style={{ padding: "3px 6px", borderRadius: 5, background: "rgba(39,174,96,.9)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Check size={10} />
                      </button>
                      <button onClick={() => remove(m.id)}
                        style={{ padding: "3px 6px", borderRadius: 5, background: "rgba(231,76,60,.9)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <div style={{ position: "absolute", top: 3, left: 3, fontSize: 9, color: "#fff", background: "rgba(0,0,0,.6)", padding: "1px 4px", borderRadius: 4 }}>
                      {m.username}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {approved.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "#2ecc71", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: .5 }}>
                Onaylı ({approved.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {approved.map(m => (
                  <div key={m.id} style={{ position: "relative" }}>
                    <img src={m.url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                    <button onClick={() => remove(m.id)}
                      style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%",
                        background: "#e74c3c", border: "none", color: "#fff", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={9} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [expanded, setExpanded] = useState(null); // event id
  const [expandedTab, setExpandedTab] = useState("info"); // "info" | "attendees" | "media"
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    setLoading(true);
    adminApi.getEvents()
      .then(r => setEvents(r.data.data?.events || r.data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (fd) => {
    setSaving(true);
    try {
      if (editItem) { fd.append("id", editItem.id); await adminApi.updateEvent(fd); }
      else await adminApi.createEvent(fd);
      setShowForm(false); setEditItem(null); load();
    } catch {}
    setSaving(false);
  };

  const remove = async (id) => {
    setDeleting(id);
    try { await adminApi.deleteEvent(id); setEvents(p => p.filter(e => e.id !== id)); } catch {}
    setDeleting(null);
  };

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null); }
    else { setExpanded(id); setExpandedTab("info"); }
  };

  const filtered = events.filter(e => statusFilter === "all" || e.status === statusFilter);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>Etkinlik Yönetimi</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{events.length} etkinlik</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Durum filtresi */}
          <div style={{ display: "flex", gap: 4 }}>
            {["all", ...STATUSES].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  border: `1px solid ${statusFilter === s ? (STATUS_COLORS[s] || "#f5a623") : "rgba(255,255,255,.1)"}`,
                  background: statusFilter === s ? `${STATUS_COLORS[s] || "#f5a623"}22` : "rgba(255,255,255,.04)",
                  color: statusFilter === s ? (STATUS_COLORS[s] || "#f5a623") : "#666" }}>
                {s === "all" ? "Tümü" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <button onClick={() => { setShowForm(true); setEditItem(null); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9,
              background: "rgba(245,166,35,.15)", border: "1px solid #f5a623", color: "#f5a623",
              fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={14} /> Yeni Etkinlik
          </button>
        </div>
      </div>

      {showForm && !editItem && (
        <EventForm initial={EMPTY} onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Etkinlik bulunamadı.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(ev => (
            <div key={ev.id}>
              {editItem?.id === ev.id ? (
                <EventForm
                  initial={{ ...ev, event_date: ev.event_date?.slice(0, 16) || "", is_private: String(ev.is_private || 0), is_active: String(ev.is_active ?? 1) }}
                  onSave={handleSave}
                  onCancel={() => setEditItem(null)}
                  saving={saving}
                />
              ) : (
                <div style={{ background: "var(--surface)", border: `1px solid ${expanded === ev.id ? "rgba(245,166,35,.3)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", transition: "border-color .2s" }}>
                  <div
                    onClick={() => toggleExpand(ev.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
                    onMouseEnter={e => { if (expanded !== ev.id) e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                  >
                    {/* Kapak */}
                    {ev.image_url ? (
                      <img src={ev.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 8, background: "rgba(255,255,255,.04)",
                        border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Calendar size={20} color="#555" />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#ddd" }}>{ev.title_tr}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20,
                          background: `${STATUS_COLORS[ev.status]}22`, color: STATUS_COLORS[ev.status] }}>
                          {STATUS_LABELS[ev.status]}
                        </span>
                        {ev.game && <span style={{ fontSize: 10, color: "#888", background: "rgba(255,255,255,.06)", padding: "1px 7px", borderRadius: 20 }}>{ev.game}</span>}
                        {ev.is_private ? <span style={{ fontSize: 10, color: "#9b59b6", background: "rgba(155,89,182,.1)", padding: "1px 7px", borderRadius: 20 }}>Özel</span> : null}
                        {!ev.is_active ? <span style={{ fontSize: 10, color: "#e74c3c", background: "rgba(231,76,60,.1)", padding: "1px 7px", borderRadius: 20 }}>Pasif</span> : null}
                      </div>
                      <div style={{ fontSize: 11, color: "#666", display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span>{ev.event_date?.slice(0, 16).replace("T", " ")}</span>
                        {ev.route && <span>📍 {ev.route}</span>}
                        <span style={{ color: "#2ecc71" }}>👥 {ev.attending_count || 0}</span>
                        <span style={{ color: "#3498db" }}>🖼 {ev.media_count || 0}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setExpanded(ev.id); setExpandedTab("attendees"); }} title="Katılımcılar"
                        style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(39,174,96,.2)",
                          background: expanded === ev.id && expandedTab === "attendees" ? "rgba(39,174,96,.15)" : "rgba(39,174,96,.06)",
                          color: "#2ecc71", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                        <Users size={12} />{ev.attending_count || 0}
                      </button>
                      <button onClick={() => { setExpanded(ev.id); setExpandedTab("media"); }} title="Medya"
                        style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(52,152,219,.2)",
                          background: expanded === ev.id && expandedTab === "media" ? "rgba(52,152,219,.15)" : "rgba(52,152,219,.06)",
                          color: "#3498db", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                        <Image size={12} />{ev.media_count || 0}
                      </button>
                      <button onClick={() => { setEditItem(ev); setShowForm(false); }} title="Düzenle"
                        style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,.1)",
                          background: "rgba(255,255,255,.04)", color: "#f5a623", cursor: "pointer",
                          display: "flex", alignItems: "center" }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => remove(ev.id)} disabled={deleting === ev.id} title="Sil"
                        style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(231,76,60,.2)",
                          background: "rgba(231,76,60,.1)", color: "#e74c3c", cursor: "pointer",
                          display: "flex", alignItems: "center", opacity: deleting === ev.id ? 0.5 : 1 }}>
                        <Trash2 size={13} />
                      </button>
                      <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>
                        {expanded === ev.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                  </div>

                  {/* Detay paneli */}
                  {expanded === ev.id && (
                    <div style={{ borderTop: "1px solid rgba(245,166,35,.2)", background: "rgba(245,166,35,.03)" }}>

                      {/* Sekme bar */}
                      <div style={{ display: "flex", gap: 2, padding: "10px 16px 0", borderBottom: "1px solid var(--border)" }}>
                        {[
                          { key: "info",       label: "Bilgiler" },
                          { key: "attendees",  label: `Katılımcılar (${ev.attending_count || 0})` },
                          { key: "media",      label: `Medya (${ev.media_count || 0})` },
                        ].map(t => (
                          <button key={t.key} onClick={e => { e.stopPropagation(); setExpandedTab(t.key); }}
                            style={{ padding: "7px 14px", border: "none", borderRadius: "8px 8px 0 0", fontSize: 12, fontWeight: 700, cursor: "pointer",
                              background: expandedTab === t.key ? "var(--surface)" : "transparent",
                              color: expandedTab === t.key ? "#f5a623" : "#666",
                              borderBottom: expandedTab === t.key ? "2px solid #f5a623" : "2px solid transparent",
                            }}>
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Bilgiler */}
                      {expandedTab === "info" && (
                        <div style={{ display: "grid", gridTemplateColumns: ev.image_url ? "200px 1fr" : "1fr", gap: 20, padding: 16 }} onClick={e => e.stopPropagation()}>
                          {ev.image_url && (
                            <img src={ev.image_url} alt="" style={{ width: "100%", borderRadius: 10, objectFit: "cover", maxHeight: 160 }} />
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {ev.description_tr && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>Açıklama</div>
                                <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>{ev.description_tr}</div>
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              {[
                                ["Tarih",    ev.event_date?.slice(0,16).replace("T"," ")],
                                ["Oyun",     ev.game],
                                ["Rota",     ev.route],
                                ["Durum",    STATUS_LABELS[ev.status]],
                                ["Katılımcı", ev.attending_count || 0],
                                ["Medya",    ev.media_count || 0],
                                ev.truckers_url ? ["TruckersMP", ev.truckers_url] : null,
                              ].filter(Boolean).map(([label, val]) => (
                                <div key={label} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", minWidth: 80 }}>
                                  <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: .4, marginBottom: 2 }}>{label}</div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ddd", wordBreak: "break-all" }}>
                                    {label === "TruckersMP"
                                      ? <a href={String(val)} target="_blank" rel="noreferrer" style={{ color: "#f5a623", textDecoration: "none" }}>Linke Git ↗</a>
                                      : String(val ?? "-")}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Katılımcılar */}
                      {expandedTab === "attendees" && (
                        <div style={{ padding: "0 16px 16px" }} onClick={e => e.stopPropagation()}>
                          <AttendeesPanel eventId={ev.id} onClose={() => setExpanded(null)} />
                        </div>
                      )}

                      {/* Medya */}
                      {expandedTab === "media" && (
                        <div style={{ padding: "0 16px 16px" }} onClick={e => e.stopPropagation()}>
                          <MediaPanel eventId={ev.id} onClose={() => setExpanded(null)} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
