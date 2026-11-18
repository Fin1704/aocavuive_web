# Quản lý cập nhật game

Đăng nhập tài khoản có role `admin`, mở **Quản trị → Cập nhật game**
(`/admin/client-updates`). Backend dùng `NEXT_PUBLIC_API_URL`, mặc định
`https://account.aocavuive.com`.

1. Trong Godot, dùng plugin Client Update Builder để tạo bản cập nhật đúng
   baseline và hệ điều hành. Giữ `upload.zip` làm bản sao lưu.
2. Trên web chọn Windows, Android hoặc iOS, chọn `upload.zip`, nhập tên gợi nhớ
   nếu cần rồi bấm **Tải lên và phát hành**.
3. Sau khi server kiểm tra toàn bộ hash, nội dung ZIP và chính sách nền tảng,
   bản mới được ghim. Bản trước chuyển xuống **Bản cũ**.
4. Dùng **Đưa lên hiện hành** để khôi phục bản cũ. Hoặc tải lại một `upload.zip`
   đã sao lưu. Không cần tăng hay nhập số phiên bản cập nhật.
5. **Xóa** chỉ có ở lịch sử. Bản đang phát hành không thể bị xóa.

Mỗi nhánh phiên bản `(OS, base_version, engine)` duy trì một bản hiện hành độc lập (hoặc chưa có bản nào), cho phép vận hành song song bản cũ khi phát hành bản mới. Windows, Android và iOS đều hỗ trợ cập nhật đầy đủ asset, scene và script theo cờ cấu hình của client.

Triển khai cả web và backend Account mới trước khi dùng. Backend cần PHP ZIP,
thư mục `writable/client-updates` ghi được, và JWT admin. Không cần migration DB.
Nếu upload lớn, đặt PHP `upload_max_filesize=512M`, `post_max_size=520M`,
`max_execution_time=180`, `max_input_time=180`, và giới hạn request web server/CDN
tương ứng. Trang hiển thị giới hạn PHP backend; proxy có thể đặt giới hạn thấp hơn.
Giới hạn ứng dụng mặc định 512 MiB ở `app/Config/ClientUpdates.php`.

Xóa khỏi danh sách không thu gom object dùng chung hay các tải xuống đang chạy.
Sao lưu nguyên thư mục `writable/client-updates` để giữ lịch sử và bản được ghim.
Sau khi dùng giao diện này, không giải nén thủ công ZIP lên hosting để đổi bản:
con trỏ quản trị là nguồn quyết định bản hiện hành.

Kiểm tra: `node --test tests/client-updates*.test.cjs`, `npx tsc --noEmit`,
`npm run build`. Các kiểm tra UI chạy DOM với dữ liệu giả, không gọi production.
