# Icon tiền tệ

`src/components/CurrencyIcon.tsx` cấu hình chung ba loại: `gold` (Vàng), `gpoint` (G Point), `so` (Sò).

PNG gốc được sao chép từ `../ao-ca-vui-ve/assets/img/` vào `public/currencies/`, giữ nguyên alpha. Next Image tối ưu ảnh theo kích thước hiển thị, tránh tải PNG gốc lớn cho icon nhỏ.

```tsx
<CurrencyIcon currency='gold' size={24} />
<CurrencyIcon currency='gpoint' size={24} decorative={false} />
<CurrencyIcon currency='so' size={24} />
```

Mặc định icon trang trí cạnh nhãn/số dư; đặt `decorative={false}` khi icon đứng riêng để có tên truy cập.

Vàng dùng ở Header, trang chủ, Dashboard và chi tiết admin. Sò dùng ở điểm danh, lối vào mobile và danh sách/chi tiết admin. G Point đã có asset và cấu hình; API tài khoản hiện chưa khai báo số dư G Point nên chưa thêm số dư vào giao diện.
