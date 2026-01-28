# Trang Help Center & User Guide

---

## Help Center

**URL:** https://skillverse.vn/help-center  
**File:** `src/pages/footer/HelpCenter.tsx`

### ✅ Điểm tốt
1. **FAQ categories đầy đủ**: Tài khoản, Khóa học, Thanh toán, Cộng đồng
2. **Accordion format**: Dễ tìm kiếm
3. **Contact info đầy đủ**: Email, Hotline, Giờ làm việc
4. **Multiple tabs**: FAQ, Gửi yêu cầu, Tra cứu ticket

### ⚠️ Issues

| # | Issue | Fix | Status |
|---|-------|-----|--------|
| 11.1 | FAQ answers quá ngắn | Thêm screenshots/links | ⏭️ SKIPPED (Content - cần team nội dung) |
| 11.2 | "24/7" nhưng "8h-22h" inconsistent | Sửa FAQ | ⏭️ SKIPPED (Content - cần xác nhận business) |
| 11.3 | Thiếu search box | Thêm search | ⏭️ SKIPPED (Đã có search box trong hero section) |
| 11.4 | Tab "Tra cứu ticket" cần verify | Test functionality | ⏭️ SKIPPED (QA task) |
| 11.5 | "HELP CENTER" English subtitle | Đổi tiếng Việt | ✅ FIXED: Đổi thành "HỖ TRỢ 24/7" |

---

## User Guide

**URL:** https://skillverse.vn/user-guide  
**File:** `src/pages/user-guide/UserGuidePage.tsx`

### ✅ Điểm tốt
1. **3 bước rõ ràng**: Chọn vai trò → Đăng ký → Bắt đầu
2. **Thông tin đầy đủ** cho mỗi bước
3. **CTA buttons đúng chỗ**
4. **Tabs cho từng role**: Project Blueprint, Pilot Protocol, Khách

### ⚠️ Issues

| # | Issue | Fix | Status |
|---|-------|-----|--------|
| 12.1 | "MISSION BRIEFING" quá technical | Đổi thành "Hướng dẫn sử dụng" | ✅ FIXED: Đổi title + subtitle sang tiếng Việt |
| 12.2 | Thiếu video tutorial | Thêm video | ⏭️ SKIPPED (Content - cần team nội dung) |
| 12.3 | Tab names không rõ | Đổi thành "Người học", "Mentor" | ✅ FIXED: "Tính Năng Chính", "Hướng Dẫn Theo Vai Trò" + "TÍNH NĂNG NỔI BẬT" header |
| 12.4 | "Meowl nhắc bạn nè!" style không nhất quán | Thống nhất tips style | ⏭️ SKIPPED (Minor style - cần thiết kế lại) |
| 12.5 | Thiếu screenshots | Thêm hình minh họa | ⏭️ SKIPPED (Content - cần assets) |

---

### 🆕 Round 2 Issues (2026-01-27)

#### Help Center

| # | Issue | Fix | Status |
|---|-------|-----|--------|
| 11.6 | **Native confirm() call** | Khi đóng ticket dùng browser confirm | 📝 **Medium** - Cần custom modal |
| 11.7 | **"24/7" vs "8h-22h" inconsistent** | Tagline "HỖ TRỢ 24/7" nhưng FAQ nói 8h-22h | 📝 **Medium** - Clarify AI vs human support |
| 11.8 | **Missing accessibility** | Buttons thiếu aria-label | 📝 **Medium** |
| 11.9 | **Guest bị redirect sang /login khi vào Help Center** | Public page nhưng bị auto-redirect | 🔴 **CRITICAL** - Block user xem nội dung |

#### User Guide

| # | Issue | Fix | Status |
|---|-------|-----|--------|
| 12.6 | **Possible broken links** | Links như `/roadmap`, `/study-planner`, `/chatbot/expert` | 🔴 **CRITICAL** - Verify routes exist |
| 12.7 | **"INITIALIZE PROJECT" English** | CTA button text | 📝 **Low** - Đổi "Bắt Đầu Ngay" |
| 12.8 | **"EXAMPLE:" English label** | Examples section | 📝 **Low** - Đổi "VÍ DỤ:" |
| 12.9 | **Missing aria-labels** | Role navigation buttons | 📝 **Medium** |

---

### 🆕 Round 3 (2026-01-28) – UI/UX “nịnh mắt” hơn

#### Help Center

| # | Quan sát (cảm nhận người dùng) | Vì sao “sượng” | Gợi ý cải thiện | Mức |
|---|-------------------------------|----------------|-----------------|-----|
| 11.10 | FAQ nhiều mục dễ tạo cảm giác “dày” | Người dùng ngại mở từng câu | Nhóm theo top questions + thêm “Xem thêm” theo category | Medium |
| 11.11 | Contact info có thể bị chìm | Người cần hỗ trợ gấp khó thấy | Làm 1 card nổi (hotline/email) + icon rõ + CTA “Gửi yêu cầu” | High |

#### User Guide

| # | Quan sát (cảm nhận người dùng) | Vì sao “sượng” | Gợi ý cải thiện | Mức |
|---|-------------------------------|----------------|-----------------|-----|
| 12.10 | Hướng dẫn nhiều chữ, ít “minh họa” | Dễ đọc mệt | Thêm 1–2 hình minh họa nhỏ hoặc sơ đồ 3 bước (có thể dùng icon) | Medium |
| 12.11 | CTA nên nhất quán tone (VN/space theme) | Người dùng cảm giác lạc tone | Chuẩn hóa microcopy CTA theo cùng giọng (thân thiện, hành động rõ) | Low |
