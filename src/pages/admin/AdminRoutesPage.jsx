import { useEffect, useState, useRef, useCallback } from "react";
import { routesApi } from "../../lib/api";
import { Plus, Search, Check, Trash2, Pencil, X, Upload, ChevronDown, Image, Map } from "lucide-react";

const ETS2_DLCS = ["Beyond the Baltic Sea","Going East","Greece","Iceland","Iberia","Isle of Ireland","Italia","Nordic Horizons","Road to the Black Sea","Scandinavia","Soul of Anatolia","Vive la France","West Balkans"];
const ATS_DLCS  = ["Arizona","Colorado","Idaho","Kansas","Montana","Nebraska","New Mexico","Oklahoma","Oregon","Texas","Utah","Washington","Wyoming"];

const DIFF_LABELS  = { easy: "Kolay", medium: "Orta", hard: "Zor", extreme: "Extreme" };
const DIFF_COLORS  = { easy: "#2ecc71", medium: "#f5a623", hard: "#e67e22", extreme: "#e74c3c" };
const MAP_LABELS   = { vanilla: "Ana Harita", promods: "ProMods", dlc: "DLC" };
const TYPE_LABELS  = { route: "Rota", start: "Baslangic", end: "Bitis", extra: "Ek" };
const TYPE_COLORS  = { route: "#3498db", start: "#2ecc71", end: "#e74c3c", extra: "#9b59b6" };

const inp = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
const sel = { ...inp, cursor: "pointer" };

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>{children}</div>;
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: color || "#fff", letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, letterSpacing: .4, textTransform: "uppercase", background: `${color}22`, color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  );
}

