# Trang Jobs

**URL:** https://skillverse.vn/jobs  
**File:** `src/pages/navbar/JobsPage.tsx`

---

## ✅ Điểm tốt

1. **Có bộ lọc đầy đủ**: Từ khóa, Khu vực làm việc, Khoảng ngân sách
2. **Filter khu vực**: Tất cả, Làm việc từ xa, Làm việc tại chỗ
3. **Range slider cho ngân sách**: 0 - 50,000,000 VND
4. **Nút reset bộ lọc**

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất | Trạng thái |
|---|--------|-----------|-----------|---------|------------|
| 4.1 | **Empty state message** không có suggestion | Main content | `JobsPage.tsx` | Thêm CTA "Đăng ký nhận thông báo" | ⏭️ **Bỏ qua** - Đã có message hướng dẫn |
| 4.2 | **"🃏" emoji random** | Bên cạnh reset | `JobsPage.tsx` | Loại bỏ | ✅ **Đã sửa** - Đổi thành 💼 |
| 4.3 | **Card symbols "♦ ♣ ♥ ♠"** lặp nhiều lần | Header | `JobsPage.tsx` | Giảm bớt | ✅ **Đã sửa** - Giảm từ 12 xuống 6 |
| 4.4 | **Thiếu filter theo ngành nghề** | Sidebar | Component | Thêm filter IT, Marketing, etc. | ⏭️ **Bỏ qua** - Improvement feature |
| 4.5 | **Thiếu filter theo kinh nghiệm** | Sidebar | Component | Thêm Fresher, 1-2 năm, etc. | ⏭️ **Bỏ qua** - Improvement feature |
| 4.6 | **"BẢNG CÔNG VIỆC"** có thể thân thiện hơn | Header | `JobsPage.tsx` | Đổi thành "Cơ hội việc làm" | ✅ **Đã sửa** |
| 4.7 | **"CHỌN CƠ HỘI"** không cần khi empty | Header | `JobsPage.tsx` | Ẩn khi không có job | ✅ **Đã sửa** - Đổi thành "Khám phá công việc phù hợp với bạn" |

---

## 📝 Ghi chú

- Hiện tại không có công việc nào được đăng
- Cần test lại khi có data thực
- Theme card game (♦♣♥♠) có thể phù hợp gamification nhưng cần consistency

---

### 🆕 Round 3 (2026-01-28) – UI/UX “nịnh mắt” hơn

| # | Quan sát (cảm nhận người dùng) | Vì sao “sượng” | Gợi ý cải thiện | Mức |
|---|-------------------------------|----------------|-----------------|-----|
| 4.8 | Empty state hơi “lạnh” khi không có job | Người dùng dễ rời đi | Thêm 1 CTA rõ ràng: “Nhận thông báo việc làm” + 1–2 gợi ý filter phổ biến | High |
| 4.9 | Filter nhiều nhưng thiếu điểm nhấn | Người dùng không biết bắt đầu ở đâu | Thêm preset chips (Remote / Fresher / Intern) để click nhanh | Medium |
| 4.10 | Budget slider có thể khó đọc trên nền/space theme | Cảm giác “kỹ thuật”, ít thân thiện | Tăng size label, thêm tick marks (5m/10m/20m…) và highlight giá trị đang chọn | Low |

---

## 🔄 Review Date: 2026-01-27

**Người thực hiện:** AI Assistant  
**Tổng kết:** 4/7 issues đã fix, 3/7 bỏ qua (improvement features)
