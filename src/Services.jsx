import React, { useEffect, useRef, useState } from 'react';
import { supabase } from './lib/supabase';
import { emptyService, servicePayload, priceLabel, fetchServices } from './lib/servicePackages';
import './services.css';

export default function Services() {
  const [items, setItems] = useState([]), [form, setForm] = useState(emptyService);
  const [editingId, setEditingId] = useState(null), [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let alive = true;
    fetchServices().then(data => { if (alive) setItems(data); })
      .catch(e => { if (alive) setError('Không tải được bảng giá: ' + e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    const guard = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm(old => ({ ...old, [name]: type === 'checkbox' ? checked : value }));
    setDirty(true); setNotice('');
  }
  function reset() { setForm(emptyService()); setEditingId(null); setDirty(false); }
  function edit(item) {
    if (dirty && !window.confirm('Bỏ các thay đổi chưa lưu để sửa gói này?')) return;
    setForm({ ...item, price_vnd: item.price_vnd === null ? '' : String(item.price_vnd), display_order: String(item.display_order) });
    setEditingId(item.id); setDirty(false); setError(''); setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function mutate(action, message, after) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      await action();
      if (after) after();
      setNotice(message);
      try { setItems(await fetchServices()); }
      catch (e) { setError('Đã ghi dữ liệu nhưng chưa tải lại được danh sách: ' + e.message); }
    } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save(event) {
    event.preventDefault();
    let payload;
    try { payload = servicePayload(form); } catch (e) { setError(e.message); return; }
    if (payload.is_published && !window.confirm('Lưu và hiển thị gói này trên portfolio?')) return;
    await mutate(async () => {
      let query = supabase.from('service_packages');
      query = editingId ? query.update(payload).eq('id', editingId) : query.insert(payload);
      const { error } = await query.select('id').single();
      if (error) throw error;
    }, 'Đã lưu gói chụp.', reset);
  }
  async function remove(item) {
    if (dirty && !window.confirm('Bỏ các thay đổi chưa lưu để xóa gói?')) return;
    if (!window.confirm(`Xóa vĩnh viễn gói “${item.title}”? Thao tác này không xóa album hoặc ảnh.`)) return;
    await mutate(async () => {
      const { error } = await supabase.from('service_packages').delete().eq('id', item.id).select('id').single();
      if (error) throw error;
    }, 'Đã xóa gói chụp.', reset);
  }
  return <div className="hn-services-admin">
    <section className="hn-service-panel">
      <span className="hn-services-eyebrow">SERVICES & PRICING</span>
      <h2>{editingId ? 'Chỉnh sửa gói chụp' : 'Thêm gói chụp'}</h2>
      <p>Soạn bảng giá, lưu bản nháp và xuất bản khi bạn sẵn sàng.</p>
      {error && <p role="alert" className="hn-service-error">{error}</p>}
      {notice && <p role="status" className="hn-service-success">{notice}</p>}
      <form onSubmit={save}>
        <fieldset disabled={busy || loading}>
          <label>Tên gói *<input name="title" value={form.title} onChange={update} maxLength={160} required placeholder="Ví dụ: Áo dài cá nhân" /></label>
          <div className="hn-service-fields">
            <label>Giá (VNĐ)<input name="price_vnd" value={form.price_vnd} onChange={update} inputMode="numeric" maxLength={12} placeholder="1400000" />
              <small>Nhập số liền nhau. Để trống sẽ hiển thị “Liên hệ báo giá”.</small></label>
            <label>Thời lượng<input name="duration" value={form.duration} onChange={update} maxLength={160} placeholder="Ví dụ: 4 giờ — makeup 2h, chụp 2h" /></label>
          </div>
          <label className="hn-service-check"><input type="checkbox" name="price_from" checked={form.price_from} onChange={update} disabled={form.price_vnd === ''} />Hiển thị “Từ” trước giá</label>
          <label>Mô tả<textarea name="description" value={form.description} onChange={update} rows={3} maxLength={3000} placeholder="Phong cách và đối tượng phù hợp..." /></label>
          <label>Quyền lợi đi kèm<textarea name="inclusions" value={form.inclusions} onChange={update} rows={5} maxLength={6000} placeholder={'Mỗi quyền lợi một dòng\nMakeup và làm tóc\n10 ảnh chỉnh sửa'} /></label>
          <div className="hn-service-fields">
            <label>Thứ tự hiển thị<input type="number" name="display_order" value={form.display_order} onChange={update} min="0" max="2147483647" step="1" required /></label>
            <label className="hn-service-check"><input type="checkbox" name="is_published" checked={form.is_published} onChange={update} />Xuất bản trên portfolio</label>
          </div>
          <div className="hn-service-actions"><button className="hn-service-primary" type="submit">{busy ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm gói chụp'}</button>
            {(editingId || dirty) && <button type="button" onClick={() => { if (!dirty || window.confirm('Bỏ thay đổi chưa lưu?')) reset(); }}>Hủy chỉnh sửa</button>}</div>
          {dirty && <small>Bạn có thay đổi chưa lưu. Chuyển tab quản trị không làm mất nội dung đang soạn; hãy lưu trước khi đóng trang.</small>}
        </fieldset>
      </form>
    </section>
    <section className="hn-service-panel">
      <h2>Danh sách gói chụp ({items.length})</h2>
      <p>Thứ tự nhỏ hơn hiển thị trước. Chọn “Sửa” để đổi trạng thái hoặc thứ tự.</p>
      <button type="button" disabled={busy || loading} onClick={() => mutate(async () => {}, 'Đã tải lại danh sách.')}>Tải lại danh sách</button>
      {loading ? <p>Đang tải bảng giá...</p> : items.length === 0 ? <p>Chưa có gói chụp. Bạn có thể thêm gói đầu tiên ở trên.</p> :
        <div className="hn-service-list">{items.map(item => <article key={item.id}>
          <div><span className={'hn-service-status ' + (item.is_published ? 'published' : '')}>{item.is_published ? 'Đã xuất bản' : 'Bản nháp'}</span>
            <h3>{item.title}</h3><strong>{priceLabel(item)}</strong>
            {item.duration && <p>{item.duration}</p>}<small>Thứ tự: {item.display_order}</small></div>
          <div className="hn-service-actions"><button disabled={busy} type="button" onClick={() => edit(item)}>Sửa</button>
            <button className="hn-service-danger" disabled={busy} type="button" onClick={() => remove(item)}>Xóa gói</button></div>
        </article>)}</div>}
    </section>
  </div>;
}