// ── Rota Formu ────────────────────────────────────────────────────────────────
function RouteForm({ initial, poolImages, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    title: "", game: "ets2", origin_city: "", origin_company: "",
    destination_city: "", destination_company: "", distance_km: "",
    difficulty: "medium", map_type: "vanilla", notes: "",
    dlc_required: [], image_ids: [],
    ...initial,
  });
  const [uploading, setUploading] = useState(false);
  const [localImgs, setLocalImgs] = useState([]);
  const fileRef = useRef();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const dlcList = form.game === "ets2" ? ETS2_DLCS : ATS_DLCS;

  const toggleDlc = (dlc) => {
    set("dlc_required", form.dlc_required.includes(dlc)
      ? form.dlc_required.filter(d => d !== dlc)
      : [...form.dlc_required, dlc]);
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("image", file);
      const res = await routesApi.uploadPoolImage(fd);
      if (res.data.success) {
        const img = { id: res.data.data.id, path: res.data.data.path, url: res.data.data.url };
        setLocalImgs(p => [...p, img]);
        set("image_ids", [...form.image_ids, img.id]);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeLocalImg = async (img) => {
    await routesApi.deleteImage(img.id);
    setLocalImgs(p => p.filter(i => i.id !== img.id));
    set("image_ids", form.image_ids.filter(id => id !== img.id));
  };

  const togglePoolImg = (img) => {
    const has = form.image_ids.includes(img.id);
    set("image_ids", has ? form.image_ids.filter(id => id !== img.id) : [...form.image_ids, img.id]);
  };

  const submit = () => {
    if (!form.origin_city.trim() || !form.destination_city.trim()) return;
    onSave({ ...form, distance_km: form.distance_km ? parseInt(form.distance_km) : null });
  };

  const allImgs = [...localImgs, ...poolImages.filter(p => form.image_ids.includes(p.id) && !localImgs.find(l => l.id === p.id))];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        <div><Label>Oyun *</Label>
          <select value={form.game} onChange={e => { set("game", e.target.value); set("dlc_required", []); }} style={sel}>
            <option value="ets2">Euro Truck Simulator 2</option>
            <option value="ats">American Truck Simulator</option>
          </select>
        </div>
        <div><Label>Rota Adi (opsiyonel)</Label>
          <input value={form.title} onChange={e => set("title", e.target.value)} style={inp} placeholder="Ornek: Kuzey Turu" />
        </div>

        <div><Label>Baslangic Sehri *</Label>
          <input value={form.origin_city} onChange={e => set("origin_city", e.target.value)} style={inp} placeholder="Ornek: Calais" />
        </div>
        <div><Label>Bitis Sehri *</Label>
          <input value={form.destination_city} onChange={e => set("destination_city", e.target.value)} style={inp} placeholder="Ornek: Berlin" />
        </div>

        <div><Label>Baslangic Sirketi</Label>
          <input value={form.origin_company} onChange={e => set("origin_company", e.target.value)} style={inp} placeholder="Ornek: Volvo Fabrikasi" />
        </div>
        <div><Label>Bitis Sirketi</Label>
          <input value={form.destination_company} onChange={e => set("destination_company", e.target.value)} style={inp} placeholder="Ornek: BMW Deposu" />
        </div>

        <div><Label>Mesafe (km)</Label>
          <input type="number" value={form.distance_km} onChange={e => set("distance_km", e.target.value)} style={inp} placeholder="850" min="1" max="9999" />
        </div>
        <div><Label>Zorluk *</Label>
          <select value={form.difficulty} onChange={e => set("difficulty", e.target.value)} style={sel}>
            {Object.entries(DIFF_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <Label>Harita Turu *</Label>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(MAP_LABELS).map(([k, v]) => (
              <button key={k} onClick={() => { set("map_type", k); if (k !== "dlc") set("dlc_required", []); }}
                style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${form.map_type === k ? "#f5a623" : "var(--border)"}`, background: form.map_type === k ? "rgba(245,166,35,.15)" : "var(--bg)", color: form.map_type === k ? "#f5a623" : "var(--text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {form.map_type === "dlc" && (
          <div style={{ gridColumn: "1/-1" }}>
            <Label>DLC Secimi</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {dlcList.map(dlc => (
                <button key={dlc} onClick={() => toggleDlc(dlc)}
                  style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${form.dlc_required.includes(dlc) ? "#f5a623" : "var(--border)"}`, background: form.dlc_required.includes(dlc) ? "rgba(245,166,35,.12)" : "var(--bg)", color: form.dlc_required.includes(dlc) ? "#f5a623" : "var(--text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {dlc}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ gridColumn: "1/-1" }}>
          <Label>Notlar</Label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
            style={{ ...inp, resize: "vertical" }} placeholder="Ozel gecisler, dikkat edilmesi gereken noktalar..." />
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <Label>Gorseller</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {allImgs.map(img => (
              <div key={img.id} style={{ position: "relative" }}>
                <img src={img.url || routesApi.imageUrl(img.path)} alt="" style={{ width: 80, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                <button onClick={() => removeLocalImg(img)}
                  style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: "#e74c3c", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={9} />
                </button>
              </div>
            ))}
            <label style={{ width: 80, height: 56, borderRadius: 6, border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", fontSize: 20 }}>
              {uploading ? "..." : "+"}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleUpload} />
            </label>
          </div>
          {poolImages.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Havuzdan sec:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {poolImages.slice(0, 12).map(img => {
                  const sel = form.image_ids.includes(img.id);
                  return (
                    <div key={img.id} onClick={() => togglePoolImg(img)} style={{ position: "relative", cursor: "pointer" }}>
                      <img src={routesApi.imageUrl(img.path)} alt="" style={{ width: 60, height: 42, objectFit: "cover", borderRadius: 5, border: `2px solid ${sel ? "#f5a623" : "transparent"}`, opacity: sel ? 1 : 0.6 }} />
                      {sel && <div style={{ position: "absolute", top: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: "#f5a623", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={8} color="#000" /></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ gridColumn: "1/-1", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Iptal</button>
          <button onClick={submit} disabled={saving || !form.origin_city.trim() || !form.destination_city.trim()}
            style={{ padding: "8px 20px", borderRadius: 8, background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? .6 : 1 }}>
            {saving ? "Kaydediliyor..." : initial?.id ? "Guncelle" : "Olustur"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Rota Detay Modal ──────────────────────────────────────────────────────────
function RouteDetailModal({ route, isAdmin, onClose, onDelete, onVerify, onAssign }) {
  const [images, setImages]   = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [events, setEvents]   = useState([]);
  const [evFilter, setEvFilter] = useState("all");
  const fileRef = useRef();

  useEffect(() => {
    routesApi.images(route.id).then(res => setImages(res.data?.data?.images || []));
  }, [route.id]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("route_id", route.id);
      fd.append("image_type", "extra");
      const res = await routesApi.uploadRouteImage(fd);
      if (res.data.success) setImages(p => [...p, { id: res.data.data.id, image_path: res.data.data.path }]);
    }
    setUploading(false);
    e.target.value = "";
  };

  const deleteImg = async (id) => {
    await routesApi.deleteImage(id);
    setImages(p => p.filter(i => i.id !== id));
    setActiveIdx(0);
  };

  const openAssign = async () => {
    setShowAssign(true);
    const res = await routesApi.eventsForAssign();
    setEvents(res.data?.data?.events || []);
  };

  const assign = async (eventId) => {
    await routesApi.assignEvent(route.id, eventId);
    setEvents(p => p.map(e => e.id === eventId ? { ...e, route: route.origin_city + " -> " + route.destination_city } : e));
    onAssign?.();
  };

  const unassign = async (eventId) => {
    await routesApi.unassignEvent(eventId);
    setEvents(p => p.map(e => e.id === eventId ? { ...e, route: null } : e));
    onAssign?.();
  };

  const dlcs = route.dlc_required ? JSON.parse(route.dlc_required) : [];
  const activeImg = images[activeIdx];
  const km = parseInt(route.distance_km) || 0;
  const timeStr = km > 0 ? (() => { const m = Math.floor(km * 0.045); const s = Math.round((km * 0.045 - m) * 60); return m > 0 ? `${m} dk ${s} sn` : `${s} sn`; })() : "-";
  const fuelRanges = { easy: [300,350], medium: [300,350], hard: [350,420], extreme: [420,500] };
  const [fMin, fMax] = fuelRanges[route.difficulty] || [300,350];
  const fuelStr = km > 0 ? `${Math.round(km/1000*fMin)}-${Math.round(km/1000*fMax)} lt` : "-";

  const filteredEvents = events.filter(e => {
    if (evFilter === "no-route") return !e.route;
    if (evFilter === "has-route") return !!e.route;
    if (evFilter === "ets2") return (e.game||"").toLowerCase().includes("ets2");
    if (evFilter === "ats") return (e.game||"").toLowerCase().includes("ats");
    return true;
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#141210", border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, width: "100%", maxWidth: 1100, maxHeight: "94vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 14px", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {route.title || `${route.origin_city} ${"->"}  ${route.destination_city}`}
            {route.is_verified ? <Badge label="Dogrulandi" color="#2ecc71" /> : null}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#aaa", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", flex: 1, minHeight: 0, overflow: "hidden", padding: "0 20px 16px", gap: 16 }}>

          {/* Sol: Gorsel */}
          <div style={{ position: "relative", background: "#0d0b09", borderRadius: 12, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {activeImg ? (
              <img src={routesApi.imageUrl(activeImg.image_path)} alt="" style={{ flex: 1, width: "100%", objectFit: "cover", cursor: "pointer" }}
                onClick={() => window.open(routesApi.imageUrl(activeImg.image_path), "_blank")} />
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: .15 }}>
                <Image size={64} />
              </div>
            )}
            {isAdmin && activeImg && (
              <button onClick={() => deleteImg(activeImg.id)}
                style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: "rgba(231,76,60,.85)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={11} />
              </button>
            )}
            {/* Thumbnail strip */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 12px", background: "linear-gradient(to top,rgba(0,0,0,.9),transparent)", display: "flex", gap: 6, alignItems: "center" }}>
              {images.map((img, i) => (
                <div key={img.id} onClick={() => setActiveIdx(i)}
                  style={{ width: 52, height: 36, borderRadius: 5, overflow: "hidden", border: `2px solid ${i === activeIdx ? "#f5a623" : "transparent"}`, cursor: "pointer", flexShrink: 0 }}>
                  <img src={routesApi.imageUrl(img.image_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
              {isAdmin && (
                <label style={{ width: 36, height: 36, borderRadius: 5, background: "rgba(255,255,255,.08)", border: "1px dashed rgba(255,255,255,.2)", color: "#aaa", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, flexShrink: 0 }}>
                  {uploading ? "..." : "+"}
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleUpload} />
                </label>
              )}
            </div>
          </div>

          {/* Sag: Bilgi */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "#f5a623", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>OYUN</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{route.game?.toUpperCase()}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, overflow: "hidden" }}>
              {[
                ["ROTA", `${route.origin_city} -> ${route.destination_city}`],
                route.origin_company ? ["SIRKET", `${route.origin_company || "-"} -> ${route.destination_company || "-"}`] : null,
                ["MESAFE", route.distance_km ? `${Number(route.distance_km).toLocaleString("tr-TR")} km` : "-"],
                ["ZORLUK", DIFF_LABELS[route.difficulty], DIFF_COLORS[route.difficulty]],
                ["HARITA", MAP_LABELS[route.map_type]],
                ["DURUM", route.is_verified ? "Dogrulandi" : "Bekliyor", route.is_verified ? "#2ecc71" : "#888"],
                dlcs.length ? ["DLC", dlcs.join(", ")] : null,
              ].filter(Boolean).map(([label, val, color], i, arr) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: color || "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: "#0f0d0b", flexWrap: "wrap" }}>
          <div style={{ flex: 1, display: "flex", gap: 0, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, overflow: "hidden" }}>
            {[["Tahmini Sure", timeStr], ["Yakit", fuelStr], ["Yuk", route.game === "ets2" ? "10-25 ton" : "15-30 ton"]].map(([l, v], i, arr) => (
              <div key={l} style={{ flex: 1, padding: "10px 14px", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .4, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{v}</div>
              </div>
            ))}
          </div>
          {isAdmin && (
            <>
              <button onClick={() => onDelete(route.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: "rgba(255,255,255,.04)", border: "1px solid rgba(231,76,60,.4)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Trash2 size={13} /> Sil
              </button>
              <button onClick={() => onVerify(route.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: "rgba(255,255,255,.04)", border: "1px solid rgba(46,204,113,.4)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Check size={13} /> {route.is_verified ? "Dogrulamayi Kaldir" : "Dogrula"}
              </button>
              <button onClick={openAssign}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: "rgba(255,255,255,.04)", border: "1px solid rgba(245,166,35,.4)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Map size={13} /> Etkinlige Ekle
              </button>
            </>
          )}
          <button onClick={onClose}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Kapat
          </button>
        </div>
      </div>

      {/* Etkinlige Ekle Modal */}
      {showAssign && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 9995, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAssign(false); }}>
          <div style={{ background: "#141210", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Etkinlige Ekle</div>
                <div style={{ fontSize: 12, color: "#f5a623", marginTop: 2 }}>{route.origin_city} {"->"} {route.destination_city}</div>
              </div>
              <button onClick={() => setShowAssign(false)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", gap: 6, padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,.07)", flexWrap: "wrap" }}>
              {[["all","Tumü"],["no-route","Rotasiz"],["has-route","Rotasi Var"],["ets2","ETS2"],["ats","ATS"]].map(([k,l]) => (
                <button key={k} onClick={() => setEvFilter(k)}
                  style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${evFilter===k?"rgba(245,166,35,.4)":"rgba(255,255,255,.12)"}`, background: evFilter===k?"rgba(245,166,35,.15)":"rgba(255,255,255,.04)", color: evFilter===k?"#f5a623":"#aaa", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "10px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredEvents.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Etkinlik bulunamadi.</div>
              ) : filteredEvents.map(ev => (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.03)", border: `1px solid ${ev.route?"rgba(245,166,35,.2)":"rgba(255,255,255,.07)"}`, borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title_tr}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{ev.game} · {ev.event_date?.slice(0,10)}</div>
                    {ev.route && <div style={{ fontSize: 11, color: "#f5a623", marginTop: 2 }}>Mevcut: {ev.route}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => assign(ev.id)}
                      style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(245,166,35,.12)", border: "1px solid rgba(245,166,35,.3)", color: "#f5a623", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Ekle
                    </button>
                    {ev.route && (
                      <button onClick={() => unassign(ev.id)}
                        style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.25)", color: "#e74c3c", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        Kaldir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function AdminRoutesPage() {
  const [routes, setRoutes]     = useState([]);
  const [pool, setPool]         = useState([]);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("routes");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailRoute, setDetailRoute] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch]     = useState("");
  const [filterGame, setFilterGame]   = useState("");
  const [filterMap, setFilterMap]     = useState("");
  const [filterDiff, setFilterDiff]   = useState("");
  const [filterVerified, setFilterVerified] = useState("");
  const [poolUploading, setPoolUploading] = useState(false);
  const poolFileRef = useRef();
  const isAdmin = true;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await routesApi.list();
    const d = res.data?.data || {};
    setRoutes(d.routes || []);
    setPool(d.pool || []);
    setStats(d.stats || {});
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    if (editItem) {
      await routesApi.update({ ...data, id: editItem.id });
    } else {
      await routesApi.save(data);
    }
    setSaving(false);
    setShowForm(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu rotayi silmek istediginize emin misiniz?")) return;
    setDeleting(id);
    await routesApi.delete(id);
    setDeleting(null);
    setDetailRoute(null);
    load();
  };

  const handleVerify = async (id) => {
    await routesApi.toggleVerify(id);
    load();
    if (detailRoute?.id === id) {
      setDetailRoute(r => r ? { ...r, is_verified: !r.is_verified } : r);
    }
  };

  const handlePoolUpload = async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;
    setPoolUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("image", file);
      const res = await routesApi.uploadPoolImage(fd);
      if (res.data.success) {
        const img = { id: res.data.data.id, image_path: res.data.data.path, image_type: "route" };
        setPool(p => [img, ...p]);
        setStats(s => ({ ...s, pool: (s.pool || 0) + 1 }));
      }
    }
    setPoolUploading(false);
    e.target.value = "";
  };

  const deletePoolImg = async (id) => {
    await routesApi.deleteImage(id);
    setPool(p => p.filter(i => i.id !== id));
    setStats(s => ({ ...s, pool: Math.max(0, (s.pool || 0) - 1) }));
  };

  const filtered = routes.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || (r.origin_city + " " + r.destination_city + " " + (r.title || "")).toLowerCase().includes(q);
    return matchQ
      && (!filterGame     || r.game === filterGame)
      && (!filterMap      || r.map_type === filterMap)
      && (!filterDiff     || r.difficulty === filterDiff)
      && (filterVerified === "" || String(r.is_verified ? 1 : 0) === filterVerified);
  });

  return (
    <>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
        <StatCard label="Toplam Rota" value={stats.total || 0} color="#f5a623" />
        <StatCard label="ETS2 Rotasi" value={stats.ets2 || 0} color="#3498db" />
        <StatCard label="ATS Rotasi"  value={stats.ats  || 0} color="#9b59b6" />
        <StatCard label="Dogrulandi"  value={stats.verified || 0} color="#2ecc71" />
        <StatCard label="Havuz Gorsel" value={stats.pool || 0} color="#1abc9c" />
      </div>

      {/* Sekmeler */}
      <div style={{ display: "flex", gap: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, marginBottom: 16, width: "fit-content" }}>
        {[["routes","Rotalar"],["pool","Gorsel Havuzu"]].map(([k,l]) => (
          <button key={k} onClick={() => setActiveTab(k)}
            style={{ padding: "8px 20px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", background: activeTab===k?"#f5a623":"transparent", color: activeTab===k?"#000":"var(--text-muted)", transition: "all .2s" }}>
            {l} <span style={{ background: activeTab===k?"rgba(0,0,0,.2)":"rgba(255,255,255,.1)", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800, marginLeft: 4 }}>{k==="routes"?routes.length:pool.length}</span>
          </button>
        ))}
      </div>

      {/* ── ROTALAR ── */}
      {activeTab === "routes" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", flex: 1, minWidth: 180 }}>
                <Search size={13} color="var(--text-muted)" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sehir veya rota adi ara..."
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit" }} />
              </div>
              {[
                ["filterGame",   filterGame,   setFilterGame,   [["","Tum Oyunlar"],["ets2","ETS2"],["ats","ATS"]]],
                ["filterMap",    filterMap,    setFilterMap,    [["","Tum Haritalar"],["vanilla","Ana Harita"],["promods","ProMods"],["dlc","DLC"]]],
                ["filterDiff",   filterDiff,   setFilterDiff,   [["","Tum Zorluklar"],["easy","Kolay"],["medium","Orta"],["hard","Zor"],["extreme","Extreme"]]],
                ["filterVerified",filterVerified,setFilterVerified,[["","Tumü"],["1","Dogrulandi"],["0","Dogrulanmadi"]]],
              ].map(([key, val, setter, opts]) => (
                <select key={key} value={val} onChange={e => setter(e.target.value)}
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
                  {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center" }}>{filtered.length} rota</span>
            </div>
            <button onClick={() => { setShowForm(true); setEditItem(null); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(245,166,35,.15)", border: "1px solid #f5a623", color: "#f5a623", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <Plus size={14} /> Yeni Rota
            </button>
          </div>

          {showForm && !editItem && (
            <RouteForm initial={{}} poolImages={pool} onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
          )}

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Yukleniyor...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Rota bulunamadi.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {filtered.map(r => {
                const dlcs = r.dlc_required ? JSON.parse(r.dlc_required) : [];
                return editItem?.id === r.id ? (
                  <div key={r.id} style={{ gridColumn: "1/-1" }}>
                    <RouteForm initial={{ ...editItem, dlc_required: editItem.dlc_required ? JSON.parse(editItem.dlc_required) : [], image_ids: [] }}
                      poolImages={pool} onSave={handleSave} onCancel={() => setEditItem(null)} saving={saving} />
                  </div>
                ) : (
                  <div key={r.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "all .2s" }}
                    onClick={() => setDetailRoute(r)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,166,35,.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}>
                    {/* Thumbnail */}
                    <div style={{ height: 130, background: "var(--surface)", position: "relative", overflow: "hidden" }}>
                      {r.thumb ? (
                        <img src={routesApi.imageUrl(r.thumb)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: .15 }}>
                          <Image size={48} />
                        </div>
                      )}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 60%)" }} />
                      <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 5 }}>
                        <Badge label={r.game?.toUpperCase()} color={r.game==="ets2"?"#3498db":"#9b59b6"} />
                        {r.is_verified && <Badge label="Dogrulandi" color="#2ecc71" />}
                      </div>
                      {r.img_count > 0 && (
                        <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,.7)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "rgba(255,255,255,.7)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Image size={10} /> {r.img_count}
                        </div>
                      )}
                    </div>
                    {/* Body */}
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.title || `${r.origin_city} -> ${r.destination_city}`}
                      </div>
                      {r.title && <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{r.origin_city} {"->"} {r.destination_city}</div>}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        {r.distance_km && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{Number(r.distance_km).toLocaleString("tr-TR")} km</span>}
                        <span style={{ fontSize: 11, color: DIFF_COLORS[r.difficulty] }}>{DIFF_LABELS[r.difficulty]}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{MAP_LABELS[r.map_type]}</span>
                      </div>
                      {dlcs.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                          {dlcs.slice(0,3).map(d => <Badge key={d} label={d} color="#f5a623" />)}
                          {dlcs.length > 3 && <span style={{ fontSize: 9, color: "var(--text-muted)" }}>+{dlcs.length-3}</span>}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.creator} · {r.created_at?.slice(0,10)}</div>
                        {isAdmin && (
                          <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setEditItem(r); setShowForm(false); }}
                              style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", color: "#f5a623", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleVerify(r.id)}
                              style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${r.is_verified?"rgba(46,204,113,.4)":"var(--border)"}`, background: r.is_verified?"rgba(46,204,113,.08)":"var(--surface)", color: r.is_verified?"#2ecc71":"var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <Check size={13} />
                            </button>
                            <button onClick={() => handleDelete(r.id)} disabled={deleting===r.id}
                              style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(231,76,60,.2)", background: "rgba(231,76,60,.1)", color: "#e74c3c", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: deleting===r.id?.5:1 }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── GORSEL HAVUZU ── */}
      {activeTab === "pool" && (
        <>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: .6 }}>Gorsel Yukle</div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>JPG, PNG, WEBP</span>
            </div>
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "40px 24px", border: "2px dashed var(--border)", margin: 16, borderRadius: 12, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#f5a623"; e.currentTarget.style.background = "rgba(245,166,35,.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = ""; }}>
              <Upload size={32} style={{ opacity: .3 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Gorselleri buraya surukle veya tikla</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Coklu secim desteklenir</div>
              <input ref={poolFileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePoolUpload} />
            </label>
            {poolUploading && <div style={{ padding: "0 16px 12px", fontSize: 12, color: "#f5a623" }}>Yukleniyor...</div>}
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: .6 }}>
              Bekleyen Gorseller ({pool.length})
            </div>
            {pool.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Havuzda gorsel yok.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, padding: 16 }}>
                {pool.map(img => (
                  <div key={img.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "var(--bg)", border: "1px solid var(--border)", aspectRatio: "16/10" }}
                    onMouseEnter={e => { const b = e.currentTarget.querySelector(".pool-del"); if (b) b.style.opacity = "1"; }}
                    onMouseLeave={e => { const b = e.currentTarget.querySelector(".pool-del"); if (b) b.style.opacity = "0"; }}>
                    <img src={routesApi.imageUrl(img.image_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", top: 6, left: 6 }}>
                      <Badge label={TYPE_LABELS[img.image_type] || img.image_type} color={TYPE_COLORS[img.image_type] || "#888"} />
                    </div>
                    <button className="pool-del" onClick={() => deletePoolImg(img.id)}
                      style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(231,76,60,.9)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .15s" }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Detay Modal */}
      {detailRoute && (
        <RouteDetailModal
          route={detailRoute}
          isAdmin={isAdmin}
          onClose={() => setDetailRoute(null)}
          onDelete={handleDelete}
          onVerify={handleVerify}
          onAssign={load}
        />
      )}
    </>
  );
}
