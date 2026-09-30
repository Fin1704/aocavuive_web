# Điểm danh Ao Cá

- Khối “Điểm danh hằng ngày” trên `/` cho user đăng nhập: trên mobile nằm ngay dưới tiêu đề Trung tâm sự kiện, trước banner; từ breakpoint `md` nằm sau banner và ngay trước Khám phá. Cũng có trên `/dashboard`.
- Mobile có liên kết “Điểm danh nhận Sò” ở đầu nội dung dẫn tới `/dashboard`; khách chưa đăng nhập được chuyển tới Login. Vùng nội dung có thể co theo chiều rộng/chiều cao màn hình và cuộn tới hết trang.
- Giao diện nền tối cùng trang, không viền/ánh sáng/nền biển, lịch 7 ngày nằm ngang và nút cam phẳng. Icon Sò nhỏ, số dư, combo và kỷ lục được giữ. Phản hồi nhận thưởng chỉ hiện khi API xác nhận `claimed: true`; hỗ trợ reduced motion.
- Đổi ngày theo server, refresh khi trở lại tab và khi tab khác nhận thưởng. Không dùng đồng hồ client để tự cấp quà. Chống bấm lặp, hủy request khi unmount; lỗi mạng cho retry và không tự tăng tiền.
- POST không có body chọn user, reward hay ngày. JWT hết hạn thử refresh một lần, các request đồng thời dùng chung refresh; UI lấy lại hồ sơ vì response refresh của Account không chứa `user`.
- Admin `/admin/users` có số Sò, combo, online gần nhất trong bảng và combo cao nhất/ngày điểm danh trong chi tiết. Online hiển thị giờ Việt Nam, chưa có lịch sử hiển thị “Chưa ghi nhận”.
- Backend phải cập nhật và migrate trước khi dùng. Xem `../AoCaVuiVe-account/docs/daily-check-in.md`.

## Kiểm tra

```powershell
npm.cmd run test:check-in
npm.cmd run test:ocean-intro
npm.cmd run build
```

Kiểm thử DOM/API dùng JSDOM và network mock: số dư/lịch server, submit lặp, kết quả đã nhận, lỗi mạng, refresh token, abort, cập nhật giữa tab, heartbeat theo visibility. Không thay thế kiểm tra hình ảnh trên trình duyệt.

Trong phiên này công cụ trình duyệt không có browser khả dụng, nên chưa xác nhận trực quan desktop/mobile. Chưa triển khai production; local web vẫn sử dụng API được cấu hình sẵn, cần backend mới để điểm danh thật.

Kết quả: 28 kiểm thử frontend (8 điểm danh/API + 20 intro) đạt. Next.js production build, kiểm tra TypeScript và kiểm tra whitespace đạt. Local server đã chạy lại tại `http://127.0.0.1:3105`.
