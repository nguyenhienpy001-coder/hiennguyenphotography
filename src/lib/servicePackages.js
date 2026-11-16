import { supabase } from './supabase';

export const emptyService = () => ({ title: '', price_vnd: '', price_from: false,
  duration: '', description: '', inclusions: '', display_order: '0', is_published: false });

export function servicePayload(form) {
  const title = form.title.trim();
  if (!title || title.length > 160) throw new Error('Tên gói phải có từ 1 đến 160 ký tự.');
  const raw = String(form.price_vnd).trim();
  if (raw && !/^\d+$/.test(raw)) throw new Error('Nhập giá bằng số nguyên, ví dụ 1400000; để trống nếu cần liên hệ.');
  const price = raw === '' ? null : Number(raw);
  if (price !== null && (!Number.isSafeInteger(price) || price > 999999999999)) throw new Error('Giá vượt giới hạn cho phép.');
  if (!/^\d+$/.test(String(form.display_order))) throw new Error('Thứ tự phải là số nguyên từ 0 trở lên.');
  const order = Number(form.display_order);
  if (order > 2147483647) throw new Error('Thứ tự vượt giới hạn cho phép.');
  const duration = form.duration.trim(), description = form.description.trim();
  const inclusions = form.inclusions.split('\n').map(x => x.trim()).filter(Boolean).join('\n');
  if (duration.length > 160 || description.length > 3000 || inclusions.length > 6000) throw new Error('Nội dung vượt giới hạn ký tự.');
  return { title, price_vnd: price, price_from: price !== null && Boolean(form.price_from),
    duration, description, inclusions, display_order: order, is_published: Boolean(form.is_published) };
}

export function priceLabel(service) {
  return service.price_vnd === null ? 'Liên hệ báo giá' :
    `${service.price_from ? 'Từ ' : ''}${new Intl.NumberFormat('vi-VN').format(service.price_vnd)}đ`;
}

export async function fetchServices(publishedOnly = false) {
  const result = [];
  for (let offset = 0; ; offset += 200) {
    let query = supabase.from('service_packages').select('*');
    if (publishedOnly) query = query.eq('is_published', true);
    const { data, error } = await query.order('display_order').order('created_at').order('id').range(offset, offset + 199);
    if (error) throw error;
    result.push(...(data || []));
    if (!data || data.length < 200) return result;
  }
}
