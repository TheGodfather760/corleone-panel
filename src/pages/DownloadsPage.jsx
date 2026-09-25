import { useState, useEffect, useCallback } from "react";
import { downloadsApi, promodsApi } from "../lib/api";
import { Download, FileArchive, Clock, HardDrive, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Gamepad2, X, ShieldCheck, Package } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function useDownloadState() {
  const [state, setState] = useState({});
  const get = (key) => state[key] || { status: "idle", progress: 0, msg: "" };
  const set = (key, patch) => setState(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
  return { get, set };
}

function downloadWithProgress(url, filename, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.responseType = "arraybuffer";
    xhr.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(new Uint8Array(xhr.response));
      else reject(new Error(`Sunucu hatasi: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Baglanti hatasi."));
    xhr.send();
  });
}

function DownloadButton({ downloadId, versionId, filename, dlState, onDownload, primary }) {
  const key = `${downloadId}-${versionId}`;
  const s = dlState.get(key);
  if (s.status === "downloading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
          <span>Indiriliyor...</span><span>{s.progress}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${s.progress}%`, background: "var(--accent)", borderRadius: 4, transition: "width 0.2s" }} />
        </div>
      </div>
    );
  }
  if (s.status === "done") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, background: "rgba(39,174,96,0.12)", border: "1px solid rgba(39,174,96,0.3)", fontSize: 12, color: "#27ae60", fontWeight: 600 }}>
        <CheckCircle size={14} /> Indirildi
      </div>
    );
  }
  if (s.status === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", fontSize: 11, color: "#e74c3c" }}>
          <AlertCircle size={13} /> {s.msg}
        </div>
        <button onClick={() => onDownload(downloadId, versionId, filename)} className={`btn ${primary ? "btn-primary" : "btn-ghost"}`} style={{ width: "100%", justifyContent: "center", fontSize: primary ? 14 : 11 }}>
          <Download size={primary ? 14 : 11} /> Tekrar Dene
        </button>
      </div>
    );
  }
  return (
    <button onClick={() => onDownload(downloadId, versionId, filename)} className={`btn ${primary ? "btn-primary" : "btn-ghost"}`}
      style={{ width: primary ? "100%" : "auto", justifyContent: "center", padding: primary ? undefined : "4px 10px", fontSize: primary ? 14 : 11 }}
      disabled={!versionId}>
      <Download size={primary ? 14 : 11} />
      {primary ? (versionId ? "Indir" : "Dosya Yok") : "Indir"}
    </button>
  );
}

const DLC_LABELS = {
  going_east: "Going East!", scandinavia: "Scandinavia", france: "France",
  italia: "Italia", beyond_the_baltic_sea: "Beyond the Baltic Sea",
  road_to_the_black_sea: "Road to the Black Sea", iberia: "Iberia",
  west_balkans: "West Balkans", greece: "Greece",
  montana: "Montana", texas: "Texas", washington: "Washington",
  wyoming: "Wyoming", colorado: "Colorado", kansas: "Kansas",
  oklahoma: "Oklahoma", utah: "Utah",
};

