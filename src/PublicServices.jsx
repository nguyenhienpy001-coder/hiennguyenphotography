import React, { useEffect, useState } from 'react';
import { fetchServices, priceLabel } from './lib/servicePackages';
import './services.css';

export default function PublicServices() {
  const [items, setItems] = useState([]), [loading, setLoading] = useState(true), [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchServices(true).then(data => { if (alive) setItems(data); })
      .catch(() => { if (alive) setFailed(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  if (!loading && !failed && items.length === 0) return null;
  return <section id="services" className="hn-public-services" aria-labelledby="hn-services-title">
    <header><span className="hn-services-eyebrow">SERVICES & PRICING</span><h2 id="hn-services-title">Gói chụp dành cho bạn</h2>
      <p>Chọn gói phù hợp để bắt đầu câu chuyện bằng hình ảnh của riêng bạn.</p></header>
    {loading ? <p role="status">Đang tải bảng giá...</p> : failed ? <p>Chưa tải được bảng giá. <a href="#contact">Liên hệ để được tư vấn.</a></p> :
      <div className="hn-public-service-grid">{items.map(item => <article className="hn-public-service-card" key={item.id}>
        <h3>{item.title}</h3><p className="hn-service-price">{priceLabel(item)}</p>
        {item.duration && <p className="hn-service-duration">{item.duration}</p>}
        {item.description && <p className="hn-service-description">{item.description}</p>}
        {item.inclusions && <ul>{item.inclusions.split('\n').filter(Boolean).map((line, i) => <li key={i}>{line}</li>)}</ul>}
        <a className="hn-service-contact" href="#contact" aria-label={`Liên hệ tư vấn gói ${item.title}`}>Liên hệ tư vấn ↗</a>
      </article>)}</div>}
  </section>;
}
