# Trang Đăng nhập, Đăng ký, Quên mật khẩu

---

## Login Page

**URL:** https://skillverse.vn/login  
**File:** `src/pages/auth/ElevatorLoginPage.tsx`

### ✅ Điểm tốt
1. **Theme nhất quán**: "HYPERION DECK" phù hợp theme space
2. **Form đầy đủ**: Email, Password, Remember me, Forgot password
3. **Có option đăng nhập Google**
4. **Link đăng ký rõ ràng**

### ⚠️ Vấn đề

| # | Vấn đề | Vị trí UI | Đề xuất | Trạng thái |
|---|--------|-----------|---------|------------|
| 2.1 | **"SYS:ONLINE v2.4.1..."** text kỹ thuật gây rối | Footer form | Ẩn hoặc simplify | ✅ **Đã sửa** - Đổi thành text tiếng Việt thân thiện |
| 2.2 | **Không có password toggle** | Password field | Thêm icon eye | ⏭️ **Bỏ qua** - Đã có sẵn trong code |
| 2.3 | **Không có validation realtime** | Form fields | Hiển thị lỗi khi blur | ⏭️ **Bỏ qua** - Improvement, không phải bug |
| 2.4 | **Logo Google nhỏ và mờ** | Nút Google | Tăng size và contrast | ✅ **Đã sửa** - Tăng size từ 18px lên 24px |
| 2.5 | **"SKILLVERSE HYPERION"** lặp lại | Footer | Giữ 1 cái | ✅ **Đã sửa** - Đổi thành "SKILLVERSE XÁC THỰC" |
| 2.6 | **Guest bị spam lỗi 401 ở console khi mở trang (premium/skins)** | DevTools console | Tránh gọi API cần auth khi chưa đăng nhập (hoặc degrade gracefully, không log error liên tục) | 🆕 **New (2026-01-28)** |
| 2.7 | **Console bị spam lỗi từ script bên thứ 3 (fbcdn/Meta)** | DevTools console | Kiểm tra lại tích hợp tracking/chat widget; đảm bảo load đúng + không spam error | 🆕 **New (2026-01-28)** |

---

### 🆕 Round 3 (2026-01-28) – UI/UX “nịnh mắt” hơn (Login)

| # | Quan sát (cảm nhận người dùng) | Vì sao “sượng” | Gợi ý cải thiện | Mức |
|---|-------------------------------|----------------|-----------------|-----|
| 2.8 | Form login dễ tạo cảm giác “khô” | Thiếu 1 câu trấn an/giá trị | Thêm 1 dòng microcopy dưới title: “Đăng nhập để tiếp tục hành trình học tập” | Low |
| 2.9 | Primary CTA chưa chắc nổi bật trên nền space | Người dùng mất 1 nhịp để thấy nút | Tăng contrast + height nút (44–48px), giữ radius/hover nhất quán | Medium |
| 2.10 | Error message (khi sai) nếu chỉ đỏ/nhỏ | Dễ “căng thẳng” và khó hiểu | Viết lỗi thân thiện, đặt ngay dưới field, thêm icon nhỏ + copy hướng dẫn | High |

---

## Register Page

**URL:** https://skillverse.vn/register  
**File:** `src/pages/auth/ElevatorPersonalRegisterPage.tsx`

### ✅ Điểm tốt
1. **Form đầy đủ**: Họ tên, Email, Password, Confirm, SĐT, Khu vực, Bio
2. **Link đăng nhập có sẵn**
3. **Bio là optional** - rõ ràng

### ⚠️ Vấn đề

| # | Vấn đề | Vị trí UI | Đề xuất | Trạng thái |
|---|--------|-----------|---------|------------|
| 2b.1 | **Không có password strength indicator** | Password field | Thêm thanh strength | ⏭️ **Bỏ qua** - Improvement feature |
| 2b.2 | **"KHU VỰC ĐỊA CHỈ"** không rõ ràng | Address field | Đổi thành "Thành phố/Tỉnh" | ⏭️ **Bỏ qua** - Đã kiểm tra: field hiện là dropdown "Khu vực" với options rõ ràng |
| 2b.3 | **Thiếu terms acceptance checkbox** | Form bottom | Thêm checkbox | 🔧 **Backend** - Cần logic xử lý terms ở BE |
| 2b.4 | **Không có step indicator** | Header | Thêm progress steps | ⏭️ **Bỏ qua** - Form đơn giản, không cần steps |

---

## Forgot Password Page

**URL:** https://skillverse.vn/forgot-password  
**File:** `src/pages/auth/ElevatorForgotPasswordPage.tsx`

### ✅ Điểm tốt
1. **Form đơn giản**: Chỉ cần email
2. **Có link quay lại login**
3. **Title rõ ràng**: "KHÔI PHỤC MẬT KHẨU"

### ⚠️ Vấn đề

| # | Vấn đề | Vị trí UI | Đề xuất | Trạng thái |
|---|--------|-----------|---------|------------|
| 2c.1 | **Technical footer** giống login | Footer | Ẩn hoặc simplify | ✅ **Đã sửa** - Cùng component ElevatorAuthLayout |
| 2c.2 | **Không có instructions** | Form | Thêm "Chúng tôi sẽ gửi link..." | ✅ **Đã sửa** - Thêm mô tả hướng dẫn |
| 2c.3 | **"SKILLVERSE HYPERION"** lặp lại | Footer | Nhất quán với trang khác | ✅ **Đã sửa** - Cùng component ElevatorAuthLayout |

---

## 💡 Đề xuất chung cho Auth pages

1. ~~Thêm password visibility toggle~~ ✅ Đã có
2. ~~Thêm realtime validation~~ ⏭️ Improvement
3. ~~Simplify technical footer text~~ ✅ Đã sửa
4. ~~Thêm password strength indicator cho register~~ ⏭️ Improvement
5. ~~Thêm terms checkbox trước khi register~~ 🔧 Cần Backend

6. (UI) Chuẩn hóa spacing cho tất cả auth pages: khoảng cách label–input–helper text đồng nhất để nhìn “sạch” hơn

---

## 🔄 Review Date: 2026-01-27

**Người thực hiện:** AI Assistant  
**Tổng kết:** 
- Login: 3/5 issues đã fix
- Register: 0/4 issues fix (1 cần BE, 3 bỏ qua)
- Forgot Password: 3/3 issues đã fix
