# Bếp nhà Đậu — website công thức đọc-only

Website tĩnh: HTML/CSS/JavaScript đọc `recipes.csv`. Khách truy cập chỉ xem và tìm kiếm công thức; không có chức năng chỉnh sửa trên website.

## Đưa website lên mạng miễn phí bằng GitHub Pages

1. Đăng nhập hoặc tạo tài khoản tại https://github.com
2. Tạo repository mới, ví dụ `bep-nha-dau`.
3. Upload các file trong thư mục này (`index.html`, `style.css`, `app.js`, `recipes.csv`, `README.md`) lên repository.
4. Vào **Settings → Pages**.
5. Trong **Build and deployment**, chọn **Deploy from a branch**; chọn branch `main`, folder `/(root)`, rồi bấm **Save**.
6. Chờ GitHub Pages xuất bản website. Link sẽ có dạng `https://TEN-TAI-KHOAN.github.io/bep-nha-dau/`.

## Cập nhật công thức

1. Sửa file CSV bằng Excel hoặc Google Sheets.
2. Lưu/xuất thành **CSV UTF-8** (nên dùng `CSV UTF-8 (Comma delimited)`).
3. Mở repository trên GitHub, chọn `recipes.csv` → nút bút chì để sửa trực tiếp, hoặc **Add file → Upload files** để tải file CSV mới thay file cũ.
4. Commit changes. Website sẽ tự đọc dữ liệu mới; nếu trình duyệt còn giữ bản cũ, tải lại trang.

## Cấu trúc dữ liệu CSV

Giữ các cột:
`Recipe_ID, Name, Category, Ingredient, Step number, Instruction, Link ảnh`

- Mỗi món dùng một `Recipe_ID` cố định.
- Dòng đầu tiên của món nên có `Name` và `Category`; các dòng tiếp theo cùng món có thể để trống hai cột này.
- Mỗi nguyên liệu một dòng; mỗi bước nấu một dòng.
- Nếu một dòng vừa có nguyên liệu vừa có bước nấu, website sẽ hiển thị cả hai.
- `Link ảnh` có thể là URL ảnh công khai. Ở phiên bản mẫu, ảnh này được dùng làm ảnh đại diện cho món.
- Khi lưu CSV, kiểm tra Excel không đổi tiếng Việt thành lỗi font.

## Quyền riêng tư và quyền chỉnh sửa

Website công khai: bất kỳ ai có link đều có thể xem. Để người khác không sửa dữ liệu, không cấp quyền collaborator vào repository. Nếu repository là public, người khác có thể xem mã nguồn và CSV, nhưng không thể commit thay đổi vào repository của bạn nếu không có quyền. Nếu muốn giữ cả dữ liệu CSV và mã nguồn kín, cần dùng cách triển khai khác có backend hoặc kho dữ liệu riêng.
