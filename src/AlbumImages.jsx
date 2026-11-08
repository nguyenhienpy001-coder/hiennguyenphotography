import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AlbumImages({ album, onBack }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function loadImages() {
    setLoading(true);

    const { data, error } = await supabase
      .from("album_images")
      .select("*")
      .eq("album_id", album.id)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setImages(data || []);
      setError("");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadImages();
  }, [album.id]);

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    setUploading(true);
    setError("");

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(`File ${file.name} không phải hình ảnh.`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`Ảnh ${file.name} vượt quá 10MB.`);
        continue;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const filePath = `albums/${album.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-images")
        .upload(filePath, file);

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data: publicData } = supabase.storage
        .from("portfolio-images")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("album_images")
        .insert([
          {
            album_id: album.id,
            image_url: publicData.publicUrl,
            display_order: 0,
          },
        ]);

      if (insertError) {
        setError(insertError.message);
      }
    }

    e.target.value = "";
    await loadImages();
    setUploading(false);
  }
  async function handleDeleteImage(image) {
  const confirmed = window.confirm("Bạn có chắc muốn xóa ảnh này không?");

  if (!confirmed) return;

  setError("");

  const { error } = await supabase
    .from("album_images")
    .delete()
    .eq("id", image.id);

  if (error) {
    setError(error.message);
    return;
  }

  const marker = "/portfolio-images/";
  const imagePath = image.image_url.split(marker)[1];

  if (imagePath) {
    await supabase.storage
      .from("portfolio-images")
      .remove([decodeURIComponent(imagePath)]);
  }

  await loadImages();
}

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section className="panel" style={{ padding: "24px" }}>
        <button onClick={onBack} style={{ marginBottom: "16px" }}>
          ← Quay lại danh sách album
        </button>

        <h2 style={{ marginTop: 0 }}>
          Thư viện ảnh: {album.title}
        </h2>

        <p style={{ color: "#777" }}>
          Tải ảnh lên để thêm vào album này.
        </p>

        {error && (
          <p style={{ color: "#d33" }}>{error}</p>
        )}

        <label
          style={{
            display: "inline-block",
            padding: "12px 18px",
            background: "#244b7a",
            color: "#fff",
            borderRadius: "8px",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? "Đang tải ảnh lên..." : "+ Chọn ảnh để tải lên"}

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>

        <p style={{ fontSize: "12px", color: "#888" }}>
          Có thể chọn nhiều ảnh cùng lúc. Mỗi ảnh tối đa 10MB.
        </p>
      </section>

      <section className="panel" style={{ padding: "24px" }}>
        <h2 style={{ marginTop: 0 }}>
          Danh sách ảnh ({images.length})
        </h2>

        {loading ? (
          <p>Đang tải ảnh...</p>
        ) : images.length === 0 ? (
          <p>Album này chưa có ảnh nào.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "16px",
            }}
          >
            {images.map((image) => (
  <div key={image.id}>
    <img
      src={image.image_url}
      alt={album.title}
      style={{
        width: "100%",
        height: "190px",
        objectFit: "cover",
        borderRadius: "8px",
      }}
    />

    <button
      onClick={() => handleDeleteImage(image)}
      style={{
        width: "100%",
        marginTop: "8px",
        padding: "8px",
        background: "#fff0f0",
        color: "#d33",
        border: "1px solid #f0cccc",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      Xóa ảnh
    </button>
  </div>
))}
          </div>
        )}
      </section>
    </div>
  );
}