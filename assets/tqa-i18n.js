(function () {
  'use strict';

  var LANG_KEY = 'tqa_lang';
  var lang = readLanguage();
  var textSource = new WeakMap();
  var attrSource = new WeakMap();
  var chartSource = new WeakMap();
  var observer = null;

  var EXACT = {
    'TQA MCVN — Đăng nhập': 'TQA MCVN — Sign in',
    'TQA MCVN — Bảng điều khiển': 'TQA MCVN — Dashboard',
    'Đăng nhập': 'Sign in',
    'Đăng nhập bằng email công ty và mật khẩu.': 'Sign in with your company email and password.',
    'Đăng nhập bằng email công ty Shopee của bạn.': 'Use your Shopee company email to sign in.',
    'Email công ty': 'Company email',
    'Mật khẩu': 'Password',
    'Quên mật khẩu?': 'Forgot password?',
    'Đặt mật khẩu': 'Set password',
    'Mật khẩu mới': 'New password',
    'Nhập lại mật khẩu': 'Confirm password',
    'Ít nhất 6 ký tự': 'At least 6 characters',
    'Lưu mật khẩu': 'Save password',
    'Đang đăng nhập…': 'Signing in…',
    'Đang gửi…': 'Sending…',
    'Đang lưu…': 'Saving…',
    'Đã đổi mật khẩu thành công!': 'Password changed successfully!',
    'Không tìm thấy tài khoản với email này.': 'No account was found for this email.',
    'Email hoặc mật khẩu chưa đúng.': 'The email or password is incorrect.',
    'Vui lòng nhập email công ty.': 'Enter your company email.',
    'Vui lòng nhập mật khẩu.': 'Enter your password.',
    'Mật khẩu cần ít nhất 6 ký tự.': 'Password must contain at least 6 characters.',
    'Hai ô mật khẩu chưa khớp.': 'The passwords do not match.',
    'Kiểm tra email': 'Check your email',
    'Mở liên kết trong email để tiếp tục.': 'Open the link in your email to continue.',
    'Gửi liên kết đăng nhập': 'Send sign-in link',
    'Gửi lại liên kết': 'Resend link',
    'Quay lại đăng nhập': 'Back to sign in',

    'Trang chủ': 'Home',
    'Công cụ': 'Tools',
    'Báo cáo CSAT': 'CSAT Reports',
    'Form ẩn danh': 'Anonymous Form',
    'Cài đặt': 'Settings',
    'Cài đặt tài khoản': 'Account Settings',
    'Giao diện': 'Appearance',
    'Ngôn ngữ': 'Language',
    'Chế độ hiển thị': 'Display mode',
    'Sáng': 'Light',
    'Tối': 'Dark',
    'Hồ sơ': 'Profile',
    'Đổi ảnh đại diện': 'Change avatar',
    'Ảnh vuông là đẹp nhất.': 'Square images work best.',
    'Tên hiển thị': 'Display name',
    'Lưu hồ sơ': 'Save profile',
    'Đổi mật khẩu': 'Change password',
    'Đăng xuất': 'Sign out',
    'Thu gọn thanh menu': 'Collapse sidebar',
    'Mở rộng thanh menu': 'Expand sidebar',
    'Tổng quan CSAT': 'CSAT Overview',
    'Tải lại': 'Reload',
    'Mở tab mới': 'Open in new tab',
    'Đang phát triển': 'In development',
    'Tính năng đang phát triển': 'This feature is under development',
    'Chào mừng Quốc khánh': 'Vietnam National Day',
    'Chủ tịch Hồ Chí Minh': 'President Ho Chi Minh',
    'cập nhật': 'updated',
    'đệm': 'cached',

    'Đang tải dữ liệu…': 'Loading data…',
    'Đang tải data…': 'Loading data…',
    'Đang tải...': 'Loading...',
    'Đang xử lý…': 'Processing…',
    'Đang cập nhật…': 'Updating…',
    'Cập nhật ngay': 'Update now',
    'Cập nhật': 'Update',
    'Dữ liệu': 'Data',
    'Nguồn dữ liệu': 'Data source',
    'Dữ liệu đầu vào': 'Input data',
    'Không có dữ liệu': 'No data',
    'Chưa có dữ liệu': 'No data yet',
    'Không tìm thấy dữ liệu': 'No data found',
    'Không có kết quả phù hợp': 'No matching results',
    'Tất cả': 'All',
    'Tất cả tháng': 'All months',
    'Tất cả tuần': 'All weeks',
    'Tất cả Queue': 'All queues',
    'Tất cả Batch': 'All batches',
    'Tháng': 'Month',
    'Tuần': 'Week',
    'Ngày': 'Day',
    'Hôm nay': 'Today',
    'Chi tiết': 'Details',
    'Đóng': 'Close',
    'Lưu': 'Save',
    'Hủy': 'Cancel',
    'Xác nhận': 'Confirm',
    'Tìm kiếm': 'Search',
    'Bộ lọc': 'Filters',
    'Trạng thái': 'Status',
    'Ghi chú': 'Notes',
    'Hành động': 'Action',
    'Kết quả': 'Result',
    'Mục tiêu': 'Target',
    'Hiện tại': 'Current',
    'So với tuần trước': 'vs previous week',
    'So với tháng trước': 'vs previous month',
    'Tăng': 'Increase',
    'Giảm': 'Decrease',
    'Không đổi': 'No change',
    'Cải thiện': 'Improved',
    'Xấu đi': 'Declined',
    'Ổn định': 'Stable',
    'Tổng': 'Total',
    'Tổng cộng': 'Total',
    'Tỷ lệ': 'Rate',
    'Số lượng': 'Count',
    'Nhân sự': 'Headcount',
    'Nhân viên': 'Agent',
    'Vai trò': 'Role',
    'Tên': 'Name',
    'Email': 'Email',
    'Team': 'Team',
    'Queue': 'Queue',
    'Agent': 'Agent',

    '⬇ Tải file (CSV)': '⬇ Download CSV',
    'Tải file (CSV)': 'Download CSV',
    'Tải Excel': 'Download Excel',
    'Tải xuống': 'Download',
    'Sao chép': 'Copy',
    'Copy toàn bộ': 'Copy all',
    'Đã copy!': 'Copied!',
    'Chuyển sáng/tối': 'Switch light/dark mode',
    'Tìm agent...': 'Search agents...',
    '🎯 Coaching Priority tuần này': '🎯 Coaching priorities this week',
    'Ai cần coach · vì sao · ZTP xu hướng': 'Who needs coaching · why · ZTP trend',
    'Vì sao (lỗi nhiều nhất)': 'Why (most frequent issue)',
    'Ưu tiên': 'Priority',
    'Không có agent nào cần coaching 🎉': 'No agents need coaching 🎉',
    'Dựa trên qa_comment KB code': 'Based on qa_comment KB codes',
    'Vi phạm ZTP nhiều nhất': 'Most ZTP violations',
    'Pass = vi phạm': 'Pass = violation',
    'Pass = vi phạm | Fail = không vi phạm': 'Pass = violation | Fail = no violation',
    'Vi phạm ghi nhận': 'Recorded violations',
    '(Pass = vi phạm)': '(Pass = violation)',
    'Không vi phạm': 'No violation',
    'Hiệu suất Agent': 'Agent performance',
    'Bảng xếp hạng': 'Ranking',
    'Điểm trung bình': 'Average score',
    'Số case': 'Cases',
    'Lỗi nhiều nhất': 'Top issue',
    'Xu hướng': 'Trend',

    'Repeated Agent': 'Repeated Agent',
    'Hướng dẫn sử dụng': 'User guide',
    'Ẩn hướng dẫn': 'Hide guide',
    'Hiện hướng dẫn': 'Show guide',
    'Lưu & Tải data': 'Save & load data',
    'Đang tải data từ Google Sheet…': 'Loading data from Google Sheets…',
    'Tải lại data từ Google Sheet': 'Reload data from Google Sheets',
    'tuần hiện tại': 'current week',
    'Tăng WoW': 'WoW increase',
    'Giảm WoW': 'WoW decrease',
    'Lần 2+': '2nd time+',
    'Exit tuần trước': 'Exited last week',
    'Danh sách Repeated': 'Repeated list',
    'Bảng tổng hợp chỉ số': 'Metrics summary',
    'Agent mới': 'New agents',
    'Agent đã thoát': 'Exited agents',
    'Số lần lặp': 'Repeat count',
    'Lần xuất hiện đầu': 'First appearance',
    'Lần xuất hiện gần nhất': 'Most recent appearance',
    'Chưa có data. Hãy tải data từ Google Sheet.': 'No data yet. Load data from Google Sheets.',

    'Báo cáo vấn đề — QA Team': 'Issue Report — QA Team',
    'Ơ có người mới! Mình là Bé lửa.': 'Oh, someone new! I’m Little Flame.',
    'Chào mừng bạn': 'Welcome',
    'Bỏ qua': 'Skip',
    'Bắt đầu': 'Get started',
    'Thấy gì thì kể đi': 'Tell us what you noticed',
    'Chọn team': 'Select a team',
    'Vui lòng chọn team': 'Please select a team',
    'Gửi ẩn danh': 'Submit anonymously',
    'Ẩn danh': 'Anonymous',
    'Không ẩn danh': 'Not anonymous',
    'Chọn loại vấn đề': 'Select issue type',
    'Nội dung báo cáo': 'Report details',
    'Tải file lên': 'Upload files',
    'Xem lại': 'Review',
    'Gửi báo cáo': 'Submit report',
    'Đang gửi báo cáo…': 'Submitting report…',
    'Gửi thành công!': 'Submitted successfully!',
    'Gửi thất bại': 'Submission failed',
    'Cảm ơn bạn đã chia sẻ.': 'Thank you for sharing.',
    'Báo cáo của bạn hoàn toàn ẩn danh.': 'Your report is completely anonymous.',
    'Danh tính của bạn sẽ không được lưu.': 'Your identity will not be stored.',
    'Mô tả chi tiết vấn đề bạn gặp phải...': 'Describe the issue in detail...',
    'Kéo thả file vào đây hoặc bấm để chọn': 'Drag files here or click to browse',

    'HC hiện tại': 'Current headcount',
    'Tổng HC': 'Total HC',
    'Không tính': 'Excluded',
    'Thay đổi nhân sự': 'Headcount changes',
    'Ai vào, ai ra': 'Joiners and leavers',
    'Sắp nghỉ': 'Upcoming leavers',
    'Mới vào': 'New joiners',
    'Newbie theo tháng': 'Newbies by month',
    'Click header để sort': 'Click a header to sort',
    'CSAT × HC theo Team / Queue': 'CSAT × HC by Team / Queue',
    'Ngày vào': 'Join date',
    'Ngày nghỉ': 'Last working day',
    'Thâm niên': 'Tenure',
    'Đang làm việc': 'Active',
    'Đã nghỉ': 'Left',
    'Danh sách nhân sự': 'Headcount list',
    'Cơ cấu nhân sự': 'Headcount structure',
    'Theo team': 'By team',
    'Theo vị trí': 'By position',

    'Chat Log Part-time': 'Part-time Chat Log',
    'Báo cáo tổng quan': 'Overview report',
    'Báo cáo chi tiết': 'Detailed report',
    'Phân tích theo tháng': 'Monthly analysis',
    'Phân tích theo tuần': 'Weekly analysis',
    'Phân tích theo Queue': 'Queue analysis',
    'Phân tích theo Batch': 'Batch analysis',
    'Kế hoạch hành động': 'Action plan',
    'Điểm nổi bật': 'Highlights',
    'Cần chú ý': 'Needs attention',
    'Đề xuất': 'Recommendations',
    'Tổng Agent': 'Total agents',
    'Tổng Chat': 'Total chats',
    'Tổng đánh giá': 'Total ratings',
    'Tỷ lệ Good': 'Good rate',
    'Tỷ lệ Bad': 'Bad rate',
    'Hiệu suất theo Queue': 'Performance by queue',
    'Hiệu suất theo Batch': 'Performance by batch',
    'Xem chi tiết': 'View details',

    'CSAT Team Call': 'Team Call CSAT',
    'Hệ thống theo dõi CSAT Team Call': 'Team Call CSAT Monitoring System',
    'Tổng quan': 'Overview',
    'Theo tháng': 'By month',
    'Theo tuần': 'By week',
    'Theo ngày': 'By day',
    'Cảnh báo': 'Alerts',
    'Dự báo': 'Forecast',
    'Xếp hạng': 'Ranking',
    'Top cải thiện': 'Most improved',
    'Top cần chú ý': 'Needs attention',
    'Chỉ tiêu': 'Target',
    'Thực tế': 'Actual',
    'Chênh lệch': 'Variance',
    'Đạt mục tiêu': 'On target',
    'Chưa đạt mục tiêu': 'Below target',
    'Tỷ lệ phản hồi': 'Response rate',
    'Good rating': 'Good ratings',
    'Bad rating': 'Bad ratings',
    'Đã gửi link đăng nhập! Mở email và bấm vào liên kết.': 'Sign-in link sent! Open your email and click the link.',
    'Đã đăng nhập. Đang chuyển tới dashboard...': 'Signed in. Redirecting to the dashboard...',
    'Tính năng này đang được phát triển.': 'This feature is under development.',
    'Chọn ngôn ngữ và chế độ hiển thị phù hợp với bạn.': 'Choose your preferred language and display mode.',
    'Áp dụng cho dashboard và thanh menu.': 'Applies to the dashboard and sidebar.',
    'Đồng bộ giao diện sáng/tối với các tool.': 'Sync light/dark mode with all tools.',
    'Đổi ảnh đại diện và tên hiển thị của bạn.': 'Change your avatar and display name.',
    'Nhập mật khẩu mới nếu bạn muốn thay mật khẩu mặc định. Không đổi cũng không sao.': 'Enter a new password if you want to replace the default one. This is optional.',
    'Paste data từ Google Sheets vào đây · Dashboard tự động tính toán khi bấm Parse & Apply': 'Paste data from Google Sheets here · The dashboard calculates automatically when you click Parse & Apply',
    'Chưa có data. Paste và Parse để bắt đầu.': 'No data yet. Paste and parse to get started.',
    'Format: Tab-separated (copy thẳng từ Google Sheets). Cần có header row.': 'Format: tab-separated (copy directly from Google Sheets). A header row is required.',
    '⟳ Kéo Agent List': '⟳ Pull Agent List',
    'Kéo trực tiếp vùng A6:M sheet "3. Agent list Weekly" (cần deploy Apps Script — xem hướng dẫn). URL dùng chung cho cả File 2, chỉ lưu trên trình duyệt này.': 'Pull range A6:M directly from the "3. Agent list Weekly" sheet (Apps Script deployment required — see the guide). The same URL is used for File 2 and is stored only in this browser.',
    'Format: Tab-separated. Bao gồm header row có ngày (7/13/2026, 7/6/2026...) để xác định tuần.': 'Format: tab-separated. Include the header row with dates (7/13/2026, 7/6/2026...) to identify each week.',
    '⟳ Kéo CSAT Weekly': '⟳ Pull CSAT Weekly',
    'Dùng chung URL Web App đã nhập ở File 1 · vùng C1:S tab "CSAT_Weekly" (gồm cả dòng ngày & W29/W28…)': 'Uses the Web App URL entered for File 1 · range C1:S in the "CSAT_Weekly" tab (including date and W29/W28 rows)',
    'Lưu ý quan trọng: Mỗi khi muốn nhập data mới cho tuần tiếp theo, cần F5 (reload trang) trước để reset toàn bộ trạng thái. Dashboard không lưu data giữa các phiên.': 'Important: Before entering data for a new week, press F5 (reload) to reset all state. The dashboard does not retain data between sessions.',
    'Hướng dẫn sử dụng — Dành cho người mới': 'User guide — For new users',
    'QUICKSTART — CHẠY THỬ NGAY': 'QUICK START — TRY IT NOW',
    'Nếu chưa có data thật, bấm Load Sample Data (W28) ở trên → rồi bấm Parse & Apply → Dashboard sẽ render ngay với data mẫu W28.': 'If you do not have real data yet, click Load Sample Data (W28) above → then click Parse & Apply → the dashboard will immediately render the W28 sample data.',
    'QUY TRÌNH NHẬP DATA THỰC MỖI TUẦN': 'WEEKLY REAL-DATA WORKFLOW',
    'Bước 1 — File 1: Agent List Weekly': 'Step 1 — File 1: Agent List Weekly',
    'Click vào ô A1 (cột Week)': 'Click cell A1 (Week column)',
    'Bôi đen toàn bộ vùng data từ A1 đến M cuối': 'Select the entire data range from A1 to the last cell in column M',
    '(Ctrl+Shift+End để chọn đến ô cuối cùng)': '(Use Ctrl+Shift+End to select through the final cell)',
    'Ctrl+C để copy': 'Press Ctrl+C to copy',
    'Paste vào ô bên trái trong trang này': 'Paste into the left-hand field on this page',
    'Script chỉ lấy dòng có cột Repeated = số (0, 1, 2, 3).': 'The script only reads rows where Repeated is a number (0, 1, 2, 3).',
    'Dòng có Repeated = "-" sẽ tự bỏ qua.': 'Rows where Repeated = "-" are skipped automatically.',
    'Nên paste nhiều tuần để có Trend chart.': 'Paste multiple weeks to produce a trend chart.',
    'Bước 2 — File 2: CSAT Weekly': 'Step 2 — File 2: CSAT Weekly',
    'Cùng file Sheets → sheet CSAT_Weekly': 'In the same Sheets file → open the CSAT_Weekly sheet',
    'Click vào ô C1 (cột Agent name)': 'Click cell C1 (Agent name column)',
    'Bôi đen từ C1 đến S cuối': 'Select from C1 to the last cell in column S',
    '(Bao gồm cả dòng header ngày tháng và dòng W29/W28...)': '(Include the date header row and W29/W28 rows...)',
    'Paste vào ô bên phải trong trang này': 'Paste into the right-hand field on this page',
    'Script tự detect dòng chứa ngày (7/13/2026...) để xác định tuần.': 'The script detects the row containing dates (7/13/2026...) to identify each week.',
    'File 2 có thể paste không cần File 1 (dùng riêng cho tab History).': 'File 2 can be pasted without File 1 (for the History tab only).',
    'BƯỚC 3 — PARSE & XEM KẾT QUẢ': 'STEP 3 — PARSE & VIEW RESULTS',
    'Bấm nút xanh để parse. Status bar sẽ hiển thị số rows đã đọc được. Nếu lỗi sẽ thấy thông báo đỏ kèm nguyên nhân.': 'Click the blue button to parse. The status bar shows how many rows were read. Errors appear in red with the reason.',
    'Sau khi parse thành công, chuyển sang tab Dashboard để xem KPI, chart, và bảng agent detail. Có thể nhập Root Cause trực tiếp vào bảng.': 'After parsing succeeds, open the Dashboard tab to view KPIs, charts, and the agent details table. You can enter Root Cause directly in the table.',
    'Tab Report auto-generate text theo format chuẩn IH. Có nút Copy từng section hoặc Copy toàn bộ để paste vào chat/email.': 'The Report tab generates text in the standard IH format. Copy individual sections or copy everything for chat/email.',
    'Week mới: F5 trang trước khi paste data mới. Data chỉ tồn tại trong phiên làm việc hiện tại, đóng tab là mất.': 'New week: press F5 before pasting new data. Data lasts only for the current session and is cleared when the tab closes.',
    'Nếu lâu không hiện, bấm nút ⟳ trên thanh menu (cần đăng nhập tài khoản Shopee).': 'If it takes too long, click ⟳ in the menu bar (Shopee account sign-in required).',
    'Chưa có data CSAT Weekly': 'No CSAT Weekly data yet',
    'Chưa có data CSAT Weekly.': 'No CSAT Weekly data yet.',
    'Chưa có data.': 'No data yet.',
    'Nhập data và Parse để generate report.': 'Enter data and click Parse to generate the report.',
    'Form này giúp bạn kể những điều không ổn trong quá trình QA. Bé lửa dẫn bạn qua từng phần nhé.': 'This form helps you report anything that does not feel right in the QA process. Little Flame will guide you through each step.',
    'Chỉ MNG QA mới đọc được — bảo mật hoàn toàn. Thấy mà không nói mới là có vấn đề đó.': 'Only QA management can read this — fully confidential. If something feels wrong, speak up.',
    'Bạn thuộc team nào?': 'Which team are you on?',
    'Bí mật': 'Confidential',
    'Please select team của bạn trước khi tiếp tục.': 'Please select your team before continuing.',
    'Tên bạn không xuất hiện ở đâu hết': 'Your name will not appear anywhere',
    'Bạn muốn kể chuyện kiểu nào?': 'How would you like to report it?',
    'Kể tự nhiên': 'Tell it naturally',
    'Gõ hoặc nói thoải mái như nhắn tin. Bé Lửa tự sắp xếp lại cho bạn xem.': 'Type or speak freely as if you were chatting. Little Flame will organize it for your review.',
    'Điền từng bước': 'Fill it out step by step',
    'Chọn loại vấn đề rồi mô tả chi tiết.': 'Select an issue type, then describe it in detail.',
    '🎤 Nói thay vì gõ': '🎤 Speak instead of typing',
    '📎 Ảnh / file bằng chứng (nếu có)': '📎 Evidence images/files (optional)',
    'Thêm': 'Add',
    '📁 Bấm để chọn file — hoặc dán ảnh (Ctrl+V)': '📁 Click to choose a file — or paste an image (Ctrl+V)',
    'Tối đa 5MB/ảnh': 'Maximum 5 MB per image',
    '💡 Kể xong bấm nút bên dưới — Bé Lửa sẽ tự sắp xếp lại thành từng mục để bạn xem lại và chỉnh trước khi gửi. Không lo nhấn nhầm.': '💡 When you finish, click below. Little Flame will organize everything into sections for you to review and edit before submitting.',
    'Xem lại trước khi gửi →': 'Review before submitting →',
    'Chuyện gì đang xảy ra?': 'What is happening?',
    '— Chọn loại vấn đề —': '— Select issue type —',
    'Hành vi': 'Behavior',
    'Kỹ năng': 'Skills',
    'Khác': 'Other',
    'Kể thêm cho mình nghe': 'Tell me more',
    'Ảnh hoặc file bằng chứng (nếu có)': 'Evidence images or files (optional)',
    'Xem lại trước khi gửi': 'Review before submitting',
    'Mình đã sắp xếp lại — bạn xem qua và chỉnh nếu cần': 'I organized it for you — review and edit if needed',
    'Sửa lại Gửi cho MNG QA': 'Edit Submit to QA management',
    '1 — HC hiện tại': '1 — Current headcount',
    '■ Working   ■ Training   ■ Pending   ■ Long Leave (không tính HC)': '■ Working   ■ Training   ■ Pending   ■ Long Leave (excluded from HC)',
    'Không tính: Long-term leave, Stopped': 'Excluded: Long-term leave, Stopped',
    '2 — Thay đổi so với previous week': '2 — Changes vs previous week',
    '3 — Ai vào, ai ra': '3 — Joiners and leavers',
    'Sắp nghỉ — LWD (Báo IH) —': 'Upcoming leavers — LWD (IH notice) —',
    'Mới vào — 4 tuần gần nhất —': 'New joiners — Last 4 weeks —',
    'New — mới vào trong tháng': 'New — Joined this month',
    'Total — CS 0–2 tháng': 'Total — CS with 0–2 months tenure',
    'LWD 1–2 tháng': 'LWD in 1–2 months',
    'Click card để xem chi tiết agents': 'Click a card to view agent details',
    'Volume = số agent · % HC = tỷ lệ agent active · CSAT = good/(good+bad)': 'Volume = agent count · % HC = active agent rate · CSAT = good/(good+bad)',
    'Dán URL Web App (…/exec) để trang lấy data tự động.': 'Paste the Web App URL (…/exec) so the page can load data automatically.',
    'URL sẽ được lưu trên trình duyệt này. Để tất cả mọi người thấy data, hãy gắn cứng URL vào file (nhờ dev cập nhật).': 'The URL is saved in this browser. To make the data available to everyone, configure the URL in the source file.',
    'Bộ lọc:': 'Filters:',
    'Tất cả Tháng': 'All months',
    'Tất cả Tuần': 'All weeks',
    'Tất cả Queue (Buyer & Seller)': 'All queues (Buyer & Seller)',
    'Total lượt chat được xử lý': 'Total chats handled',
    'Tỷ Lệ Good': 'Good rate',
    'Tỷ Lệ Bad': 'Bad rate',
    'Công thức: Good / (Good + Bad)': 'Formula: Good / (Good + Bad)',
    'Số CS Hiển Thị': 'CS displayed',
    'Theo bộ lọc hiện tại': 'Based on current filters',
    '1. Tổng Quan Project 2. Performance theo Batch 3. Drill-down Danh Sách CS 4. Weekly/Monthly Review': '1. Project overview 2. Performance by batch 3. CS list drill-down 4. Weekly/monthly review',
    'Số Lượt Good': 'Good ratings',
    'Xu hướng Sản Lượng & CSAT theo Tuần': 'Weekly volume & CSAT trend',
    'Phân Bổ Performance Tier CS': 'CS performance tier distribution',
    'So Sánh CSAT & Volume giữa các Batch': 'CSAT & volume comparison across batches',
    'Theo dõi hiệu quả đào tạo từ Batch K167 đến K203': 'Track training effectiveness from Batch K167 to K203',
    'Bảng Chi Tiết Tổng Quan Theo Batch': 'Batch overview details',
    'Khung Thời Gian (Start - End)': 'Time range (Start - End)',
    'Ngày Online Chat': 'Chat go-live date',
    'Số CS Phụ Trách': 'Assigned CS',
    'Đánh Giá Batch': 'Batch assessment',
    'Danh Sách CS Chat Log Parttime': 'Part-time Chat Log CS list',
    'Họ và Tên CS': 'CS full name',
    'Lượt Good': 'Good ratings',
    'Lượt Bad': 'Bad ratings',
    'Phân Loại': 'Classification',
    'Thao Tác': 'Actions',
    'Báo Cáo Hiệu Quả Chat Log Parttime': 'Part-time Chat Log performance report',
    'Nội dung tổng hợp tự động cho buổi họp đánh giá định kỳ Team Leads & Operations': 'Automatically generated summary for periodic Team Leads & Operations reviews',
    'Thời gian báo cáo': 'Reporting period',
    'Điểm Sáng Performance': 'Performance highlights',
    'Queue Buyer duy trì tỷ lệ CSAT ổn định ở mức cao.': 'Buyer Queue maintains a consistently high CSAT rate.',
    'Các Batch mới (K194, K203) hòa nhập nhanh sau thời gian Online Date.': 'New batches (K194, K203) ramped up quickly after their online date.',
    'Count CS đạt Tier Top (≥88%) chiếm tỷ trọng lớn.': 'A large share of CS achieved the Top tier (≥88%).',
    'Điểm Cần Chú Ý': 'Needs attention',
    'Queue Seller phát sinh một số case Bad liên quan đến quy trình xử lý đơn.': 'Seller Queue has some Bad cases related to order-handling processes.',
    'Cần rà soát nhóm CS thuộc Tier Low để lên kế hoạch coaching 1-on-1.': 'Review Low-tier CS and create a 1-on-1 coaching plan.',
    'Hành Động Đề Xuất (Action Plan)': 'Recommended actions (Action Plan)',
    'TLs tiến hành audit ngẫu nhiên 5 chat/tuần với các bạn Tier Low.': 'TLs should audit five random chats per week for Low-tier staff.',
    'Tổ chức refresh training quy trình Seller Chat vào giữa tháng.': 'Run a Seller Chat process refresher in the middle of the month.',
    'Tuyên dương và khen thưởng Top Performers của tháng.': 'Recognize and reward the month’s top performers.',
    'Nhóm CS Cần Kèm Cặp (Coaching)': 'CS requiring coaching',
    'Batch Đào Tạo': 'Training batch',
    'Đánh Giá Performance & Đề Xuất': 'Performance assessment & recommendations',
    'Nhân sự đạt hiệu suất tốt, duy trì thái độ giao tiếp chuẩn mực và xử lý thắc mắc người dùng nhanh chóng.': 'The employee performs well, communicates professionally, and resolves user questions quickly.',
    'Đóng Modal': 'Close modal',
    'Hệ thống Phân tích CSAT & Alert Good Thiếu (Target ≥ 96%)': 'CSAT Analysis & Missing Good Alert System (Target ≥ 96%)',
    'BỘ LỌC DỮ LIỆU': 'DATA FILTERS',
    'Đặt lại': 'Reset',
    'Tất cả QA': 'All QA',
    'Tất cả TL': 'All TLs',
    'Tất cả Project': 'All projects',
    'Tất cả Channel': 'All channels',
    'Tất cả thời gian': 'All time',
    'Cần thêm lượt Good để đạt target': 'Additional Good ratings needed to reach target',
    'Total Đánh giá (Rated)': 'Total ratings',
    '1. Tổng Quan & Cảnh Báo CSAT Drop 2. Chi Tiết CS Tham Gia Project 3. Bảng Xếp Hạng Agent Chi Tiết': '1. Overview & CSAT drop alerts 2. CS project participation details 3. Detailed agent ranking',
    'CẢNH BÁO CSAT DROP & GOOD THIẾU': 'CSAT DROP & MISSING GOOD ALERTS',
    'Nhóm / Nhân sự có CSAT thấp (< 96%) và số lượt Good thiếu cao nhất': 'Groups/employees with low CSAT (<96%) and the largest Good-rating shortfall',
    'Tên / Đối tượng': 'Name / entity',
    'Phân loại / Role': 'Classification / role',
    'Good Thiếu (Target 96%)': 'Missing Good (96% target)',
    'Mức độ Alert': 'Alert level',
    'CSAT % Theo Channel (Kênh)': 'CSAT % by channel',
    'Thống kê CS theo số lượng Project tham gia & so sánh hiệu suất CSAT.': 'CS distribution by project participation count and CSAT performance comparison.',
    'Total số Project đang chạy: 3 Projects': 'Total active projects: 3',
    'CS Không tham gia Project: 0 CS': 'CS not participating in a project: 0',
    'Bảng bên dưới so sánh **CSAT của CS trong Project** so với **CSAT Overall** của chính CS đó để đánh giá sức ảnh hưởng của Project.': 'The table below compares each CS’s project CSAT with their overall CSAT to assess project impact.',
    'BẢNG PHÂN TÍCH CHI TIẾT CS & SO SÁNH CSAT PROJECT VS OVERALL': 'DETAILED CS ANALYSIS & PROJECT VS OVERALL CSAT COMPARISON',
    'Details từng CS, số lượng Project tham gia, CSAT từng Project & Chênh lệch (+/-) so với Overall CSAT': 'CS details, number of projects, CSAT by project, and variance (+/-) versus overall CSAT',
    'Tên CS Agent': 'CS agent name',
    'Số Project Tham Gia': 'Projects joined',
    'Chi Tiết Project Tham Gia': 'Project participation details',
    'CSAT trong Project': 'CSAT in project',
    'CSAT Overall (Toàn Bộ)': 'Overall CSAT',
    'So Sánh với Overall': 'Comparison with overall',
    'BẢNG XẾP HẠNG HIỆU SUẤT CSAT THEO AGENT': 'AGENT CSAT PERFORMANCE RANKING',
    'Sắp xếp theo thứ tự CSAT từ Cao → Thấp, kèm tính toán lượt Good thiếu theo target 96%': 'Sorted by CSAT from high → low, with missing Good ratings calculated against the 96% target',
    'Hạng': 'Rank',
    'Quickstart — Chạy thử ngay': 'Quick start — Try it now',
    'Quy trình nhập data thực mỗi tuần': 'Weekly real-data workflow',
    'Bước 3 — Parse & xem kết quả': 'Step 3 — Parse & view results',
    'Vui lòng chọn team của bạn trước khi tiếp tục.': 'Please select your team before continuing.',
    'Tổng lượt chat được xử lý': 'Total chats handled',
    'Số lượng CS đạt Tier Top (≥88%) chiếm tỷ trọng lớn.': 'A large share of CS achieved the Top tier (≥88%).',
    'Tổng Đánh giá (Rated)': 'Total ratings',
    'Tổng số Project đang chạy:': 'Total active projects:',
    'Chi tiết từng CS, số lượng Project tham gia, CSAT từng Project & Chênh lệch (+/-) so với Overall CSAT': 'CS details, number of projects, CSAT by project, and variance (+/-) versus overall CSAT',
    'này': 'this',
    '⚠ Tuần mới:': '⚠ New week:',
    'Tuần mới:': 'New week:'
  };

  var REPLACEMENTS = [
    [/^Lỗi:\s*/i, 'Error: '],
    [/^Cập nhật lần cuối:\s*/i, 'Last updated: '],
    [/^Cập nhật:\s*/i, 'Updated: '],
    [/^Đang hiển thị:\s*/i, 'Showing: '],
    [/^Tìm thấy\s+(\d+)\s+kết quả/i, 'Found $1 results'],
    [/^(\d+)\s+người$/i, '$1 people'],
    [/^(\d+)\s+nhân sự$/i, '$1 employees'],
    [/^(\d+)\s+agent$/i, '$1 agents'],
    [/^(\d+)\s+agents$/i, '$1 agents'],
    [/^(\d+)\s+case$/i, '$1 cases'],
    [/^(\d+)\s+lượt Good$/i, '$1 Good ratings'],
    [/^(\d+)\s+lượt Bad$/i, '$1 Bad ratings'],
    [/^Tháng\s+(\d{1,2})\/(\d{4})$/i, 'Month $1/$2'],
    [/^Tuần\s+(.+)$/i, 'Week $1'],
    [/^Danh sách\s*\((\d+)\)$/i, 'List ($1)'],
    [/^Tổng\s+(.+)$/i, 'Total $1'],
    [/^Lý do:\s*(.+)$/i, 'Reason: $1'],
    [/^Không có dữ liệu cho\s+(.+)$/i, 'No data for $1'],
    [/^Chưa có dữ liệu\.?$/i, 'No data yet.'],
    [/^Click để xem chi tiết\s*→?$/i, 'Click to view details →'],
    [/^Bấm để xem chi tiết\s*→?$/i, 'Click to view details →'],
    [/^Đã cập nhật lúc\s+(.+)$/i, 'Updated at $1'],
    [/^Dữ liệu đã lưu lúc\s+(.+)$/i, 'Data saved at $1'],
    [/^Không thể tải dữ liệu[.!]?$/i, 'Unable to load data.'],
    [/^Vui lòng thử lại[.!]?$/i, 'Please try again.'],
    [/^Không tìm thấy\s+(.+)$/i, '$1 not found'],
    [/^Đang tải\s+(.+)$/i, 'Loading $1'],
    [/^Đang xử lý\s+(.+)$/i, 'Processing $1'],
    [/^Đang tạo\s+(.+)$/i, 'Creating $1'],
    [/^Đang gửi\s+(.+)$/i, 'Sending $1'],
    [/^Đang lưu\s+(.+)$/i, 'Saving $1'],
    [/^Đang cập nhật\s+(.+)$/i, 'Updating $1']
  ];

  var PHRASES = [
    ['Tính năng này', 'This feature'],
    ['Đăng nhập bằng', 'Sign in with'],
    ['email công ty Shopee', 'your Shopee company email'],
    ['của bạn.', ''],
    ['đang được phát triển.', 'is under development.'],
    ['Paste data từ Google Sheets vào đây', 'Paste data from Google Sheets here'],
    ['Dashboard tự động tính toán khi bấm', 'The dashboard calculates automatically when you click'],
    ['Lưu ý quan trọng:', 'Important:'],
    ['Mỗi khi muốn nhập data mới cho tuần tiếp theo, cần', 'Before entering data for a new week,'],
    ['trước để reset toàn bộ trạng thái. Dashboard không lưu data giữa các phiên.', 'to reset all state. The dashboard does not retain data between sessions.'],
    ['QUICKSTART — CHẠY THỬ NGAY', 'QUICK START — TRY IT NOW'],
    ['Nếu chưa có data thật, bấm', 'If you do not have real data yet, click'],
    ['ở trên → rồi bấm', 'above → then click'],
    ['Dashboard sẽ render ngay với data mẫu W28.', 'The dashboard will immediately render the W28 sample data.'],
    ['QUY TRÌNH NHẬP DATA THỰC MỖI TUẦN', 'WEEKLY REAL-DATA WORKFLOW'],
    ['Click vào ô', 'Click cell'],
    ['Bôi đen toàn bộ vùng data từ', 'Select the entire data range from'],
    ['Bôi đen từ', 'Select from'],
    ['A1 đến M cuối', 'A1 to the last cell in column M'],
    ['C1 đến S cuối', 'C1 to the last cell in column S'],
    ['đến ô cuối cùng', 'through the final cell'],
    ['để copy', 'to copy'],
    ['Paste vào ô', 'Paste into the'],
    ['bên trái', 'left-hand field'],
    ['bên phải', 'right-hand field'],
    ['trong trang này', 'on this page'],
    ['Script chỉ lấy dòng có cột', 'The script only reads rows where'],
    ['Repeated = số', 'Repeated is a number'],
    ['Cùng file Sheets → sheet', 'In the same Sheets file → open the'],
    ['Sau khi parse thành công, chuyển sang tab', 'After parsing succeeds, open the'],
    ['để xem KPI, chart, và bảng agent detail. Có thể nhập Root Cause trực tiếp vào bảng.', 'to view KPIs, charts, and the agent details table. You can enter Root Cause directly in the table.'],
    ['auto-generate text theo format chuẩn IH.', 'generates text in the standard IH format.'],
    ['Có nút Copy từng section hoặc Copy toàn bộ để paste vào chat/email.', 'Copy individual sections or copy everything for chat/email.'],
    ['F5 trang trước khi paste data mới.', 'Press F5 before pasting new data.'],
    ['Data chỉ tồn tại trong phiên làm việc hiện tại, đóng tab là mất.', 'Data lasts only for the current session and is cleared when the tab closes.'],
    ['Nếu lâu không hiện, bấm nút', 'If it takes too long, click'],
    ['trên thanh menu (cần đăng nhập tài khoản Shopee).', 'in the menu bar (Shopee account sign-in required).'],
    ['Please select team của bạn trước khi tiếp tục.', 'Please select your team before continuing.'],
    ['Nói thay vì gõ', 'Speak instead of typing'],
    ['Bấm để chọn file', 'Click to choose a file'],
    ['hoặc dán ảnh', 'or paste an image'],
    ['Kể xong bấm nút bên dưới', 'When you finish, click the button below'],
    ['Bé Lửa sẽ tự sắp xếp lại thành từng mục để bạn xem lại và chỉnh trước khi gửi.', 'Little Flame will organize it into sections for you to review and edit before submitting.'],
    ['Không lo nhấn nhầm.', 'You will be able to review it first.'],
    ['Sửa lại', 'Edit'],
    ['Gửi cho MNG QA', 'Submit to QA management'],
    ['không tính HC', 'excluded from HC'],
    ['Không tính:', 'Excluded:'],
    ['Thay đổi so với tuần trước', 'Changes vs previous week'],
    ['Thay đổi so với previous week', 'Changes vs previous week'],
    ['Sắp nghỉ', 'Upcoming leavers'],
    ['Báo IH', 'IH notice'],
    ['Mới vào', 'New joiners'],
    ['tuần gần nhất', 'most recent weeks'],
    ['Total lượt chat được xử lý', 'Total chats handled'],
    ['Tổng Quan Project', 'Project overview'],
    ['Performance theo Batch', 'Performance by batch'],
    ['Drill-down Danh Sách CS', 'CS list drill-down'],
    ['Count CS đạt Tier Top', 'CS achieving the Top tier'],
    ['chiếm tỷ trọng lớn.', 'make up a large share.'],
    ['Hệ thống Phân tích CSAT', 'CSAT Analysis System'],
    ['Cảnh báo Good Thiếu', 'Missing Good Alerts'],
    ['Alert Good Thiếu', 'Missing Good Alerts'],
    ['Tổng Đánh giá', 'Total ratings'],
    ['Total Đánh giá', 'Total ratings'],
    ['Tổng Quan & Cảnh Báo CSAT Drop', 'Overview & CSAT drop alerts'],
    ['Chi Tiết CS Tham Gia Project', 'CS project participation details'],
    ['Bảng Xếp Hạng Agent Chi Tiết', 'Detailed agent ranking'],
    ['Mức độ Cảnh báo', 'Alert level'],
    ['Mức độ Alert', 'Alert level'],
    ['Tổng số Project đang chạy:', 'Total active projects:'],
    ['Total số Project đang chạy:', 'Total active projects:'],
    ['CS Không tham gia Project:', 'CS not participating in a project:'],
    ['Details từng CS, số lượng Project tham gia, CSAT từng Project & Chênh lệch (+/-) so với Overall CSAT', 'CS details, number of projects, CSAT by project, and variance (+/-) versus overall CSAT'],
    ['Tên Agent', 'Agent name'],
    ['Không có dữ liệu phù hợp', 'No matching data'],
    ['Không có dữ liệu để hiển thị', 'No data to display'],
    ['Không có dữ liệu trong khoảng thời gian này', 'No data for this period'],
    ['Tính năng này đang được phát triển', 'This feature is under development'],
    ['Vui lòng chọn', 'Please select'],
    ['Vui lòng nhập', 'Please enter'],
    ['Vui lòng kiểm tra lại', 'Please check again'],
    ['Đang tải dữ liệu', 'Loading data'],
    ['Đang tải data', 'Loading data'],
    ['Đang cập nhật', 'Updating'],
    ['Đang xử lý', 'Processing'],
    ['Đang gửi', 'Sending'],
    ['Đã cập nhật', 'Updated'],
    ['Cập nhật lần cuối', 'Last updated'],
    ['Không thể tải', 'Unable to load'],
    ['Không tìm thấy', 'Not found'],
    ['Xem chi tiết', 'View details'],
    ['Bấm để xem', 'Click to view'],
    ['Click để xem', 'Click to view'],
    ['Tải lại dữ liệu', 'Reload data'],
    ['Tải dữ liệu', 'Load data'],
    ['Tải file', 'Download file'],
    ['Theo tháng', 'By month'],
    ['Theo tuần', 'By week'],
    ['Theo ngày', 'By day'],
    ['tuần trước', 'previous week'],
    ['tháng trước', 'previous month'],
    ['tuần hiện tại', 'current week'],
    ['tháng hiện tại', 'current month'],
    ['Số lượng', 'Count'],
    ['Tỷ lệ', 'Rate'],
    ['Danh sách', 'List'],
    ['Chi tiết', 'Details'],
    ['Ghi chú', 'Notes'],
    ['Mục tiêu', 'Target'],
    ['Cảnh báo', 'Alert'],
    ['Đề xuất', 'Recommendation']
  ];

  function readLanguage() {
    try {
      var query = new URLSearchParams(location.search).get('lang');
      if (query === 'en' || query === 'vi') {
        localStorage.setItem(LANG_KEY, query);
        return query;
      }
      return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'vi';
    } catch (e) { return 'vi'; }
  }

  function translate(source) {
    if (lang !== 'en' || source == null) return source;
    var value = String(source);
    var lead = (value.match(/^\s*/) || [''])[0];
    var tail = (value.match(/\s*$/) || [''])[0];
    var clean = value.trim().replace(/\s+/g, ' ');
    if (!clean) return value;
    if (Object.prototype.hasOwnProperty.call(EXACT, clean)) return lead + EXACT[clean] + tail;
    var result = clean;
    for (var i = 0; i < REPLACEMENTS.length; i++) {
      if (REPLACEMENTS[i][0].test(result)) {
        result = result.replace(REPLACEMENTS[i][0], REPLACEMENTS[i][1]);
        return lead + result + tail;
      }
    }
    for (var j = 0; j < PHRASES.length; j++) result = result.split(PHRASES[j][0]).join(PHRASES[j][1]);
    return lead + result + tail;
  }

  function blocked(node) {
    var p = node.nodeType === 1 ? node : node.parentElement;
    return !p || !!p.closest('script,style,noscript,textarea,[contenteditable="true"],[data-no-i18n]');
  }

  function translateTextNode(node) {
    if (!node || blocked(node)) return;
    if (!textSource.has(node)) textSource.set(node, node.nodeValue);
    var source = textSource.get(node);
    var next = lang === 'en' ? translate(source) : source;
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function translateElement(el) {
    if (!el || el.nodeType !== 1 || blocked(el)) return;
    var attrs = ['placeholder', 'title', 'aria-label'];
    var saved = attrSource.get(el) || {};
    for (var i = 0; i < attrs.length; i++) {
      var name = attrs[i];
      if (!el.hasAttribute(name)) continue;
      if (!Object.prototype.hasOwnProperty.call(saved, name)) saved[name] = el.getAttribute(name);
      var source = saved[name];
      var next = lang === 'en' ? translate(source) : source;
      if (el.getAttribute(name) !== next) el.setAttribute(name, next);
    }
    attrSource.set(el, saved);
  }

  function scan(root) {
    if (!root) return;
    if (root.nodeType === 3) { translateTextNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) translateElement(root);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeType === 3) translateTextNode(n);
      else translateElement(n);
    }
  }

  function translateDocumentTitle() {
    if (!document.title) return;
    var holder = document.documentElement;
    if (!holder.dataset.tqaTitleVi) holder.dataset.tqaTitleVi = document.title;
    var next = lang === 'en' ? translate(holder.dataset.tqaTitleVi) : holder.dataset.tqaTitleVi;
    if (document.title !== next) document.title = next;
  }

  function translateCharts() {
    if (!window.Chart || typeof window.Chart.getChart !== 'function') return;
    document.querySelectorAll('canvas').forEach(function (canvas) {
      var chart = window.Chart.getChart(canvas);
      if (!chart) return;
      if (!chartSource.has(chart)) {
        chartSource.set(chart, {
          labels: Array.isArray(chart.data.labels) ? chart.data.labels.slice() : null,
          datasets: (chart.data.datasets || []).map(function (d) { return d.label; }),
          renderedLabels: null,
          renderedDatasets: null
        });
      }
      var src = chartSource.get(chart);
      var currentLabels = Array.isArray(chart.data.labels) ? chart.data.labels.slice() : null;
      var currentDatasets = (chart.data.datasets || []).map(function (d) { return d.label; });
      var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
      if (lang === 'en') {
        if (currentLabels && ((!src.renderedLabels && !same(currentLabels, src.labels)) || (src.renderedLabels && !same(currentLabels, src.renderedLabels)))) src.labels = currentLabels;
        if ((!src.renderedDatasets && !same(currentDatasets, src.datasets)) || (src.renderedDatasets && !same(currentDatasets, src.renderedDatasets))) src.datasets = currentDatasets;
      } else {
        if (src.renderedLabels && currentLabels && !same(currentLabels, src.renderedLabels)) src.labels = currentLabels;
        if (src.renderedDatasets && !same(currentDatasets, src.renderedDatasets)) src.datasets = currentDatasets;
      }
      var nextLabels = src.labels && src.labels.map(function (x) { return typeof x === 'string' && lang === 'en' ? translate(x) : x; });
      var nextDatasets = src.datasets.map(function (x) { return typeof x === 'string' && lang === 'en' ? translate(x) : x; });
      var changed = false;
      if (nextLabels && !same(currentLabels, nextLabels)) { chart.data.labels = nextLabels; changed = true; }
      (chart.data.datasets || []).forEach(function (d, i) {
        if (d.label !== nextDatasets[i]) { d.label = nextDatasets[i]; changed = true; }
      });
      src.renderedLabels = lang === 'en' ? (nextLabels && nextLabels.slice()) : null;
      src.renderedDatasets = lang === 'en' ? nextDatasets.slice() : null;
      if (changed) { try { chart.update('none'); } catch (e) {} }
    });
  }

  function apply(next) {
    lang = next === 'en' ? 'en' : 'vi';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    document.documentElement.lang = lang;
    document.documentElement.dataset.tqaLanguage = lang;
    scan(document.documentElement);
    translateDocumentTitle();
    translateCharts();
    window.dispatchEvent(new CustomEvent('tqa-language-change', { detail: { lang: lang } }));
  }

  function start() {
    apply(lang);
    observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(scan);
        } else if (m.type === 'attributes') {
          translateElement(m.target);
        }
      });
      translateDocumentTitle();
      if (lang === 'en') translateCharts();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label']
    });
    setInterval(function () { if (lang === 'en') translateCharts(); }, 1500);
  }

  window.TQAI18N = { apply: apply, current: function () { return lang; }, translate: translate };
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'tqa-language') apply(event.data.lang);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
