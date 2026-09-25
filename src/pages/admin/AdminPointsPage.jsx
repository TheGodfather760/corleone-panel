import { useEffect, useState, useCallback } from "react";
import { adminPointsApi } from "../../lib/api";
import { Save, Plus, Trash2, Trophy, Star, CheckSquare, BarChart2 } from "lucide-react";

const inp = {
  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 7,
  padding: "7px 10px", color: "var(--text-primary)", fontSize: 13,
  outline: "none", fontFamily: "inherit",
};

function Toast({ msg, type, onDone }) {
  useEffect(() => { if (msg) { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  const c = type === "error" ? "#e74c3c" : "#2ecc71";
  return (
    <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--surface)", border: `1px solid ${c}40`, borderRadius: 10, padding: "10px 18px", fontSize: 13, color: c, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 32px rgba(0,0,0,.5)", zIndex: 9999, whiteSpace: "nowrap" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
      {msg}
    </div>
  );
}

function SectionHeader({ icon: Icon, label, color, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{label}</span>
      </div>
      {action}
    </div>
  );
}

// ── Puan Kurallari ────────────────────────────────────────────────────────────
function PointRulesSection({ rules, onChange, onSave, saving }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
      <SectionHeader icon={Star} label="Puan Kurallari" color="#f5a623"
        action={
          <button onClick={onSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: "rgba(245,166,35,.15)", border: "1px solid rgba(245,166,35,.4)", color: "#f5a623", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: saving ? .6 : 1 }}>
            <Save size={12} /> {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rules.map((r, i) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{r.action}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="number" value={r.points} min="0" max="9999"
                onChange={e => onChange(i, "points", parseInt(e.target.value) || 0)}
                style={{ ...inp, width: 70, textAlign: "center" }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>puan</span>
              <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                <input type="checkbox" checked={!!r.is_active}
                  onChange={e => onChange(i, "is_active", e.target.checked ? 1 : 0)}
                  style={{ accentColor: "#f5a623", width: 14, height: 14 }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Aktif</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rank Ayarlari ─────────────────────────────────────────────────────────────
function RanksSection({ ranks, onChange, onAdd, onRemove, onSave, saving }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
      <SectionHeader icon={Trophy} label="Rank Esikleri" color="#9b59b6"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onAdd}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "rgba(155,89,182,.12)", border: "1px solid rgba(155,89,182,.3)", color: "#9b59b6", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              <Plus size={12} /> Ekle
            </button>
            <button onClick={onSave} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: "rgba(245,166,35,.15)", border: "1px solid rgba(245,166,35,.4)", color: "#f5a623", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: saving ? .6 : 1 }}>
              <Save size={12} /> {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        }
      />
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>Min puana gore otomatik siralanir.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ranks.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="color" value={r.color}
              onChange={e => onChange(i, "color", e.target.value)}
              style={{ width: 34, height: 34, border: "none", borderRadius: 7, cursor: "pointer", background: "none", padding: 0, flexShrink: 0 }} />
            <div style={{ flex: 1, position: "relative" }}>
              <input value={r.name} onChange={e => onChange(i, "name", e.target.value)}
                placeholder="Rank adi" style={{ ...inp, width: "100%", boxSizing: "border-box", paddingLeft: 26 }} />
              <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 8, height: 8, borderRadius: "50%", background: r.color, pointerEvents: "none" }} />
            </div>
            <input type="number" value={r.min_points} min="0"
              onChange={e => onChange(i, "min_points", parseInt(e.target.value) || 0)}
              placeholder="Min puan" style={{ ...inp, width: 100, textAlign: "center" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>min pt</span>
            <button onClick={() => onRemove(i)}
              style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.2)", color: "#e74c3c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Gorev Yonetimi ────────────────────────────────────────────────────────────
function TasksSection({ tasks, onChange, onSave, saving }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
      <SectionHeader icon={CheckSquare} label="Gorev Yonetimi" color="#2ecc71"
        action={
          <button onClick={onSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: "rgba(245,166,35,.15)", border: "1px solid rgba(245,166,35,.4)", color: "#f5a623", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: saving ? .6 : 1 }}>
            <Save size={12} /> {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.map((t, i) => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 80px 44px 60px", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <input value={t.icon} onChange={e => onChange(i, "icon", e.target.value)}
              style={{ ...inp, width: 36, textAlign: "center", fontSize: 16, padding: "5px" }} />
            <input value={t.title} onChange={e => onChange(i, "title", e.target.value)}
              style={{ ...inp }} />
            <input value={t.description || ""} onChange={e => onChange(i, "description", e.target.value)}
              placeholder="Aciklama" style={{ ...inp }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="number" value={t.points} min="0" max="9999"
                onChange={e => onChange(i, "points", parseInt(e.target.value) || 0)}
                style={{ ...inp, width: 56, textAlign: "center" }} />
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>pt</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 20, textAlign: "center",
              background: t.type === "one_time" ? "rgba(52,152,219,.12)" : "rgba(245,166,35,.12)",
              color: t.type === "one_time" ? "#3498db" : "#f5a623" }}>
              {t.type === "one_time" ? "1x" : "inf"}
            </span>
            <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={!!t.is_active}
                onChange={e => onChange(i, "is_active", e.target.checked ? 1 : 0)}
                style={{ accentColor: "#f5a623", width: 14, height: 14 }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Aktif</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Liderlik Tablosu ──────────────────────────────────────────────────────────
function LeaderboardSection({ leaders }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,166,35,.18)", border: "1px solid rgba(245,166,35,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart2 size={15} color="#f5a623" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Puan Siralaması (Top 20)</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["#", "Kullanici", "Puan", "Rank"].map(h => (
              <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leaders.map((l, i) => (
            <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)", transition: "background .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
              <td style={{ padding: "10px 16px", width: 48 }}>
                {i < 3
                  ? <span style={{ fontSize: 16 }}>{medals[i]}</span>
                  : <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>{i + 1}</span>}
              </td>
              <td style={{ padding: "10px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  {l.avatar
                    ? <img src={l.avatar} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                    : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(245,166,35,.15)", color: "#f5a623", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{l.username?.[0]?.toUpperCase()}</div>
                  }
                  <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{l.username}</span>
                </div>
              </td>
              <td style={{ padding: "10px 16px", fontWeight: 700, color: "#fff", fontSize: 13 }}>
                {Number(l.total).toLocaleString("tr-TR")}
              </td>
              <td style={{ padding: "10px 16px" }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                  background: `${l.rank?.color || "#888"}18`, color: l.rank?.color || "#888",
                  border: `1px solid ${l.rank?.color || "#888"}30` }}>
                  {l.rank?.name || "Caylak"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function AdminPointsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [rules, setRules]     = useState([]);
  const [ranks, setRanks]     = useState([]);
  const [tasks, setTasks]     = useState([]);
  const [toast, setToast]     = useState({ msg: "", type: "success" });
  const [saving, setSaving]   = useState({ points: false, ranks: false, tasks: false });

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminPointsApi.load();
    const d = res.data?.data;
    if (d) {
      setData(d);
      setRules(d.point_rules || []);
      setRanks(d.ranks || []);
      setTasks(d.tasks || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const savePoints = async () => {
    setSaving(s => ({ ...s, points: true }));
    const res = await adminPointsApi.savePoints(rules);
    setSaving(s => ({ ...s, points: false }));
    showToast(res.data?.message || "Kaydedildi.", res.data?.success !== false ? "success" : "error");
  };

  const saveRanks = async () => {
    setSaving(s => ({ ...s, ranks: true }));
    const sorted = [...ranks].sort((a, b) => a.min_points - b.min_points);
    const res = await adminPointsApi.saveRanks(sorted);
    setSaving(s => ({ ...s, ranks: false }));
    showToast(res.data?.message || "Kaydedildi.", res.data?.success !== false ? "success" : "error");
    if (res.data?.success !== false) load();
  };

  const saveTasks = async () => {
    setSaving(s => ({ ...s, tasks: true }));
    const res = await adminPointsApi.saveTasks(tasks);
    setSaving(s => ({ ...s, tasks: false }));
    showToast(res.data?.message || "Kaydedildi.", res.data?.success !== false ? "success" : "error");
  };

  const updateRule = (i, k, v) => setRules(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const updateRank = (i, k, v) => setRanks(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const updateTask = (i, k, v) => setTasks(p => p.map((t, idx) => idx === i ? { ...t, [k]: v } : t));

  const addRank = () => setRanks(p => [...p, { name: "", min_points: 0, color: "#888888", sort_order: p.length }]);
  const removeRank = (i) => setRanks(p => p.filter((_, idx) => idx !== i));

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Yukleniyor...</div>;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <PointRulesSection rules={rules} onChange={updateRule} onSave={savePoints} saving={saving.points} />
        <RanksSection ranks={ranks} onChange={updateRank} onAdd={addRank} onRemove={removeRank} onSave={saveRanks} saving={saving.ranks} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <TasksSection tasks={tasks} onChange={updateTask} onSave={saveTasks} saving={saving.tasks} />
      </div>

      <LeaderboardSection leaders={data?.leaders || []} />

      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast({ msg: "", type: "success" })} />
    </>
  );
}
