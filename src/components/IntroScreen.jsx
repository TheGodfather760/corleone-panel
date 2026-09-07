import { useEffect, useRef, useState } from "react";

export default function IntroScreen({ onDone }) {
  const videoRef = useRef(null);
  const [opacity, setOpacity] = useState(1);

  const finish = () => {
    setOpacity(0);
    setTimeout(onDone, 600);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => finish()); // autoplay engellendiyse direkt geç
    v.addEventListener("ended", finish);
    return () => v.removeEventListener("ended", finish);
  }, []);

  return (
    <div
      onClick={finish}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity, transition: "opacity 0.6s ease",
        cursor: "pointer",
      }}
    >
      <video
        ref={videoRef}
        src="/Corleone-Logo-Animation.mp4"
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Skip butonu */}
      <div style={{
        position: "absolute", bottom: 32, right: 32,
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.5)",
        letterSpacing: .6, textTransform: "uppercase",
        userSelect: "none",
      }}>
        Geç &nbsp;›
      </div>
    </div>
  );
}
