import { useEffect, useState, useRef, useCallback } from "react";
import { adminFleetApi } from "../../lib/api";
import { Pencil, X, Upload, History, Truck, Package } from "lucide-react";

export const STATUS_LABELS = { active: "Aktif", inactive: "Kullanim Disi", sold: "Satildi", broken: "Arizali" };
export const STATUS_COLORS = { active: "#2ecc71", inactive: "#888", sold: "#f5a623", broken: "#e74c3c" };

const inp = {
  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
  padding: "8px 12px", color: "var(--text-primary)", fontSize: 13,
  outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit",
};

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>{children}</div>;
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "#888";
  const label = STATUS_LABELS[status] || status;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

function FleetThumb({ url, placeholder, size = 52 }) {
  if (url) return <img src={url} style={{ width: size, height: Math.round(size * 0.65), objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: Math.round(size * 0.65), borderRadius: 6, border: "1px dashed var(--border)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
      {placeholder}
    </div>
  );
}

// ── Gorsel Yukleme Alani ──────────────────────────────────────────────────────
function ImageUploader({ currentUrl, onFileSelect, onRemove }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(currentUrl);

  useEffect(() => setPreview(currentUrl), [currentUrl]);

  const handleFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      {preview && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <img src={preview} style={{ maxHeight: 90, maxWidth: 200, objectFit: "contain", borderRadius: 7, border: "1px solid var(--border)" }} />
          <button type="button" onClick={() => { setPreview(null); onRemove(); }}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.2)", color: "#e74c3c", fontSize: 11, cursor: "pointer" }}>
            <X size={11} /> Kaldir
          </button>
        </div>
      )}
      <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: "16px", textAlign: "center", cursor: "pointer", transition: "border-color .2s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#f5a623"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
        <Upload size={22} style={{ opacity: .3, marginBottom: 6 }} />
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Tikla veya surukle · JPG, PNG, WEBP · max 8MB</div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])} />
      </div>
    </div>
  );
}

