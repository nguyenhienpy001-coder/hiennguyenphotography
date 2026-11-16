import React, { useEffect, useRef, useState } from 'react';
import './portfolio-lightbox.css';

export default function PortfolioLightbox({ images, index, onIndexChange, onClose, albumTitle }) {
  const dialog = useRef(null);
  const start = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const image = images[index];
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => { setLoaded(false); setFailed(false); start.current = null; }, [index, image?.image_url, retry]);
  if (!image) return null;
  function move(step) {
    if (images.length > 1) onIndexChange((index + step + images.length) % images.length);
  }
  function keyDown(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); event.stopPropagation(); move(event.key === 'ArrowLeft' ? -1 : 1);
    }
    if (event.key === 'Tab') {
      const controls = [...dialog.current.querySelectorAll('button:not(:disabled), [href], [tabindex="0"]')];
      if (!controls.length) { event.preventDefault(); return; }
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
    }
  }
  return <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true"
    aria-label={`Xem ảnh lớn: ${albumTitle || 'Album ảnh'}`} className="hn-lightbox" onKeyDown={keyDown}>
    <header className="hn-lightbox-header">
      <span className="hn-lightbox-title">{albumTitle}</span>
      <button type="button" className="hn-lightbox-close" onClick={onClose} aria-label="Đóng ảnh lớn"><span aria-hidden="true">×</span></button>
    </header>
    <div className="hn-lightbox-stage" onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      onTouchStart={event => {
        start.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
      }}
      onTouchMove={event => { if (event.touches.length !== 1) start.current = null; }}
      onTouchCancel={() => { start.current = null; }}
      onTouchEnd={event => {
        const origin = start.current; start.current = null;
        if (!origin || event.touches.length || !event.changedTouches[0]) return;
        const dx = event.changedTouches[0].clientX - origin.x;
        const dy = event.changedTouches[0].clientY - origin.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) move(dx < 0 ? 1 : -1);
      }}>
      {!loaded && !failed && <span role="status" className="hn-lightbox-message">Đang tải ảnh…</span>}
      {failed ? <div className="hn-lightbox-message" role="alert">Chưa tải được ảnh.<br />
        <button type="button" onClick={() => setRetry(value => value + 1)}>Thử lại</button></div> :
        <img key={`${image.id || image.image_url}-${retry}`} src={image.image_url}
          alt={`${albumTitle || 'Album ảnh'} — ảnh ${index + 1} trên ${images.length}`}
          onLoad={() => setLoaded(true)} onError={() => { setFailed(true); setLoaded(false); }} draggable={false} />}
    </div>
    <footer className="hn-lightbox-footer" aria-label="Điều khiển ảnh">
      <button type="button" className="hn-lightbox-prev" aria-label="Ảnh trước" disabled={images.length < 2} onClick={() => move(-1)}><span aria-hidden="true">‹</span></button>
      <span className="hn-lightbox-counter" aria-live="polite" aria-atomic="true">{index + 1} / {images.length}</span>
      <button type="button" className="hn-lightbox-next" aria-label="Ảnh tiếp theo" disabled={images.length < 2} onClick={() => move(1)}><span aria-hidden="true">›</span></button>
    </footer>
  </div>;
}
