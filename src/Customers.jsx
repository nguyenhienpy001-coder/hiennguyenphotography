
import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });

  async function loadCustomers() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setCustomers(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadCustomers();
  }, []);
  const filteredCustomers = customers.filter(customer => {
  const keyword = searchTerm.toLowerCase().trim();

  return (
    customer.full_name?.toLowerCase().includes(keyword) ||
    customer.phone?.toLowerCase().includes(keyword)
  );
});

  
async function handleAddCustomer(e) {
  e.preventDefault();
  setSaving(true);
  setError("");

  let result;

  if (editingId) {
    result = await supabase
      .from("customers")
      .update(form)
      .eq("id", editingId);
  } else {
    result = await supabase
      .from("customers")
      .insert([form]);
  }

  if (result.error) {
    setError(result.error.message);
  } else {
    setForm({
      full_name: "",
      phone: "",
      email: "",
      address: "",
      notes: ""
    });

    setEditingId(null);
    await loadCustomers();
  }

  setSaving(false);
}


  function handleEditCustomer(customer) {
  setEditingId(customer.id);

  setForm({
    full_name: customer.full_name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
    notes: customer.notes || ""
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function handleDeleteCustomer(customer) {
  const confirmed = window.confirm(
    `Bạn có chắc chắn muốn xóa khách hàng "${customer.full_name}" không?`
  );

  if (!confirmed) return;

  setError("");

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customer.id);

  if (error) {
    setError(error.message);
    return;
  }

  await loadCustomers();
}

  const inputStyle = {
    width: "100%",
    padding: "11px",
    border: "1px solid #dbe2ea",
    borderRadius: "8px",
    boxSizing: "border-box",
    marginTop: "6px",
    fontSize: "14px"
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section className="panel" style={{ padding: 22 }}>
        <h2>Thêm khách hàng mới</h2>

        <form onSubmit={handleAddCustomer}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16
          }}>
            <label>
              Họ và tên *
              <input
                style={inputStyle}
                value={form.full_name}
                onChange={e => setForm({
                  ...form,
                  full_name: e.target.value
                })}
                placeholder="Nhập họ tên khách hàng"
                required
              />
            </label>

            <label>
              Số điện thoại
              <input
                style={inputStyle}
                value={form.phone}
                onChange={e => setForm({
                  ...form,
                  phone: e.target.value
                })}
                placeholder="Nhập số điện thoại"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                style={inputStyle}
                value={form.email}
                onChange={e => setForm({
                  ...form,
                  email: e.target.value
                })}
                placeholder="Nhập email"
              />
            </label>

            <label>
              Địa chỉ
              <input
                style={inputStyle}
                value={form.address}
                onChange={e => setForm({
                  ...form,
                  address: e.target.value
                })}
                placeholder="Nhập địa chỉ"
              />
            </label>
          </div>

          <label style={{ display: "block", marginTop: 16 }}>
            Ghi chú
            <textarea
              style={{ ...inputStyle, minHeight: 75 }}
              value={form.notes}
              onChange={e => setForm({
                ...form,
                notes: e.target.value
              })}
              placeholder="Ghi chú về khách hàng..."
            />
          </label>

          {error && (
            <p style={{ color: "#dc2626" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="primary-button"
            style={{ marginTop: 16 }}
          >
            {saving ? "Đang lưu..." : "Lưu khách hàng"}
          </button>
        </form>
      </section>

      <section className="panel" style={{ padding: 22 }}>
  <h2>Danh sách khách hàng</h2>
  <p>Tổng số khách hàng: {customers.length}</p>

  <input
    style={inputStyle}
    value={searchTerm}
    onChange={e => setSearchTerm(e.target.value)}
    placeholder="Tìm theo tên hoặc số điện thoại..."
  />

        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : customers.length === 0 ? (
          <p>Chưa có khách hàng nào.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left"
            }}>
              <thead>
                <tr>
                  {["Họ tên", "Điện thoại", "Email", "Địa chỉ", "Thao tác"].map(item => (
                    <th key={item} style={{
                      padding: 12,
                      borderBottom: "1px solid #e2e8f0"
                    }}>
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    {[customer.full_name, customer.phone,
  customer.email, customer.address].map((value, i) => (
  <td key={i} style={{
    padding: 12,
    borderBottom: "1px solid #e2e8f0"
  }}>
    {value || "—"}
  </td>
))}

<td style={{
  padding: 12,
  borderBottom: "1px solid #e2e8f0"
}}>
  <button
    type="button"
    onClick={() => handleEditCustomer(customer)}
    className="primary-button"
  >
    Chỉnh sửa
  </button>
  <button
    type="button"
    onClick={() => handleDeleteCustomer(customer)}
    style={{
      marginLeft: 8,
      padding: "8px 12px",
      border: "1px solid #fecaca",
      borderRadius: 8,
      background: "#fef2f2",
      color: "#dc2626",
      cursor: "pointer"
    }}
  >
    Xóa
  </button>

</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
