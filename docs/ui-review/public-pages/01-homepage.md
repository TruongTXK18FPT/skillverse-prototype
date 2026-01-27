# Trang chủ (Homepage / Landing Page)

**URL:** https://skillverse.vn/  
**File:** `src/pages/main/HomePage.tsx`

---

## ✅ Điểm tốt

1. **Hero Section ấn tượng**: Slider với 5 slides giới thiệu các tính năng chính
2. **Thiết kế nhất quán**: Theme space/cosmic xuyên suốt
3. **CTA rõ ràng**: Các nút call-to-action được đặt hợp lý
4. **Thông tin đầy đủ**: Footer có đủ liên kết, thông tin liên hệ, mạng xã hội
5. **Thành tích giải thưởng**: Hiển thị các giải thưởng Top 11, Top 7, Top 25

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất |
|---|--------|-----------|-----------|---------|
| 1.1 | **Navbar thiếu nhất quán** - "DỊCH CHUYỂN" và "NÂNG CẤP" là text không có link | Navbar phải | `src/pages/navbar/` | Thêm tooltip hoặc dropdown menu |
| 1.2 | **"KHÁM PHÁ" button** không rõ dẫn đến đâu | Navbar trái | `src/pages/navbar/` | Đổi thành "Bản đồ khám phá" |
| 1.3 | **Footer copyright "2025"** | Footer | `src/components/layout/Footer.tsx:197` | Cập nhật thành 2026 hoặc dynamic |
| 1.4 | **Không có loading indicator** | Toàn trang | `src/App.tsx` | Thêm skeleton loading |
| 1.5 | **"INCOMING TRANSMISSION: TIKTOK_FEED"** - Text kỹ thuật | Social section | `src/pages/main/HomePage.tsx` | Đơn giản hóa |

---

## 💡 Code Fix

### Fix 1.3: Footer Copyright (Dynamic Year)

```tsx
// src/components/layout/Footer.tsx:197
// Thay đổi từ:
© 2025 Skillverse. All rights reserved.

// Thành:
© {new Date().getFullYear()} Skillverse. All rights reserved.
```

---

## 📝 Ghi chú

- Trang chủ load khá nhanh
- Responsive chưa kiểm tra được
- Animation slider mượt mà
