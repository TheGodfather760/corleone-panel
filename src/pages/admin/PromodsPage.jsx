import { useEffect, useState, useCallback } from "react";
import { adminPromodsApi } from "../../lib/api";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, ExternalLink, Check } from "lucide-react";
import { GameVersionModal, PkgVersionModal, FileModal } from "./PromodsShared";

function PubBadge({ pv }) {
  const total  = pv.files?.length || 0;
  const filled = pv.files?.filter(f => f.download_url)?.length || 0;
  if (pv.is_published) return <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(46,204,113,.15)", color: "#2ecc71", border: "1px solid rgba(46,204,113,.3)" }}>YAYINDA</span>;
  if (filled > 0) return <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(245,166,35,.12)", color: "#f5a623", border: "1px solid rgba(245,166,35,.3)" }}>KISMI ({filled}/{total})</span>;
  return <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(231,76,60,.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,.25)" }}>TASLAK</span>;
}

export default function PromodsPage({ game }) {
  const [gameVersions, setGameVersions] = useState([]);
  const [packages, setPackages]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeGvId, setActiveGvId]     = useState(null);
  const [expandedPv, setExpandedPv]     = useState(null);

  // Modaller
  const [gvModal, setGvModal]   = useState(null); // null | {} | {gv}
  const [pvModal, setPvModal]   = useState(null);
  const [fileModal, setFileModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminPromodsApi.load(game);
    const d = res.data?.data || {};
    const gvs = d.game_versions || [];
    setGameVersions(gvs);
    setPackages(d.packages || []);
    // Aktif versiyonu sec: once is_current, yoksa ilk
    const cur = gvs.find(g => g.is_current) || gvs[0];
    if (cur) setActiveGvId(cur.id);
    setLoading(false);
  }, [game]);

  useEffect(() => { load(); }, [load]);

  const activeGv = gameVersions.find(g => g.id === activeGvId);

  // ── Oyun versiyonu kaydet ──
  const handleGvSaved = (saved) => {
    setGameVersions(prev => {
      const exists = prev.find(g => g.id === saved.id);
      let updated = exists ? prev.map(g => g.id === saved.id ? { ...g, ...saved } : g) : [...prev, { ...saved, pkg_versions: [] }];
      if (saved.is_current) updated = updated.map(g => ({ ...g, is_current: g.id === saved.id ? 1 : 0 }));
      return updated;
    });
    if (!activeGvId) setActiveGvId(saved.id);
  };

  // ── Paket versiyonu kaydet ──
  const handlePvSaved = (saved) => {
    const pkg = packages.find(p => p.id === saved.package_id);
    setGameVersions(prev => prev.map(gv => {
      if (gv.id !== activeGvId) return gv;
      const pvs = gv.pkg_versions || [];
      const exists = pvs.find(p => p.id === saved.id);
      const newPv = { ...saved, map_name: pkg?.map_name, accent_color: pkg?.accent_color, files: exists?.files || [] };
      return { ...gv, pkg_versions: exists ? pvs.map(p => p.id === saved.id ? { ...p, ...newPv } : p) : [...pvs, newPv] };
    }));
  };

  // ── Paket versiyonu sil ──
  const handlePvDelete = async (pvId) => {
    if (!confirm("Bu paket versiyonu ve tum dosyalari silinsin mi?")) return;
    await adminPromodsApi.deletePkgVersion(pvId);
    setGameVersions(prev => prev.map(gv => ({
      ...gv, pkg_versions: (gv.pkg_versions || []).filter(p => p.id !== pvId)
    })));
  };

  // ── Yayin toggle ──
  const handleTogglePublish = async (pvId) => {
    const res = await adminPromodsApi.togglePublish(pvId);
    const pub = res.data?.data?.is_published;
    setGameVersions(prev => prev.map(gv => ({
      ...gv, pkg_versions: (gv.pkg_versions || []).map(p => p.id === pvId ? { ...p, is_published: pub ? 1 : 0 } : p)
    })));
  };

  // ── Dosya kaydet ──
  const handleFileSaved = (pvId, saved) => {
    setGameVersions(prev => prev.map(gv => ({
      ...gv, pkg_versions: (gv.pkg_versions || []).map(pv => {
        if (pv.id !== pvId) return pv;
        const files = pv.files || [];
        const exists = files.find(f => f.id === saved.id);
        const newFiles = exists ? files.map(f => f.id === saved.id ? { ...f, ...saved } : f) : [...files, saved];
        // Tum URL'ler doluysa otomatik yayinla
        const allFilled = newFiles.every(f => f.download_url);
        return { ...pv, files: newFiles, is_published: allFilled ? 1 : pv.is_published };
      })
    })));
  };

  // ── Dosya sil ──
  const handleFileDelete = async (pvId, fileId) => {
    if (!confirm("Bu dosya silinsin mi?")) return;
    await adminPromodsApi.deleteFile(fileId);
    setGameVersions(prev => prev.map(gv => ({
      ...gv, pkg_versions: (gv.pkg_versions || []).map(pv =>
        pv.id !== pvId ? pv : { ...pv, files: (pv.files || []).filter(f => f.id !== fileId) }
      )
    })));
  };

  const gameLabel = game === "ets2" ? "ETS2" : "ATS";
  const pkgVersions = activeGv?.pkg_versions || [];

  return (
    <>
      {/* Baslik + Yeni Versiyon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>ProMods {gameLabel} Yonetimi</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{gameVersions.length} oyun versiyonu</div>
        </div>
        <button onClick={() => setGvModal({})}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, background: "rgba(245,166,35,.15)", border: "1px solid rgba(245,166,35,.4)", color: "#f5a623", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={13} /> Oyun Versiyonu
        </button>
      </div>

      {/* Versiyon sekmeleri */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 4 }}>Versiyon:</span>
        {gameVersions.map(gv => (
          <button key={gv.id} onClick={() => setActiveGvId(gv.id)}
            style={{ padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${activeGvId === gv.id ? "rgba(245,166,35,.4)" : gv.is_current ? "rgba(46,204,113,.4)" : "var(--border)"}`, background: activeGvId === gv.id ? "rgba(245,166,35,.15)" : "var(--surface)", color: activeGvId === gv.id ? "#f5a623" : gv.is_current ? "#2ecc71" : "var(--text-muted)", transition: "all .15s" }}>
            {gv.label}
            {gv.is_current ? <span style={{ marginLeft: 5 }}>●</span> : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Yukleniyor...</div>
      ) : !activeGv ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
          Henuz {gameLabel} versiyonu eklenmemis.
          <br /><button onClick={() => setGvModal({})} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Ekle</button>
        </div>
      ) : (
        <>
          {/* Aktif versiyon bilgi bari */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{activeGv.label}</span>
                {activeGv.is_current ? <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(46,204,113,.15)", color: "#2ecc71", border: "1px solid rgba(46,204,113,.3)" }}>GUNCEL</span> : null}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                {pkgVersions.length} paket · {pkgVersions.filter(p => p.is_published).length} yayinda
                {activeGv.def_file_name && <span style={{ marginLeft: 10 }}>DEF: {activeGv.def_file_name} ({activeGv.def_file_size})</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setGvModal({ gv: activeGv })}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
                <Pencil size={12} /> Duzenle
              </button>
              <button onClick={() => setPvModal({ gvId: activeGv.id })}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: "rgba(245,166,35,.15)", border: "1px solid rgba(245,166,35,.4)", color: "#f5a623", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <Plus size={13} /> Paket Versiyonu
              </button>
            </div>
          </div>

          {/* Paket versiyonlari */}
          {pkgVersions.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
              Bu versiyon icin henuz paket eklenmemis.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pkgVersions.map(pv => {
                const isExpanded = expandedPv === pv.id;
                const color = pv.accent_color || "#f5a623";
                return (
                  <div key={pv.id} style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                    {/* Paket baslik */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--surface)", cursor: "pointer" }}
                      onClick={() => setExpandedPv(isExpanded ? null : pv.id)}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}80`, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{pv.map_name}</span>
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>v{pv.pm_version}</span>
                          {pv.total_size && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{pv.total_size}</span>}
                          <PubBadge pv={pv} />
                        </div>
                        {pv.note && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{pv.note}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleTogglePublish(pv.id)}
                          style={{ padding: "4px 10px", borderRadius: 7, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 11, cursor: "pointer" }}>
                          {pv.is_published ? "Yayindan Al" : "Yayinla"}
                        </button>
                        <button onClick={() => setPvModal({ pv, gvId: activeGv.id })}
                          style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg)", border: "1px solid var(--border)", color: "#f5a623", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setFileModal({ pvId: pv.id, nextSort: (pv.files?.length || 0) + 1 })}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, background: "rgba(245,166,35,.12)", border: "1px solid rgba(245,166,35,.3)", color: "#f5a623", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          <Plus size={11} /> Dosya
                        </button>
                        <button onClick={() => handlePvDelete(pv.id)}
                          style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", color: "#e74c3c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ color: "var(--text-muted)", marginLeft: 4 }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>

                    {/* Dosyalar */}
                    {isExpanded && (
                      <div>
                        {!pv.files?.length ? (
                          <div style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                            Henuz dosya eklenmemis.
                          </div>
                        ) : pv.files.map((f, fi) => (
                          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,.04)", fontSize: 12 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 5, background: `${color}20`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, flexShrink: 0 }}>
                              {f.sort_order}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.file_name}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{f.file_size}</div>
                            </div>
                            <div style={{ flex: 2, minWidth: 0 }}>
                              {f.download_url ? (
                                <a href={f.download_url} target="_blank" rel="noreferrer"
                                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#2ecc71", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  <Check size={11} /> {new URL(f.download_url).hostname}
                                  <ExternalLink size={10} style={{ flexShrink: 0 }} />
                                </a>
                              ) : (
                                <span style={{ fontSize: 11, color: "#e74c3c", fontStyle: "italic" }}>URL girilmemis</span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                              <button onClick={() => setFileModal({ file: f, pvId: pv.id, nextSort: (pv.files?.length || 0) + 1 })}
                                style={{ width: 26, height: 26, borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", color: "#f5a623", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Pencil size={11} />
                              </button>
                              <button onClick={() => handleFileDelete(pv.id, f.id)}
                                style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", color: "#e74c3c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modaller */}
      {gvModal !== null && (
        <GameVersionModal
          gv={gvModal.gv || null}
          game={game}
          onClose={() => setGvModal(null)}
          onSaved={handleGvSaved}
        />
      )}
      {pvModal !== null && (
        <PkgVersionModal
          pv={pvModal.pv || null}
          gvId={pvModal.gvId}
          packages={packages}
          onClose={() => setPvModal(null)}
          onSaved={handlePvSaved}
        />
      )}
      {fileModal !== null && (
        <FileModal
          file={fileModal.file || null}
          pvId={fileModal.pvId}
          nextSort={fileModal.nextSort}
          onClose={() => setFileModal(null)}
          onSaved={saved => { handleFileSaved(fileModal.pvId, saved); setFileModal(null); }}
        />
      )}
    </>
  );
}
