import { useState, useEffect } from "react";
import { downloadsApi, api } from "../lib/api";
import { Download, FileArchive, Clock, HardDrive, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

// { status: 'idle' | 'downloading' | 'done' | 'error', progress: 0-100, msg: '' }
function useDownloadState() {
  const [state, setState] = useState({});
  const get = (key) => state[key] || { status: 'idle', progress: 0, msg: '' };
  const set = (key, patch) => setState(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
  return { get, set };
}

function downloadWithProgress(url, filename, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'arraybuffer';
    xhr.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(new Uint8Array(xhr.response));
      } else {
        reject(new Error(`Sunucu hatası: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Bağlantı hatası.'));
    xhr.send();
  });
}

function DownloadButton({ downloadId, versionId, filename, dlState, onDownload, primary }) {
  const key = `${downloadId}-${versionId}`;
  const s = dlState.get(key);

  if (s.status === 'downloading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
          <span>İndiriliyor...</span>
          <span>{s.progress}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${s.progress}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width 0.2s' }} />
        </div>
      </div>
    );
  }

  if (s.status === 'done') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.3)', fontSize: 12, color: '#27ae60', fontWeight: 600 }}>
        <CheckCircle size={14} /> İndirildi
      </div>
    );
  }

  if (s.status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', fontSize: 11, color: '#e74c3c' }}>
          <AlertCircle size={13} /> {s.msg}
        </div>
        <button onClick={() => onDownload(downloadId, versionId, filename)} className={`btn ${primary ? 'btn-primary' : 'btn-ghost'}`} style={{ width: '100%', justifyContent: 'center', fontSize: primary ? 14 : 11 }}>
          <Download size={primary ? 14 : 11} /> Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => onDownload(downloadId, versionId, filename)}
      className={`btn ${primary ? 'btn-primary' : 'btn-ghost'}`}
      style={{ width: primary ? '100%' : 'auto', justifyContent: 'center', padding: primary ? undefined : '4px 10px', fontSize: primary ? 14 : 11 }}
      disabled={!versionId}
    >
      <Download size={primary ? 14 : 11} />
      {primary ? (versionId ? "İndir" : "Dosya Yok") : "İndir"}
    </button>
  );
}

export default function DownloadsPage() {
  const [downloads, setDownloads]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [openVersions, setOpenVersions] = useState({});
  const dlState = useDownloadState();

  useEffect(() => {
    downloadsApi.list()
      .then(r => setDownloads(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const toggleVersions = (id) => setOpenVersions(prev => ({ ...prev, [id]: !prev[id] }));

  const handleDownload = async (downloadId, versionId, filename) => {
    const key = `${downloadId}-${versionId}`;
    const token = localStorage.getItem('auth_token');
    const url = `https://corleoneteam.com.tr/api/auth/download-file.php?id=${downloadId}${versionId ? `&version=${versionId}` : ''}`;

    // Kaydet dialogı
    const savePath = await save({
      defaultPath: filename || 'download',
      title: 'Dosyayı Kaydet',
    });
    if (!savePath) return; // kullanıcı iptal etti

    dlState.set(key, { status: 'downloading', progress: 0, msg: '' });
    try {
      const bytes = await downloadWithProgress(url, filename, token, (p) => dlState.set(key, { progress: p }));
      await writeFile(savePath, bytes);
      dlState.set(key, { status: 'done' });
      setTimeout(() => dlState.set(key, { status: 'idle' }), 4000);
    } catch (err) {
      dlState.set(key, { status: 'error', msg: err.message || 'İndirme başarısız.' });
    }
  };

  if (loading) return <div className="empty-state"><Clock size={32} /><p>Yükleniyor...</p></div>;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">İndirmeler</h1>
        <p className="page-subtitle">{downloads.length} dosya</p>
      </div>

      {downloads.length === 0 ? (
        <div className="empty-state"><Download size={40} /><p>Henüz indirme yok.</p></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {downloads.map(item => {
            // versions[0] her zaman ana (en güncel) versiyon
            const mainVer = item.versions?.[0] ?? {
              version_id:    item.version_id,
              version:       item.version,
              original_name: item.original_name,
              file_size:     item.file_size,
              changelog:     item.changelog,
              version_date:  item.version_date,
            };
            const otherVersions = item.versions?.slice(1) ?? [];
            return (
            <div key={item.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {item.thumbnail && (
                <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8 }} />
              )}

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{item.title}</h3>
                  {mainVer.version && <span className="badge badge-blue" style={{ flexShrink: 0 }}>v{mainVer.version}</span>}
                </div>

                {item.description && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {item.description}
                  </p>
                )}

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                  {mainVer.original_name && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <FileArchive size={11} />{mainVer.original_name}
                    </span>
                  )}
                  {mainVer.file_size && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <HardDrive size={11} />{formatSize(mainVer.file_size)}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Download size={11} />{item.download_count || 0} indirme
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} />{formatDate(mainVer.version_date || item.created_at)}
                  </span>
                </div>

                {mainVer.changelog && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-elevated)", borderRadius: 6, padding: "8px 10px", marginBottom: 12, lineHeight: 1.6 }}>
                    {mainVer.changelog}
                  </div>
                )}
              </div>

              <DownloadButton
                downloadId={item.id} versionId={mainVer.version_id} filename={mainVer.original_name}
                dlState={dlState} onDownload={handleDownload} primary
              />

              {/* Eski sürümler */}
              {otherVersions.length > 0 && (
                <div>
                  <button onClick={() => toggleVersions(item.id)} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 12 }}>
                    {openVersions[item.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    Eski Sürümler ({otherVersions.length})
                  </button>

                  {openVersions[item.id] && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      {otherVersions.map(v => (
                        <div key={v.version_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-elevated)", borderRadius: 8, padding: "8px 10px", gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>v{v.version}</span>
                            {v.original_name && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{v.original_name}</span>}
                            {v.file_size && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{formatSize(v.file_size)}</span>}
                          </div>
                          <DownloadButton
                            downloadId={item.id} versionId={v.version_id} filename={v.original_name}
                            dlState={dlState} onDownload={handleDownload} primary={false}
                          />
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
  );
}
