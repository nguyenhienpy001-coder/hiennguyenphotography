// Keep Vietnamese accents: “Ao dai” and “Áo dài” are distinct names.
// Case, surrounding/repeated spaces, and Unicode composition are normalized.
export function categoryName(value) {
  return typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/gu, ' ') : '';
}
export function categoryKey(value) {
  const name = categoryName(value);
  return name ? 'c:' + name.toLocaleLowerCase('vi-VN') : 'uncategorized';
}
export function categoryHref(key) {
  const params = new URLSearchParams();
  params.set('the-loai', key);
  return '/?' + params.toString() + '#portfolio';
}
export const categoriesHref = '/#portfolio';
export const allAlbumsHref = '/?view=albums#portfolio';

export function groupPublishedAlbums(albums) {
  const groups = new Map();
  for (const album of albums) {
    if (album.is_published !== true) continue;
    const key = categoryKey(album.category);
    if (!groups.has(key)) groups.set(key, { key, title: categoryName(album.category) || 'Chưa phân loại', albums: [], cover: '' });
    groups.get(key).albums.push(album);
  }
  for (const group of groups.values()) {
    const coverAlbum = group.albums.find(a => a.is_featured && a.cover_url) || group.albums.find(a => a.cover_url);
    group.cover = coverAlbum?.cover_url || '';
  }
  // Inherit display order from the first published album, uncategorized last.
  return [...groups.values()].sort((a, b) => Number(a.key === 'uncategorized') - Number(b.key === 'uncategorized'));
}
