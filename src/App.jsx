import React from "react";
import { useState, useEffect } from "react";
import Auth from "./Auth";
import { supabase } from "./lib/supabase";
import Customers from "./Customers";
import Portfolio from "./Portfolio";
import Albums from "./Albums";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Users, Images, Video, Globe, Shirt,
  Boxes, ChartNoAxesCombined, Receipt, Contact, Bell, Settings, Search,
  Plus, Clock3, Hourglass, Image, Wallet, AlertTriangle, Menu, X,
  ChevronRight, Heart, ExternalLink
} from "lucide-react";

const navGroups = [
  { label: "CÔNG VIỆC", items: [
    ["Tổng quan", LayoutDashboard], ["Lịch hẹn", CalendarDays],
    ["Khách hàng", Users], ["Album ảnh", Images], ["Videos", Video],
    ["Portfolio", Globe], ["Shop trang phục", Shirt], ["Tiện ích", Boxes]
  ]},
  { label: "QUẢN LÝ", items: [
    ["Doanh thu", ChartNoAxesCombined], ["Chi phí", Receipt],
    ["Nhân viên & lương", Contact]
  ]},
  { label: "TÀI KHOẢN", items: [
    ["Thông báo", Bell], ["Tài khoản & giao diện", Settings]
  ]}
];

const appointments = [
  { day: "04", month: "Th 11", name: "Nguyễn Minh Anh", time: "08:30", type: "Chụp couple", status: "Đã xác nhận" },
  { day: "04", month: "Th 11", name: "Trần Gia Bảo", time: "14:00", type: "Chụp gia đình", status: "Đã xác nhận" },
  { day: "04", month: "Th 11", name: "Lê Thu Hà", time: "17:30", type: "Chụp chân dung", status: "Chờ xác nhận" }
];
const upcoming = [
  { day: "05", month: "Th 11", name: "Phạm Quốc Huy", time: "09:00", type: "Chụp sản phẩm", status: "Đã xác nhận" },
  { day: "06", month: "Th 11", name: "Đỗ Ngọc Lan & Vũ Hoàng", time: "07:00", type: "Chụp couple ngoại cảnh", status: "Đã xác nhận" },
  { day: "08", month: "Th 11", name: "Bùi Khánh Linh", time: "15:30", type: "Chụp thời trang", status: "Chờ xác nhận" }
];

function StatCard({ icon: Icon, label, value, note, accent = "" }) {
  return <div className={`stat-card ${accent}`}>
    <div className="stat-label"><Icon size={15}/>{label}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-note">{note}</div>
  </div>;
}

function AppointmentList({ title, items, count }) {
  return <section className="panel appointment-panel">
    <div className="panel-heading"><h3><CalendarDays size={17}/>{title}</h3><span>{count}</span></div>
    {items.map((item, i) => <div className="appointment" key={i}>
      <div className="date-box"><b>{item.day}</b><small>{item.month}</small></div>
      <div className="appointment-info">
        <strong>{item.name}</strong>
        <span className={item.status === "Chờ xác nhận" ? "status waiting" : "status"}>{item.status}</span>
        <small>{item.time} · {item.type}</small>
      </div>
      <button className="small-button" onClick={() => alert(`Thông tin lịch hẹn: ${item.name}\\n${item.time} · ${item.type}`)}>Mở</button>
    </div>)}
  </section>;
}
function AdminApp() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user ?? null);
        setCheckingSession(false);
      }
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setCheckingSession(false);
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Không thể đăng xuất: " + error.message);
    }
  }
  const [active, setActive] = useState("Tổng quan");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotice, setShowNotice] = useState(true);
  const now = new Date();
  const dateText = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(now);
  const isDashboard = active === "Tổng quan";
    if (checkingSession) {
    return <div style={{ padding: 40 }}>Đang kiểm tra đăng nhập...</div>;
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="brand">
  <div className="brand-mark">HN</div>
  <div>
    <b>HienNguyenphotography</b>
    <small>STUDIO MANAGEMENT SYSTEM</small>
  </div>
  <button className="close-menu" onClick={() => setMenuOpen(false)}>
    <X />
  </button>
</div>
      <div className="profile"><div className="avatar">H</div><div><b>Chủ Studio</b><small>Không gian quản lý</small></div></div>
      {navGroups.map(group => <div className="nav-group" key={group.label}>
        <div className="nav-label">{group.label}</div>
        {group.items.map(([label, Icon]) => <button key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => { setActive(label); setMenuOpen(false); }}>
          <Icon size={17}/><span>{label}</span>
        </button>)}
      </div>)}
      <div className="sidebar-bottom"><span className="online-dot"></span> Phiên bản thử nghiệm <b>v1.0</b></div>
    </aside>

    {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Đóng menu"/>}
    <main className="main-content">
      {showNotice && <div className="top-notice">Chào mừng đến với Hiên Studio Manager – phiên bản giao diện thử nghiệm.<button onClick={() => setShowNotice(false)}><X size={14}/></button></div>}
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMenuOpen(true)}><Menu/></button>
        <div><div className="eyebrow">KHÔNG GIAN LÀM VIỆC</div><h1>{active}</h1></div>
        <div className="top-actions">
  <button
    className="primary-button"
    onClick={() => setActive("Lịch hẹn")}
  >
    <Plus size={16}/> Ghi lịch
  </button>

  <button
    className="icon-button"
    title="Tìm kiếm"
    onClick={() => alert("Tìm kiếm sẽ được bổ sung ở giai đoạn chức năng.")}
  >
    <Search size={18}/>
  </button>

  <button className="icon-button notification" title="Thông báo">
    <Bell size={18}/>
    <i>3</i>
  </button>

  <button
    className="icon-button"
    onClick={handleLogout}
    title="Đăng xuất"
  >
    Đăng xuất
  </button>
