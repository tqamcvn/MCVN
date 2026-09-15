# Bot Recap riêng cho QA MCVN

Trạng thái: mã và cấu hình đã chuẩn bị, chưa tạo Service Account hoặc triển khai.
Bot ghi bằng Google Service Account, không impersonate tài khoản QA. PIC incharge
vẫn lấy tên QA đã ghi note. Không cần tài khoản Google cá nhân chạy Apps Script.

## Đích và dữ liệu

- File: https://docs.google.com/spreadsheets/d/1rWlf7Zv1X2Cc8-bB7wDr8TcR5RZaxOK4WIgxEvymzLc/edit?gid=891613457
- Tab: `5. Recap Coaching/Refreshing`, gid `891613457`.
- Year, Date, Timeline: thời điểm ghi nhận theo GMT+7, ngày dd-mm-yyyy, giờ HH:mm:ss.
- Week: WEEKNUM(ngày ghi,2), không phải ISO week.
- Session Type: trường QA chọn; bản cũ được map từ loại action nếu xác định được.
- Project=Normal; Topic=1:1; Status=Complete; #Participant=1.
- Detail và Agent list: tên CS; PIC incharge: QA; Recap/Document/Next steps giữ nguyên nội dung.
- Final Result để trống với dòng mới, giữ nguyên với dòng đã có.
- Bỏ demo, sự kiện xóa và history trùng. Bản cũ thiếu ngày giờ/tên/loại buổi được báo bằng event ID, không tự đoán.
- Mỗi ghi nhận một dòng; sửa ghi nhận cập nhật dòng đã ghi. Mã chống trùng nằm trong ghi chú ô Year.
- Tất cả chuỗi được ghi kiểu stringValue; nội dung bắt đầu bằng `=` không chạy thành công thức.

## Các bước kích hoạt

1. Chọn Google Cloud project của tổ chức, bật **Google Sheets API**.
2. Tạo Service Account có ID `qa-recap-bot`, tên `QA Recap Bot`. Không cấp Owner/Editor của Cloud project, không bật domain-wide delegation.
3. Google sẽ cấp email thật theo project, dạng `qa-recap-bot@PROJECT_ID.iam.gserviceaccount.com` (đây chỉ là mẫu, chưa tồn tại).
4. Chia sẻ đúng file Sheet đích cho email bot quyền **Editor**. Nếu Workspace chặn chia sẻ Service Account, nhờ quản trị viên kiểm tra; không đổi Sheet thành public.
5. Tạo khóa JSON của bot và lưu trực tiếp vào secret `GOOGLE_SERVICE_ACCOUNT_JSON` trong repo GitHub **private** dành riêng cho bot. Không dán khóa vào chat, mã nguồn hay repo. Nếu tổ chức cấm khóa Service Account, cần chuyển sang Workload Identity Federation trước khi triển khai, không nới chính sách.
6. Tạo secret `SUPABASE_SERVICE_KEY` bằng khóa backend hiện dùng. Khóa này chỉ ở Secrets của repo bot, không đưa vào trang web. Giới hạn người có quyền sửa workflow/repo.
7. Đưa **nội dung thư mục này** vào root repo bot (gồm thư mục ẩn `.github`). Workflow giả định `bot.py` và `requirements.txt` nằm ở root.
8. Ban đầu chỉ chạy **Actions → Recap bot → Run workflow → dry_run=true**. Lần chạy này đọc dữ liệu và báo số dòng, chưa ghi.
9. Trước khi bật ghi thật, tắt trigger `syncRecapNow`/`setupRecapSync` cũ nếu đã cài. Giữ trigger cập nhật performance và backup khác. Chỉ có một bot được ghi tab recap.
10. Chạy với `dry_run=false`, kiểm tra một bản ghi thật trên Sheet và chạy lại để xác nhận không nhân đôi dòng. Sau đó bật lịch tự động theo hướng dẫn dưới đây.

**Lịch:** workflow có lịch 5 phút nhưng chưa cho chạy tự động. Sau bước 10, đặt
repository variable `RECAP_BOT_ENABLED=true` để bật. Xóa hoặc đặt false để dừng lịch.
GitHub Actions có thể chạy trễ; đây không phải ghi tức thì.
Repo private có thể dùng quota/tính phí Actions tùy gói tài khoản. Chưa phát sinh triển khai hay chi phí từ bộ chuẩn bị này.

Workflow khóa đồng thời một lượt chạy. Không sắp xếp/chèn/xóa dòng bằng tay trong lúc bot ghi;
API Sheet không cung cấp khóa giao dịch chung với thao tác người dùng. Đợt batch ghi dữ liệu và
mã chống trùng cùng nhau để chạy lại sau lỗi không nhân bản dòng. Không xóa ghi chú `CSP_RECAP:`.

## Kiểm thử tại máy

```
python -m venv .venv
# Activate the virtual environment for your OS.
pip install -r requirements.txt
python -m unittest discover -s tests
```

Bot mặc định dry-run khi không đặt DRY_RUN. Chỉ `DRY_RUN=false` mới ghi dữ liệu.
Chưa thể xác nhận quyền Sheet, tên header thực tế, dữ liệu đầu-cuối hoặc danh tính bot
cho đến khi tạo Service Account và chạy tích hợp bằng credentials thật.

## Tài liệu chính thức

- Service Accounts: https://cloud.google.com/iam/docs/service-accounts-create
- Sheets batch updates: https://developers.google.com/workspace/sheets/api/guides/batch
- GitHub schedules: https://docs.github.com/actions/using-workflows/events-that-trigger-workflows#schedule
