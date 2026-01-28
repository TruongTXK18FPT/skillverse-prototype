# Trang Premium

**URL:** https://skillverse.vn/premium  
**File:** `src/pages/payment/PremiumPageCosmic.tsx`

---

## ✅ Điểm tốt

1. **4 tiers rõ ràng**: Free, Student (29k), Skill+ (79k), Pro (249k)
2. **Feature list đầy đủ cho mỗi tier**
3. **Visual hierarchy tốt**: Popular tag cho Skill+
4. **Avatar frames khác nhau**: Silver, Gold, Diamond

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất | Trạng thái |
|---|--------|-----------|-----------|---------|------------|
| 7.1 | **Tên tier không nhất quán** | Card headers | `PremiumPageCosmic.tsx` | Thống nhất naming | ⏭️ **Bỏ qua** - Data từ backend |
| 7.2 | **"MỖI 1 CHU KỲ"** không rõ | Price description | `PremiumPageCosmic.tsx` | Đổi thành "/ tháng" | ✅ **Đã sửa** - Đổi thành "/ tháng" hoặc "Vĩnh viễn" |
| 7.3 | **Features viết tắt** - "(Limited)", "(Unlimited)" | Feature list | `PremiumPageCosmic.tsx` | Diễn giải cụ thể | 🔧 **Backend** - Text từ API |
| 7.4 | **"ĐĂNG NHẬP ĐỂ TRUY CẬP"** cho tất cả gói | Button CTA | `PremiumPageCosmic.tsx` | Phân biệt CTA | ⏭️ **Bỏ qua** - Logic đã đúng |
| 7.5 | **Không có comparison table** | Layout | `PremiumPageCosmic.tsx` | Thêm tab so sánh | ⏭️ **Bỏ qua** - Improvement feature |
| 7.6 | **Thiếu FAQ section** | Footer page | `PremiumPageCosmic.tsx` | Thêm FAQ | ⏭️ **Bỏ qua** - Improvement feature |
| 7.7 | **"0 VND"** cho gói Free | Card price | `PremiumPageCosmic.tsx` | Đổi thành "Miễn phí" | ✅ **Đã sửa** |
| 7.8 | **"(4 meetings)"** không rõ timeframe | Feature Pro | `PremiumPageCosmic.tsx` | "4 buổi/tháng" | 🔧 **Backend** - Text từ API |

---

## 📝 Ghi chú

- Pricing structure hợp lý cho target audience (sinh viên)
- Cần test flow thanh toán sau đăng nhập

---

### 🆕 Round 2 Issues (2026-01-27)

| # | Vấn đề | Vị trí UI | File Code | Đề xuất | Trạng thái |
|---|--------|-----------|-----------|---------|------------|
| 7.9 | **English tags "STUDENT"/"POPULAR"** | Card badges | `RankCard.tsx:109,112` | Đổi thành Vietnamese | ✅ **Đã sửa Round 2** - "SINH VIÊN"/"PHỔ BIẾN" |
| 7.10 | **Native alert() call** | Student already has premium | `PremiumPageCosmic.tsx:127` | Dùng toast notification | 📝 **Medium** - Cần custom component |
| 7.11 | **page.reload() after payment** | After wallet payment | `PremiumPageCosmic.tsx` | Dùng React state update | 📝 **Low** |
| 7.12 | **No loading state** | Initial plan fetch | `PremiumPageCosmic.tsx` | Thêm loading skeleton | 📝 **Medium** |

---

### 🆕 Round 3 (2026-01-28) – UI/UX “nịnh mắt” hơn

| # | Quan sát (cảm nhận người dùng) | Vì sao “sượng” | Gợi ý cải thiện | Mức |
|---|-------------------------------|----------------|-----------------|-----|
| 7.13 | 4 gói nhìn khá giống nhau nếu lướt nhanh | Người dùng khó phân biệt, khó quyết | Làm rõ “điểm khác biệt 1 câu” cho mỗi gói + icon riêng (không chỉ badge) | High |
| 7.14 | CTA “ĐĂNG NHẬP ĐỂ TRUY CẬP” tạo cảm giác bị chặn | Dễ hụt hẫng với khách mới | Thêm CTA mềm: “Xem quyền lợi” (public) + CTA chính vẫn là đăng nhập khi mua | Medium |
| 7.15 | Giá/chu kỳ nên được nhấn mạnh hơn phần mô tả | Người dùng nhìn rối chữ | Tăng size price, giảm phụ đề, thống nhất format (29K/79K/249K) | Medium |
| 7.16 | Feature list dài dễ làm trang “nặng” | Đọc mệt | Cho phép collapse/expand: 5 feature nổi bật + “Xem thêm” | Low |

---

## 🔄 Review Date: 2026-01-27

**Người thực hiện:** AI Assistant  
**Tổng kết Round 1:** 2/8 issues đã fix, 2/8 cần Backend, 4/8 bỏ qua
**Tổng kết Round 2:** 1 fix, 3 noted
