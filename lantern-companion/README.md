# Đèn nhỏ — widget cho dashboard HTML

Giữ và kéo đèn lồng bằng chuột hoặc cảm ứng để di chuyển trong vùng hiển thị. Vị trí được nhớ bằng localStorage; tự giới hạn trong màn hình khi đổi kích thước cửa sổ. Bấm nhanh để trò chuyện. Khi nút đèn lồng được focus, dùng phím mũi tên để di chuyển 10 px (Shift: 30 px). Khung lời nhắn tự đổi vị trí để nằm trong màn hình.

Mở demo.html để xem thử. Sao chép cả thư mục lantern-companion vào website, thêm trước thẻ đóng body (điều chỉnh đường dẫn theo vị trí trang):

```html
<script src="./lantern-companion/lantern.js" defer></script>
```

Sau khi thao tác hoàn thành thực sự thành công, gọi:

```js
window.LanternCompanion?.celebrate('Bạn đã hoàn thành báo cáo rồi! ✨');
// Hoặc phát sự kiện từ ứng dụng:
window.dispatchEvent(new CustomEvent('lantern:complete', {
  detail: { message: 'Lưu công việc thành công. Giỏi lắm!' }
}));
```

Widget độc lập, dùng hai sprite gốc, không cần React/npm. Nhìn theo chuột, biểu cảm, nhắc nước 45 phút, mắt 20 phút, nghỉ 60 phút; lịch sáng/chiều theo giờ máy, lưu tùy chọn trên trình duyệt. Các con số là mặc định giao diện có thể chỉnh. Hẹn giờ chạy khi trang mở; trang ẩn sẽ không hiện nhắc cho đến khi quay lại. Không có thông báo khi trình duyệt đóng. Mỗi tab có bộ hẹn giờ riêng. Không tự suy đoán việc hoàn thành: cần nối sự kiện thành công của dashboard. Hai khoảng giờ phải nằm trong cùng ngày.
