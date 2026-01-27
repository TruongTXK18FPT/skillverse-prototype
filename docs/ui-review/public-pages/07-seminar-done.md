# Trang Seminar

**URL:** https://skillverse.vn/seminar  
**File:** `src/pages/navbar/SeminarPage.tsx`

---

## ✅ Điểm tốt

1. **Layout chuyên nghiệp**: "BẢN TIN HỘI THẢO" với dashboard style
2. **Có bộ lọc category**: Tất cả, Công nghệ, Kinh doanh, Thiết kế
3. **Có calendar filter icon**
4. **Hiển thị thống kê hệ thống**: Kênh, Hoạt động, Thời gian

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất | Trạng thái |
|---|--------|-----------|-----------|---------|------------|
| 6.1 | **Empty state không hấp dẫn** | Main content | `SeminarPage.tsx` | Thêm CTA "Đề xuất chủ đề" | ⏭️ **Bỏ qua** - Improvement feature |
| 6.2 | **"QUÉT RADAR"** không rõ action hay status | Button/label | `SeminarPage.tsx` | Đổi thành "Làm mới" | ✅ **Đã sửa** - Đổi thành "CẬP NHẬT" |
| 6.3 | **"VẬN HÀNH THÔNG TIN TRỰC TUYẾN"** quá dài | Header | `SeminarPage.tsx` | Rút gọn | ✅ **Đã sửa** - Đổi thành "SỰ KIỆN TRỰC TUYẾN" |
| 6.4 | **"KÊNH TRUYỀN BẢO MẬT ĐANG HOẠT ĐỘNG"** | Header | `SeminarPage.tsx` | Thay bằng "Kết nối ổn định" | ✅ **Đã sửa** |
| 6.5 | **"DIỄN GIẢ NỔI BẬT 📊 Chưa có dữ liệu"** | Sidebar | `SeminarPage.tsx` | Ẩn section khi empty | ⏭️ **Bỏ qua** - Cần logic phức tạp hơn |
| 6.6 | **"NHIỆM VỤ HOÀN THÀNH 0"** confusing | Sidebar stats | `SeminarPage.tsx` | Đổi thành "Đã tham gia: 0" | ✅ **Đã sửa** - Đổi thành "ĐÃ THAM GIA" và "SẮP DIỄN RA" |
| 6.7 | **Thiếu calendar view** | Header | `SeminarPage.tsx` | Thêm month view | ⏭️ **Bỏ qua** - Improvement feature |

---

## 📝 Ghi chú

- Hiện không có seminar nào
- Theme nhất quán với các trang khác
- Cần test khi có seminars thực tế

---

### 🆕 Round 2 Issues (2026-01-27)

| # | Vấn đề | Vị trí UI | File Code | Đề xuất | Trạng thái |
|---|--------|-----------|-----------|---------|------------|
| 6.8 | **English fallback "Recruiter"** | Modal & Detail page | `SeminarPage.tsx`, `SeminarDetailPage.tsx` | Đổi thành Vietnamese | ✅ **Đã sửa Round 2** - "Chưa cập nhật" |
| 6.9 | **Random sector number** | BriefingRow, BriefingCard | `BriefingRow.tsx`, `BriefingCard.tsx` | Dùng seminar.id để có số stable | ✅ **Đã sửa Round 2** |
| 6.10 | **Category filter không hoạt động** | Filter buttons | `SeminarPage.tsx:196` | Backend chưa hỗ trợ tags | 📝 **Backend Note** - Chờ API |
| 6.11 | **Date format inconsistent** | Modal vs Detail page | Various | Modal thiếu locale parameter | 📝 **Low** |
| 6.12 | **"ĐANG DIỄN RA" for ended seminars** | Countdown | `BriefingRow.tsx` | Thêm check CLOSED status | 📝 **Low** |

---

## 🔄 Review Date: 2026-01-27

**Người thực hiện:** AI Assistant  
**Tổng kết Round 1:** 4/7 issues đã fix, 3/7 bỏ qua
**Tổng kết Round 2:** 2 fixes, 3 noted
