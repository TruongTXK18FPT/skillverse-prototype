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
| 13.5 | Guest bị redirect sang /login khi vào Choose Role | Verify route guard cho public page | 📝 NEW (2026-01-28): Guest (clear storage) vào `http://localhost:5173/choose-role` → bị chuyển sang `/login` |

---

### 🆕 Round 3 (2026-01-28) – UI/UX “nịnh mắt” hơn

#### Choose Role

| # | Quan sát (cảm nhận người dùng) | Vì sao “sượng” | Gợi ý cải thiện | Mức |
|---|-------------------------------|----------------|-----------------|-----|
| 13.6 | 4 role cards nếu visual quá tương đồng | Người dùng khó chọn nhanh | Làm nổi “đối tượng phù hợp” bằng 1 line tag (vd: “Học để đi làm”, “Dạy để kiếm thêm”) | High |
| 13.7 | Description nếu dài dòng sẽ làm card “nặng” | Nhìn rối trên mobile | Giới hạn 2 dòng + tooltip/expand để xem thêm | Medium |

#### Terms of Service

| # | Quan sát (cảm nhận người dùng) | Vì sao “sượng” | Gợi ý cải thiện | Mức |
|---|-------------------------------|----------------|-----------------|-----|
| 15.6 | Trang điều khoản dài nhưng thiếu điều hướng tại chỗ | Người dùng mất phương hướng | Thêm sticky Table of Contents (desktop) + jump links (mobile accordion) | High |
| 15.7 | Paragraph nếu full-width | Khó đọc, mỏi mắt | Giới hạn max-width + tăng line-height, dùng typography cho heading rõ ràng | Medium |

#### Privacy Policy

| # | Quan sát (cảm nhận người dùng) | Vì sao “sượng” | Gợi ý cải thiện | Mức |
|---|-------------------------------|----------------|-----------------|-----|
| 16.6 | Nội dung policy mang tính pháp lý nhưng tone có thể quá “khô” | Người dùng lướt bỏ qua | Thêm phần tóm tắt 5 gạch đầu dòng ở đầu trang (“Chúng tôi thu thập gì / dùng để làm gì”) | Medium |

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
| 15.5 | Guest không xem được Terms (bị redirect /login) | Terms/Privacy nên public (không require auth) | 📝 NEW (2026-01-28): Test 5 lần guest vào `http://localhost:5173/terms-of-service` → 5/5 về `/login` |

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
| 16.5 | Guest vào Privacy Policy bị redirect /login (không ổn định) | Privacy nên public, fix route guard / auth gating | 📝 NEW (2026-01-28): Test 5 lần guest vào `http://localhost:5173/privacy-policy` → 4/5 về `/login` |
