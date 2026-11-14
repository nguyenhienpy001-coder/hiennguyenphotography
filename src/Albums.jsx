
import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import AlbumImages from "./AlbumImages";

export default function Albums() {
  const emptyForm = {
    title: "",
    category: "",
    description: "",
    cover_url: "",
    is_featured: false,
    is_published: true,
    display_order: 0,
  };

  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [imageCounts, setImageCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState("");

  const filteredAlbums = albums.filter((album) => {
    const matchesSearch = (album.title || "")
      .toLocaleLowerCase("vi-VN")
      .includes(searchTerm.trim().toLocaleLowerCase("vi-VN"));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && album.is_published) ||
      (statusFilter === "draft" && !album.is_published);
    return matchesSearch && matchesStatus;
  });

  async function loadAlbums() {
    setLoading(true);

    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setAlbums(data || []);
      setError("");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  // Read-only image counts. Fetches only album IDs, not image files.
  useEffect(() => {
    let cancelled = false;
    async function loadImageCounts() {
      setCountsLoading(true);
      setCountsError("");
      if (albums.length === 0) {
        setImageCounts({});
        setCountsLoading(false);
        return;
      }
      const ids = albums.map((album) => album.id);
      const counts = {};
      for (const id of ids) counts[id] = 0;
      // Query in pages so albums with more than 1,000 images count correctly.
      const pageSize = 500;
      let offset = 0;
      while (true) {
        const { data, error: queryError } = await supabase
          .from("album_images")
          .select("album_id")
          .is("deleted_at", null)
          .order("id")
          .in("album_id", ids)
          .range(offset, offset + pageSize - 1);
        if (cancelled) return;
        if (queryError) {
          setCountsError("Không thể tải số lượng ảnh: " + queryError.message);
          setCountsLoading(false);
          return;
        }
        for (const row of data || []) {
          counts[row.album_id] = (counts[row.album_id] || 0) + 1;
        }
        if (!data || data.length < pageSize) break;
        offset += pageSize;
      }
      if (!cancelled) {
        setImageCounts(counts);
        setCountsLoading(false);
      }
    }
    loadImageCounts();
    return () => { cancelled = true; };
  }, [albums]);
async function handleUploadImage(e) {
  const file = e.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setError("Vui lòng chọn một file hình ảnh.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    setError("Ảnh không được vượt quá 10MB.");
    return;
  }

  setUploading(true);
  setError("");

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `covers/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("portfolio-images")
    .upload(filePath, file);

  if (uploadError) {
    setError(uploadError.message);
  } else {
    const { data } = supabase.storage
      .from("portfolio-images")
      .getPublicUrl(filePath);

    setForm((prev) => ({
      ...prev,
      cover_url: data.publicUrl,
    }));
  }

  setUploading(false);
  e.target.value = "";
}
  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const albumData = {
      ...form,
      display_order: Number(form.display_order) || 0,
    };

    let result;

    if (editingId) {
      result = await supabase
        .from("albums")
        .update(albumData)
        .eq("id", editingId);
    } else {
      result = await supabase
        .from("albums")
        .insert([albumData]);
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setForm(emptyForm);
      setEditingId(null);
      await loadAlbums();
    }

    setSaving(false);
  }

  function handleEdit(album) {
    setForm({
      title: album.title || "",
      category: album.category || "",
      description: album.description || "",
      cover_url: album.cover_url || "",
      is_featured: album.is_featured || false,
      is_published: album.is_published ?? true,
      display_order: album.display_order || 0,
    });

    setEditingId(album.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete() {
    setError("Tạm khóa xóa album để bảo vệ ảnh trong Thùng rác. Bạn có thể bỏ chọn Xuất bản album để ẩn album khỏi portfolio.");
  }

  const fieldStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #dfe3eb",
    borderRadius: "8px",
    marginTop: "7px",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  if (selectedAlbum) {
  return (
    <AlbumImages
      album={selectedAlbum}
      onBack={() => { setSelectedAlbum(null); loadAlbums(); }}
    />
  );
}
  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section className="panel" style={{ padding: "24px" }}>
        <h2 style={{ marginTop: 0 }}>
          {editingId ? "Chỉnh sửa album" : "Thêm album mới"}
        </h2>

        {error && (
          <p style={{ color: "#d33" }}>{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "16px" }}>
            <label>
              Tên album *
              <input
                style={fieldStyle}
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ví dụ: Nét xưa"
                required
              />
            </label>

            <label>
              Thể loại
              <input
                style={fieldStyle}
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Ví dụ: Áo dài & Cổ phục"
              />
            </label>

            <label>
              Mô tả
              <textarea
                style={fieldStyle}
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                placeholder="Giới thiệu ngắn về album..."
              />
            </label>

            
<label>
  Ảnh bìa album

  <input
    style={fieldStyle}
    type="file"
    accept="image/*"
    onChange={handleUploadImage}
    disabled={uploading}
  />

  {uploading && (
    <p style={{ color: "#777" }}>Đang tải ảnh lên...</p>
  )}

  {form.cover_url && (
    <div style={{ marginTop: "12px" }}>
      <img
        src={form.cover_url}
        alt="Ảnh bìa album"
        style={{
          width: "180px",
          height: "220px",
          objectFit: "cover",
          borderRadius: "8px",
        }}
      />

      <p style={{ fontSize: "12px", color: "#777" }}>
        Ảnh bìa đã được tải lên.
      </p>
    </div>
  )}
</label>


            <label>
              Thứ tự hiển thị
              <input
                style={fieldStyle}
                type="number"
                name="display_order"
                value={form.display_order}
                onChange={handleChange}
              />
            </label>

            <label>
              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
              />
              {" "}Đánh dấu album nổi bật
            </label>

            <label>
              <input
                type="checkbox"
                name="is_published"
                checked={form.is_published}
                onChange={handleChange}
              />
              {" "}Xuất bản album trên Portfolio
            </label>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" disabled={saving}>
                {saving
                  ? "Đang lưu..."
                  : editingId
                    ? "Cập nhật album"
                    : "Thêm album"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(emptyForm);
                    setEditingId(null);
                  }}
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </form>
      </section>

      <section className="panel" style={{ padding: "24px" }}>
        <h2 style={{ marginTop: 0 }}>
          Danh sách album ({filteredAlbums.length}/{albums.length})
        </h2>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
          <label style={{ flex: "2 1 240px" }}>
            <span style={{ display: "block", marginBottom: "6px" }}>Tìm theo tên album</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên album..."
              aria-label="Tìm theo tên album"
              style={{ ...fieldStyle, marginTop: 0 }}
            />
          </label>
          <label style={{ flex: "1 1 170px" }}>
            <span style={{ display: "block", marginBottom: "6px" }}>Trạng thái</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc trạng thái album"
              style={{ ...fieldStyle, marginTop: 0 }}
            >
              <option value="all">Tất cả</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
            </select>
          </label>
        </div>

        {countsError && <p role="alert" style={{ color: "#b45309" }}>{countsError}</p>}
        {loading ? (
          <p>Đang tải album...</p>
        ) : albums.length === 0 ? (
          <p>Chưa có album nào. Hãy thêm album đầu tiên.</p>
        ) : filteredAlbums.length === 0 ? (
          <p>Không tìm thấy album phù hợp. Hãy thử từ khóa hoặc trạng thái khác.</p>
        ) : (
          <div style={{ display: "grid", gap: "15px" }}>
            {filteredAlbums.map((album) => (
              <div
                key={album.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  flexWrap: "wrap",
                }}
              >
                {album.cover_url ? (
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    style={{
                      width: "100px",
                      height: "110px",
                      objectFit: "cover",
                      borderRadius: "7px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100px",
                      height: "110px",
                      background: "#edf0f5",
                      borderRadius: "7px",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    Chưa có ảnh
                  </div>
                )}

                <div style={{ flex: 1, minWidth: "150px" }}>
                  <strong>{album.title}</strong>
                  <p style={{ margin: "6px 0", color: "#777" }}>
                    {album.category}
                  </p>
                  <small>
                    {album.is_published ? "Đã xuất bản" : "Bản nháp"}
                    {album.is_featured ? " · Nổi bật" : ""}
                  </small>
                  <div style={{ marginTop: "8px", fontSize: "13px", color: "#666" }}>
                    {countsLoading
                      ? "Đang đếm ảnh..."
                      : countsError
                        ? "Chưa tải được số lượng ảnh"
                        : `${imageCounts[album.id] ?? 0} ảnh`}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
  <button onClick={() => setSelectedAlbum(album)}>
    Quản lý ảnh
  </button>

  <button onClick={() => handleEdit(album)}>
    Sửa
  </button>

  <button onClick={() => handleDelete(album)}>
    Xóa album (tạm khóa)
  </button>
</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
