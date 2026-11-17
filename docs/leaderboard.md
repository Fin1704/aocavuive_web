# Bảng xếp hạng Sò

Trang chủ và dashboard dùng `GET /api/v1/leaderboard` từ Account.
API chọn tối đa 5 tài khoản theo `user_accounts.shells DESC`, bằng điểm thì
`user_id ASC` để thứ tự ổn định. `experience` và `vip_level` vẫn giữ trong response
cho các consumer cũ, nhưng không quyết định thứ hạng và không được dùng làm điểm
hiển thị trong bảng web. Số Sò được định dạng `vi-VN` và dùng biểu tượng Sò hiện có.

Triển khai Account API trước web. Gói Account mới nhất có thay đổi model và
controller leaderboard; không dùng ZIP cũ vẫn xếp theo EXP. Số dư người chơi không
bị thay đổi bởi API xếp hạng. Fetch và response không cache; danh sách được đọc lại
khi tải trang theo luồng hiện tại.

Đã kiểm tra build Next.js, render DOM (điểm Sò, biểu tượng, số 0), và MySQL tách
biệt (top 5, thứ tự độc lập với EXP, tie-break ổn định, đổi số dư, kiểu JSON và các
field API cũ). Không cập nhật dữ liệu hay triển khai lên hosting trong lượt này.