</div>
      </header>

      {isDashboard ? <>
        <section className="welcome-card"><div><span className="welcome-kicker">TỔNG QUAN HOẠT ĐỘNG</span><h2>Chào buổi chiều!</h2><p>{dateText} · Hiên Studio</p></div><div className="welcome-orb"></div></section>

        <section className="stats-grid">
          <StatCard icon={CalendarDays} label="Lịch hôm nay" value="3" note="Đầu tiên: 08:30 · Nguyễn Minh Anh" accent="cyan"/>
          <StatCard icon={Clock3} label="7 ngày tới" value="9" note="Lịch hẹn sắp diễn ra"/>
          <StatCard icon={Hourglass} label="Chờ xác nhận" value="2" note="Cần liên hệ khách" accent="cyan"/>
          <StatCard icon={Image} label="Chờ chỉnh / giao ảnh" value="5" note="2 hoàn thành · 3 đang chỉnh"/>
          <StatCard icon={Wallet} label="Doanh thu tháng" value="48.500.000 ₫" note="Số liệu minh họa"/>
          <StatCard icon={Receipt} label="Chi phí tháng" value="14.200.000 ₫" note="Số liệu minh họa"/>
          <StatCard icon={ChartNoAxesCombined} label="Lãi ròng" value="34.300.000 ₫" note="Doanh thu trừ chi phí" accent="green"/>
          <StatCard icon={AlertTriangle} label="Chờ thanh toán" value="6.500.000 ₫" note="Cần theo dõi công nợ"/>
        </section>

        <section className="content-grid">
          <div className="left-column">
            <AppointmentList title="Lịch hôm nay" items={appointments} count="3 buổi"/>
            <AppointmentList title="7 ngày tới" items={upcoming} count="9 buổi"/>
          </div>
          <div className="right-column">
            <section className="panel progress-panel">
              <div className="panel-heading"><h3><ChartNoAxesCombined size={17}/>Tiến độ lịch hẹn</h3><span>42 lịch</span></div>
              <div className="progress-bar"><i/><i/><i/><i/><i/></div>
              <div className="legend"><span>● Chờ xác nhận 2</span><span>● Đã xác nhận 12</span><span>● Hoàn thành 2</span><span>● Đang chỉnh ảnh 3</span><span>● Đã giao ảnh 6</span><span>● Đã thanh toán 17</span></div>
            </section>
            <section className="panel album-panel">
              <div className="panel-heading"><h3><Images size={17}/>Album khách đang chọn</h3><span>3 album</span></div>
              {[["Cưới Minh Anh & Đức","412 ảnh · khách đã chọn 58"],["Gia đình bé Su","126 ảnh · khách đã chọn 22"],["Kỷ yếu 12A1","980 ảnh · đang chọn"]].map(([name, note]) => <div className="album-row" key={name}><div><b>{name}</b><small>{note}</small></div><button className="small-button" onClick={() => setActive("Album ảnh")}><Heart size={12}/> Xem</button></div>)}
            </section>
            <section className="panel chart-panel">
              <div className="panel-heading"><h3><ChartNoAxesCombined size={17}/>Lãi ròng 6 tháng gần nhất</h3></div>
              <div className="chart">{[58,72,49,85,84,77].map((h,i)=><div className="bar-wrap" key={i}><div className="bar" style={{height:`${h}%`}}/><small>{["T6","T7","T8","T9","T10","T11"][i]}</small></div>)}</div>
              <div className="chart-foot">Tháng này: <b>34.300.000 ₫</b></div>
            </section>
          </div>
        </section>
      </> : active === "Khách hàng" ? (
  <Customers />
) : active === "Album ảnh" ? (
  <Albums />
) : (
  <section className="panel placeholder">
    <div className="placeholder-icon"><Boxes size={28}/></div><h2>{active}</h2>
    <p>Đây là khu vực {active.toLowerCase()} của HienNguyenphotography.</p>
    <p className="muted">Chúng ta sẽ xây dựng chức năng và kết nối dữ liệu cho mục này ở các bước tiếp theo.</p>
    <button className="primary-button" onClick={() => setActive("Tổng quan")}>Quay lại tổng quan <ChevronRight size={16}/></button>
  </section>
)}

<footer>© 2026 Hiên Studio Manager <span>Thiết kế dành cho công việc nhiếp ảnh</span></footer>
    </main>
  </div>;
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
