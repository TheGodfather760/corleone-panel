import { useState } from "react";
import { Pencil } from "lucide-react";
import { useFleetData, FleetThumb, StatusBadge, TruckEditModal, STATUS_COLORS } from "./FleetShared";

export default function AdminFleetTrucksPage() {
  const { trucks, setTrucks, trailers, loading } = useFleetData();
  const [editTruck, setEditTruck] = useState(null);

  const active   = trucks.filter(t => t.status === "active").length;
  const inactive = trucks.filter(t => t.status !== "active").length;
  const totalKm  = trucks.reduce((s, t) => s + (parseInt(t.total_km) || 0), 0);
  const totalEvents = trucks.reduce((s, t) => s + (t.event_count || 0), 0);

  return (
    <>
      {/* Stat kartlari */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Toplam Cekici", value: trucks.length,                    color: "#f5a623" },
          { label: "Aktif",         value: active,                           color: "#2ecc71" },
          { label: "Toplam KM",     value: totalKm.toLocaleString("tr-TR"),  color: "#3498db" },
          { label: "Etkinlik",      value: totalEvents,                      color: "#9b59b6" },
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
                {["", "#", "Marka / Model", "Motor", "Garaj", "KM", "Durum", "Versiyon", "Etkinlik", ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: .5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trucks.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: i < trucks.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none", transition: "background .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                  <td style={{ padding: "10px 14px" }}>
                    <FleetThumb url={t.image_url} placeholder="🚛" />
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 700, fontSize: 13 }}>{t.sort_order}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{t.brand}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>{t.model}</div>
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                    {t.engine_hp} bg ({t.engine_kw} kW)
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 13 }}>{t.garage || "-"}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                    {Number(t.total_km).toLocaleString("tr-TR")} km
                  </td>
                  <td style={{ padding: "10px 14px" }}><StatusBadge status={t.status} /></td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--text-muted)" }}>{t.profile_version || "-"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {t.event_count > 0
                      ? <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(46,204,113,.12)", color: "#2ecc71", border: "1px solid rgba(46,204,113,.25)" }}>{t.event_count}x</span>
                      : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>-</span>}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <button onClick={() => setEditTruck(t)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", color: "#f5a623", fontSize: 12, cursor: "pointer" }}>
                      <Pencil size={12} /> Duzenle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editTruck && (
        <TruckEditModal
          truck={editTruck}
          trailers={trailers}
          onClose={() => setEditTruck(null)}
          onSaved={updated => setTrucks(p => p.map(t => t.id === updated.id ? updated : t))}
        />
      )}
    </>
  );
}
