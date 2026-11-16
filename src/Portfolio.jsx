
import React, { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "./lib/supabase";
import PublicServices from "./PublicServices";
import PortfolioLightbox from "./PortfolioLightbox";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { groupPublishedAlbums, categoryName, categoryHref, categoriesHref, allAlbumsHref } from "./lib/portfolioCategories";
import "./portfolio-categories.css";

function PortfolioCover({ src, alt }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  return src && !failed ? <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} /> :
    <span className="hn-cover-empty">Chưa có ảnh bìa</span>;
}




export default function Portfolio() {
const [selectedAlbum, setSelectedAlbum] = useState(null);
const [albums, setAlbums] = useState([]);
const [albumImages, setAlbumImages] = useState([]);
const [previewIndex, setPreviewIndex] = useState(null);
const [loading, setLoading] = useState(true);
const [imagesLoading, setImagesLoading] = useState(false);
const [loadError, setLoadError] = useState("");
const [imageError, setImageError] = useState("");
const [retry, setRetry] = useState(0);
const [copyNotice, setCopyNotice] = useState("");
const [copyFallback, setCopyFallback] = useState("");
const imageRequest = useRef(0);
const albumTrigger = useRef(null);
const modalRef = useRef(null);
const [searchParams] = useSearchParams();
const location = useLocation();
const categoryId = searchParams.get("the-loai");
const groups = useMemo(() => groupPublishedAlbums(albums), [albums]);
const currentGroup = groups.find(group => group.key === categoryId);
const isCategory = categoryId !== null;
const isAllAlbums = !isCategory && searchParams.get("view") === "albums";
const showCategories = !isCategory && !isAllAlbums;
const visibleAlbums = isCategory ? (currentGroup?.albums || []) : albums;
const sectionTitle = showCategories ? "Khám phá theo thể loại" : isAllAlbums ? "Tất cả album" : currentGroup?.title || "Không tìm thấy thể loại";

function closeAlbum() {
  imageRequest.current += 1;
  setSelectedAlbum(null); setPreviewIndex(null); setAlbumImages([]); setImageError("");
  albumTrigger.current?.focus();
}
useEffect(() => {
  imageRequest.current += 1;
  setSelectedAlbum(null); setPreviewIndex(null); setAlbumImages([]);
  setCopyNotice(""); setCopyFallback("");
}, [location.search]);
useEffect(() => {
  if (!loading && location.hash === "#portfolio") {
    document.getElementById("portfolio")?.scrollIntoView({ block: "start" });
  }
}, [location.search, location.hash, loading]);
useEffect(() => {
  if (!selectedAlbum) return;
  const previous = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  modalRef.current?.focus();
  return () => { document.body.style.overflow = previous; };
}, [selectedAlbum]);
async function copyCategoryLink() {
  const path = isCategory ? categoryHref(categoryId) : isAllAlbums ? allAlbumsHref : categoriesHref;
  const url = new URL(path, window.location.origin).href;
  try {
    await navigator.clipboard.writeText(url);
    setCopyNotice("Đã sao chép liên kết."); setCopyFallback("");
  } catch {
    setCopyNotice("Bạn có thể chọn và sao chép đường dẫn bên dưới."); setCopyFallback(url);
  }
}

  useEffect(() => {
    let cancelled = false;
    async function loadAlbums() {
      setLoading(true); setLoadError("");
      try {
        const rows = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error } = await supabase.from("albums").select("*")
            .eq("is_published", true)
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: false }).order("id")
            .range(offset, offset + 499);
          if (cancelled) return;
          if (error) throw error;
          rows.push(...(data || []));
          if (!data || data.length < 500) break;
        }
        setAlbums(rows.filter(album => album.is_published === true));
      } catch {
        if (!cancelled) { setAlbums([]); setLoadError("Chưa tải được bộ sưu tập. Vui lòng thử lại."); }
      } finally { if (!cancelled) setLoading(false); }
    }
    loadAlbums();
    return () => { cancelled = true; imageRequest.current += 1; };
  }, [retry]);

  async function openAlbum(album, event) {
    if (event) albumTrigger.current = event.currentTarget;
    const request = ++imageRequest.current;
    setSelectedAlbum(album); setPreviewIndex(null); setAlbumImages([]);
    setImagesLoading(true); setImageError("");
    try {
      const rows = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("album_images").select("*")
          .eq("album_id", album.id).is("deleted_at", null)
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false }).order("id")
          .range(offset, offset + 499);
        if (request !== imageRequest.current) return;
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < 500) break;
      }
      if (request === imageRequest.current) setAlbumImages(rows);
    } catch {
      if (request === imageRequest.current) setImageError("Chưa tải được ảnh của album. Vui lòng thử lại.");
    } finally { if (request === imageRequest.current) setImagesLoading(false); }
  }

