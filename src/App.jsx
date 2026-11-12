import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Images, Tags, ExternalLink, LogOut } from "lucide-react";
import Auth from "./Auth";
import Albums from "./Albums";
import Portfolio from "./Portfolio";
import { supabase } from "./lib/supabase";

const ui = {
  page: { minHeight: "100vh", background: "#f8f7f4", color: "#282722", fontFamily: "Arial, sans-serif" },
  header: { background: "#fff", borderBottom: "1px solid #e8e4dd", padding: "20px 5%", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 },
  button: { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 15px", border: "1px solid #ddd8d1", borderRadius: 8, background: "#fff", color: "#282722", cursor: "pointer", textDecoration: "none", fontSize: 14 },
};

function AdminApp() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [active, setActive] = useState("albums");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error("Session error:", error.message);
      setUser(data?.session?.user ?? null);
      setCheckingSession(false);
    }).catch((error) => {
      if (!mounted) return;
      console.error("Session error:", error);
      setCheckingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setCheckingSession(false);
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) alert("Không thể đăng xuất: " + error.message);
  }

  if (checkingSession) return <div style={{ padding: 40 }}>Đang kiểm tra đăng nhập...</div>;
  if (!user) return <Auth onLogin={setUser} />;

  const tabs = [
    { id: "albums", label: "Albums & Images", Icon: Images },
    { id: "services", label: "Services & Pricing", Icon: Tags },
  ];

  return (
    <div style={ui.page}>
      <header style={ui.header}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "0.08em" }}>HIEN NGUYEN PHOTOGRAPHY</div>
          <div style={{ color: "#777", fontSize: 11, marginTop: 7, letterSpacing: "0.13em" }}>ADMIN WORKSPACE · MINIMAL V1</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/" style={ui.button}><ExternalLink size={16} /> View Website</Link>
          <button type="button" style={ui.button} onClick={handleLogout}><LogOut size={16} /> Đăng xuất</button>
        </div>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 5%" }}>
        <nav aria-label="Quản lý website" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => setActive(id)}
              style={{ ...ui.button, ...(active === id ? { background: "#282722", borderColor: "#282722", color: "#fff" } : {}) }}
              aria-pressed={active === id}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        {active === "albums" ? <Albums /> : (
          <section style={{ background: "#fff", padding: 24, border: "1px solid #e8e4dd", borderRadius: 10 }}>
            <h2 style={{ marginTop: 0 }}>Services & Pricing</h2>
            <p>Chúng ta sẽ xây dựng chức năng quản lý dịch vụ và bảng giá ở bước tiếp theo.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Portfolio />} />
      <Route path="/admin" element={<AdminApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
