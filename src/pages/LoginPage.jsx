import { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/AuthContext";
import { authApi } from "../lib/api";
import { openUrl } from "@tauri-apps/plugin-opener";

export default function LoginPage() {
  const { login, setUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
    } catch (err) {
      setError(err.response?.data?.message || "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const pollRef = useRef(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const openOAuth = (urlFn) => {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2,'0')).join('');
    const url = urlFn(key);
    openUrl(url).catch(() => {});
    // Her 2 saniyede token geldi mi kontrol et
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await authApi.pollOAuth(key);
        if (res.data.ok && res.data.token) {
          clearInterval(pollRef.current);
          localStorage.setItem('auth_token', res.data.token);
          const me = await authApi.me();
          if (me.data.authenticated) setUser(me.data.user);
        }
      } catch {}
    }, 2000);
    // 5 dakika sonra polling'i durdur
    setTimeout(() => clearInterval(pollRef.current), 300000);
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <img src="https://corleoneteam.com.tr/assets/logo/logo.png" alt="Corleone" />
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="email"
            placeholder="E-posta"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="input"
            type="password"
            placeholder="Şifre"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p style={{ fontSize: 12, color: "#e74c3c" }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px" }} disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="login-divider"><span>veya</span></div>

        <div className="oauth-btns">
          <button className="oauth-btn oauth-btn-discord" onClick={() => openOAuth(authApi.loginWithDiscord)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            Discord ile Giriş
          </button>
          <button className="oauth-btn oauth-btn-google" onClick={() => openOAuth(authApi.loginWithGoogle)}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google ile Giriş
          </button>
          <button className="oauth-btn oauth-btn-steam" onClick={() => openOAuth(authApi.loginWithSteam)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z"/></svg>
            Steam ile Giriş
          </button>
        </div>
      </div>
    </div>
  );
}
