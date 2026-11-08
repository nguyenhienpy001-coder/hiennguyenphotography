
import React, { useState } from "react";
import { supabase } from "./lib/supabase";

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
  setError(error.message);
  return;
}

    onLogin(data.user);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f1f5f9",
      fontFamily: "Arial, sans-serif",
      padding: 20
    }}>
      <form onSubmit={handleLogin} style={{
        width: "100%",
        maxWidth: 400,
        background: "#fff",
        padding: 35,
        borderRadius: 16,
        boxShadow: "0 10px 35px rgba(0,0,0,0.08)"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>
          HienNguyenphotography
        </h2>

        <p style={{
          textAlign: "center",
          color: "#64748b",
          marginBottom: 30
        }}>
          Đăng nhập hệ thống quản lý Studio
        </p>

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
          placeholder="Nhập email quản trị"
        />

        <label>Mật khẩu</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
          placeholder="Nhập mật khẩu"
        />

        {error && (
          <p style={{ color: "red", fontSize: 13 }}>{error}</p>
        )}

        <button type="submit" disabled={loading} style={{
          width: "100%",
          padding: 13,
          background: "#1e3a5f",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 15
        }}>
          {loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  marginTop: 8,
  marginBottom: 20,
  border: "1px solid #dbe2ea",
  borderRadius: 8,
  fontSize: 14
};
