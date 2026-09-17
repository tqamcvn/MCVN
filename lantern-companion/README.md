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

Widget độc lập, dùng hai sprite gốc, không cần React/npm. Bấm vào đèn để nhận lời động viên ngẫu nhiên. Lịch cố định 15 phút, luân phiên uống nước, nhắm mắt, nghỉ ngơi, đứng dậy vươn vai; không có cài đặt cho người dùng. Lịch được lưu trên trình duyệt để giữ khi chuyển trang. Chỉ nhắc khi trang đang hiển thị; quay lại sau thời gian dài chỉ nhắc một lần, không dồn thông báo. Lời nhắn tự thu gọn. Không có thông báo khi đóng trình duyệt. Sự kiện hoàn thành từ ứng dụng vẫn hiển thị lời chúc mừng.