function PromodsPkgCard({ pv, color }) {
  const [open, setOpen] = useState(false);
  const allReady = pv.files?.length > 0 && pv.files.every(f => f.download_url);
  return (
    <div style={{ border: `1px solid ${open ? color + "40" : "var(--border)"}`, borderRadius: 10, overflow: "hidden", transition: "border-color .2s" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: open ? `${color}08` : "var(--bg-elevated)", border: "none", cursor: "pointer", transition: "background .15s" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: allReady ? "#2ecc71" : "rgba(255,255,255,.2)", flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: "left" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{pv.map_name} </span>
          <span style={{ fontSize: 11, color }}> v{pv.pm_version}</span>
          {pv.total_size && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>· {pv.total_size}</span>}
        </div>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{pv.files?.length || 0} dosya</span>
        {open ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
      </button>
      {open && (
        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {pv.note && <p style={{ fontSize: 11, color: "var(--text-muted)", padding: "6px 0" }}>{pv.note}</p>}
          {pv.files?.map(f => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <Package size={12} color={color} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.file_name}</div>
                {f.file_size && <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{f.file_size}</div>}
              </div>
              {f.download_url
                ? <button onClick={() => openUrl(f.download_url).catch(() => {})} className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><Download size={11} /> Indir</button>
                : <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Yakinda</span>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromodsTab({ game }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const color = game === "ets2" ? "#f5a623" : "#3b82f6";

  useEffect(() => {
    promodsApi.load(game)
      .then(r => {
        // success() -> { success, message, data: { game_versions: [] } }
        const d = r.data;
        const gvs = d?.data?.game_versions ?? d?.game_versions ?? d?.data ?? [];
        setData(Array.isArray(gvs) ? gvs : []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [game]);

  if (loading) return <div className="empty-state"><Clock size={28} /><p>Yukleniyor...</p></div>;
  if (!data?.length) return <div className="empty-state"><Package size={28} /><p>Aktif oyun versiyonu bulunamadi. Admin panelinden ekleyin.</p></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {data.map(gv => (
        <div key={gv.id} className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{gv.label}</span>
                {gv.is_current ? <span className="badge badge-orange">Guncel</span> : null}
              </div>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Oyun v{gv.game_version}</span>
            </div>
          </div>

          {gv.required_dlcs?.length > 0 && (
            <div style={{ marginBottom: 12, padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 700 }}>Gerekli DLC</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {gv.required_dlcs.map(d => (
                  <span key={d} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                    {DLC_LABELS[d] || d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {gv.def_file_name && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(245,166,35,.06)", border: "1px solid rgba(245,166,35,.2)", borderRadius: 8, marginBottom: 12 }}>
              <Package size={14} color="#f5a623" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f5a623" }}>DEF Dosyasi</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{gv.def_file_name}{gv.def_file_size ? ` · ${gv.def_file_size}` : ""}</div>
              </div>
              {gv.def_download_url && (
                <button onClick={() => openUrl(gv.def_download_url).catch(() => {})} className="btn btn-primary" style={{ fontSize: 11, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
                  <Download size={11} /> Indir
                </button>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {gv.pkg_versions?.map(pv => (
              <PromodsPkgCard key={pv.id} pv={pv} color={color} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DownloadsPage() {
  const [downloads, setDownloads]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState("downloads");
  const [openVersions, setOpenVersions] = useState({});
  const [ets2Modal, setEts2Modal]       = useState(null);
  const [ets2Step, setEts2Step]         = useState("idle");
  const [ets2Found, setEts2Found]       = useState(false);
  const [ets2Files, setEts2Files]       = useState([]);
  const [ets2Selected, setEts2Selected] = useState([]);
  const [ets2InstalledVer, setEts2InstalledVer] = useState(null);
  const [ets2Msg, setEts2Msg]           = useState("");
  const [atsModal, setAtsModal]         = useState(null);
  const [atsStep, setAtsStep]           = useState("idle");
  const [atsFound, setAtsFound]         = useState(false);
  const [atsFiles, setAtsFiles]         = useState([]);
  const [atsSelected, setAtsSelected]   = useState([]);
  const [atsInstalledVer, setAtsInstalledVer] = useState(null);
  const [atsMsg, setAtsMsg]             = useState("");
  const dlState = useDownloadState();

  useEffect(() => {
    downloadsApi.list().then(r => setDownloads(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const toggleVersions = (id) => setOpenVersions(prev => ({ ...prev, [id]: !prev[id] }));

  const openEts2Modal = useCallback(async (profileZipUrl, version) => {
    setEts2Modal({ profileZipUrl, version }); setEts2Step("scanning"); setEts2Msg("");
    try {
      const result = await invoke("get_ets2_profile_status");
      setEts2Found(result.found); setEts2Files(result.transferable || []);
      setEts2Selected(result.transferable || []); setEts2InstalledVer(result.installed_version || null);
      setEts2Step("confirm");
    } catch (e) { setEts2Msg(e?.toString() || "Tarama basarisiz."); setEts2Step("error"); }
  }, []);

  const closeEts2Modal = () => { setEts2Modal(null); setEts2Step("idle"); };

  const runInstall = async () => {
    setEts2Step("installing"); setEts2Msg("");
    try {
      const token = localStorage.getItem("auth_token") || "";
      await invoke("install_ets2_profile", { zipUrl: ets2Modal.profileZipUrl, transferFiles: ets2Selected, token, version: ets2Modal.version || "" });
      setEts2Step("done");
    } catch (e) { setEts2Msg(e?.toString() || "Kurulum basarisiz."); setEts2Step("error"); }
  };

  const openAtsModal = useCallback(async (profileZipUrl, version) => {
    setAtsModal({ profileZipUrl, version }); setAtsStep("scanning"); setAtsMsg("");
    try {
      const result = await invoke("get_ats_profile_status");
      setAtsFound(result.found); setAtsFiles(result.transferable || []);
      setAtsSelected(result.transferable || []); setAtsInstalledVer(result.installed_version || null);
      setAtsStep("confirm");
    } catch (e) { setAtsMsg(e?.toString() || "Tarama basarisiz."); setAtsStep("error"); }
  }, []);

  const closeAtsModal = () => { setAtsModal(null); setAtsStep("idle"); };

  const runAtsInstall = async () => {
    setAtsStep("installing"); setAtsMsg("");
    try {
      const token = localStorage.getItem("auth_token") || "";
      await invoke("install_ats_profile", { zipUrl: atsModal.profileZipUrl, transferFiles: atsSelected, token, version: atsModal.version || "" });
      setAtsStep("done");
    } catch (e) { setAtsMsg(e?.toString() || "Kurulum basarisiz."); setAtsStep("error"); }
  };

  const handleDownload = async (downloadId, versionId, filename) => {
    const key = `${downloadId}-${versionId}`;
    const token = localStorage.getItem("auth_token");
    const url = `https://corleoneteam.com.tr/api/auth/download-file.php?id=${downloadId}${versionId ? `&version=${versionId}` : ""}`;
    const savePath = await save({ defaultPath: filename || "download", title: "Dosyayi Kaydet" });
    if (!savePath) return;
    dlState.set(key, { status: "downloading", progress: 0, msg: "" });
    try {
      const bytes = await downloadWithProgress(url, filename, token, (p) => dlState.set(key, { progress: p }));
      await writeFile(savePath, bytes);
      dlState.set(key, { status: "done" });
      setTimeout(() => dlState.set(key, { status: "idle" }), 4000);
    } catch (err) {
      dlState.set(key, { status: "error", msg: err.message || "Indirme basarisiz." });
    }
  };

  if (loading) return <div className="empty-state"><Clock size={32} /><p>Yukleniyor...</p></div>;

  const TABS = [
    { id: "downloads", label: "Indirmeler" },
    { id: "ets2",      label: "ProMods ETS2" },
    { id: "ats",       label: "ProMods ATS" },
  ];

  return (
    <>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, padding: "4px", background: "var(--bg-elevated)", borderRadius: 10, border: "1px solid var(--border)", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={tab === t.id ? "btn btn-primary" : "btn btn-ghost"}
            style={{ fontSize: 12, padding: "6px 16px" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ProMods sekmeleri */}
      {tab === "ets2" && <PromodsTab game="ets2" />}
      {tab === "ats"  && <PromodsTab game="ats" />}

      {/* Indirmeler sekmesi */}
      {tab === "downloads" && (
        <>
          {/* ATS Modal */}
          {atsModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#1a1714", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, width: 420, maxWidth: "90vw", padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Gamepad2 size={18} color="#3498db" />
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>ATS Profil Kurulumu</span>
                    {atsModal.version && <span style={{ fontSize: 10, background: "rgba(52,152,219,.15)", color: "#3498db", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{atsModal.version}</span>}
                  </div>
                  <button onClick={closeAtsModal} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><X size={16} /></button>
                </div>
                {atsStep === "scanning" && (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
                    <div style={{ marginBottom: 10 }}>Profil taraniyor...</div>
                    <div style={{ width: 32, height: 32, border: "3px solid rgba(52,152,219,.2)", borderTopColor: "#3498db", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                  </div>
                )}
                {atsStep === "confirm" && (
                  <>
                    <div style={{ fontSize: 12, color: atsFound ? "#2ecc71" : "var(--text-muted)", background: atsFound ? "rgba(39,174,96,.08)" : "var(--bg-elevated)", border: `1px solid ${atsFound ? "rgba(39,174,96,.2)" : "var(--border)"}`, borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
                      {atsFound ? "Mevcut Corleone profili bulundu." : "Mevcut profil bulunamadi — temiz kurulum yapilacak."}
                    </div>
                    {atsFound && atsFiles.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
                        {atsFiles.map(f => (
                          <label key={f} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "var(--text-secondary)" }}>
                            <input type="checkbox" checked={atsSelected.includes(f)} onChange={e => setAtsSelected(prev => e.target.checked ? [...prev, f] : prev.filter(x => x !== f))} style={{ accentColor: "#3498db" }} />
                            {f}
                          </label>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={closeAtsModal} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Iptal</button>
                      <button onClick={runAtsInstall} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 8, background: "#3498db", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        <ShieldCheck size={14} /> Yedekle ve Kur
                      </button>
                    </div>
                  </>
                )}
                {atsStep === "installing" && (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
                    <div style={{ marginBottom: 10 }}>Kurulum yapiliyor...</div>
                    <div style={{ width: 32, height: 32, border: "3px solid rgba(52,152,219,.2)", borderTopColor: "#3498db", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                  </div>
                )}
                {atsStep === "done" && (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <CheckCircle size={40} color="#2ecc71" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Kurulum tamamlandi!</div>
                    <button onClick={closeAtsModal} style={{ padding: "8px 24px", borderRadius: 8, background: "#3498db", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Kapat</button>
                  </div>
                )}
                {atsStep === "error" && (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <AlertCircle size={40} color="#e74c3c" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 11, color: "#e74c3c", marginBottom: 18 }}>{atsMsg}</div>
                    <button onClick={closeAtsModal} style={{ padding: "8px 24px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Kapat</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ETS2 Modal */}
          {ets2Modal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#1a1714", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, width: 420, maxWidth: "90vw", padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Gamepad2 size={18} color="#f5a623" />
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>ETS2 Profil Kurulumu</span>
                    {ets2Modal.version && <span style={{ fontSize: 10, background: "rgba(245,166,35,.15)", color: "#f5a623", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{ets2Modal.version}</span>}
                  </div>
                  <button onClick={closeEts2Modal} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><X size={16} /></button>
                </div>
                {ets2Step === "scanning" && (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
                    <div style={{ marginBottom: 10 }}>Profil taraniyor...</div>
                    <div style={{ width: 32, height: 32, border: "3px solid rgba(245,166,35,.2)", borderTopColor: "#f5a623", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                  </div>
                )}
                {ets2Step === "confirm" && (
                  <>
                    <div style={{ fontSize: 12, color: ets2Found ? "#2ecc71" : "var(--text-muted)", background: ets2Found ? "rgba(39,174,96,.08)" : "var(--bg-elevated)", border: `1px solid ${ets2Found ? "rgba(39,174,96,.2)" : "var(--border)"}`, borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
                      {ets2Found ? "Mevcut Corleone profili bulundu." : "Mevcut profil bulunamadi — temiz kurulum yapilacak."}
                    </div>
                    {ets2Found && ets2Files.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
                        {ets2Files.map(f => (
                          <label key={f} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "var(--text-secondary)" }}>
                            <input type="checkbox" checked={ets2Selected.includes(f)} onChange={e => setEts2Selected(prev => e.target.checked ? [...prev, f] : prev.filter(x => x !== f))} style={{ accentColor: "#f5a623" }} />
                            {f}
                          </label>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={closeEts2Modal} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Iptal</button>
                      <button onClick={runInstall} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 8, background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        <ShieldCheck size={14} /> Yedekle ve Kur
                      </button>
                    </div>
                  </>
                )}
                {ets2Step === "installing" && (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
                    <div style={{ marginBottom: 10 }}>Kurulum yapiliyor...</div>
                    <div style={{ width: 32, height: 32, border: "3px solid rgba(245,166,35,.2)", borderTopColor: "#f5a623", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                  </div>
                )}
                {ets2Step === "done" && (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <CheckCircle size={40} color="#2ecc71" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Kurulum tamamlandi!</div>
                    <button onClick={closeEts2Modal} style={{ padding: "8px 24px", borderRadius: 8, background: "#f5a623", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Kapat</button>
                  </div>
                )}
                {ets2Step === "error" && (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <AlertCircle size={40} color="#e74c3c" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 11, color: "#e74c3c", marginBottom: 18 }}>{ets2Msg}</div>
                    <button onClick={closeEts2Modal} style={{ padding: "8px 24px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Kapat</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {downloads.length === 0 ? (
            <div className="empty-state"><Download size={40} /><p>Henuz indirme yok.</p></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {downloads.map(item => {
                const mainVer = item.versions?.[0] ?? { version_id: item.version_id, version: item.version, original_name: item.original_name, file_size: item.file_size, changelog: item.changelog, version_date: item.version_date };
                const otherVersions = item.versions?.slice(1) ?? [];
                return (
                  <div key={item.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {item.thumbnail && <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{item.title}</h3>
                        {mainVer.version && <span className="badge badge-blue" style={{ flexShrink: 0 }}>{mainVer.version.startsWith("v") ? mainVer.version : `v${mainVer.version}`}</span>}
                      </div>
                      {item.description && <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.description}</p>}
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                        {mainVer.original_name && <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><FileArchive size={11} />{mainVer.original_name}</span>}
                        {mainVer.file_size && <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><HardDrive size={11} />{formatSize(mainVer.file_size)}</span>}
                        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><Download size={11} />{item.download_count || 0} indirme</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{formatDate(mainVer.version_date || item.created_at)}</span>
                      </div>
                      {mainVer.changelog && <div style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-elevated)", borderRadius: 6, padding: "8px 10px", marginBottom: 12, lineHeight: 1.6 }}>{mainVer.changelog}</div>}
                    </div>
                    <DownloadButton downloadId={item.id} versionId={mainVer.version_id} filename={mainVer.original_name} dlState={dlState} onDownload={handleDownload} primary />
                    {mainVer.profile_zip_url && (item.category === "ets2_profile" || !item.category || item.category === "general" || item.category === "mod") && (
                      <button onClick={() => openEts2Modal(mainVer.profile_zip_url, mainVer.version)} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 13, gap: 6, borderColor: "rgba(245,166,35,.3)", color: "#f5a623" }}>
                        <Gamepad2 size={14} /> ETS2 Profil Kur
                      </button>
                    )}
                    {mainVer.profile_zip_url && item.category === "ats_profile" && (
                      <button onClick={() => openAtsModal(mainVer.profile_zip_url, mainVer.version)} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 13, gap: 6, borderColor: "rgba(52,152,219,.3)", color: "#3498db" }}>
                        <Gamepad2 size={14} /> ATS Profil Kur
                      </button>
                    )}
                    {otherVersions.length > 0 && (
                      <div>
                        <button onClick={() => toggleVersions(item.id)} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 12 }}>
                          {openVersions[item.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          Eski Surumler ({otherVersions.length})
                        </button>
                        {openVersions[item.id] && (
                          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                            {otherVersions.map(v => (
                              <div key={v.version_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-elevated)", borderRadius: 8, padding: "8px 10px", gap: 8 }}>
                                <div style={{ minWidth: 0 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{v.version.startsWith("v") ? v.version : `v${v.version}`}</span>
                                  {v.original_name && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{v.original_name}</span>}
                                  {v.file_size && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{formatSize(v.file_size)}</span>}
                                </div>
                                <DownloadButton downloadId={item.id} versionId={v.version_id} filename={v.original_name} dlState={dlState} onDownload={handleDownload} primary={false} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
