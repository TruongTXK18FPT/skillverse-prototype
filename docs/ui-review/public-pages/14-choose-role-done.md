# Trang Choose Role & Terms/Privacy

---

## Choose Role Page

**URL:** https://skillverse.vn/choose-role  
**File:** `src/pages/auth/ChooseRolePage.tsx`

### ✅ Điểm tốt
1. **4 roles rõ ràng**: Người học, Người dạy, Nhà tuyển dụng, Phụ huynh
2. **Visual icons đẹp**: Meowl characters cho mỗi role
3. **Descriptions ngắn gọn**
4. **Responsive layout**: Grid cards

### ⚠️ Issues

| # | Issue | Fix | Status |
|---|-------|-----|--------|
| 13.1 | Không có hover state rõ | Thêm hover effect | ⏭️ SKIPPED (Đã có hover state + speech bubble trong code) |
| 13.2 | Thiếu "compare roles" feature | Thêm comparison | ⏭️ SKIPPED (New feature - cần thiết kế) |
| 13.3 | "♦♣♥♠" decoration quá nhiều | Giảm bớt | ⏭️ SKIPPED (Không tìm thấy decoration này trong code) |
| 13.4 | Thiếu back button | Thêm navigation | ⏭️ SKIPPED (UX decision - có thể dùng browser back) |

---

## Terms of Service

**URL:** https://skillverse.vn/terms-of-service  
**File:** `src/pages/footer/TermOfService.tsx`

### ✅ Điểm tốt
1. **11 sections đầy đủ**
2. **Ngày cập nhật rõ**: 18/06/2025
3. **Contact info đầy đủ**
4. **Format dễ đọc**

### ⚠️ Issues

| # | Issue | Fix | Status |
|---|-------|-----|--------|
| 15.1 | Copyright "2025" | Cập nhật 2026 | ✅ FIXED: Sử dụng `{new Date().getFullYear()}` để tự động cập nhật |
| 15.2 | Thiếu Table of Contents | Thêm anchor links | ⏭️ SKIPPED (Feature mới - cần design) |
| 15.3 | Thiếu print/download | Thêm PDF option | ⏭️ SKIPPED (Feature mới - cần implement) |
| 15.4 | "Trụ sở: Đại học FPT" không đủ | Thêm địa chỉ đầy đủ | ⏭️ SKIPPED (Content - cần team business cung cấp) |

---

## Privacy Policy

**URL:** https://skillverse.vn/privacy-policy  
**File:** `src/pages/footer/PrivacyPolicy.tsx`

### ✅ Điểm tốt
1. **9 sections rõ ràng**
2. **GDPR-like structure**
3. **Contact info đầy đủ**

### ⚠️ Issues

| # | Issue | Fix | Status |
|---|-------|-----|--------|
| 16.1 | "PRIVACY POLICY" English | Đổi tiếng Việt | ✅ FIXED: Đổi thành "BẢO MẬT THÔNG TIN" |
| 16.2 | Footer copyright 2025 | Cập nhật 2026 | ⏭️ SKIPPED (Trang này dùng Footer chung đã được fix) |
| 16.3 | Thiếu cookie consent banner | Thêm popup | ⏭️ SKIPPED (Feature mới - cần implement riêng) |
| 16.4 | Thiếu Cookie Policy link | Thêm section | ⏭️ SKIPPED (Content - cần team legal) |
