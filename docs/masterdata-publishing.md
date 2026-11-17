# Phát hành master tới game server

Khối **Cập nhật master cho server** có tại `/admin/outfits` và `/admin/servers`,
chỉ hiển thị cho quản trị viên. API Account vẫn kiểm tra JWT và quyền admin.

1. Thêm server tại trang Servers nếu chưa có.
2. Chọn **Cấu hình** trong khối master, nhập URL HTTPS của Game kết thúc bằng
   `/internal/masterdata/update`, rồi **Lưu và đồng bộ**. Khóa riêng của server
   phải được vận hành cấu hình trên Account và Game; web không nhận/lưu khóa.
3. Thêm hoặc bật/tắt mẫu trang phục trong trang Outfits. Đây là thay đổi bản nháp.
4. Chọn **Phát hành master** để chốt snapshot mới và xếp hàng cho các server đã
   đăng ký. Theo dõi cột **Đã áp dụng / Mục tiêu**, không chỉ thông báo xếp hàng.
5. **Gửi lại** ở một server chỉ xếp hàng bản đã phát hành mới nhất. Nó không tạo
   phiên bản mới, không phát hành bản nháp và không cập nhật các server khác.

Trạng thái tự đọc lại mỗi 10 giây khi trang đang hiển thị; đây là polling giao diện
quản trị, không phải polling catalog của game. Server offline sẽ chờ worker Account
thử lại. Nút **Tải trạng thái** cho phép kiểm tra ngay. Khi mất phản hồi mutation,
web không tự retry; tải trạng thái trước khi quyết định gửi lại.

## API Account cần triển khai

| Method | Path sau `/api/v1` | Công dụng |
| --- | --- | --- |
| GET | `/admin/masterdata/status` | Trả `latest_revision` và `servers`, gồm callback, revision và trạng thái retry |
| POST | `/admin/masterdata/publish` | Chốt snapshot, xếp hàng toàn bộ target; trả 202 |
| PUT | `/admin/masterdata/servers/{id}` | Lưu `callback_url`, xếp hàng bản hiện hành nếu có |
| POST | `/admin/masterdata/servers/{id}/sync` | Xếp hàng gửi lại bản hiện hành cho một server; trả 202 |

`NEXT_PUBLIC_API_URL` là origin Account (ví dụ `https://account.aocavuive.com`),
không thêm `/api/v1`. Không đưa `MASTERDATA_SECRET` hoặc `MASTERDATA_SERVER_KEYS`
vào biến `NEXT_PUBLIC_*` hay trình duyệt. Worker `php spark masterdata:deliver`
phải được lên lịch trên Account; HTTP 202 không đồng nghĩa worker đã giao xong.

Triển khai Account kèm API trạng thái/gửi lại trước khi deploy web này. Cấu hình
Game và publish lần đầu theo [hướng dẫn backend](../../GolangServer/docs/masterdata-publishing.md).
Khi xóa server bằng API admin hiện tại, Account cũng xóa đăng ký master trong cùng
transaction; không ảnh hưởng dữ liệu nhân vật trên Game server.

## Kiểm tra local

Đã chạy type-check, build Next.js, các case API/DOM tạm cho trạng thái server,
chống click lặp, publish/gửi lại/đăng ký, lỗi xác thực/kết nối và kiểm tra URL.
Fixture PHP/MySQL tách biệt kiểm tra gửi lại không phát hành bản nháp, không đổi
server khác, giữ lease đang chạy và dùng đúng revision hiện hành. Không gửi yêu
cầu cập nhật đến server thật trong quá trình kiểm tra.
