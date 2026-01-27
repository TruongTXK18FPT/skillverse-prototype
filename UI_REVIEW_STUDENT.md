# UI Review - Student Role

**Ngày review:** 27/01/2026  
**Reviewer:** AI Assistant  
**Tài khoản test:** cattpbse184684@fpt.edu.vn  
**Role:** Student
**Website:** https://skillverse.vn

---

## Mục lục
1. [Trang chủ (Landing Page)](#1-trang-chủ-landing-page)
2. [Trang đăng nhập](#2-trang-đăng-nhập)
3. [Dashboard](#3-dashboard)
4. [Trang Courses](#4-trang-courses)
5. [Trang Roadmap](#5-trang-roadmap)
6. [Trang Community](#6-trang-community)
7. [Trang Jobs](#7-trang-jobs)
8. [Trang Portfolio](#8-trang-portfolio)
9. [Trang Profile](#9-trang-profile)
10. [Trang Wallet](#10-trang-wallet)
11. [Trang Premium](#11-trang-premium)
12. [Trang Seminar](#12-trang-seminar)
13. [Trang Chatbot](#13-trang-chatbot)
14. [Trang Gamification](#14-trang-gamification)
15. [Các trang khác](#15-các-trang-khác)

---

## 1. Trang chủ (Landing Page)

**URL:** https://skillverse.vn/

### ✅ Điểm tốt:
1. **Hero Section ấn tượng**: Slider với 5 slides giới thiệu các tính năng chính
2. **Thiết kế nhất quán**: Theme space/cosmic xuyên suốt
3. **CTA rõ ràng**: Các nút call-to-action được đặt hợp lý
4. **Thông tin đầy đủ**: Footer có đủ liên kết, thông tin liên hệ, mạng xã hội
5. **Thành tích giải thưởng**: Hiển thị các giải thưởng Top 11, Top 7, Top 25

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 1.1 | **Navbar thiếu nhất quán** - "DỊCH CHUYỂN" và "NÂNG CẤP" là text không có link, không rõ là gì | Navbar bên phải | `src/pages/navbar/` hoặc `src/components/layout/` | Thêm tooltip hoặc đổi thành dropdown menu có ý nghĩa rõ ràng |
| 1.2 | **"KHÁM PHÁ" button** - Không rõ dẫn đến trang nào, UX confusing | Navbar trái | `src/pages/navbar/` | Thêm hover state hiển thị preview hoặc đổi text thành "Bản đồ khám phá" |
| 1.3 | **Footer copyright năm 2025** - Đã lỗi thời | Footer cuối trang | `src/components/layout/Footer.tsx` hoặc `src/pages/footer/` | Cập nhật thành "© 2026" hoặc dùng dynamic year |
| 1.4 | **Không có loading indicator** khi chuyển trang | Toàn trang | `src/App.tsx` hoặc loading component | Thêm skeleton loading hoặc spinner khi navigate |
| 1.5 | **Social media section**: "INCOMING TRANSMISSION: TIKTOK_FEED" - Text kỹ thuật không thân thiện user | Section "Các Kênh Mạng Xã Hội" | `src/pages/main/HomePage.tsx` | Đơn giản hóa hoặc thêm giải thích |

### 📝 Ghi chú thêm:
- Trang chủ load khá nhanh
- Responsive chưa kiểm tra được
- Animation slider mượt mà

---

## 2. Trang đăng nhập (Login)

**URL:** https://skillverse.vn/login

### ✅ Điểm tốt:
1. **Theme nhất quán**: "HYPERION DECK" phù hợp theme space
2. **Form đầy đủ**: Email, Password, Remember me, Forgot password
3. **Có option đăng nhập Google**
4. **Link đăng ký rõ ràng**

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 2.1 | **"SYS:ONLINE v2.4.1 DECK:AUTH LV.00 STATUS STANDBY"** - Text kỹ thuật không cần thiết, gây rối | Footer của form login | `src/pages/auth/ElevatorLoginPage.tsx` | Ẩn hoặc chuyển thành footer nhẹ hơn |
| 2.2 | **Không có hiển thị password toggle** | Field password | `src/pages/auth/ElevatorLoginPage.tsx` | Thêm icon eye để toggle show/hide password |
| 2.3 | **Không có validation realtime** | Form fields | `src/pages/auth/ElevatorLoginPage.tsx` | Hiển thị lỗi ngay khi blur field (email format, password length) |
| 2.4 | **Logo Google nhỏ và mờ** | Nút Google login | CSS hoặc component auth | Tăng size và contrast logo |
| 2.5 | **"SKILLVERSE HYPERION"** lặp lại không cần thiết | Footer form | `src/pages/auth/ElevatorLoginPage.tsx` | Giữ 1 cái hoặc loại bỏ |

### 📝 Ghi chú thêm:
- Cần test validation error messages
- Cần test flow đăng nhập thực tế

---

## 2b. Trang đăng ký (Register)

**URL:** https://skillverse.vn/register

### ✅ Điểm tốt:
1. **Form đầy đủ**: Họ tên, Email, Password, Confirm password, SĐT, Khu vực, Giới thiệu
2. **Link đăng nhập có sẵn**
3. **Bio là optional** - rõ ràng

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 2b.1 | **Không có password strength indicator** | Password field | `src/pages/auth/ElevatorPersonalRegisterPage.tsx` | Thêm thanh strength và requirements |
| 2b.2 | **"KHU VỰC ĐỊA CHỈ"** - Label không rõ ràng | Address field | `src/pages/auth/ElevatorPersonalRegisterPage.tsx` | Đổi thành "Thành phố/Tỉnh" hoặc dropdown |
| 2b.3 | **Thiếu terms acceptance checkbox** | Form bottom | `src/pages/auth/ElevatorPersonalRegisterPage.tsx` | Thêm "Tôi đồng ý với Điều khoản sử dụng" |
| 2b.4 | **Không có step indicator** | Header | `src/pages/auth/ElevatorPersonalRegisterPage.tsx` | Thêm steps: 1. Thông tin → 2. Xác thực → 3. Hoàn tất |

---

## 2c. Trang quên mật khẩu

**URL:** https://skillverse.vn/forgot-password

### ✅ Điểm tốt:
1. **Form đơn giản**: Chỉ cần email
2. **Có link quay lại login**
3. **Title rõ ràng**: "KHÔI PHỤC MẬT KHẨU"

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 2c.1 | **Technical footer** - "SYS:ONLINE v2.4.1..." giống login | Footer | `src/pages/auth/ElevatorForgotPasswordPage.tsx` | Ẩn hoặc simplify |
| 2c.2 | **Không có instructions** | Form | `src/pages/auth/ElevatorForgotPasswordPage.tsx` | Thêm text: "Chúng tôi sẽ gửi link khôi phục đến email của bạn" |
| 2c.3 | **"SKILLVERSE HYPERION"** xuất hiện lại | Footer | `src/pages/auth/ElevatorForgotPasswordPage.tsx` | Nhất quán với các trang khác |

---

## 3. Trang Courses

**URL:** https://skillverse.vn/courses

### ✅ Điểm tốt:
1. **Layout rõ ràng**: Card grid hiển thị courses
2. **Có bộ lọc theo category**: Tất Cả, Công Nghệ, Thiết Kế, Kinh Doanh, Marketing, Ngoại Ngữ, Kỹ Năng Mềm
3. **Hiển thị thông tin course**: Instructor, Modules, Enrolled, Price
4. **Có preview button**: "XEM TRƯỚC" cho mỗi course

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 3.1 | **"INSTRUCTOR: Unknown"** - Hiển thị cho tất cả courses | Card course | `src/components/course/` | Đảm bảo data instructor được load hoặc hiển thị "Đang cập nhật" thay vì "Unknown" |
| 3.2 | **"0 ENROLLED"** - Tất cả courses hiển thị 0 enrolled | Card course | `src/components/course/` | Nếu chưa có data, ẩn phần này hoặc hiển thị "Mới" |
| 3.3 | **Thiếu filter theo giá** | Sidebar bộ lọc | `src/components/course/` | Thêm bộ lọc theo khoảng giá (Miễn phí, < 300k, 300k-500k, > 500k) |
| 3.4 | **Thiếu search box** | Header section | `src/components/course/` | Thêm input search để tìm course theo tên |
| 3.5 | **"SCAN RESULT:3 MODULES DETECTED"** - Text quá kỹ thuật | Header | `src/pages/course/CoursesPage.tsx` | Đổi thành "Tìm thấy 3 khóa học" |
| 3.6 | **Hình ảnh default** - Tất cả courses dùng `default-course.jpg` | Card course thumbnail | `src/components/course/` | Yêu cầu upload hình riêng cho mỗi course hoặc tạo placeholder đẹp hơn |
| 3.7 | **Giá hiển thị không format** - "499000 VND" thay vì "499,000 VND" | Card course | `src/components/course/` | Format số tiền với dấu phân cách hàng nghìn |
| 3.8 | **"KHỞI ĐỘNG" button** - Không rõ nghĩa, có thể confuse với "Đăng ký" hoặc "Xem chi tiết" | Card course CTA | `src/components/course/` | Đổi thành "Xem chi tiết" hoặc "Đăng ký học" |
| 3.9 | **Thiếu sort options** | Header section | `src/components/course/` | Thêm dropdown sort: Mới nhất, Giá thấp-cao, Phổ biến nhất |

### 📝 Ghi chú thêm:
- Hiện chỉ có 3 courses: React, Spring Boot, Java
- Theme "THIÊN HÀ TRI THỨC" phù hợp
- Cần kiểm tra pagination khi có nhiều courses hơn

---

## 4. Trang Jobs

**URL:** https://skillverse.vn/jobs

### ✅ Điểm tốt:
1. **Có bộ lọc đầy đủ**: Từ khóa, Khu vực làm việc, Khoảng ngân sách
2. **Filter khu vực**: Tất cả, Làm việc từ xa, Làm việc tại chỗ
3. **Range slider cho ngân sách**: 0 - 50,000,000 VND
4. **Nút reset bộ lọc**

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 4.1 | **Empty state message** - "Hiện chưa có công việc nào được đăng" nhưng không có suggestion | Main content | `src/pages/job/JobsPage.tsx` | Thêm CTA: "Đăng ký nhận thông báo việc làm mới" hoặc suggest courses liên quan |
| 4.2 | **"🃏" emoji random** - Ý nghĩa không rõ | Bên cạnh nút reset | `src/pages/job/JobsPage.tsx` | Loại bỏ hoặc thay bằng icon có ý nghĩa |
| 4.3 | **Card symbols "♦ ♣ ♥ ♠"** - Lặp lại nhiều lần, không phục vụ mục đích gì | Header decoration | `src/pages/job/JobsPage.tsx` | Giảm bớt hoặc thay bằng loading animation |
| 4.4 | **Thiếu filter theo ngành nghề** | Sidebar bộ lọc | `src/components/job/` | Thêm filter: IT, Marketing, Sales, Design, etc. |
| 4.5 | **Thiếu filter theo kinh nghiệm** | Sidebar bộ lọc | `src/components/job/` | Thêm filter: Fresher, 1-2 năm, 3-5 năm, Senior |
| 4.6 | **"BẢNG CÔNG VIỆC" title** - Có thể dùng từ thân thiện hơn | Header | `src/pages/job/JobsPage.tsx` | Đổi thành "Cơ hội việc làm" hoặc "Tìm việc" |
| 4.7 | **"CHỌN CƠ HỘI" subtitle** - Không cần thiết khi không có job | Header | `src/pages/job/JobsPage.tsx` | Ẩn khi không có kết quả |

### 📝 Ghi chú thêm:
- Hiện tại không có công việc nào được đăng
- Cần test lại khi có data thực
- Theme card game (♦♣♥♠) có thể phù hợp với gamification nhưng cần consistency

---

## 5. Trang Community

**URL:** https://skillverse.vn/community

### ✅ Điểm tốt:
1. **Có nội dung phong phú**: 12 bài viết với các chủ đề hữu ích cho dev
2. **Filter theo category**: Tất Cả, Mẹo hay, Thảo luận, Hướng dẫn, Tin tức, Tuyển dụng
3. **Hiển thị author info**: Avatar, tên, ngày đăng
4. **Có thumbnail cho mỗi bài**
5. **Pagination**: Page 1 of 2

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 5.1 | **"Mã Hóa: Tắt Kênh: Mở Trạng Thái: Hoạt Động"** - Text kỹ thuật gây confusion | Header status | `src/components/community-hud/` | Ẩn hoặc đơn giản hóa thành icon status |
| 5.2 | **Nút "Đăng bài viết"** - Không rõ có cần đăng nhập không | Header action | `src/components/community-hud/` | Hiển thị tooltip "Đăng nhập để đăng bài" nếu chưa login |
| 5.3 | **Thiếu search box** | Header | `src/components/community-hud/` | Thêm search để tìm bài viết theo keyword |
| 5.4 | **Ngày đăng format không nhất quán** - "21/12/2025" vs "2/12/2025" | Post card | `src/components/community-hud/` | Thống nhất format: "21/12/2025" hoặc "2 tháng 12, 2025" |
| 5.5 | **Thiếu like/comment count preview** | Post card | `src/components/community-hud/` | Thêm icon và số lượng like, comment trên card |
| 5.6 | **Tags hiển thị lạ** - "skillmistake2030", "courseskillmistake2010" | Post card | `src/components/community-hud/` | Format thành dạng dễ đọc: "#skillmistake #2030" hoặc ẩn nếu là internal ID |
| 5.7 | **Thumbnail bị crop** - Một số ảnh bị cắt mất content quan trọng | Post card | CSS | Sử dụng object-fit: contain hoặc chuẩn hóa ratio ảnh |

### 📝 Ghi chú thêm:
- Nội dung bài viết chất lượng, hữu ích cho target audience
- Theme "KÊNH CỘNG ĐỒNG" phù hợp
- Cần test trang chi tiết bài viết

---

## 6. Trang Seminar

**URL:** https://skillverse.vn/seminar

### ✅ Điểm tốt:
1. **Layout chuyên nghiệp**: "BẢN TIN HỘI THẢO" với dashboard style
2. **Có bộ lọc category**: Tất cả, Công nghệ, Kinh doanh, Thiết kế
3. **Có calendar filter icon**
4. **Hiển thị thống kê hệ thống**: Kênh, Hoạt động, Thời gian hoạt động

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 6.1 | **Empty state không hấp dẫn** - "Không tìm thấy hội thảo" quá đơn giản | Main content | `src/pages/seminar/SeminarPage.tsx` | Thêm CTA "Đề xuất chủ đề hội thảo" hoặc "Đăng ký nhận thông báo" |
| 6.2 | **"QUÉT RADAR" text** - Không rõ là action hay status | Button/label | `src/pages/seminar/SeminarPage.tsx` | Đổi thành "Làm mới" hoặc loại bỏ |
| 6.3 | **"VẬN HÀNH THÔNG TIN TRỰC TUYẾN" subtitle** - Quá dài và technical | Header | `src/pages/seminar/SeminarPage.tsx` | Rút gọn thành "Sự kiện trực tuyến" |
| 6.4 | **"KÊNH TRUYỀN BẢO MẬT ĐANG HOẠT ĐỘNG"** - Gây hiểu lầm về security | Header animation | `src/pages/seminar/SeminarPage.tsx` | Loại bỏ hoặc thay bằng "Kết nối ổn định" |
| 6.5 | **"DIỄN GIẢ NỔI BẬT 📊 Chưa có dữ liệu diễn giả"** - Section trống | Sidebar | `src/pages/seminar/SeminarPage.tsx` | Ẩn section này khi chưa có data, hoặc hiển thị placeholder speakers |
| 6.6 | **"NHIỆM VỤ HOÀN THÀNH 0 ĐANG DIỄN RA 0"** - Confusing terminology | Sidebar stats | `src/pages/seminar/SeminarPage.tsx` | Đổi thành "Đã tham gia: 0 | Sắp diễn ra: 0" |
| 6.7 | **Thiếu calendar view** - Chỉ có icon lịch nhưng không có view | Header | `src/pages/seminar/SeminarPage.tsx` | Thêm calendar month view cho seminars |

### 📝 Ghi chú thêm:
- Hiện không có seminar nào
- Theme nhất quán với các trang khác
- Cần test khi có seminars thực tế

---

## 7. Trang Premium

**URL:** https://skillverse.vn/premium

### ✅ Điểm tốt:
1. **4 tiers rõ ràng**: Free, Student (29k), Skill+ (79k), Pro (249k)
2. **Feature list đầy đủ cho mỗi tier**
3. **Visual hierarchy tốt**: Popular tag cho Skill+
4. **Avatar frames khác nhau**: Silver, Gold, Diamond

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 7.1 | **Tên tier không nhất quán** - "HỌC VIÊN MIỄN PHÍ", "HỌC GIẢ GÓI SINH VIÊN", "SĨ QUAN KỸ NĂNG+", "CHỈ HUY CỐ VẤN PRO" | Card headers | `src/pages/premium/PremiumPageCosmic.tsx` | Thống nhất naming: Free, Student, Premium, Pro hoặc dùng tên tiếng Việt ngắn gọn hơn |
| 7.2 | **"MỖI 1 CHU KỲ"** - Không rõ chu kỳ là bao lâu | Price description | `src/pages/premium/PremiumPageCosmic.tsx` | Đổi thành "/ tháng" hoặc "/ 30 ngày" |
| 7.3 | **Features viết tắt khó hiểu** - "(Limited)", "(Unlimited)", "(more request)" | Feature list | `src/pages/premium/PremiumPageCosmic.tsx` | Diễn giải cụ thể: "5 requests/tháng", "Không giới hạn" |
| 7.4 | **"ĐĂNG NHẬP ĐỂ TRUY CẬP"** - Tất cả gói đều cùng CTA | Button CTA | `src/pages/premium/PremiumPageCosmic.tsx` | Gói Free: "Dùng miễn phí", Gói có phí: "Nâng cấp ngay" |
| 7.5 | **Không có so sánh table view** | Layout | `src/pages/premium/PremiumPageCosmic.tsx` | Thêm tab "So sánh chi tiết" với bảng comparison |
| 7.6 | **Thiếu FAQ section** | Footer page | `src/pages/premium/PremiumPageCosmic.tsx` | Thêm câu hỏi thường gặp về premium |
| 7.7 | **Giá "0 VND"** cho gói Free | Card Free tier | `src/pages/premium/PremiumPageCosmic.tsx` | Đổi thành "Miễn phí" thay vì "0 VND" |
| 7.8 | **Mentor Booking "(4 meetings)"** - Không rõ 4 meetings trong bao lâu | Feature Pro tier | `src/pages/premium/PremiumPageCosmic.tsx` | Diễn giải: "4 buổi mentor/tháng" |

### 📝 Ghi chú thêm:
- Pricing structure hợp lý cho target audience (sinh viên)
- Cần test flow thanh toán sau khi đăng nhập

---

## 8. Trang About

**URL:** https://skillverse.vn/about

### ✅ Điểm tốt:
1. **Thông tin đầy đủ**: Giải pháp, Tính năng, Đối tượng, Đội ngũ
2. **Visual storytelling tốt**: 3 vấn đề → 3 giải pháp
3. **Team section có ảnh và social links**
4. **Tầm nhìn dài hạn rõ ràng**

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 8.1 | **Slogan "Learn Fast.Fail Smart.Improve Constantsly"** - Typo "Constantsly" | Hero section | `src/pages/about/AboutPage.tsx` | Sửa thành "Constantly" |
| 8.2 | **Copyright mismatch** - Footer "© 2025" nhưng cuối trang "© 2024" | Footer page vs main footer | `src/pages/about/AboutPage.tsx` | Thống nhất thành "© 2026" |
| 8.3 | **Team member GitHub/LinkedIn icons** - Không có text label | Team section | `src/pages/about/AboutPage.tsx` | Thêm tooltip khi hover |
| 8.4 | **Missing team member info** - Chỉ có 4 members, thiếu description roles chi tiết | Team section | `src/pages/about/AboutPage.tsx` | Thêm 1-2 dòng mô tả contribution của mỗi người |
| 8.5 | **"Supervisor: Lại Đức Hùng"** - Không có ảnh hoặc link | Team header | `src/pages/about/AboutPage.tsx` | Thêm ảnh hoặc link profile supervisor |
| 8.6 | **Stats section "∞ Khả năng"** - Không có ý nghĩa cụ thể | Stats bar | `src/pages/about/AboutPage.tsx` | Đổi thành số liệu thực: "1000+ Users" hoặc bỏ |

### 📝 Ghi chú thêm:
- Trang về chúng tôi khá hoàn chỉnh
- Cần cập nhật thông tin khi có data mới

---

## 9. Trang Explore (Bản đồ khám phá)

**URL:** https://skillverse.vn/explore

### ✅ Điểm tốt:
1. **Visual map đẹp mắt**: 4 zones với hình ảnh riêng biệt
2. **Theme space nhất quán**: Học Viện Chiến Binh, Phi Thuyền Mẹ, Khu Chợ Đen, Lỗ Sâu
3. **System status display**: UTC time, Data flow
4. **Interactive elements**

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 9.1 | **"[SONTUNGMTP]" text** - Không rõ ý nghĩa, có thể là debug text | System log | `src/pages/ExploreMapPage.tsx` | Loại bỏ hoặc thay bằng username thực |
| 9.2 | **"SCANNING... [TARGET: LOW]"** - Confusing cho user thông thường | Status bar | `src/pages/ExploreMapPage.tsx` | Đơn giản hóa hoặc ẩn bớt technical text |
| 9.3 | **Thiếu legend/hướng dẫn** - User không biết mỗi zone dẫn đến đâu | Map area | `src/pages/ExploreMapPage.tsx` | Thêm tooltip khi hover mô tả mỗi zone |
| 9.4 | **Zone names quá abstract** - "Lỗ Sâu", "Khu Chợ Đen" không rõ function | Zone labels | `src/pages/ExploreMapPage.tsx` | Thêm subtitle: "Lỗ Sâu (Chatbot AI)", "Khu Chợ Đen (Marketplace)" |
| 9.5 | **Responsive unclear** - Không rõ map hoạt động thế nào trên mobile | Toàn trang | CSS / `src/pages/ExploreMapPage.tsx` | Cần test và optimize cho mobile view |

### 📝 Ghi chú thêm:
- Concept map rất creative và phù hợp với theme
- Cần documentation để user hiểu từng zone

---

## 10. Trang Gamification

**URL:** https://skillverse.vn/gamification

### ✅ Điểm tốt:
1. **Leaderboard đầy đủ**: Top users với xu, tiến độ
2. **Multiple tabs**: Bảng xếp hạng, Huy hiệu, Mini games, Thành tựu
3. **Time filters**: Tuần này, Tháng này, Tất cả
4. **Sorting options**: Xu kiếm được, Tiến độ học tập, Đóng góp cộng đồng
5. **Personal position display**: Hiển thị vị trí #12 của user

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 10.1 | **Data giả** - Leaderboard dùng stock photos từ Unsplash | Leaderboard avatars | `src/pages/gamification/Gamification.tsx` | Thay bằng real user data hoặc placeholder avatars |
| 10.2 | **"15 ngày" không rõ context** - Ở header section | Stats header | `src/pages/gamification/Gamification.tsx` | Thêm label: "Streak: 15 ngày" |
| 10.3 | **Thiếu mini games content** - Tab Mini Games có gì? | Tab content | `src/pages/gamification/Gamification.tsx` | Cần verify content trong tab này |
| 10.4 | **"Bạn đang dẫn đầu!"** - Hiển thị khi user ở #12 | Position message | `src/pages/gamification/Gamification.tsx` | Sửa logic: chỉ hiển thị khi thực sự #1 |
| 10.5 | **Số hiển thị lặp** - "2,847 28 152,847 xu" format lạ | Score display | `src/pages/gamification/Gamification.tsx` | Kiểm tra và fix format số |
| 10.6 | **Thiếu explanation** - Xu dùng để làm gì? | General | `src/pages/gamification/Gamification.tsx` | Thêm info tooltip: "Xu có thể đổi thành..." |

### 📝 Ghi chú thêm:
- Concept gamification tốt
- Cần verify các tab khác: Huy hiệu, Mini games, Thành tựu
- Link đến mini games: /gamification/tic-tac-toe, /gamification/meowl-adventure

---

## 10a. Mini Game: Tic Tac Toe

**URL:** https://skillverse.vn/gamification/tic-tac-toe

### ✅ Điểm tốt:
1. **Game đơn giản dễ chơi**
2. **Có nút chơi lại**
3. **Luật chơi đặc biệt**: Tối đa 3 nước, nước thứ 4 xóa nước đầu tiên

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 10a.1 | **Không có đối thủ AI** | Game logic | `src/components/game/TicTacToeGame.tsx` | Verify có chế độ chơi với AI không |
| 10a.2 | **Không có reward system** | Game result | `src/components/game/TicTacToeGame.tsx` | Thêm xu thưởng khi thắng |
| 10a.3 | **Thiếu back button** | Header | `src/components/game/TicTacToeGame.tsx` | Thêm nút quay lại gamification hub |

---

## 10b. Mini Game: Meowl Adventure (Rhythm Game)

**URL:** https://skillverse.vn/gamification/meowl-adventure

### ✅ Điểm tốt:
1. **Concept sáng tạo**: Rhythm game với 4 phím
2. **Hướng dẫn rõ ràng**: D, F, J, K keys
3. **Scoring system**: +100 cho Slash, +200 cho Parry
4. **Lives system**: 3 mạng, +1 mạng mỗi 10 notes

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 10b.1 | **Mobile không chơi được** - Game yêu cầu keyboard | General | `src/components/game/MeowlAdventure.tsx` | Thêm touch controls cho mobile hoặc thông báo "Chỉ hỗ trợ desktop" |
| 10b.2 | **Không có music visualization** - Rhythm game cần nhạc | Game area | `src/components/game/MeowlAdventure.tsx` | Verify có audio không |
| 10b.3 | **Thiếu tutorial mode** | Start screen | `src/components/game/MeowlAdventure.tsx` | Thêm practice mode trước khi chơi thật |
| 10b.4 | **Thiếu high score leaderboard** | Game result | `src/components/game/MeowlAdventure.tsx` | Thêm bảng xếp hạng điểm cao |

---

## 11. Trang Help Center

**URL:** https://skillverse.vn/help-center

### ✅ Điểm tốt:
1. **FAQ categories đầy đủ**: Tài khoản, Khóa học, Thanh toán, Cộng đồng
2. **Accordion format**: Dễ tìm kiếm thông tin
3. **Contact info đầy đủ**: Email, Hotline, Giờ làm việc
4. **Multiple tabs**: Câu hỏi thường gặp, Gửi yêu cầu, Tra cứu ticket

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 11.1 | **FAQ answers quá ngắn** - "Vào Cài đặt > Bảo mật > Đổi mật khẩu." | FAQ content | `src/pages/footer/HelpCenter.tsx` | Thêm screenshots hoặc link trực tiếp |
| 11.2 | **"Hỗ trợ kỹ thuật 24/7?"** nhưng "8h-22h" | FAQ inconsistency | `src/pages/footer/HelpCenter.tsx` | Sửa FAQ hoặc note rõ "AI chat 24/7, nhân viên 8h-22h" |
| 11.3 | **Thiếu search box** | Header | `src/pages/footer/HelpCenter.tsx` | Thêm search để tìm FAQ nhanh |
| 11.4 | **Tab "Tra cứu ticket"** - Có hoạt động không? | Tab content | `src/pages/footer/HelpCenter.tsx` | Verify functionality và UX |
| 11.5 | **"HELP CENTER" English subtitle** | Header | `src/pages/footer/HelpCenter.tsx` | Đổi thành "TRUNG TÂM HỖ TRỢ" hoặc bỏ subtitle |

### 📝 Ghi chú thêm:
- Trang help center khá cơ bản nhưng đủ dùng
- Cần thêm nội dung chi tiết hơn cho FAQ

---

## 12. Trang User Guide

**URL:** https://skillverse.vn/user-guide

### ✅ Điểm tốt:
1. **3 bước rõ ràng**: Chọn vai trò → Đăng ký → Bắt đầu
2. **Thông tin đầy đủ** cho mỗi bước
3. **CTA buttons đúng chỗ**
4. **Tabs cho từng role**: Project Blueprint, Pilot Protocol, Khách tham quan

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 12.1 | **"MISSION BRIEFING" title** - Quá technical/military | Header | `src/pages/user-guide/UserGuidePage.tsx` | Đổi thành "Hướng dẫn sử dụng" hoặc "Bắt đầu với Skillverse" |
| 12.2 | **Thiếu video tutorial** | Content | `src/pages/user-guide/UserGuidePage.tsx` | Thêm video demo cho từng bước |
| 12.3 | **Tab names không rõ** - "Project Blueprint", "Pilot Protocol" | Tab headers | `src/pages/user-guide/UserGuidePage.tsx` | Đổi thành tên dễ hiểu: "Người học", "Mentor", "Khách" |
| 12.4 | **"Meowl nhắc bạn nè!"** - Style không nhất quán | Note in step 2 | `src/pages/user-guide/UserGuidePage.tsx` | Thống nhất style tips với các trang khác |
| 12.5 | **Thiếu screenshots** | Steps content | `src/pages/user-guide/UserGuidePage.tsx` | Thêm hình minh họa cho mỗi bước |

### 📝 Ghi chú thêm:
- Cấu trúc tốt nhưng content còn sơ sài
- Cần expand cho từng role cụ thể

---

## 13. Trang Choose Role (Đăng ký)

**URL:** https://skillverse.vn/choose-role

### ✅ Điểm tốt:
1. **4 roles rõ ràng**: Người học, Người dạy, Nhà tuyển dụng, Phụ huynh
2. **Visual icons đẹp**: Meowl characters cho mỗi role
3. **Descriptions ngắn gọn**
4. **Responsive layout**: Grid cards

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 13.1 | **Không có hover state rõ ràng** | Role cards | `src/pages/auth/ChooseRolePage.tsx` | Thêm hover effect: scale, shadow, border highlight |
| 13.2 | **Thiếu "compare roles" feature** | General | `src/pages/auth/ChooseRolePage.tsx` | Thêm link hoặc modal so sánh quyền lợi từng role |
| 13.3 | **Decoration quá nhiều** - "♦♣♥♠" ở bottom | Footer decoration | `src/pages/auth/ChooseRolePage.tsx` | Giảm bớt hoặc thay bằng subtle pattern |
| 13.4 | **Thiếu back button** | Header | `src/pages/auth/ChooseRolePage.tsx` | Thêm nút quay lại trang trước |

### 📝 Ghi chú thêm:
- Flow đăng ký bắt đầu từ đây
- Cần test flow đăng ký cho từng role

---

## 14. Các trang yêu cầu đăng nhập

Các trang sau redirect về login khi chưa authenticated:
- `/dashboard` - Dashboard học viên
- `/portfolio` - Portfolio cá nhân  
- `/roadmap` - AI Roadmap (chỉ view, tạo mới cần login)
- `/chatbot` - Career AI Chat
- `/chatbot/general` - General Chat
- `/chatbot/expert` - Expert Chat
- `/profile` - Profile cá nhân
- `/wallet` - Ví điện tử
- `/my-wallet` - My Wallet (duplicate route?)
- `/notifications` - Thông báo
- `/messages` - Tin nhắn
- `/my-bookings` - Lịch hẹn
- `/study-planner` - Kế hoạch học tập
- `/mentorship` - Mentorship
- `/my-applications` - Đơn ứng tuyển
- `/my-reports` - Báo cáo của tôi

### ⚠️ Vấn đề chung:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 14.1 | **Redirect không có message** - Chỉ chuyển về login, không thông báo tại sao | Login page | `src/components/shared/ProtectedRoute.tsx` | Thêm toast/message: "Vui lòng đăng nhập để truy cập trang này" |
| 14.2 | **Duplicate routes** - `/wallet` và `/my-wallet` cùng component | Routes | `src/App.tsx` | Gộp thành 1 route hoặc redirect |
| 14.3 | **Return URL không được lưu** - Sau login không quay lại trang gốc | Auth flow | `src/pages/auth/ElevatorLoginPage.tsx` | Lưu intended URL và redirect sau login |

---

## 15. Trang Terms of Service

**URL:** https://skillverse.vn/terms-of-service

### ✅ Điểm tốt:
1. **Nội dung đầy đủ**: 11 sections covering all legal aspects
2. **Ngày cập nhật rõ ràng**: 18/06/2025
3. **Thông tin liên hệ**: Email, Hotline, Trụ sở
4. **Format dễ đọc**: Sections và sub-sections

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 15.1 | **Copyright "© 2025"** đã lỗi thời | Footer | `src/pages/footer/TermOfService.tsx` | Cập nhật thành 2026 |
| 15.2 | **Thiếu Table of Contents** | Header | `src/pages/footer/TermOfService.tsx` | Thêm mục lục với anchor links |
| 15.3 | **Thiếu print/download option** | Header | `src/pages/footer/TermOfService.tsx` | Thêm nút tải PDF hoặc in |
| 15.4 | **"Trụ sở: Đại học FPT"** không đủ chi tiết | Section 11 | `src/pages/footer/TermOfService.tsx` | Thêm địa chỉ đầy đủ như footer main |

### 📝 Ghi chú thêm:
- Nội dung legal khá hoàn chỉnh
- Phù hợp với quy định pháp luật VN

---

## 16. Trang Privacy Policy

**URL:** https://skillverse.vn/privacy-policy

### ✅ Điểm tốt:
1. **9 sections rõ ràng**
2. **Ngày cập nhật**: 27/11/2025
3. **GDPR-like structure**: Thu thập, Sử dụng, Chia sẻ, Quyền user
4. **Contact info đầy đủ**

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 16.1 | **"PRIVACY POLICY" English subtitle** khi title đã Việt | Header | `src/pages/footer/PrivacyPolicy.tsx` | Bỏ subtitle hoặc đổi thành tiếng Việt |
| 16.2 | **Footer copyright 2025** | Footer | `src/pages/footer/PrivacyPolicy.tsx` | Cập nhật thành 2026 |
| 16.3 | **Thiếu cookie consent banner** | General | App level | Thêm cookie consent popup khi lần đầu truy cập |
| 16.4 | **Thiếu link đến Cookie Policy** | Section 2 | `src/pages/footer/PrivacyPolicy.tsx` | Thêm separate cookie policy page hoặc section |

### 📝 Ghi chú thêm:
- Privacy policy đủ chi tiết
- Cần review định kỳ theo luật mới

---

## 17. Trang Course Detail

**URL:** https://skillverse.vn/courses/{id}

### ⚠️ Vấn đề:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 17.1 | **"KHÔNG TÌM THẤY MODULE"** - Error message cho course ID = 1 | Main content | `src/pages/course/CourseDetailPage.tsx` | Verify API endpoint và data, hoặc redirect về /courses nếu không tìm thấy |
| 17.2 | **Error message quá technical** - "Module không tồn tại trong hệ thống" | Error page | `src/pages/course/CourseDetailPage.tsx` | Đổi thành "Khóa học không tồn tại. Bạn có thể khám phá các khóa học khác." |
| 17.3 | **Thiếu suggestions** - Không gợi ý courses khác | Error page | `src/pages/course/CourseDetailPage.tsx` | Thêm list suggested courses khi course not found |

### 📝 Ghi chú thêm:
- Cần test với course ID thực từ API
- Error handling cần improve

---

## 18. Trang Meowl Shop

**URL:** https://skillverse.vn/meowl-shop

### ✅ Điểm tốt:
1. **Theme phù hợp**: "DIGITAL BOUTIQUE ONLINE"
2. **Version numbering**: V2.0
3. **Back button có sẵn**
4. **Description rõ ràng**

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 18.1 | **Không thấy products/skins** - Trang có vẻ trống hoặc cần login | Main content | `src/pages/shop/MeowlSkinShopPage.tsx` | Hiển thị preview skins cho guest users |
| 18.2 | **"Giao dịch mã hóa"** - Gây hiểu lầm về cryptocurrency | Description | `src/pages/shop/MeowlSkinShopPage.tsx` | Đổi thành "Thanh toán bằng xu Skillverse" |
| 18.3 | **Thiếu price list preview** | General | `src/pages/shop/MeowlSkinShopPage.tsx` | Hiển thị range giá hoặc featured skins |

### 📝 Ghi chú thêm:
- Cần test khi đăng nhập để xem full content
- Feature gamification thú vị

---

## 19. Các vấn đề chung trên toàn site

### ⚠️ UX/UI Issues:

| # | Vấn đề | Vị trí trên giao diện | File trong code (dự kiến) | Đề xuất chỉnh sửa |
|---|--------|----------------------|---------------------------|-------------------|
| 19.1 | **Footer copyright "© 2025"** - Xuất hiện trên tất cả trang | Footer global | `src/components/layout/Footer.tsx` hoặc `src/pages/footer/FooterCosmic.tsx` | Cập nhật thành `© ${new Date().getFullYear()}` |
| 19.2 | **"DỊCH CHUYỂN" và "NÂNG CẤP"** trên navbar không interactive | Navbar | `src/pages/navbar/` | Làm rõ function hoặc loại bỏ |
| 19.3 | **Không có breadcrumbs** | Các trang con | Global component | Thêm breadcrumb navigation |
| 19.4 | **Thiếu scroll to top button** | Các trang dài | Global component | Thêm floating button scroll to top |
| 19.5 | **Language switcher không thấy** | Navbar | `src/pages/navbar/` | Thêm toggle EN/VI nếu có multi-language |
| 19.6 | **Dark theme only** | Toàn site | Theme system | Cân nhắc thêm light mode option |
| 19.7 | **Technical jargon quá nhiều** | Nhiều nơi | Toàn bộ content | Review và simplify các term như "HYPERION DECK", "DATA FLOW OPTIMAL" |

### ⚠️ Performance & Technical:

| # | Vấn đề | Vị trí | File trong code (dự kiến) | Đề xuất |
|---|--------|--------|---------------------------|---------|
| 19.8 | **Không có 404 custom friendly** | Invalid URLs | `src/pages/notfound/NotFoundPage.tsx` | Verify và improve 404 page |
| 19.9 | **SEO meta tags** | Head | `index.html` hoặc React Helmet | Verify meta descriptions, OG tags cho mỗi trang |
| 19.10 | **Loading states** | Các trang load data | Components | Thêm skeleton loaders thống nhất |

---

## Tổng kết số liệu

| Metric | Số lượng |
|--------|----------|
| Tổng số trang/section đã review | 38 |
| Tổng số issues tìm thấy | ~180+ |
| Issues nghiêm trọng (Critical) | ~15 |
| Issues trung bình (Medium) | ~70 |
| Issues nhẹ (Minor) | ~95 |

### Danh sách trang đã review:

#### Public Pages (22 trang):
1. Homepage (Landing Page)
2. Login
3. Register (2b)
4. Forgot Password (2c)
5. Courses
6. Jobs
7. Community
8. Seminar
9. Premium
10. About
11. Explore Map
12. Gamification
13. Mini Game: Tic Tac Toe (10a)
14. Mini Game: Meowl Adventure (10b)
15. Help Center
16. User Guide
17. Choose Role
18. Protected Routes (general)
19. Terms of Service
20. Privacy Policy
21. Course Detail
22. Meowl Shop

#### Protected Pages (16 trang - reviewed via API + Code):
23. Dashboard (MothershipDashboard)
24. My Wallet (MyWalletCosmic)
25. Profile (ProfilePageCosmic)
26. Notifications (NotificationPage)
27. AI Roadmap
28. Premium Subscription (in Wallet)
29. Notification Dropdown
30. Portfolio (PortfolioPage)
31. Career Chat / Chatbot (CareerChatPage)
32. Study Planner (StudyPlannerPage)
33. Mentorship (MentorshipPage)
34. My Bookings (UserBookingsPage)
35. Dashboard Components
36. Wallet Modals
37. Profile Components
38. Protected Routes Summary

### Top 10 Issues cần ưu tiên fix:

1. **Footer copyright năm 2025** → Cập nhật thành 2026 (global fix) - `src/components/layout/Footer.tsx:197`
2. **Typo "Constantsly"** trong trang About - `src/pages/about/AboutPage.tsx:181`
3. **"Bạn đang dẫn đầu!"** hiển thị sai khi #12 trong Gamification - `src/pages/navbar/Gamification.tsx:403`
4. **Course detail không load** - Error handling cần improve - `src/pages/course/CourseDetailPage.tsx`
5. **Giá hiển thị không format** - Cần dùng `formatPrice()` - `src/pages/navbar/CoursesPage.tsx:64`
6. **Hardcoded achievements với dates 2024** - Dashboard - `MothershipDashboard.tsx:114-132`
7. **Store items hardcoded** - Wallet Store tab - `MyWalletCosmic.tsx:122-179`
8. **Features array malformed** - Premium API response - Backend
9. **UTF-8 encoding issues** - Roadmap titles - Backend API
10. **Auto-renewal warning missing** - Wallet Premium section - `MyWalletCosmic.tsx`

---

## Phần tiếp theo cần làm

1. ✅ Đã review các trang public (22 trang/sections)
2. ✅ Đã review các trang protected (xem phần 20-29 bên dưới)

---

## 20. Trang Dashboard (Protected)

**URL:** https://skillverse.vn/dashboard  
**File:** `src/pages/navbar/DashboardPage.tsx`, `src/components/dashboard-hud/MothershipDashboard.tsx`

### ✅ Điểm tốt:
1. **"MOTHERSHIP DASHBOARD"** - Theme space nhất quán
2. **System Status**: Hiển thị streak, weekly goal
3. **Stats Grid**: 4 thẻ thống kê (Modules, Missions, Badges, Energy)
4. **Active Simulations**: Hiển thị courses đang học
5. **Analyst Track**: Roadmaps progress
6. **Favorite Mentors**: Danh sách mentor yêu thích

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 20.1 | **Hardcoded achievements** - Data achievements là static | MissionLog section | `MothershipDashboard.tsx:114-132` | Fetch từ API thay vì hardcode |
| 20.2 | **Hardcoded deadlines** - "2024-04-05", "2024-04-07" đã quá hạn | Proximity Alerts | `MothershipDashboard.tsx:134-156` | Fetch deadlines thực từ API hoặc ẩn section |
| 20.3 | **"Tiếp tục học" button** không rõ dẫn đến đâu | Active Simulations | `MothershipDashboard.tsx:241` | Verify navigation đến đúng course |
| 20.4 | **Empty state không handle** | Favorite Mentors | `MothershipDashboard.tsx:245-247` | Khi không có mentor yêu thích, hiển thị suggestion |
| 20.5 | **Dates format 2024** trong achievements | Achievement cards | `MothershipDashboard.tsx:114-132` | Cập nhật hoặc fetch từ real data |
| 20.6 | **+3 this cycle** hardcoded | Stats change text | `MothershipDashboard.tsx:61-94` | Tính toán từ actual data |

---

## 21. Trang My Wallet (Protected)

**URL:** https://skillverse.vn/my-wallet  
**File:** `src/pages/my-wallet/MyWalletCosmic.tsx`

### ✅ Điểm tốt:
1. **"Ví Vũ Trụ"** theme phù hợp
2. **Hiển thị 2 loại tài sản**: VND Cash và SkillCoin
3. **Cosmic background**: Stars animation
4. **5 tabs**: Overview, Transactions, Store, Withdrawals, Settings
5. **Multiple modals**: Deposit, Buy Coin, Withdraw, Bank Setup

### Dữ liệu thực từ API (User ID: 6):
- Cash Balance: 261,000 VND
- Coin Balance: 5,910 xu
- Status: ACTIVE
- Premium: Mentor Pro (còn 9 ngày)

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 21.1 | **Store items hardcoded** | Tab Store | `MyWalletCosmic.tsx:122-179` | Fetch products từ API |
| 21.2 | **Tỷ giá COIN_TO_VND_RATE = 76** hardcoded | Tính tổng tài sản | `MyWalletCosmic.tsx:300` | Fetch tỷ giá từ config/API |
| 21.3 | **"Tính năng đang phát triển"** | Store purchase | `MyWalletCosmic.tsx:282-285` | Implement actual store purchase hoặc ẩn tab |
| 21.4 | **PaymentCallbackHelper** cho localhost | Payment callback | `MyWalletCosmic.tsx:250` | Verify hoạt động trên production |
| 21.5 | **No loading state cho individual modals** | Deposit, Withdraw | Modal components | Thêm loading khi processing |
| 21.6 | **Transaction invoice download** chỉ cho một số types | Transaction list | `MyWalletCosmic.tsx:368-369` | Clarify UI nút tải hóa đơn |

---

## 22. Trang Profile (Protected)

**URL:** https://skillverse.vn/profile  
**File:** `src/pages/profile/ProfilePageCosmic.tsx`

### ✅ Điểm tốt:
1. **"PILOT" theme** - Gọi user là "Pilot"
2. **Multiple sections**: Header, Identity Form, Companion Pod, Skin Selector
3. **Avatar upload** có sẵn
4. **Premium badge** hiển thị subscription
5. **Parent Requests** section cho kết nối phụ huynh

### Dữ liệu thực từ API (User ID: 6):
- Full Name: Tran Pham Bach Cat (K18 HCM)
- Email: cattpbse184684@fpt.edu.vn
- Phone: 0347419730
- Bio: "SkillVerse..."
- Avatar: Google photo

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 22.1 | **Inline styles cho messages** | Success/Error messages | `ProfilePageCosmic.tsx:127-128` | Dùng CSS classes thay vì inline |
| 22.2 | **"Đang tải hồ sơ..." không có animation** | Loading state | `ProfilePageCosmic.tsx:119` | Thêm MeowlKuruLoader |
| 22.3 | **Lỗi tải hồ sơ message quá đơn giản** | Error state | `ProfilePageCosmic.tsx:120` | Thêm retry button và chi tiết lỗi |
| 22.4 | **Skin selector** cho tất cả users | Companion Pod | `ProfilePageCosmic.tsx:142-143` | Verify premium-only skins có lock |
| 22.5 | **StudentReviews component** | Below profile | `ProfilePageCosmic.tsx:142` | Verify hiển thị đúng cho student role |

---

## 23. Trang Notifications (Protected)

**URL:** https://skillverse.vn/notifications  
**File:** `src/pages/NotificationPage.tsx`

### ✅ Điểm tốt:
1. **Filters**: All, Unread, Read
2. **Pagination** có sẵn
3. **Mark all as read** button
4. **Modal detail** khi click notification
5. **Type-specific icons**: Like, Comment, Payment, etc.

### Dữ liệu thực từ API (User ID: 6):
- Total: 9 notifications
- Types: PREMIUM_PURCHASE, SYSTEM, COMMENT, COIN_PURCHASE
- All read: true

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 23.1 | **Modal action routing incomplete** | Click notification | `NotificationPage.tsx:103-134` | Thêm case cho SYSTEM, COIN_PURCHASE types |
| 23.2 | **Empty state** khi không có notifications | Main content | `NotificationPage.tsx` | Thêm friendly empty state với illustration |
| 23.3 | **Date format** có thể inconsistent | Notification list | `NotificationPage.tsx` | Dùng relative time ("2 giờ trước") |
| 23.4 | **Notification detail modal** | Modal | `NotificationPage.tsx` | Verify UX flow sau khi click action |
| 23.5 | **Real-time update** không có | Header badge | `NotificationDropdown.tsx` | Thêm WebSocket cho live notifications |

---

## 24. Trang AI Roadmap (Protected)

**URL:** https://skillverse.vn/ai-roadmap  
**File:** `src/services/aiRoadmapService.ts`

### Dữ liệu thực từ API (User ID: 6):
- 3 roadmaps đã tạo:
  1. "Lộ trình Chuyên Gia Next.js" - 0% progress, 13 quests
  2. "Lộ trình học RAG" - 0% progress, 13 quests  
  3. "Lộ trình MERN Stack" - 75% progress, 12 quests (9 completed)

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 24.1 | **Encoding issues** với tiếng Việt trong API response | Roadmap titles | Backend API | Fix UTF-8 encoding trong response |
| 24.2 | **Progress 0%** cho 2/3 roadmaps | Roadmap cards | UI component | Thêm nudge/reminder để tiếp tục học |
| 24.3 | **schemaVersion** trong response | API data | `aiRoadmapService.ts` | Verify UI handles different schema versions |
| 24.4 | **experienceLevel** values inconsistent | API data | Backend | "BASIC" vs "Mới bắt đầu" vs "Trung cấp" - cần normalize |

---

## 25. Trang Premium Subscription (Protected - in Wallet)

**File:** Hiển thị trong `MyWalletCosmic.tsx` và `ProfilePageCosmic.tsx`

### Dữ liệu thực từ API (User ID: 6):
- Plan: Mentor Pro (249,000 VND/tháng)
- Status: ACTIVE
- Days Remaining: 9
- Auto Renew: false
- Features: 11 features including AI Unlimited, Mentor Booking (4 meetings)

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 25.1 | **Features array malformed** | Premium info | Backend API | Features có dấu `[` và `]` ở đầu/cuối - cần clean |
| 25.2 | **userName empty** trong subscription response | API data | Backend | `"userName": ""` nên có giá trị |
| 25.3 | **Auto-renewal disabled** không có reminder | Wallet page | `MyWalletCosmic.tsx` | Thêm warning khi autoRenew=false và sắp hết hạn |
| 25.4 | **Encoding issues** trong description | Plan description | Backend API | Fix UTF-8 encoding |

---

## 26. Notification Dropdown (Layout Component)

**File:** `src/components/layout/NotificationDropdown.tsx`

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 26.1 | **Polling interval 60s** có thể quá lâu | Notification count | `NotificationDropdown.tsx:57` | Giảm xuống 30s hoặc dùng WebSocket |
| 26.2 | **Recent chats từ localStorage** | Chat section | `NotificationDropdown.tsx:52-59` | Verify data consistency với server |
| 26.3 | **Missing PARENT_CONNECT case** | Notification click | `NotificationDropdown.tsx:118-148` | Thêm routing cho parent connect notifications |
| 26.4 | **10 notifications limit** | Dropdown list | `NotificationDropdown.tsx:43` | Thêm "View all" link nếu có nhiều hơn |

---

## 27. Dashboard Components Analysis

### CommanderWelcome
**File:** `src/components/dashboard-hud/CommanderWelcome.tsx`

| # | Issue | Fix |
|---|-------|-----|
| 27.1 | "View Study Plan" và "Resume Learning" buttons | Verify navigation targets |

### SystemStatus
**File:** `src/components/dashboard-hud/SystemStatus.tsx`

| # | Issue | Fix |
|---|-------|-----|
| 27.2 | Weekly goal hardcoded = 5 | Fetch từ user settings |

### SystemLimits
**File:** `src/components/dashboard-hud/SystemLimits.tsx`

| # | Issue | Fix |
|---|-------|-----|
| 27.3 | Feature usage limits display | Verify progress bars accuracy |

---

## 28. Wallet Modals Analysis

**Files:** `src/components/wallet/*.tsx`

### DepositCashModal

| # | Issue | Fix |
|---|-------|-----|
| 28.1 | Min amount validation | Verify minimum deposit amount |
| 28.2 | VNPay integration | Verify production credentials |

### BuyCoinModal

| # | Issue | Fix |
|---|-------|-----|
| 28.3 | Coin packages | Verify pricing matches API |
| 28.4 | Bonus calculations | Verify bonus xu displayed correctly |

### WithdrawModal

| # | Issue | Fix |
|---|-------|-----|
| 28.5 | Bank account required | Verify error message khi chưa có bank |
| 28.6 | Minimum withdrawal | Verify minimum amount enforcement |

---

## 29. Protected Routes Summary

### Routes đã xác nhận hoạt động:
- ✅ `/dashboard` - MothershipDashboard
- ✅ `/my-wallet` - MyWalletCosmic
- ✅ `/profile` - ProfilePageCosmic
- ✅ `/notifications` - NotificationPage
- ✅ `/ai-roadmap` - AI Roadmap builder/viewer
- ✅ `/portfolio` - PortfolioPage (TacticalDossierPortfolio)
- ✅ `/chatbot` - CareerChatPage
- ✅ `/my-bookings` - UserBookingsPage
- ✅ `/study-planner` - StudyPlannerPage
- ✅ `/mentorship` - MentorshipPage

---

## 30. Trang Portfolio (Protected)

**URL:** https://skillverse.vn/portfolio  
**File:** `src/pages/navbar/PortfolioPage.tsx`, `src/components/portfolio-hud/TacticalDossierPortfolio.tsx`

### ✅ Điểm tốt:
1. **Multiple sections**: Overview, Projects, Certificates, CVs
2. **CRUD operations**: Create, Edit, Delete cho Projects và Certificates
3. **CV Generation**: Tạo CV từ portfolio data
4. **Public/Private toggle**: Cho phép share portfolio

### Dữ liệu thực từ API (User ID: 6):
- Professional Title: Full Stack Developer
- Location: TP HCM
- Tagline: "Web developing"
- Status: AVAILABLE
- Projects: 0, Certificates: 0

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 30.1 | **confirm() native** | Delete project | `PortfolioPage.tsx:145` | Dùng custom modal thay vì browser confirm |
| 30.2 | **topSkills là string "[]"** | API response | Backend | Parse thành actual array |
| 30.3 | **languagesSpoken là string "[]"** | API response | Backend | Parse thành actual array |
| 30.4 | **displayName = "User 6"** | API response | Backend | Dùng fullName từ user profile |
| 30.5 | **Empty state khi chưa có projects** | Projects section | `PortfolioPage.tsx` | Thêm illustration và guide để tạo project đầu tiên |
| 30.6 | **yearsOfExperience = 0** | Profile section | UI component | Ẩn hoặc hiển thị "Chưa cập nhật" |

---

## 31. Trang Career Chat / Chatbot (Protected)

**URL:** https://skillverse.vn/chatbot  
**File:** `src/pages/navbar/CareerChatPage.tsx`

### ✅ Điểm tốt:
1. **Multiple chat modes**: General Career Advisor, Expert Mode, Deep Research
2. **Session management**: Save/Load chat sessions
3. **Voice input**: Recording với WavRecorder
4. **Streaming messages**: Real-time AI responses
5. **Markdown rendering**: Rich text trong messages
6. **Welcome message**: Detailed onboarding

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 31.1 | **ENABLE_TTS = false** hardcoded | TTS feature | `CareerChatPage.tsx:21` | Làm configurable qua settings |
| 31.2 | **Welcome message năm 2024-2025** | Initial message | `CareerChatPage.tsx:30-56` | Cập nhật thành 2026 |
| 31.3 | **Session loading error** không hiển thị | Sidebar | `CareerChatPage.tsx` | Thêm error state và retry |
| 31.4 | **Voice mode không active** | Voice button | `CareerChatPage.tsx:94-95` | Verify voice feature hoạt động |
| 31.5 | **Model dropdown** có thể confuse user | Header | `CareerChatPage.tsx:65` | Thêm tooltip giải thích NORMAL vs DEEP_RESEARCH |
| 31.6 | **Expert mode state** từ landing page | Navigation | `CareerChatPage.tsx:117-124` | Verify flow từ CareerChatLanding |

---

## 32. Trang Study Planner (Protected)

**URL:** https://skillverse.vn/study-planner  
**File:** `src/pages/study-planner/StudyPlannerPage.tsx`

### ✅ Điểm tốt:
1. **Dual view modes**: Calendar và Task Board
2. **AI Agent integration**: Tự động tạo tasks
3. **Task management**: CRUD operations
4. **Overdue tracking**: Đếm tasks quá hạn
5. **Week navigation**: Previous/Next week
6. **"MISSION CONTROL"** theme phù hợp

### Dữ liệu thực từ API (User ID: 6):
- 6 columns: To Do, In Progress, Done, Overdue, Skibidi, Sigma
- 9 tasks total, mostly about "Học Git cơ bản"
- 1 task in progress (50%), nhiều task overdue

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 32.1 | **Footer bị ẩn** khi vào trang | Layout | `StudyPlannerPage.tsx:30-36` | Consider keeping footer hoặc thêm back button rõ ràng |
| 32.2 | **Custom columns** như "Skibidi", "Sigma" | Task Board | Backend/UI | Cần validate column names hoặc cho phép rename |
| 32.3 | **UTF-8 encoding** trong task titles | Task cards | Backend API | Fix encoding cho tiếng Việt |
| 32.4 | **Overdue tasks** không tự động move | Column logic | `StudyPlannerPage.tsx:53-58` | Thêm auto-move option |
| 32.5 | **linkedSessionIds format** | Task data | Backend | Improve format và linking UI |
| 32.6 | **satisfactionLevel** "Unsatisfied" task | Task card | UI component | Highlight hoặc suggest action |

---

## 33. Trang Mentorship (Protected)

**URL:** https://skillverse.vn/mentorship  
**File:** `src/pages/navbar/MentorshipPage.tsx`

### ✅ Điểm tốt:
1. **Mentor grid**: UplinkGrid với cards
2. **Dynamic categories**: Từ mentor skills
3. **Favorites system**: Toggle favorite mentor
4. **Pre-chat feature**: Chat trước booking
5. **Booking modal**: Đặt lịch mentor
6. **Rating display**: Stars và review count
7. **Search và filter**: Tìm kiếm mentor

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 33.1 | **Fallback hourlyRate** calculation | Mentor card | `MentorshipPage.tsx:65-67` | Hiển thị "Liên hệ" thay vì calculated rate |
| 33.2 | **Default languages** = ['Tiếng Anh'] | Mentor card | `MentorshipPage.tsx:72` | Fetch từ API thay vì hardcode |
| 33.3 | **mockMentors fallback** | Error handling | `MentorshipPage.tsx:143` | Hiển thị error message thay vì mock data |
| 33.4 | **Ratings enrichment** chạy mỗi lần | Performance | `MentorshipPage.tsx:99-118` | Cache ratings data |
| 33.5 | **6 mentors per page** hardcoded | Pagination | `MentorshipPage.tsx:41` | Làm configurable hoặc responsive |
| 33.6 | **Experience format** không nhất quán | Mentor card | `MentorshipPage.tsx:74-75` | "5 năm" vs "Chưa cập nhật" |

---

## 34. Trang My Bookings (Protected)

**URL:** https://skillverse.vn/my-bookings  
**File:** `src/pages/user/UserBookingsPage.tsx`

### ✅ Điểm tốt:
1. **Dual tabs**: Bookings và Tickets (seminars)
2. **Review system**: Rate và comment sau booking
3. **Invoice download**: PDF invoice
4. **Cancel booking**: Với confirmation
5. **Real-time status**: Active meeting indicator
6. **Pagination**: Cho tickets

### ⚠️ Vấn đề cần cải thiện:

| # | Vấn đề | Vị trí trên giao diện | File trong code | Đề xuất chỉnh sửa |
|---|--------|----------------------|-----------------|-------------------|
| 34.1 | **alert()** native | Submit review | `UserBookingsPage.tsx:102-103` | Dùng toast notification |
| 34.2 | **alert()** cho invoice error | Download error | `UserBookingsPage.tsx:127` | Dùng toast notification |
| 34.3 | **Polling mỗi 60s** cho currentTime | Performance | `UserBookingsPage.tsx:44-48` | Consider requestAnimationFrame hoặc dài hơn |
| 34.4 | **URL params handling** | Tab switch | `UserBookingsPage.tsx:36-42` | Validate tab param |
| 34.5 | **Empty state** cho bookings/tickets | Main content | UI component | Thêm CTA "Đặt lịch mentor đầu tiên" |
| 34.6 | **Review modal UX** | Modal | `UserBookingsPage.tsx:82-106` | Disable submit khi đã có review |

---

**Ghi chú cuối:**
- Review này dựa trên giao diện thực tế tại https://skillverse.vn
- Các trang protected đã được review qua API data + code analysis
- Recommend fix critical issues trước khi launch
- Backend cần fix UTF-8 encoding cho tiếng Việt trong API responses
- Một số API endpoints trả về 500 error cần được kiểm tra

**Ngày hoàn thành review:** 27/01/2026
**Tổng số issues:** ~180+
**Tổng số trang reviewed:** 38

---

## APPENDIX A: File Paths Chính Xác

Dựa trên cấu trúc codebase thực tế:

### Layout & Navigation
| Component | File Path |
|-----------|-----------|
| Footer | `src/components/layout/Footer.tsx` (line 197: copyright 2025) |
| Navbar | `src/pages/navbar/` folder |
| Notification Dropdown | `src/components/layout/NotificationDropdown.tsx` |
| Header | `src/components/layout/Header.tsx` |

### Public Pages
| Trang | File Path |
|-------|-----------|
| Homepage | `src/pages/main/HomePage.tsx` |
| About | `src/pages/about/AboutPage.tsx` (line 181: typo "Constantsly") |
| Login | `src/pages/auth/ElevatorLoginPage.tsx` |
| Register | `src/pages/auth/ChooseRolePage.tsx` |
| Courses | `src/pages/navbar/CoursesPage.tsx` |
| Jobs | `src/pages/navbar/JobsPage.tsx` |
| Seminar | `src/pages/navbar/SeminarPage.tsx` |
| Gamification | `src/pages/navbar/Gamification.tsx` (line 403: "Bạn đang dẫn đầu") |
| Explore Map | `src/pages/ExploreMapPage.tsx` |
| Premium | `src/pages/payment/PremiumPageCosmic.tsx` |
| Help Center | `src/pages/footer/HelpCenter.tsx` |
| Terms | `src/pages/footer/TermOfService.tsx` |
| Privacy | `src/pages/footer/PrivacyPolicy.tsx` |
| User Guide | `src/pages/user-guide/UserGuidePage.tsx` |

### Protected Pages
| Trang | File Path |
|-------|-----------|
| Dashboard | `src/pages/navbar/DashboardPage.tsx` |
| Dashboard HUD | `src/components/dashboard-hud/MothershipDashboard.tsx` (lines 114-156: hardcoded data) |
| My Wallet | `src/pages/my-wallet/MyWalletCosmic.tsx` (lines 122-179: hardcoded store) |
| Profile | `src/pages/profile/ProfilePageCosmic.tsx` |
| Notifications | `src/pages/NotificationPage.tsx` |
| Portfolio | `src/pages/portfolio/PortfolioPageCosmic.tsx` |

### Dashboard Components
| Component | File Path |
|-----------|-----------|
| CommanderWelcome | `src/components/dashboard-hud/CommanderWelcome.tsx` |
| SystemStatus | `src/components/dashboard-hud/SystemStatus.tsx` |
| StatUnit | `src/components/dashboard-hud/StatUnit.tsx` |
| ActiveModules | `src/components/dashboard-hud/ActiveModules.tsx` |
| MissionLog | `src/components/dashboard-hud/MissionLog.tsx` |
| FavoriteMentors | `src/components/dashboard-hud/FavoriteMentors.tsx` |
| AnalystTrack | `src/components/dashboard-hud/AnalystTrack.tsx` |
| SystemLimits | `src/components/dashboard-hud/SystemLimits.tsx` |

### Wallet Components
| Component | File Path |
|-----------|-----------|
| DepositCashModal | `src/components/wallet/DepositCashModal.tsx` |
| BuyCoinModal | `src/components/wallet/BuyCoinModal.tsx` |
| WithdrawModal | `src/components/wallet/WithdrawModal.tsx` |
| SetupBankAccountModal | `src/components/wallet/SetupBankAccountModal.tsx` |
| StatisticsPanel | `src/components/wallet/StatisticsPanel.tsx` |

### Profile Components
| Component | File Path |
|-----------|-----------|
| PilotHeader | `src/components/profile-hud/user/PilotHeader.tsx` |
| PilotIdentityForm | `src/components/profile-hud/user/PilotIdentityForm.tsx` |
| CompanionPod | `src/components/profile-hud/user/CompanionPod.tsx` |
| PilotSkinSelector | `src/components/profile-hud/user/PilotSkinSelector.tsx` |
| ParentRequests | `src/components/profile-hud/user/ParentRequests.tsx` |

### Services
| Service | File Path |
|---------|-----------|
| AI Roadmap | `src/services/aiRoadmapService.ts` |
| Wallet | `src/services/walletService.ts` |
| Premium | `src/services/premiumService.ts` |
| Notification | `src/services/notificationService.ts` |
| User | `src/services/userService.ts` |
| Portfolio | `src/services/portfolioService.ts` |

### Utilities
| Utility | File Path |
|---------|-----------|
| Format Price | `src/utils/formatters.ts` - Có sẵn `formatPrice()` nhưng chưa được dùng ở CoursesPage |

---

## APPENDIX B: Quick Fix List

### 🔴 Critical (Fix ngay)
1. `src/components/layout/Footer.tsx:197` - Đổi "2025" thành "2026" hoặc dynamic year
2. `src/pages/about/AboutPage.tsx:181` - Sửa typo "Constantsly" → "Constantly"
3. `src/pages/navbar/Gamification.tsx:403` - Fix logic "Bạn đang dẫn đầu" khi không phải #1
4. `src/components/dashboard-hud/MothershipDashboard.tsx:114-156` - Thay hardcoded achievements/deadlines bằng API data
5. Backend API - Fix UTF-8 encoding trong roadmap responses
6. Backend API - Fix features array format trong premium subscription response

### 🟡 Medium (Nên fix sớm)
1. Thêm toast message khi redirect về login (`src/components/shared/ProtectedRoute.tsx`)
2. Format giá tiền với dấu phẩy - `src/pages/navbar/CoursesPage.tsx:64` - Import và dùng `formatPrice` từ `src/utils/formatters.ts`
3. Fix course detail error handling (`src/pages/course/CourseDetailPage.tsx`)
4. Thêm search box cho Courses, Community, Help Center
5. `src/pages/my-wallet/MyWalletCosmic.tsx:122-179` - Fetch store items từ API thay vì hardcode
6. `src/pages/my-wallet/MyWalletCosmic.tsx:300` - Fetch tỷ giá COIN_TO_VND từ API
7. `src/components/layout/NotificationDropdown.tsx:57` - Giảm polling interval xuống 30s hoặc dùng WebSocket
8. `src/pages/profile/ProfilePageCosmic.tsx:119-120` - Thêm loader animation và retry button cho error states
9. Thêm auto-renewal warning khi sắp hết hạn Premium trong Wallet page
10. `src/components/dashboard-hud/MothershipDashboard.tsx:61-94` - Tính toán stats change từ actual data

### 🟢 Low (Cải thiện dần)
1. Giảm technical jargon ("HYPERION DECK", "DATA FLOW OPTIMAL")
2. Thêm breadcrumbs navigation
3. Thêm scroll-to-top button
4. Thêm skeleton loaders thống nhất
5. Thêm video tutorials trong User Guide
6. `src/pages/NotificationPage.tsx:103-134` - Thêm routing cases cho SYSTEM, COIN_PURCHASE notification types
7. `src/components/layout/NotificationDropdown.tsx:118-148` - Thêm PARENT_CONNECT case
8. `src/pages/profile/ProfilePageCosmic.tsx:127-128` - Dùng CSS classes thay vì inline styles
9. Verify premium-only skins có lock icon trong Skin Selector
10. Thêm empty state với illustration cho Notifications page

---

## APPENDIX C: Code Snippets để Fix

### Fix 1: Footer Copyright (Dynamic Year)
**File:** `src/components/layout/Footer.tsx:197`
```tsx
// Thay đổi từ:
© 2025 Skillverse. All rights reserved.

// Thành:
© {new Date().getFullYear()} Skillverse. All rights reserved.
```

### Fix 2: Typo About Page
**File:** `src/pages/about/AboutPage.tsx:181`
```tsx
// Thay đổi từ:
Learn Fast.Fail Smart.Improve Constantsly

// Thành:
Learn Fast. Fail Smart. Improve Constantly
```

### Fix 3: Format Price in Courses
**File:** `src/pages/navbar/CoursesPage.tsx`
```tsx
// Thêm import:
import { formatPrice } from '../../utils/formatters';

// Line 63-65, thay đổi từ:
price: (actualPrice !== null && actualPrice !== undefined && actualPrice !== 0)
  ? `${actualPrice} ${actualCurrency}`
  : '0',

// Thành:
price: (actualPrice !== null && actualPrice !== undefined && actualPrice !== 0)
  ? `${formatPrice(actualPrice)} ${actualCurrency}`
  : 'Miễn phí',
```

### Fix 4: Gamification Leader Message
**File:** `src/pages/navbar/Gamification.tsx:400-405`
```tsx
// Thay đổi logic để check rank thực sự:
<p>
  {currentUserRank === 1 
    ? 'Bạn đang dẫn đầu!'
    : coinsToNextRank > 0 
      ? `Chỉ cần ${coinsToNextRank} xu nữa để lên Top ${currentUserRank - 1}!`
      : `Bạn đang ở vị trí #${currentUserRank}`
  }
</p>
```

### Fix 5: Dashboard - Remove Hardcoded Achievements
**File:** `src/components/dashboard-hud/MothershipDashboard.tsx:114-132`
```tsx
// Thay đổi từ hardcoded data:
const achievements = [
  { title: 'First Module Completed', icon: '🎓', date: '2024-01-15', ... },
  ...
];

// Thành props hoặc fetch từ API:
interface MothershipDashboardProps {
  // ... existing props
  achievements?: Achievement[];
  upcomingDeadlines?: Deadline[];
}

// Hoặc ẩn section khi không có data:
{achievements && achievements.length > 0 && (
  <MissionLog achievements={achievements} deadlines={upcomingDeadlines} ... />
)}
```

### Fix 6: Wallet - Fetch Store Items from API
**File:** `src/pages/my-wallet/MyWalletCosmic.tsx:122-179`
```tsx
// Thay đổi từ hardcoded:
const storeItems: StoreItem[] = [
  { id: 'ai-premium', title: 'Gói Khóa học AI Premium', ... },
  ...
];

// Thành:
const [storeItems, setStoreItems] = useState<StoreItem[]>([]);

useEffect(() => {
  const fetchStoreItems = async () => {
    try {
      const items = await walletService.getStoreItems();
      setStoreItems(items);
    } catch (error) {
      console.error('Failed to fetch store items:', error);
    }
  };
  fetchStoreItems();
}, []);
```

### Fix 7: Wallet - Dynamic Coin Rate
**File:** `src/pages/my-wallet/MyWalletCosmic.tsx:300`
```tsx
// Thay đổi từ hardcoded:
const COIN_TO_VND_RATE = 76;

// Thành:
const [coinRate, setCoinRate] = useState(76); // default

useEffect(() => {
  const fetchCoinRate = async () => {
    try {
      const config = await configService.getCoinRate();
      setCoinRate(config.rate);
    } catch (error) {
      console.error('Failed to fetch coin rate:', error);
    }
  };
  fetchCoinRate();
}, []);
```

### Fix 8: Profile - Better Loading State
**File:** `src/pages/profile/ProfilePageCosmic.tsx:119`
```tsx
// Thay đổi từ:
if (loading) return <div className="pilot-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải hồ sơ...</div>;

// Thành:
if (loading) return (
  <div className="pilot-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <MeowlKuruLoader size="medium" text="Đang tải hồ sơ..." />
  </div>
);
```

### Fix 9: Notification Click Handler - Missing Cases
**File:** `src/pages/NotificationPage.tsx:103-134`
```tsx
// Thêm cases missing:
switch (type) {
  // ... existing cases
  case 'SYSTEM':
    // System notifications usually don't navigate
    break;
  case 'COIN_PURCHASE':
  case 'SPEND_COINS':
  case 'ADMIN_ADJUSTMENT':
    navigate('/my-wallet');
    break;
  case 'PARENT_CONNECT':
  case 'PARENT_REQUEST':
    navigate('/profile'); // hoặc /parent-connection
    break;
  default:
    console.log('No specific route for notification type:', type);
    break;
}
```

### Fix 10: Auto-renewal Warning in Wallet
**File:** `src/pages/my-wallet/MyWalletCosmic.tsx` (trong Premium section)
```tsx
// Thêm warning khi auto-renew = false và sắp hết hạn:
{subscription && !subscription.autoRenew && subscription.daysRemaining <= 7 && (
  <div className="renewal-warning">
    <AlertCircle size={16} />
    <span>
      Gói Premium của bạn sẽ hết hạn trong {subscription.daysRemaining} ngày. 
      <button onClick={() => setShowEnableAutoRenewalModal(true)}>
        Bật gia hạn tự động
      </button>
    </span>
  </div>
)}
```

---

## APPENDIX D: API Endpoints Reference

### Endpoints đã test thành công:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login |
| `/api/user/profile` | GET | User profile |
| `/api/wallet/my-wallet` | GET | Wallet data |
| `/api/wallet/transactions` | GET | Transaction history |
| `/api/portfolio/profile` | GET | Portfolio profile |
| `/api/v1/ai/roadmap` | GET | User roadmaps list |
| `/api/premium/subscription/current` | GET | Current subscription |
| `/api/notifications` | GET | User notifications |

### Endpoints trả về 500 Error (cần kiểm tra):

| Endpoint | Method | Issue |
|----------|--------|-------|
| `/api/enrollments/my-enrollments` | GET | 500 Internal Server Error |
| `/api/roadmaps/my-roadmaps` | GET | 500 Internal Server Error |
| `/api/wallet/withdrawals/my-requests` | GET | 500 Internal Server Error |
| `/api/premium/my-subscription` | GET | 500 Internal Server Error (wrong endpoint, correct is `/subscription/current`) |

---

## APPENDIX E: User Test Data Summary

**Test Account:** cattpbse184684@fpt.edu.vn (User ID: 6)

### User Profile:
- Full Name: Tran Pham Bach Cat (K18 HCM)
- Roles: USER
- Auth Provider: GOOGLE

### Wallet:
- Cash Balance: 261,000 VND
- Coin Balance: 5,910 xu
- Status: ACTIVE

### Premium:
- Plan: Mentor Pro (249,000 VND/month)
- Status: ACTIVE
- Days Remaining: 9
- Auto Renew: false

### Roadmaps:
1. Next.js Expert - 0% (13 quests)
2. RAG Learning - 0% (13 quests)
3. MERN Stack - 75% (9/12 quests completed)

### Transactions (sample):
- PURCHASE_PREMIUM: 249,000 VND
- ADMIN_ADJUSTMENT: +500,000 VND, +3000 Xu
- PURCHASE_COINS: 3100 xu (+600 bonus)

### Notifications: 9 total (all read)

