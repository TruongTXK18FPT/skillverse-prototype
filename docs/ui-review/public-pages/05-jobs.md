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

| # | Vấn đề | Vị trí UI | File Code | Đề xuất |
|---|--------|-----------|-----------|---------|
| 4.1 | **Empty state message** không có suggestion | Main content | `JobsPage.tsx` | Thêm CTA "Đăng ký nhận thông báo" |
| 4.2 | **"🃏" emoji random** | Bên cạnh reset | `JobsPage.tsx` | Loại bỏ |
| 4.3 | **Card symbols "♦ ♣ ♥ ♠"** lặp nhiều lần | Header | `JobsPage.tsx` | Giảm bớt |
| 4.4 | **Thiếu filter theo ngành nghề** | Sidebar | Component | Thêm filter IT, Marketing, etc. |
| 4.5 | **Thiếu filter theo kinh nghiệm** | Sidebar | Component | Thêm Fresher, 1-2 năm, etc. |
| 4.6 | **"BẢNG CÔNG VIỆC"** có thể thân thiện hơn | Header | `JobsPage.tsx` | Đổi thành "Cơ hội việc làm" |
| 4.7 | **"CHỌN CƠ HỘI"** không cần khi empty | Header | `JobsPage.tsx` | Ẩn khi không có job |

---

## 📝 Ghi chú

- Hiện tại không có công việc nào được đăng
- Cần test lại khi có data thực
- Theme card game (♦♣♥♠) có thể phù hợp gamification nhưng cần consistency
