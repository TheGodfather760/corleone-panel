import { useEffect, useState, useCallback } from "react";
import { adminPromodsApi } from "../../lib/api";
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const ETS2_DLCS = [
  { key: "going_east",        label: "Going East",             released: true },
  { key: "scandinavia",       label: "Scandinavia",            released: true },
  { key: "vive_la_france",    label: "Vive la France",         released: true },
  { key: "italia",            label: "Italia",                 released: true },
  { key: "beyond_baltic_sea", label: "Beyond the Baltic Sea",  released: true },
  { key: "road_black_sea",    label: "Road to the Black Sea",  released: true },
  { key: "iberia",            label: "Iberia",                 released: true },
  { key: "greece",            label: "Greece",                 released: true },
  { key: "west_balkans",      label: "West Balkans",           released: true },
  { key: "nordic_horizons",   label: "Nordic Horizons",        released: true },
  { key: "soul_of_anatolia",  label: "Soul of Anatolia",       released: false },
  { key: "heart_of_russia",   label: "Heart of Russia",        released: false },
  { key: "isle_of_ireland",   label: "Isle of Ireland",        released: false },
  { key: "iceland",           label: "Iceland",                released: false },
];

const inp = {
  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
  padding: "8px 12px", color: "var(--text-primary)", fontSize: 13,
  outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit",
};

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>{children}</div>;
}

function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: wide ? 560 : 480, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>{children}</div>
        {footer && <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  );
}

function SaveBtn({ onClick, loading, label }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ padding: "8px 20px", borderRadius: 8, background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: loading ? .6 : 1 }}>
      {loading ? "Kaydediliyor..." : (label || "Kaydet")}
    </button>
  );
}

function CancelBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>
      Iptal
    </button>
  );
}

// ── DLC Secici ────────────────────────────────────────────────────────────────
function DlcPicker({ selected, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, padding: 10, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8 }}>
      {ETS2_DLCS.map(dlc => {
        const checked = selected.includes(dlc.key);
        return (
          <label key={dlc.key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, color: dlc.released ? "var(--text-primary)" : "var(--text-muted)", padding: "2px 0" }}>
            <input type="checkbox" checked={checked}
              onChange={e => onChange(e.target.checked ? [...selected, dlc.key] : selected.filter(k => k !== dlc.key))}
              style={{ accentColor: "#f5a623", width: 13, height: 13 }} />
            {dlc.label}
            {!dlc.released && <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: "rgba(245,166,35,.1)", color: "rgba(245,166,35,.6)" }}>YAKINDA</span>}
          </label>
        );
      })}
    </div>
  );
}