// The lightbox handles its own keyboard controls; Escape here only closes the album.
useEffect(() => {
  function handleKeyDown(event) {
    if (event.key === "Escape" && selectedAlbum && previewIndex === null) {
      event.preventDefault(); closeAlbum();
    }
  }
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedAlbum, previewIndex]);

return (
  <div className="portfolio-site">
    <header className="portfolio-header">
      <a href="/" className="portfolio-brand">
        <strong>HIEN NGUYEN</strong>

          <span>PHOTOGRAPHY</span>
        </a>

        <nav>
          <Link to={categoriesHref}>Portfolio</Link>
          <a href="#about">Giới thiệu</a>
          <a href="#services">Bảng giá</a>
          <a href="#contact">Liên hệ</a>
        </nav>
      </header>

      <section className={`portfolio-hero ${!showCategories ? "hn-category-hero" : ""}`}>
        <p className="eyebrow">HIEN NGUYEN PHOTOGRAPHY</p>
        <h1>{showCategories ? <>Every frame tells<br />a beautiful story.</> : isAllAlbums ? "Tất cả bộ sưu tập" : currentGroup?.title || (loading ? "Đang tải thể loại..." : "Thể loại ảnh")}</h1>
        <p>
          Lưu giữ vẻ đẹp, cảm xúc và những khoảnh khắc đáng nhớ.
        </p>
        <a href="#portfolio" className="hero-link">
          KHÁM PHÁ BỘ SƯU TẬP ↓
        </a>
      </section>

      <main id="portfolio" className="portfolio-content hn-category-content">
        {!showCategories && <div className="hn-category-breadcrumb">
          <Link to={categoriesHref}>Thể loại ảnh</Link><span aria-hidden="true">/</span><span>{sectionTitle}</span>
        </div>}
        <div className="portfolio-section-heading">
          <div><span className="eyebrow">SELECTED WORKS</span><h2>{sectionTitle}</h2></div>
          {!loading && !loadError && <span className="album-count">
            {showCategories ? `${groups.length} thể loại · ${albums.length} album` : `${visibleAlbums.length} album`}
          </span>}
        </div>
        <p className="hn-category-intro">{showCategories ? "Chọn thể loại để khám phá những bộ ảnh cùng phong cách." :
          "Mở một album để xem trọn bộ ảnh. Bạn có thể sao chép liên kết thể loại để chia sẻ."}</p>
        <div className="hn-category-toolbar">
          <nav aria-label="Cách xem bộ sưu tập">
            <Link to={categoriesHref} aria-current={showCategories ? "page" : undefined}>Theo thể loại</Link>
            <Link to={allAlbumsHref} aria-current={isAllAlbums ? "page" : undefined}>Tất cả album</Link>
          </nav>
          <button type="button" onClick={copyCategoryLink}>Sao chép liên kết</button>
        </div>
        {!showCategories && groups.length > 0 && <nav className="hn-category-chips" aria-label="Chọn thể loại ảnh">
          {groups.map(group => <Link key={group.key} to={categoryHref(group.key)} aria-current={categoryId === group.key ? "page" : undefined}>
            {group.title} ({group.albums.length})
          </Link>)}
        </nav>}
        {copyNotice && <p role="status" className="hn-category-notice">{copyNotice}</p>}
        {copyFallback && <div className="hn-category-copy-fallback"><label>Đường dẫn chia sẻ
          <input readOnly value={copyFallback} onFocus={e => e.target.select()} />
        </label></div>}
        {loading ? <p role="status">Đang tải bộ sưu tập...</p> : loadError ?
          <div className="hn-category-error" role="alert">{loadError}<button type="button" onClick={() => setRetry(value => value + 1)}>Thử lại</button></div> :
          albums.length === 0 ? <p>Chưa có album nào được xuất bản.</p> : showCategories ?
          <div className="hn-category-grid">{groups.map(group =>
            <Link className="hn-category-card" key={group.key} to={categoryHref(group.key)} aria-label={`Xem thể loại ${group.title}, ${group.albums.length} album`}>
              <div className="hn-category-cover"><PortfolioCover src={group.cover} alt={`Thể loại ${group.title}`} />
                <span className="hn-category-action">KHÁM PHÁ ↗</span></div>
              <div className="hn-category-meta"><h3>{group.title}</h3><span>{group.albums.length} album</span></div>
            </Link>
          )}</div> : visibleAlbums.length === 0 ?
          <p>Thể loại này không có album đã xuất bản hoặc đã được đổi tên. <Link to={categoriesHref}>Xem các thể loại hiện có.</Link></p> :
          <div className="portfolio-grid">{visibleAlbums.map((album, index) =>
            <button type="button" className={`portfolio-card ${album.is_featured || index === 0 ? "featured" : ""}`}
              key={album.id} onClick={event => openAlbum(album, event)}>
              <div className="portfolio-image"><PortfolioCover src={album.cover_url} alt={album.title} /><span className="view-album">XEM ALBUM ↗</span></div>
              <div className="album-info"><div><span>{categoryName(album.category) || "Chưa phân loại"}</span><h3>{album.title}</h3></div>
                <span className="album-number">{String(index + 1).padStart(2, "0")}</span></div>
            </button>
          )}</div>}
      </main>

      <section id="about" className="portfolio-about">
        <span className="eyebrow">BEHIND THE LENS</span>
        <h2>Photography is<br />the art of remembering.</h2>
        <p>
          Hiên Nguyễn Photography – nơi những câu chuyện,
          vẻ đẹp và cảm xúc được lưu giữ qua từng khung hình.
        </p>
      </section>

      <PublicServices />

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
  <div className="album-modal" onClick={closeAlbum}
    aria-hidden={previewIndex !== null ? true : undefined} inert={previewIndex !== null ? "" : undefined}>
    <button
      aria-label="Đóng album"
      className="modal-close"
      onClick={closeAlbum}
    >
      ×
    </button>

    <div
      className="album-modal-content"
      role="dialog" aria-modal="true" aria-labelledby="hn-album-title" tabIndex={-1} ref={modalRef}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const items = [...event.currentTarget.querySelectorAll('button, [href], input, [tabindex="0"]')];
        if (items.length === 0) { event.preventDefault(); return; }
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === event.currentTarget)) { event.preventDefault(); first.focus(); }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <span>{selectedAlbum.category}</span>
      <button type="button" onClick={closeAlbum}>← Quay lại danh sách album</button>
      <h2 id="hn-album-title">{selectedAlbum.title}</h2>
      <p>{selectedAlbum.description}</p>

      {imagesLoading ? (
        <p>Đang tải bộ sưu tập ảnh...</p>
      ) : imageError ? (
        <p role="alert">{imageError} <button type="button" onClick={() => openAlbum(selectedAlbum)}>Thử lại</button></p>
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
  role="button" tabIndex={0}
  aria-label={`Xem ảnh ${albumImages.findIndex(item => item.id === image.id) + 1} trong album ${selectedAlbum.title}`}
  onKeyDown={event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault(); setPreviewIndex(albumImages.findIndex(item => item.id === image.id));
    }
  }}
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
  <PortfolioLightbox images={albumImages} index={previewIndex} onIndexChange={setPreviewIndex}
    onClose={() => setPreviewIndex(null)} albumTitle={selectedAlbum?.title || ""} />
)}

    </div>
  );
}