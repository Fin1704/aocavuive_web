# Phát hành master trực tiếp

Khối cập nhật master nằm ở `/admin/outfits` và `/admin/servers`.

- Cấu hình: lưu URL HTTPS nhận cập nhật và gửi ngay bản hiện hành nếu có.
- Phát hành master: chốt bản nháp thành phiên bản mới, gửi ngay đến mọi server
  đăng ký và hiển thị số server đã xác nhận cập nhật.
- Gửi lại: gửi ngay phiên bản đã phát hành mới nhất cho riêng một server.
- Server lỗi/offline cần người quản trị bấm Gửi lại sau khi khắc phục.

Không dùng Cron và không tự retry mutation. Khi mất phản hồi hãy tải trạng thái
trước khi gửi lại. Giao diện chỉ đọc trạng thái mỗi 10 giây; Game không polling
catalog. API publish/sync/register trả kết quả `deliveries` trực tiếp, không còn
trả lời chỉ xếp hàng 202. Account gửi kèm snapshot đã ký để Game không phải gọi
ngược về Account trong lúc phát hành. Game chỉ GET snapshot một lần khi khởi chạy.

Cập nhật Account và Game cùng các thay đổi này trước khi dùng web. Giới hạn gửi
trực tiếp là 16 server đăng ký; các yêu cầu HTTPS chạy song song, timeout 15 giây.
Web chờ tối đa 25 giây. Khóa server vẫn nằm riêng trong `.env` Account và cấu hình
Game/Portainer; không đưa vào trình duyệt hay `NEXT_PUBLIC_*`.

Xem [cấu hình backend](../../GolangServer/docs/masterdata-publishing.md).
