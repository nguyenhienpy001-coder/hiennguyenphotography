
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "./lib/supabase";



export default function Portfolio() {
const [selectedAlbum, setSelectedAlbum] = useState(null);
const [albums, setAlbums] = useState([]);
const [albumImages, setAlbumImages] = useState([]);
const [previewIndex, setPreviewIndex] = useState(null);
const touchStartX = useRef(null);
const [loading, setLoading] = useState(true);
const [imagesLoading, setImagesLoading] = useState(false);

  useEffect(() => {
    async function loadAlbums() {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Lỗi tải album:", error.message);
      } else {
        setAlbums(
          (data || []).map((album) => ({
            ...album,
            cover: album.cover_url,
          }))
        );
      }

      setLoading(false);
    }

    loadAlbums();
  }, []);
  async function openAlbum(album) {
  setSelectedAlbum(album);
  setAlbumImages([]);
  setImagesLoading(true);

  const { data, error } = await supabase
    .from("album_images")
    .select("*")
    .eq("album_id", album.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Lỗi tải ảnh album:", error.message);
  } else {
    setAlbumImages(data || []);
  }

  setImagesLoading(false);
}
function handlePrevImage() {
  setPreviewIndex((current) =>
    current === 0 ? albumImages.length - 1 : current - 1
  );
}


function handleNextImage() {
  setPreviewIndex((current) =>
    current === albumImages.length - 1 ? 0 : current + 1
  );
}

// Điều khiển Lightbox bằng bàn phím
useEffect(() => {
  function handleKeyDown(e) {
    if (previewIndex === null) return;

    if (e.key === "ArrowLeft") {
      handlePrevImage();
    }

    if (e.key === "ArrowRight") {
      handleNextImage();
    }

    if (e.key === "Escape") {
      setPreviewIndex(null);
    }
  }

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [previewIndex, albumImages.length]);

return (
  <div className="portfolio-site">
    <header className="portfolio-header">
      <a href="/" className="portfolio-brand">
        <strong>HIEN NGUYEN</strong>

          <span>PHOTOGRAPHY</span>
        </a>

        <nav>
          <a href="#portfolio">Portfolio</a>
          <a href="#about">Giới thiệu</a>
          <a href="#contact">Liên hệ</a>
        </nav>
      </header>

      <section className="portfolio-hero">
        <p className="eyebrow">HIEN NGUYEN PHOTOGRAPHY</p>
        <h1>Every frame tells<br />a beautiful story.</h1>
        <p>
          Lưu giữ vẻ đẹp, cảm xúc và những khoảnh khắc đáng nhớ.
        </p>
        <a href="#portfolio" className="hero-link">
          KHÁM PHÁ BỘ SƯU TẬP ↓
        </a>
      </section>

      <main id="portfolio" className="portfolio-content">
        <div className="portfolio-section-heading">
          <div>
            <span className="eyebrow">SELECTED WORKS</span>
            <h2>Những câu chuyện bằng hình ảnh</h2>
          </div>
          <span className="album-count">
  01 — {String(albums.length).padStart(2, "0")}
</span>
        </div>

<div className="portfolio-grid">
  {loading ? (
    <p>Đang tải album...</p>
  ) : albums.length === 0 ? (
    <p>Chưa có album nào được xuất bản.</p>
  ) : (
    albums.map((album, index) => (
      <button
        className={`portfolio-card ${
          album.is_featured || index === 0 ? "featured" : ""
        }`}
        key={album.id}
        onClick={() => openAlbum(album)}
      >
        <div className="portfolio-image">
          <img src={album.cover} alt={album.title} />
          <span className="view-album">XEM ALBUM ↗</span>
        </div>

        <div className="album-info">
          <div>
            <span>{album.category}</span>
            <h3>{album.title}</h3>
          </div>
          <span className="album-number">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </button>
    ))
  )}
</div>
      </main>

      <section id="about" className="portfolio-about">
        <span className="eyebrow">BEHIND THE LENS</span>
        <h2>Photography is<br />the art of remembering.</h2>
        <p>
          Hiên Nguyễn Photography – nơi những câu chuyện,
          vẻ đẹp và cảm xúc được lưu giữ qua từng khung hình.
        </p>
      </section>

      <section id="contact" className="portfolio-contact">
        <span className="eyebrow">LET'S CREATE SOMETHING BEAUTIFUL</span>
        <h2>Hãy cùng tạo nên<br />một câu chuyện của riêng bạn.</h2>
        <div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "28px",
  }}
