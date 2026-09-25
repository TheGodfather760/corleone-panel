import { useState } from "react";
import { Pencil } from "lucide-react";
import { useFleetData, FleetThumb, StatusBadge, TrailerEditModal } from "./FleetShared";

export default function AdminFleetTrailersPage() {
  const { trailers, setTrailers, loading } = useFleetData();
  const [editTrailer, setEditTrailer] = useState(null);

  const active      = trailers.filter(t => t.status === "active").length;
  const totalEvents = trailers.reduce((s, t) => s + (t.event_count || 0), 0);
  const avgUsage    = trailers.length > 0
    ? Math.round(trailers.reduce((s, t) => s + (parseInt(t.usage_pct) || 0), 0) / trailers.length)
    : 0;

  return (
    <>
      {/* Stat kartlari */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Toplam Dorse", value: trailers.length, color: "#f5a623" },
          { label: "Aktif",        value: active,          color: "#2ecc71" },
          { label: "Ort. Kullanim", value: `%${avgUsage}`, color: "#3498db" },
          { label: "Etkinlik",     value: totalEvents,     color: "#9b59b6" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: -1 }}>{value}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tablo */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Yukleniyor...</div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["", "#", "Tur", "Garaj", "Kullanim", "Durum", "Versiyon", "Etkinlik", ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trailers.map((t, i) => {
                const usagePct = parseInt(t.usage_pct) || 0;
                const usageColor = usagePct >= 80 ? "#2ecc71" : usagePct >= 40 ? "#f5a623" : "#888";
                return (
                  <tr key={t.id} style={{ borderBottom: i < trailers.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none", transition: "background .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                    <td style={{ padding: "10px 14px" }}>
                      <FleetThumb url={t.image_url} placeholder="🚚" />
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 700, fontSize: 13 }}>{t.sort_order}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{t.brand || "-"}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>{t.model || t.type_name}</div>
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 13 }}>{t.garage || "-"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 48, height: 4, borderRadius: 4, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${usagePct}%`, background: usageColor, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 11, color: usageColor, fontWeight: 700 }}>%{usagePct}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}><StatusBadge status={t.status} /></td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--text-muted)" }}>{t.profile_version || "-"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {t.event_count > 0
                        ? <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(46,204,113,.12)", color: "#2ecc71", border: "1px solid rgba(46,204,113,.25)" }}>{t.event_count}x</span>
                        : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>-</span>}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => setEditTrailer(t)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", color: "#f5a623", fontSize: 12, cursor: "pointer" }}>
                        <Pencil size={12} /> Duzenle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editTrailer && (
        <TrailerEditModal
          trailer={editTrailer}
          onClose={() => setEditTrailer(null)}
          onSaved={updated => setTrailers(p => p.map(t => t.id === updated.id ? updated : t))}
        />
      )}
    </>
  );
}