// ── Oyun Versiyonu Modal ──────────────────────────────────────────────────────
function GameVersionModal({ gv, game, onClose, onSaved }) {
  const [form, setForm] = useState({
    game, game_version: "", label: "", is_current: false, is_active: true,
    def_file_name: "", def_file_size: "", def_download_url: "",
    required_dlcs: ETS2_DLCS.filter(d => d.released).map(d => d.key),
    ...gv,
    required_dlcs: gv?.required_dlcs || ETS2_DLCS.filter(d => d.released).map(d => d.key),
    is_current: !!gv?.is_current, is_active: gv ? !!gv.is_active : true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.game_version || !form.label) return;
    setSaving(true);
    const res = await adminPromodsApi.saveGameVersion({ ...form, id: gv?.id || 0 });
    setSaving(false);
    if (res.data?.success !== false) { onSaved({ ...form, id: res.data?.data?.id || gv?.id }); onClose(); }
  };

  return (
    <Modal title={gv ? "Oyun Versiyonu Duzenle" : "Yeni Oyun Versiyonu"} onClose={onClose} wide
      footer={<><CancelBtn onClick={onClose} /><SaveBtn onClick={save} loading={saving} /></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Label>Oyun</Label>
            <select value={form.game} onChange={e => set("game", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              <option value="ets2">ETS2</option>
              <option value="ats">ATS</option>
            </select>
          </div>
          <div><Label>Versiyon *</Label><input value={form.game_version} onChange={e => set("game_version", e.target.value)} placeholder="1.61" style={inp} /></div>
        </div>
        <div><Label>Etiket *</Label><input value={form.label} onChange={e => set("label", e.target.value)} placeholder="ETS2 1.61" style={inp} /></div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 10 }}>DEF DOSYASI</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
            <div><Label>Dosya Adi</Label><input value={form.def_file_name} onChange={e => set("def_file_name", e.target.value)} placeholder="promods-def-v284.zip" style={inp} /></div>
            <div><Label>Dosya Boyutu</Label><input value={form.def_file_size} onChange={e => set("def_file_size", e.target.value)} placeholder="12 MB" style={inp} /></div>
          </div>
          <div><Label>Indirme URL</Label><input value={form.def_download_url} onChange={e => set("def_download_url", e.target.value)} placeholder="https://..." style={inp} /></div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <Label>Gerekli DLC'ler</Label>
          <DlcPicker selected={form.required_dlcs} onChange={v => set("required_dlcs", v)} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[["is_current", "Guncel versiyon olarak isaretla"], ["is_active", "Aktif"]].map(([k, l]) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-primary)" }}>
              <input type="checkbox" checked={!!form[k]} onChange={e => set(k, e.target.checked)} style={{ accentColor: "#f5a623", width: 14, height: 14 }} />
              {l}
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ── Paket Versiyonu Modal ─────────────────────────────────────────────────────
function PkgVersionModal({ pv, gvId, packages, onClose, onSaved }) {
  const [form, setForm] = useState({
    package_id: packages[0]?.id || "", game_version_id: gvId,
    pm_version: "", total_size: "", note: "", is_published: false,
    ...pv, is_published: !!pv?.is_published,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.package_id || !form.pm_version) return;
    setSaving(true);
    const res = await adminPromodsApi.savePkgVersion({ ...form, id: pv?.id || 0 });
    setSaving(false);
    if (res.data?.success !== false) { onSaved({ ...form, id: res.data?.data?.id || pv?.id }); onClose(); }
  };

  return (
    <Modal title={pv ? "Paket Versiyonu Duzenle" : "Yeni Paket Versiyonu"} onClose={onClose}
      footer={<><CancelBtn onClick={onClose} /><SaveBtn onClick={save} loading={saving} /></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><Label>Paket *</Label>
          <select value={form.package_id} onChange={e => set("package_id", parseInt(e.target.value))} style={{ ...inp, cursor: "pointer" }}>
            {packages.map(p => <option key={p.id} value={p.id}>{p.map_name}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Label>ProMods Versiyonu *</Label><input value={form.pm_version} onChange={e => set("pm_version", e.target.value)} placeholder="2.84" style={inp} /></div>
          <div><Label>Toplam Boyut</Label><input value={form.total_size} onChange={e => set("total_size", e.target.value)} placeholder="1.2 GB toplam" style={inp} /></div>
        </div>
        <div><Label>Not</Label><textarea value={form.note} onChange={e => set("note", e.target.value)} rows={2} placeholder="ProMods Europe gerektirir." style={{ ...inp, resize: "vertical" }} /></div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-primary)" }}>
          <input type="checkbox" checked={form.is_published} onChange={e => set("is_published", e.target.checked)} style={{ accentColor: "#f5a623", width: 14, height: 14 }} />
          Yayinda
        </label>
      </div>
    </Modal>
  );
}

// ── Dosya Modal ───────────────────────────────────────────────────────────────
function FileModal({ file, pvId, nextSort, onClose, onSaved }) {
  const [form, setForm] = useState({
    package_version_id: pvId, sort_order: nextSort,
    file_name: "", file_size: "", download_url: "",
    ...file,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.file_name || !form.file_size) return;
    setSaving(true);
    const res = await adminPromodsApi.saveFile({ ...form, id: file?.id || 0 });
    setSaving(false);
    if (res.data?.success !== false) { onSaved({ ...form, id: res.data?.data?.id || file?.id }); onClose(); }
  };

  return (
    <Modal title={file ? "Dosya Duzenle" : "Yeni Dosya"} onClose={onClose}
      footer={<><CancelBtn onClick={onClose} /><SaveBtn onClick={save} loading={saving} /></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><Label>Sira No</Label><input type="number" value={form.sort_order} min="1" onChange={e => set("sort_order", parseInt(e.target.value))} style={inp} /></div>
          <div><Label>Dosya Boyutu *</Label><input value={form.file_size} onChange={e => set("file_size", e.target.value)} placeholder="250 MB" style={inp} /></div>
        </div>
        <div><Label>Dosya Adi *</Label><input value={form.file_name} onChange={e => set("file_name", e.target.value)} placeholder="promods-europe-v284.7z.001" style={inp} /></div>
        <div><Label>Indirme URL</Label><input value={form.download_url} onChange={e => set("download_url", e.target.value)} placeholder="https://..." style={inp} /></div>
        <div style={{ padding: "10px 12px", background: "rgba(245,166,35,.08)", border: "1px solid rgba(245,166,35,.2)", borderRadius: 8, fontSize: 11, color: "var(--text-muted)" }}>
          Tum dosyalarin URL'si girildiginde paket otomatik yayina alinir.
        </div>
      </div>
    </Modal>
  );
}

export { GameVersionModal, PkgVersionModal, FileModal };
