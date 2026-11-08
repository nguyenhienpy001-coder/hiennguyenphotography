# Hiên Studio Manager — Bản khởi đầu

Đây là bản giao diện React chạy trên máy tính, có responsive cho điện thoại. Dữ liệu trên dashboard hiện là dữ liệu minh họa; chưa lưu dữ liệu thật.

## 1. Cài phần mềm

- Node.js bản LTS: https://nodejs.org/
- Visual Studio Code: https://code.visualstudio.com/

Sau khi cài Node.js, mở Terminal hoặc Command Prompt và kiểm tra:

```bash
node -v
npm -v
```

## 2. Chạy website

Giải nén thư mục, mở thư mục `hien-studio-manager` bằng VS Code.

Trong VS Code chọn Terminal > New Terminal, chạy lần lượt:

```bash
npm install
npm run dev
```

Mở địa chỉ hiện trong Terminal, thường là `http://localhost:5173`.

## 3. Kiểm tra bản build

```bash
npm run build
```

## Lưu ý

- Các mục ở thanh bên hiện chuyển trang mẫu để kiểm tra điều hướng.
- Số liệu dashboard là dữ liệu demo, không phải doanh thu thực tế.
- Bước tiếp theo sẽ xây dựng CRUD lịch hẹn/khách hàng, sau đó kết nối Supabase để đăng nhập và lưu dữ liệu thật.