// ── Cekici Duzenle Modal ──────────────────────────────────────────────────────
export function TruckEditModal({ truck, trailers, onClose, onSaved }) {
  const [form, setForm] = useState({
    brand: truck.brand || "", model: truck.model || "",
    engine_hp: truck.engine_hp || "", engine_kw: truck.engine_kw || "",
    garage: truck.garage || "", total_km: truck.total_km || "",
    status: truck.status || "active", profile_version: truck.profile_version || "",
    notes: truck.notes || "", changelog_note: "",
    compat_trailers: truck.compat_trailers || [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleCompat = (id) => {
    set("compat_trailers", form.compat_trailers.includes(id)
      ? form.compat_trailers.filter(t => t !== id)
      : [...form.compat_trailers, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append("id", truck.id);
    Object.entries(form).forEach(([k, v]) => {
      if (k === "compat_trailers") v.forEach(id => fd.append("compat_trailers[]", id));
      else fd.append(k, v);
    });
    if (imageFile) fd.append("image", imageFile);
    if (removeImage) fd.append("remove_image", "1");
    const res = await adminFleetApi.updateTruck(fd);
    setSaving(false);
    if (res.data?.success !== false) {
      onSaved({ ...truck, ...form, image_url: res.data?.data?.image_url ?? (removeImage ? null : truck.image_url) });
      onClose();
    }
  };

  const changelog = truck.changelog || [];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>#{truck.sort_order} {truck.brand} {truck.model}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div><Label>Gorsel</Label><ImageUploader currentUrl={truck.image_url} onFileSelect={f => { setImageFile(f); setRemoveImage(false); }} onRemove={() => { setImageFile(null); setRemoveImage(true); }} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><Label>Marka</Label><input value={form.brand} onChange={e => set("brand", e.target.value)} style={inp} /></div>
            <div><Label>Model</Label><input value={form.model} onChange={e => set("model", e.target.value)} style={inp} /></div>
            <div><Label>Motor (bg)</Label><input type="number" value={form.engine_hp} onChange={e => set("engine_hp", e.target.value)} style={inp} /></div>
            <div><Label>Motor (kW)</Label><input type="number" value={form.engine_kw} onChange={e => set("engine_kw", e.target.value)} style={inp} /></div>
            <div><Label>Garaj</Label><input value={form.garage} onChange={e => set("garage", e.target.value)} style={inp} /></div>
            <div><Label>Toplam KM</Label><input type="number" value={form.total_km} onChange={e => set("total_km", e.target.value)} style={inp} /></div>
            <div><Label>Durum</Label>
              <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div><Label>Profil Versiyonu</Label><input value={form.profile_version} onChange={e => set("profile_version", e.target.value)} style={inp} /></div>
          </div>
          <div><Label>Notlar</Label><textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} /></div>
          <div>
            <Label>Guncelleme Notu (changelog)</Label>
            <input value={form.changelog_note} onChange={e => set("changelog_note", e.target.value)} placeholder="Ornek: Motor degistirildi" style={inp} />
            {changelog.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: 5 }}>
                <History size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                {changelog.slice(-3).map(c => `${c.date}: ${c.note}`).join(" · ")}
              </div>
            )}
          </div>
          <div>
            <Label>Uyumlu Dorseler</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {trailers.map(tr => {
                const sel = form.compat_trailers.includes(tr.id);
                const label = [tr.brand, tr.model || tr.type_name].filter(Boolean).join(" ");
                return (
                  <div key={tr.id} onClick={() => toggleCompat(tr.id)}
                    style={{ display: "flex", flexDirection: "column", width: 110, borderRadius: 8, border: `2px solid ${sel ? "#f5a623" : "var(--border)"}`, background: sel ? "rgba(245,166,35,.08)" : "var(--bg)", cursor: "pointer", overflow: "hidden", transition: "all .15s" }}>
                    {tr.image_url
                      ? <img src={tr.image_url} style={{ width: "100%", height: 64, objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: 64, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🚚</div>}
                    <div style={{ padding: "5px 7px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: sel ? "#f5a623" : "var(--text-muted)" }}>#{tr.sort_order}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: sel ? "#f5a623" : "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tr.brand || "-"}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tr.model || tr.type_name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Iptal</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "8px 20px", borderRadius: 8, background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? .6 : 1 }}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dorse Duzenle Modal ───────────────────────────────────────────────────────
export function TrailerEditModal({ trailer, onClose, onSaved }) {
  const [form, setForm] = useState({
    brand: trailer.brand || "", model: trailer.model || trailer.type_name || "",
    garage: trailer.garage || "", usage_pct: trailer.usage_pct || 0,
    status: trailer.status || "active", profile_version: trailer.profile_version || "",
    notes: trailer.notes || "", changelog_note: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append("id", trailer.id);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append("image", imageFile);
    if (removeImage) fd.append("remove_image", "1");
    const res = await adminFleetApi.updateTrailer(fd);
    setSaving(false);
    if (res.data?.success !== false) {
      onSaved({ ...trailer, ...form, image_url: res.data?.data?.image_url ?? (removeImage ? null : trailer.image_url) });
      onClose();
    }
  };

  const changelog = trailer.changelog || [];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>#{trailer.sort_order} {trailer.brand} {trailer.model || trailer.type_name}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div><Label>Gorsel</Label><ImageUploader currentUrl={trailer.image_url} onFileSelect={f => { setImageFile(f); setRemoveImage(false); }} onRemove={() => { setImageFile(null); setRemoveImage(true); }} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><Label>Marka</Label><input value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="Schwarzmuller, Krone..." style={inp} /></div>
            <div><Label>Model</Label><input value={form.model} onChange={e => set("model", e.target.value)} placeholder="Low Loader, Cool Liner..." style={inp} /></div>
            <div><Label>Garaj</Label><input value={form.garage} onChange={e => set("garage", e.target.value)} style={inp} /></div>
            <div><Label>Kullanim %</Label><input type="number" value={form.usage_pct} min="0" max="100" onChange={e => set("usage_pct", e.target.value)} style={inp} /></div>
            <div><Label>Durum</Label>
              <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div><Label>Profil Versiyonu</Label><input value={form.profile_version} onChange={e => set("profile_version", e.target.value)} style={inp} /></div>
          </div>
          <div><Label>Notlar</Label><textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} /></div>
          <div>
            <Label>Guncelleme Notu (changelog)</Label>
            <input value={form.changelog_note} onChange={e => set("changelog_note", e.target.value)} placeholder="Ornek: Yeni dorse alindi" style={inp} />
            {changelog.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: 5 }}>
                <History size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                {changelog.slice(-3).map(c => `${c.date}: ${c.note}`).join(" · ")}
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Iptal</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "8px 20px", borderRadius: 8, background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? .6 : 1 }}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared hook ───────────────────────────────────────────────────────────────
export function useFleetData() {
  const [trucks, setTrucks]     = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFleetApi.list();
    const d = res.data?.data || {};
    setTrucks(d.trucks || []);
    setTrailers(d.trailers || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { trucks, setTrucks, trailers, setTrailers, loading };
}

export { FleetThumb, StatusBadge };
