# Trang About

**URL:** https://skillverse.vn/about  
**File:** `src/pages/about/AboutPage.tsx`

---

## ✅ Điểm tốt

1. **Thông tin đầy đủ**: Giải pháp, Tính năng, Đối tượng, Đội ngũ
2. **Visual storytelling tốt**: 3 vấn đề → 3 giải pháp
3. **Team section có ảnh và social links**
4. **Tầm nhìn dài hạn rõ ràng**

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất | Trạng thái |
|---|--------|-----------|-----------|---------|------------|
| 8.1 | **Typo "Constantsly"** 🔴 CRITICAL | Hero section | `AboutPage.tsx:181` | Sửa thành "Constantly" | ✅ **Đã sửa** - Thêm spacing sau dấu chấm |
| 8.2 | **Copyright mismatch** - "2025" vs "2024" | Footers | `AboutPage.tsx` | Thống nhất 2026 | ✅ **Đã sửa** - Dynamic year |
| 8.3 | **Team icons** không có text label | Team section | `AboutPage.tsx` | Thêm tooltip | ⏭️ **Bỏ qua** - Icons đã rõ ràng |
| 8.4 | **Team member** thiếu description roles | Team section | `AboutPage.tsx` | Thêm 1-2 dòng mô tả | ⏭️ **Bỏ qua** - Improvement feature |
| 8.5 | **Supervisor** không có ảnh | Team header | `AboutPage.tsx` | Thêm ảnh/link | ⏭️ **Bỏ qua** - Cần asset |
| 8.6 | **"∞ Khả năng"** không cụ thể | Stats bar | `AboutPage.tsx` | Đổi thành số liệu thực | ⏭️ **Bỏ qua** - Design choice |
| 8.7 | **Guest bị redirect sang /login (public page bị khóa)** 🔴 CRITICAL | On load | (Global) | Public page phải luôn xem được khi chưa đăng nhập | 🆕 **New (2026-01-28)** |

---

## 💡 Code Fix Đã Thực Hiện

### Fix 8.1: Typo "Constantsly" (CRITICAL)

```tsx
// src/pages/about/AboutPage.tsx:181
// Thay đổi từ:
Learn Fast.Fail Smart.Improve Constantsly

// Thành:
Learn Fast. Fail Smart. Improve Constantly
```

### Fix 8.2: Copyright Dynamic Year

```tsx
// src/pages/about/AboutPage.tsx:542
// Thay đổi từ:
SKILLVERSE © 2024 - Learn Smart. Practice Real. Work Confidently.

// Thành:
SKILLVERSE © {new Date().getFullYear()} - Learn Smart. Practice Real. Work Confidently.
```

---

## 📝 Ghi chú

- Trang về chúng tôi khá hoàn chỉnh
- Cần cập nhật thông tin khi có data mới
- Repro 8.7: Guest (xóa localStorage/sessionStorage) mở `/about` → bị chuyển sang `/login`

---

### 🆕 Round 3 (2026-01-28) – UI/UX “nịnh mắt” hơn

| # | Quan sát (cảm nhận người dùng) | Vì sao “sượng” | Gợi ý cải thiện | Mức |
|---|-------------------------------|----------------|-----------------|-----|
| 8.8 | Nội dung dài nhưng thiếu “điểm nghỉ” khi đọc | Người dùng dễ mệt | Giới hạn độ rộng đoạn văn (max-width) + tăng line-height nhất quán | Medium |
| 8.9 | Section headings nếu đồng cấp quá giống nhau | Khó nhận ra cấu trúc câu chuyện | Dùng bậc typography rõ: H2/H3 khác biệt hơn, thêm subheading 1 câu | Low |
| 8.10 | Team section có thể thiếu “tín nhiệm” nếu role mờ | Người dùng không hiểu từng người làm gì | Thêm role tag nhỏ (PM/Dev/Design/Advisor) để nhìn 3 giây hiểu ngay | High |

---

## 🔄 Review Date: 2026-01-27

**Người thực hiện:** AI Assistant  
**Tổng kết:** 2/6 issues đã fix (bao gồm 1 CRITICAL), 4/6 bỏ qua
