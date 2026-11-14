import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AlbumImages({ album, onBack }) {
  const mutationLock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [notice, setNotice] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [settingCoverId, setSettingCoverId] = useState(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState(album.cover_url || "");

  async function loadImages() {
    setLoading(true);

    try {
      const rows = [];
      for (let offset = 0; ; offset += 500) {
        let query = supabase.from("album_images").select("*")
          .eq("album_id", album.id);
        query = showTrash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
        const { data, error: queryError } = await query
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false }).order("id")
          .range(offset, offset + 499);
        if (queryError) throw queryError;
        rows.push(...(data || []));
        if (!data || data.length < 500) break;
      }
      setImages(rows);
      setOrderChanged(false);
      setError("");
    } catch (loadError) {
      setImages([]);
      setError("Không tải được ảnh: " + loadError.message);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadImages();
  }, [album.id, showTrash]);

  function moveImage(fromId, toId) {
    if (showTrash || busy || savingOrder || uploading || fromId === toId) return;
    setImages((current) => {
      const from = current.findIndex((item) => item.id === fromId);
      const to = current.findIndex((item) => item.id === toId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setOrderChanged(true);
  }

  function moveByStep(id, step) {
    const index = images.findIndex((item) => item.id === id);
    const target = index + step;
    if (index < 0 || target < 0 || target >= images.length) return;
    moveImage(id, images[target].id);
  }

  async function saveImageOrder() {
    if (!orderChanged || savingOrder) return;
    setSavingOrder(true);
    setError("");
    // Unique positive ranks avoid ambiguity with older rows at display_order=0.
    // Writes are sequential; on error, reload the server's actual order.
    for (let index = 0; index < images.length; index++) {
      const { error: updateError } = await supabase
        .from("album_images")
        .update({ display_order: index + 1 })
        .eq("id", images[index].id)
        .eq("album_id", album.id);
      if (updateError) {
        await loadImages();
        setError("Không thể lưu đầy đủ thứ tự ảnh: " + updateError.message + ". Đã tải lại thứ tự từ Supabase.");
        setSavingOrder(false);
        return;
      }
    }
    await loadImages();
    setSavingOrder(false);
  }

  async function handleSetCover(image) {
    if (busy || loading || showTrash || uploading || savingOrder || settingCoverId !== null) return;
    if (orderChanged) {
      setError("Hãy lưu hoặc hủy thay đổi thứ tự trước khi đổi ảnh bìa.");
      return;
    }
    if (image.image_url === currentCoverUrl) return;
    if (!window.confirm("Đặt ảnh này làm ảnh bìa cho album \"" + album.title + "\"? Thay đổi sẽ hiển thị trên website chính.")) return;
    setSettingCoverId(image.id);
    setError("");
    const { data, error: updateError } = await supabase
      .from("albums")
      .update({ cover_url: image.image_url })
      .eq("id", album.id)
      .select("id, cover_url")
      .single();
    if (updateError) {
      setError("Không thể đổi ảnh bìa: " + updateError.message);
    } else if (data?.cover_url === image.image_url) {
      setCurrentCoverUrl(data.cover_url);
    } else {
      setError("Không xác nhận được ảnh bìa mới. Vui lòng tải lại trang để kiểm tra.");
    }
    setSettingCoverId(null);
  }

  async function handleUpload(e) {
    if (orderChanged) {
      setError("Hãy lưu hoặc hủy thay đổi thứ tự trước khi tải ảnh mới.");
      e.target.value = "";
      return;
    }
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
  async function changeTrash(image, restore = false) {
    if (mutationLock.current || uploading || savingOrder || settingCoverId !== null || loading) return;
    if (orderChanged) {
      setError("Hãy lưu hoặc hủy thay đổi thứ tự trước khi dùng Thùng rác.");
      return;
    }
    const message = restore ? "Khôi phục ảnh này về album?" :
      "Đưa ảnh vào Thùng rác? Ảnh sẽ ẩn khỏi portfolio và có thể khôi phục trong 30 ngày.";
    if (!window.confirm(message)) return;
    mutationLock.current = true;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const { error: rpcError } = await supabase.rpc(
        restore ? "hn_restore_album_image" : "hn_trash_album_image",
        { p_image_id: image.id }
      );
      if (rpcError) throw rpcError;
      await loadImages();
      setNotice(restore ? "Đã khôi phục ảnh." : "Đã đưa ảnh vào Thùng rác.");
    } catch (mutationError) {
      setError(mutationError.message);
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section className="panel" style={{ padding: "24px" }}>
        <button onClick={() => {
          if (orderChanged && !window.confirm("Bạn chưa lưu thứ tự ảnh. Rời khỏi và bỏ thay đổi?")) return;
          onBack();
        }} disabled={savingOrder || uploading || busy || settingCoverId !== null} style={{ marginBottom: "16px" }}>
          ← Quay lại danh sách album
        </button>

        <h2 style={{ marginTop: 0 }}>
          Thư viện ảnh: {album.title}
        </h2>

        <p style={{ color: "#777" }}>
          Tải ảnh lên để thêm vào album này.
        </p>

        {notice && <p role="status">{notice}</p>}
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
            cursor: uploading || savingOrder || orderChanged ? "not-allowed" : "pointer",
            opacity: uploading || savingOrder || orderChanged ? 0.6 : 1,
          }}
        >
          {uploading ? "Đang tải ảnh lên..." : "+ Chọn ảnh để tải lên"}

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading || savingOrder || orderChanged || busy || loading || showTrash}
            style={{ display: "none" }}
          />
        </label>

        <p style={{ fontSize: "12px", color: "#888" }}>
          Có thể chọn nhiều ảnh cùng lúc. Mỗi ảnh tối đa 10MB.
        </p>
      </section>

      <section className="panel" style={{ padding: "24px" }}>
        <h2 style={{ marginTop: 0 }}>
          {showTrash ? "Thùng rác" : "Danh sách ảnh"} ({images.length})
        </h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <button type="button" disabled={busy || uploading || savingOrder || loading || orderChanged || settingCoverId !== null}
            onClick={() => { setNotice(""); setShowTrash(false); }} aria-pressed={!showTrash}>Ảnh trong album</button>
          <button type="button" disabled={busy || uploading || savingOrder || loading || orderChanged || settingCoverId !== null}
            onClick={() => { setNotice(""); setShowTrash(true); }} aria-pressed={showTrash}>Thùng rác</button>
        </div>
        {showTrash && <p>Khôi phục trong 30 ngày kể từ lúc đưa vào Thùng rác. Ảnh hết hạn vẫn được giữ, chưa tự động xóa vĩnh viễn.</p>}
        {!showTrash && <p style={{ color: "#777", fontSize: "13px" }}>
          Kéo ảnh vào vị trí mong muốn trên máy tính, hoặc dùng nút ← → để đổi vị trí.
          Nhấn “Lưu thứ tự” để ghi vào Supabase.
        </p>}
        {orderChanged && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button type="button" onClick={saveImageOrder} disabled={savingOrder || uploading || busy}>
              {savingOrder ? "Đang lưu thứ tự..." : "Lưu thứ tự ảnh"}
            </button>
            <button type="button" disabled={savingOrder} onClick={loadImages}>Hủy thay đổi</button>
          </div>
        )}
        {loading ? (
          <p>Đang tải ảnh...</p>
        ) : images.length === 0 ? (
          <p>{showTrash ? "Thùng rác của album đang trống." : "Album này chưa có ảnh nào."}</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "16px",
            }}
          >
            {images.map((image, index) => (
  <div
    key={image.id}
    draggable={!showTrash && !busy && !savingOrder && !uploading}
    onDragStart={(event) => {
      setDraggedId(image.id);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(image.id));
    }}
    onDragOver={(event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }}
    onDrop={(event) => {
      event.preventDefault();
      const sourceId = draggedId ?? event.dataTransfer.getData("text/plain");
      const source = images.find((item) => String(item.id) === String(sourceId));
      if (source) moveImage(source.id, image.id);
      setDraggedId(null);
    }}
    onDragEnd={() => setDraggedId(null)}
    style={{
      border: draggedId === image.id ? "2px dashed #5792cb" : "2px solid transparent",
      borderRadius: "9px",
      padding: "3px",
      cursor: "grab",
    }}
  >
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

    {!showTrash && <React.Fragment>
    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "7px" }}>
      <button type="button" onClick={() => moveByStep(image.id, -1)}
        disabled={index === 0 || savingOrder || uploading || busy}
        aria-label={`Chuyển ảnh ${index + 1} sang trái`} style={{ flex: 1, padding: "7px" }}>
        ← Trái
      </button>
      <span style={{ fontSize: "12px", color: "#888", whiteSpace: "nowrap" }}>{index + 1}/{images.length}</span>
      <button type="button" onClick={() => moveByStep(image.id, 1)}
        disabled={index === images.length - 1 || savingOrder || uploading || busy}
        aria-label={`Chuyển ảnh ${index + 1} sang phải`} style={{ flex: 1, padding: "7px" }}>
        Phải →
      </button>
    </div>
     <button
       type="button"
       onClick={() => handleSetCover(image)}
       disabled={image.image_url === currentCoverUrl || settingCoverId !== null || uploading || savingOrder || orderChanged || busy}
       style={{ width: "100%", marginTop: "8px", padding: "8px", borderRadius: "6px", cursor: "pointer" }}
     >
       {image.image_url === currentCoverUrl ? "✓ Ảnh bìa hiện tại" : settingCoverId === image.id ? "Đang cập nhật..." : "Đặt làm ảnh bìa"}
     </button>
    </React.Fragment>}
    {showTrash && <p style={{ fontSize: 12 }}>
      Đã xóa: {new Date(image.deleted_at).toLocaleString("vi-VN")}<br />
      Hạn khôi phục: {new Date(new Date(image.deleted_at).getTime() + 30 * 86400000).toLocaleString("vi-VN")}
    </p>}
    <button
      disabled={busy || uploading || savingOrder || orderChanged || settingCoverId !== null ||
        (showTrash && Date.now() >= new Date(image.deleted_at).getTime() + 30 * 86400000)}
      onClick={() => changeTrash(image, showTrash)}
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
      {busy ? "Đang xử lý..." : showTrash
        ? (Date.now() >= new Date(image.deleted_at).getTime() + 30 * 86400000 ? "Đã hết hạn khôi phục" : "Khôi phục ảnh")
        : "Đưa vào Thùng rác"}
    </button>
  </div>
))}
          </div>
        )}
      </section>
    </div>
  );
}