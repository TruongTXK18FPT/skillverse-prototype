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

| # | Vấn đề | Vị trí UI | File Code | Đề xuất |
|---|--------|-----------|-----------|---------|
| 7.1 | **Tên tier không nhất quán** | Card headers | `PremiumPageCosmic.tsx` | Thống nhất naming |
| 7.2 | **"MỖI 1 CHU KỲ"** không rõ | Price description | `PremiumPageCosmic.tsx` | Đổi thành "/ tháng" |
| 7.3 | **Features viết tắt** - "(Limited)", "(Unlimited)" | Feature list | `PremiumPageCosmic.tsx` | Diễn giải cụ thể |
| 7.4 | **"ĐĂNG NHẬP ĐỂ TRUY CẬP"** cho tất cả gói | Button CTA | `PremiumPageCosmic.tsx` | Phân biệt CTA |
| 7.5 | **Không có comparison table** | Layout | `PremiumPageCosmic.tsx` | Thêm tab so sánh |
| 7.6 | **Thiếu FAQ section** | Footer page | `PremiumPageCosmic.tsx` | Thêm FAQ |
| 7.7 | **"0 VND"** cho gói Free | Card price | `PremiumPageCosmic.tsx` | Đổi thành "Miễn phí" |
| 7.8 | **"(4 meetings)"** không rõ timeframe | Feature Pro | `PremiumPageCosmic.tsx` | "4 buổi/tháng" |

---

## 📝 Ghi chú

- Pricing structure hợp lý cho target audience (sinh viên)
- Cần test flow thanh toán sau đăng nhập
