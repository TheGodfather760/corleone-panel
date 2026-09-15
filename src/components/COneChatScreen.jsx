import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Users, MessageCircle, X, ChevronLeft } from "lucide-react";
import { chatApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

function playSound(name) {
  try { const a = new Audio(`/sounds/${name}`); a.volume = 0.4; a.play().catch(() => {}); } catch {}
}

function formatTime(str) {
  if (!str) return "";
  const d = new Date(str);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "az önce";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}dk`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function formatMsgTime(str) {
  if (!str) return "";
  return new Date(str).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ user, size = 36, showOnline = false }) {
  const src = user?.avatar || null;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: "rgba(245,166,35,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {src
          ? <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: size * 0.38, fontWeight: 800, color: "#f5a623" }}>{user?.username?.[0]?.toUpperCase()}</span>
        }
      </div>
      {showOnline && (
        <div style={{
          position: "absolute", bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28, borderRadius: "50%",
          background: user?.is_online ? "#2ecc71" : "rgba(255,255,255,.2)",
          border: "2px solid #0a0a0f",
        }} />
      )}
    </div>
  );
}

// ── MESAJ BALONCUĞU ──
function Bubble({ msg, isMine, showAvatar, prevSame }) {
  return (
    <div style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: prevSame ? 2 : 10 }}>
      {/* Avatar — sadece karşı taraf ve grup sonu */}
      <div style={{ width: 28, flexShrink: 0 }}>
        {!isMine && showAvatar && (
          <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", background: "rgba(245,166,35,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {msg.from_avatar
              ? <img src={msg.from_avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 11, fontWeight: 800, color: "#f5a623" }}>{msg.from_username?.[0]?.toUpperCase()}</span>
            }
          </div>
        )}
      </div>
      <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: 2 }}>
        <div style={{
          padding: "9px 13px",
          borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: isMine ? "rgba(245,166,35,.18)" : "rgba(255,255,255,.07)",
          border: isMine ? "1px solid rgba(245,166,35,.3)" : "1px solid rgba(255,255,255,.1)",
          fontSize: 13, color: "#fff", lineHeight: 1.5, wordBreak: "break-word",
        }}>
          {msg.body}
        </div>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,.25)", paddingLeft: isMine ? 0 : 4, paddingRight: isMine ? 4 : 0 }}>
          {formatMsgTime(msg.created_at)}
          {isMine && msg.read_at && <span style={{ marginLeft: 4, color: "#2ecc71" }}>✓✓</span>}
          {isMine && !msg.read_at && <span style={{ marginLeft: 4 }}>✓</span>}
        </span>
      </div>
    </div>
  );
}

// ── SOHBET PANELİ ──
function ChatPanel({ withUser, myId, accent, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const sinceRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  const load = useCallback(async (initial = false) => {
    try {
      const r = await chatApi.messages(withUser.user_id || withUser.id, initial ? null : sinceRef.current);
      const msgs = r.data.data?.messages || [];
      if (initial) {
        setMessages(msgs);
      } else if (msgs.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id));
          const newMsgs = msgs.filter(m => !ids.has(m.id));
          if (newMsgs.length > 0) playSound("c-one_navigation.wav");
          return [...prev, ...newMsgs];
        });
      }
      if (msgs.length > 0) {
        sinceRef.current = msgs[msgs.length - 1].created_at;
      }
    } catch {}
    if (initial) setLoading(false);
  }, [withUser]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    sinceRef.current = null;
    load(true);
    inputRef.current?.focus();
    pollRef.current = setInterval(() => load(false), 3000);
    return () => clearInterval(pollRef.current);
  }, [withUser.user_id || withUser.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    playSound("c-one_onay.wav");
    try {
      const r = await chatApi.send(withUser.user_id || withUser.id, text);
      const msg = r.data.data;
      if (msg) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        sinceRef.current = msg.created_at;
      }
    } catch {}
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const uid = withUser.user_id || withUser.id;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      {/* Üst bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = `${accent}20`; e.currentTarget.style.color = accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(255,255,255,.5)"; }}
        ><ChevronLeft size={14} /></button>
        <Avatar user={withUser} size={36} showOnline />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{withUser.username}</div>
          <div style={{ fontSize: 10, color: withUser.is_online ? "#2ecc71" : "rgba(255,255,255,.3)" }}>
            {withUser.is_online ? "Çevrimiçi" : withUser.last_seen ? `Son görülme: ${formatTime(withUser.last_seen)}` : "Çevrimdışı"}
          </div>
        </div>
      </div>

      {/* Mesajlar */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.1)", borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Yükleniyor...</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <MessageCircle size={36} color="rgba(255,255,255,.1)" />
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>Henüz mesaj yok. İlk mesajı sen gönder!</div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMine = msg.from_id === myId;
              const next = messages[i + 1];
              const showAvatar = !next || next.from_id !== msg.from_id;
              const prev = messages[i - 1];
              const prevSame = prev && prev.from_id === msg.from_id;
              return <Bubble key={msg.id} msg={msg} isMine={isMine} showAvatar={showAvatar} prevSame={prevSame} />;
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "8px 12px", transition: "border-color .2s" }}
          onFocus={() => {}} // handled by input
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Mesaj yaz..."
            rows={1}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "#fff", fontSize: 13, fontFamily: "inherit", resize: "none",
              lineHeight: 1.5, maxHeight: 100, overflowY: "auto",
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            style={{
              width: 34, height: 34, borderRadius: 9, border: "none", cursor: input.trim() ? "pointer" : "not-allowed",
              background: input.trim() ? accent : "rgba(255,255,255,.08)",
              color: input.trim() ? "#000" : "rgba(255,255,255,.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all .2s",
            }}
          >
            <Send size={14} />
          </button>
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,.2)", marginTop: 5, textAlign: "right" }}>Enter ile gönder · Shift+Enter yeni satır</div>
      </div>
    </div>
  );
}

// ── ANA EKRAN ──
export default function COneChatScreen({ onBack, accent = "#f5a623" }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("conversations"); // conversations | online
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const pollRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [onlineRes, convRes] = await Promise.all([
        chatApi.online(),
        chatApi.conversations(),
      ]);
      setUsers(onlineRes.data.data || onlineRes.data || []);
      setConversations(convRes.data.data || convRes.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    pollRef.current = setInterval(loadData, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);

  const filteredUsers = users.filter(u =>
    search === "" || u.username.toLowerCase().includes(search.toLowerCase())
  );

  const filteredConvos = conversations.filter(c =>
    search === "" || c.username.toLowerCase().includes(search.toLowerCase())
  );

  const openChat = (u) => {
    playSound("c-one_onay.wav");
    setActiveChat(u);
    // Okunmamış sayısını sıfırla
    setConversations(prev => prev.map(c =>
      (c.user_id === (u.user_id || u.id)) ? { ...c, unread: 0 } : c
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", inset: 0, zIndex: 40, background: "#0a0a0f", display: "flex", fontFamily: "var(--c1-font, 'LemonMilk', 'Segoe UI', sans-serif)", fontSize: `calc(14px * var(--c1-scale, 1))`, overflow: "hidden" }}
    >
      {/* Arka plan */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`, top: -150, left: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.1) 0%, transparent 70%)", bottom: -100, right: -100 }} />
      </div>

      {/* ── SOL PANEL ── */}
      <div style={{ position: "relative", zIndex: 2, width: "clamp(200px, 22vw, 320px)", borderRight: "1px solid rgba(255,255,255,.07)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Başlık */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <button onClick={() => { playSound("c-one_back.wav"); onBack(); }}
              style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = `${accent}20`; e.currentTarget.style.color = accent; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.color = "rgba(255,255,255,.7)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div>
              <div style={{ fontSize: 9, color: accent, letterSpacing: 2 }}>C-ONE</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1 }}>SOHBET</div>
            </div>
            {totalUnread > 0 && (
              <div style={{ marginLeft: "auto", background: "#e74c3c", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "2px 8px", minWidth: 20, textAlign: "center" }}>
                {totalUnread > 99 ? "99+" : totalUnread}
              </div>
            )}
          </div>

          {/* Arama */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8 }}>
            <Search size={12} color="rgba(255,255,255,.3)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ara..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 11, fontFamily: "inherit" }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,.3)", cursor: "pointer", display: "flex", padding: 0 }}><X size={10} /></button>}
          </div>
        </div>

        {/* Tab seçici */}
        <div style={{ display: "flex", padding: "8px 12px", gap: 4, borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
          {[
            { key: "conversations", label: "Sohbetler", icon: MessageCircle },
            { key: "online",        label: "Üyeler",    icon: Users },
          ].map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => { playSound("c-one_navigation.wav"); setTab(key); }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px", borderRadius: 7, border: "none", cursor: "pointer", transition: "all .2s", background: active ? `${accent}18` : "transparent", color: active ? accent : "rgba(255,255,255,.35)", fontSize: 10, fontWeight: 700 }}
              >
                <Icon size={12} />{label}
              </button>
            );
          })}
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 100, gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.1)", borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : tab === "conversations" ? (
            filteredConvos.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <MessageCircle size={28} color="rgba(255,255,255,.1)" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>Henüz sohbet yok</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.15)", marginTop: 4 }}>Üyeler sekmesinden birine yaz</div>
              </div>
            ) : filteredConvos.map(c => (
              <div key={c.user_id}
                onClick={() => openChat(c)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", transition: "background .15s",
                  background: activeChat && (activeChat.user_id === c.user_id) ? `${accent}10` : "transparent",
                  borderLeft: activeChat && (activeChat.user_id === c.user_id) ? `3px solid ${accent}` : "3px solid transparent",
                }}
                onMouseEnter={e => { if (!(activeChat && activeChat.user_id === c.user_id)) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
                onMouseLeave={e => { if (!(activeChat && activeChat.user_id === c.user_id)) e.currentTarget.style.background = "transparent"; }}
              >
                <Avatar user={c} size={38} showOnline />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{c.username}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,.25)" }}>{formatTime(c.last_at)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.last_from_id === user?.id && <span style={{ color: accent }}>Sen: </span>}
                    {c.last_body}
                  </div>
                </div>
                {c.unread > 0 && (
                  <div style={{ background: accent, color: "#000", borderRadius: 20, fontSize: 9, fontWeight: 800, padding: "2px 6px", minWidth: 18, textAlign: "center", flexShrink: 0 }}>
                    {c.unread}
                  </div>
                )}
              </div>
            ))
          ) : (
            // Online / Üyeler listesi
            <>
              {/* Online sayacı */}
              <div style={{ padding: "8px 16px 4px", fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5 }}>
                <span style={{ color: "#2ecc71", fontWeight: 700 }}>{filteredUsers.filter(u => u.is_online).length}</span> çevrimiçi · {filteredUsers.length} üye
              </div>
              {filteredUsers.map(u => (
                <div key={u.id}
                  onClick={() => openChat(u)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", cursor: "pointer", transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Avatar user={u} size={34} showOnline />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.username}</div>
                    <div style={{ fontSize: 10, color: u.is_online ? "#2ecc71" : "rgba(255,255,255,.25)" }}>
                      {u.is_online ? "Çevrimiçi" : u.last_seen ? formatTime(u.last_seen) : "Çevrimdışı"}
                    </div>
                  </div>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MessageCircle size={11} color="rgba(255,255,255,.4)" />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── SAĞ PANEL ── */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div key={activeChat.user_id || activeChat.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
              <ChatPanel
                withUser={activeChat}
                myId={user?.id}
                accent={accent}
                onBack={() => setActiveChat(null)}
              />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${accent}10`, border: `1px solid ${accent}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageCircle size={28} color={`${accent}60`} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>Bir sohbet seç</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.2)" }}>Sol panelden bir üyeye tıkla</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