>
  <a href="tel:0972708097">
    GỌI ĐIỆN ↗
  </a>

  <a
    href="https://zalo.me/0972708097"
    target="_blank"
    rel="noreferrer"
  >
    NHẮN ZALO ↗
  </a>

  <a
    href="https://www.facebook.com/"
    target="_blank"
    rel="noreferrer"
  >
    FACEBOOK ↗
  </a>
</div>
      </section>

      <footer className="portfolio-footer">
        <strong>HIEN NGUYEN PHOTOGRAPHY</strong>
        <span>© 2026 · ALL RIGHTS RESERVED</span>
      </footer>

      <a href="/admin" className="admin-link">Quản trị</a>

{selectedAlbum && (
  <div className="album-modal" onClick={() => setSelectedAlbum(null)}>
    <button
      className="modal-close"
      onClick={() => setSelectedAlbum(null)}
    >
      ×
    </button>

    <div
      className="album-modal-content"
      onClick={(e) => e.stopPropagation()}
    >
      <span>{selectedAlbum.category}</span>
      <h2>{selectedAlbum.title}</h2>
      <p>{selectedAlbum.description}</p>

      {imagesLoading ? (
        <p>Đang tải bộ sưu tập ảnh...</p>
      ) : albumImages.length === 0 ? (
        <p>Album này hiện chưa có ảnh.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          {albumImages.map((image) => (
            <img
  key={image.id}
  src={image.image_url}
  alt={selectedAlbum.title}
  loading="lazy"
  onClick={() =>
  setPreviewIndex(
    albumImages.findIndex((item) => item.id === image.id)
  )
}
  style={{
    width: "100%",
    height: "280px",
    objectFit: "cover",
    borderRadius: "8px",
    cursor: "zoom-in",
}}
/>
          ))}
        </div>
      )}
    </div>
  </div>
)}

{previewIndex !== null && albumImages[previewIndex] && (
  <div
    onClick={() => setPreviewImage(null)}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,0.94)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "30px",
      cursor: "zoom-out",

}}
  >
    {/* Nút ảnh trước */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        handlePrevImage();
      }}
      style={{
        position: "absolute",
        left: "25px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "rgba(255,255,255,0.15)",
        border: "none",
        color: "#fff",
        fontSize: "36px",
        padding: "10px 18px",
        cursor: "pointer",
        borderRadius: "8px",
      }}
    >
      ‹
    </button>

    {/* Nút ảnh tiếp theo */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleNextImage();
      }}
      style={{
        position: "absolute",
        right: "25px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "rgba(255,255,255,0.15)",
        border: "none",
        color: "#fff",
        fontSize: "36px",
        padding: "10px 18px",
        cursor: "pointer",
        borderRadius: "8px",
      }}
    >
      ›
    </button>

    {/* Nút đóng */}
    <button
      onClick={() => setPreviewIndex(null)}
      style={{
        position: "absolute",
        top: "20px",
        right: "25px",
        background: "transparent",
        border: "none",
        color: "#fff",
        fontSize: "36px",
        cursor: "pointer",
      }}
    >
      ×
    </button>
<div
  style={{
    position: "absolute",
    bottom: "25px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontSize: "15px",
    background: "rgba(0,0,0,0.5)",
    padding: "8px 16px",
    borderRadius: "20px",
  }}
>
  {previewIndex + 1} / {albumImages.length}
</div>
    {/* Ảnh đang xem */}
    <img
      src={albumImages[previewIndex].image_url}
      alt="Ảnh xem trước"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => {
  touchStartX.current = e.touches[0].clientX;
}}

onTouchEnd={(e) => {
  if (touchStartX.current === null) return;

  const touchEndX = e.changedTouches[0].clientX;
  const distance = touchEndX - touchStartX.current;

  if (distance < -50) {
    handleNextImage();
  } else if (distance > 50) {
    handlePrevImage();
  }

  touchStartX.current = null;
}}
      style={{
        maxWidth: "95%",
        maxHeight: "90vh",
        objectFit: "contain",
        borderRadius: "4px",
      }}
    />
  </div>
)}
    </div>
  );
}